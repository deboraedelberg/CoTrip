'use client';

import Link from 'next/link';
import * as React from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { DeleteListDialog } from '@/components/delete-list-dialog';
import { EditableListName } from '@/components/editable-list-name';
import { InviteSection } from '@/components/invite-section';
import { ItemRow } from '@/components/item-row';
import { QuickAddItemInput } from '@/components/quick-add-item-input';
import { useItems } from '@/hooks/useItems';
import { createClient } from '@/lib/supabase/client';
import { parseItemLine } from '@/lib/parse-item-input';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';

type List = Database['public']['Tables']['lists']['Row'];
type ItemRowType = Database['public']['Tables']['items']['Row'];
type Profile = Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'name' | 'email'>;
type Invite = Database['public']['Tables']['invites']['Row'];

const UNASSIGNED = '__unassigned__';
const SIN_ASIGNAR = 'Sin asignar';
const SIN_CATEGORIA = 'Sin categoría';

type SortBy = 'added' | 'person-category' | 'category-person';

function groupItems<T>(items: T[], keyFn: (item: T) => string | null, fallbackLabel: string) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item) ?? fallbackLabel;
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => {
      if (a === fallbackLabel) return 1;
      if (b === fallbackLabel) return -1;
      return a.localeCompare(b);
    })
    .map(([label, groupItems]) => ({ label, items: groupItems }));
}

function groupItemsTwoLevel<T>(
  items: T[],
  primaryKeyFn: (item: T) => string | null,
  primaryFallback: string,
  secondaryKeyFn: (item: T) => string | null,
  secondaryFallback: string
) {
  return groupItems(items, primaryKeyFn, primaryFallback).map((group) => ({
    label: group.label,
    subgroups: groupItems(group.items, secondaryKeyFn, secondaryFallback),
  }));
}

interface ListViewProps {
  list: List;
  initialItems: ItemRowType[];
  members: Profile[];
  initialInvites: Invite[];
  currentUserId: string;
  isOwner: boolean;
}

export function ListView({
  list,
  initialItems,
  members,
  initialInvites,
  currentUserId,
  isOwner,
}: ListViewProps) {
  const { items, addItems, togglePacked, updateItem, duplicateItem, deleteItem } = useItems(
    list.id,
    initialItems,
    currentUserId
  );
  const [name, setName] = React.useState(list.name);
  const [invites, setInvites] = React.useState(initialInvites);
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [excludedAssignees, setExcludedAssignees] = React.useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = React.useState<SortBy>('person-category');
  const [dragOverZone, setDragOverZone] = React.useState<string | null>(null);

  const packedCount = items.filter((i) => i.is_packed).length;
  const categoryOptions = Array.from(
    new Set(items.map((i) => i.category).filter((c): c is string => !!c))
  );
  const assigneeOptions = Array.from(
    new Set(
      [
        ...members.map((m) => m.name ?? m.email ?? '').filter(Boolean),
        ...invites.map((i) => i.email),
        ...items.map((i) => i.assigned_to).filter((a): a is string => !!a),
      ]
    )
  );

  const hasUnassignedItems = items.some((i) => !i.assigned_to);

  const filteredItems = items.filter((i) => {
    if (categoryFilter !== 'all' && (i.category ?? '') !== categoryFilter) return false;
    if (excludedAssignees.has(i.assigned_to ?? UNASSIGNED)) return false;
    return true;
  });

  const groups =
    sortBy === 'person-category'
      ? groupItemsTwoLevel(filteredItems, (i) => i.assigned_to, SIN_ASIGNAR, (i) => i.category, SIN_CATEGORIA)
      : sortBy === 'category-person'
        ? groupItemsTwoLevel(filteredItems, (i) => i.category, SIN_CATEGORIA, (i) => i.assigned_to, SIN_ASIGNAR)
        : null;

  // Which field a drop onto the primary vs. secondary zone should change,
  // depending on which one currently represents person vs. category.
  const primaryField: 'assigned_to' | 'category' = sortBy === 'category-person' ? 'category' : 'assigned_to';
  const primaryFallback = sortBy === 'category-person' ? SIN_CATEGORIA : SIN_ASIGNAR;
  const secondaryField: 'assigned_to' | 'category' = sortBy === 'category-person' ? 'assigned_to' : 'category';
  const secondaryFallback = sortBy === 'category-person' ? SIN_ASIGNAR : SIN_CATEGORIA;

  function handleDropOnZone(zoneKey: string, field: 'assigned_to' | 'category', label: string, fallback: string) {
    return (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOverZone((z) => (z === zoneKey ? null : z));
      const itemId = e.dataTransfer.getData('text/plain');
      if (!itemId) return;
      const value = label === fallback ? null : label;
      updateItem(itemId, { [field]: value } as Partial<ItemRowType>);
    };
  }

  function handleReorderBefore(targetId: string) {
    return (draggedId: string) => {
      const targetIndex = filteredItems.findIndex((i) => i.id === targetId);
      if (targetIndex === -1) return;
      const targetItem = filteredItems[targetIndex];
      const prevItem = filteredItems[targetIndex - 1];
      const newPosition = prevItem ? (prevItem.position + targetItem.position) / 2 : targetItem.position - 1;
      updateItem(draggedId, { position: newPosition });
    };
  }

  function handleReorderToEnd(draggedId: string) {
    const lastItem = filteredItems[filteredItems.length - 1];
    updateItem(draggedId, { position: (lastItem?.position ?? 0) + 1 });
  }

  function toggleAssignee(key: string) {
    setExcludedAssignees((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleAddItems(raw: string) {
    const lines = raw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    addItems(lines.map((line) => parseItemLine(line, categoryOptions, assigneeOptions)));
  }

  async function handleRename(newName: string) {
    setName(newName);
    const supabase = createClient();
    const { error } = await supabase.from('lists').update({ name: newName }).eq('id', list.id);
    if (error) {
      console.error('rename list failed', error);
      setName(list.name);
    }
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-4 p-6 pb-24">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link href="/" className="text-muted-foreground text-sm">
            ← Mis listas
          </Link>
          <EditableListName name={name} onRename={handleRename} />
          <p className="text-muted-foreground px-2 text-sm">
            {packedCount}/{items.length} empacados
          </p>
        </div>
        {isOwner ? <DeleteListDialog listId={list.id} listName={name} /> : null}
      </div>

      <InviteSection
        listId={list.id}
        members={members}
        invites={invites}
        onInvited={(invite) => setInvites((prev) => [...prev, invite])}
        currentUserId={currentUserId}
      />

      <div className="flex flex-col gap-2 rounded-2xl border border-border p-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground w-24 shrink-0 text-xs">Categoría</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 flex-1 rounded-full border border-input bg-input/30 px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="all">Todas</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-muted-foreground w-24 shrink-0 text-xs">Para quién</span>
          <div className="flex flex-1 flex-wrap gap-x-3 gap-y-1">
            {assigneeOptions.map((a) => (
              <label key={a} className="flex items-center gap-1.5 text-xs">
                <Checkbox checked={!excludedAssignees.has(a)} onCheckedChange={() => toggleAssignee(a)} />
                {a}
              </label>
            ))}
            {hasUnassignedItems ? (
              <label className="flex items-center gap-1.5 text-xs">
                <Checkbox
                  checked={!excludedAssignees.has(UNASSIGNED)}
                  onCheckedChange={() => toggleAssignee(UNASSIGNED)}
                />
                {SIN_ASIGNAR}
              </label>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground w-24 shrink-0 text-xs">Ordenar por</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="h-8 flex-1 rounded-full border border-input bg-input/30 px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="added">Orden de agregado</option>
            <option value="person-category">Persona &gt; Categoría</option>
            <option value="category-person">Categoría &gt; Persona</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col">
        {groups
          ? groups.map((group) => {
              const primaryZoneKey = `primary:${group.label}`;
              return (
                <div
                  key={group.label}
                  className={cn(
                    'flex flex-col rounded-xl transition-colors',
                    dragOverZone === primaryZoneKey && 'bg-muted/60'
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverZone(primaryZoneKey);
                  }}
                  onDragLeave={() => setDragOverZone((z) => (z === primaryZoneKey ? null : z))}
                  onDrop={handleDropOnZone(primaryZoneKey, primaryField, group.label, primaryFallback)}
                >
                  <h2 className="text-foreground mt-6 px-1 text-lg font-semibold first:mt-0">
                    {group.label}
                  </h2>
                  {group.subgroups.map((subgroup) => {
                    const secondaryZoneKey = `secondary:${group.label}:${subgroup.label}`;
                    return (
                      <div key={subgroup.label} className="flex flex-col">
                        <h3
                          className={cn(
                            'text-muted-foreground mt-3 rounded-lg px-1 text-sm font-semibold uppercase transition-colors',
                            dragOverZone === secondaryZoneKey && 'bg-muted/60'
                          )}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDragOverZone(secondaryZoneKey);
                          }}
                          onDragLeave={(e) => {
                            e.stopPropagation();
                            setDragOverZone((z) => (z === secondaryZoneKey ? null : z));
                          }}
                          onDrop={(e) => {
                            e.stopPropagation();
                            handleDropOnZone(secondaryZoneKey, secondaryField, subgroup.label, secondaryFallback)(e);
                          }}
                        >
                          {subgroup.label}
                        </h3>
                        {subgroup.items.map((item) => (
                          <ItemRow
                            key={item.id}
                            item={item}
                            categoryOptions={categoryOptions}
                            assigneeOptions={assigneeOptions}
                            onTogglePacked={() => togglePacked(item.id)}
                            onUpdate={(patch) => updateItem(item.id, patch)}
                            onDuplicate={() => duplicateItem(item.id)}
                            onDelete={() => deleteItem(item.id)}
                            hideCategory
                            hideAssignee
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })
          : filteredItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                categoryOptions={categoryOptions}
                assigneeOptions={assigneeOptions}
                onTogglePacked={() => togglePacked(item.id)}
                onUpdate={(patch) => updateItem(item.id, patch)}
                onDuplicate={() => duplicateItem(item.id)}
                onDelete={() => deleteItem(item.id)}
                onDropBefore={handleReorderBefore(item.id)}
              />
            ))}
        {!groups && filteredItems.length > 0 ? (
          <div
            className={cn(
              'h-3 border-t-2 border-transparent transition-colors',
              dragOverZone === 'end' && 'border-t-primary'
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverZone('end');
            }}
            onDragLeave={() => setDragOverZone((z) => (z === 'end' ? null : z))}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverZone(null);
              const draggedId = e.dataTransfer.getData('text/plain');
              if (draggedId) handleReorderToEnd(draggedId);
            }}
          />
        ) : null}
        {filteredItems.length === 0 && items.length > 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            Ningún item coincide con estos filtros.
          </p>
        ) : null}
      </div>

      <QuickAddItemInput onSubmit={handleAddItems} />
    </div>
  );
}

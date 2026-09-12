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
import type { Database } from '@/types/database';

type List = Database['public']['Tables']['lists']['Row'];
type ItemRowType = Database['public']['Tables']['items']['Row'];
type Profile = Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'name' | 'email'>;
type Invite = Database['public']['Tables']['invites']['Row'];

const UNASSIGNED = '__unassigned__';

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
  const { items, addItem, togglePacked, updateItem, deleteItem } = useItems(
    list.id,
    initialItems,
    currentUserId
  );
  const [name, setName] = React.useState(list.name);
  const [invites, setInvites] = React.useState(initialInvites);
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [excludedAssignees, setExcludedAssignees] = React.useState<Set<string>>(new Set());

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

  const filteredItems = items.filter((i) => {
    if (categoryFilter !== 'all' && (i.category ?? '') !== categoryFilter) return false;
    if (excludedAssignees.has(i.assigned_to ?? UNASSIGNED)) return false;
    return true;
  });

  function toggleAssignee(key: string) {
    setExcludedAssignees((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
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
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-4 p-6">
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
            <label className="flex items-center gap-1.5 text-xs">
              <Checkbox
                checked={!excludedAssignees.has(UNASSIGNED)}
                onCheckedChange={() => toggleAssignee(UNASSIGNED)}
              />
              Sin asignar
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        {filteredItems.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            categoryOptions={categoryOptions}
            assigneeOptions={assigneeOptions}
            onTogglePacked={() => togglePacked(item.id)}
            onUpdate={(patch) => updateItem(item.id, patch)}
            onDelete={() => deleteItem(item.id)}
          />
        ))}
        {filteredItems.length === 0 && items.length > 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            Ningún item coincide con estos filtros.
          </p>
        ) : null}
      </div>

      <QuickAddItemInput onSubmit={addItem} />
    </div>
  );
}

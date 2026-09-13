'use client';

import { Copy, GripVertical, Trash2 } from 'lucide-react';
import * as React from 'react';

import { Combobox } from '@/components/combobox';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { Item } from '@/hooks/useItems';
import { cn } from '@/lib/utils';

interface ItemRowProps {
  item: Item;
  categoryOptions: string[];
  assigneeOptions: string[];
  onTogglePacked: () => void;
  onUpdate: (patch: { name?: string; quantity?: number; category?: string | null; assigned_to?: string | null }) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  /** Grouped views already show category/person as a title, so hide the redundant field. */
  hideCategory?: boolean;
  hideAssignee?: boolean;
  /** Flat (unsorted) view only: dropping a dragged row here moves it before this one. */
  onDropBefore?: (draggedId: string) => void;
}

const ghostFieldClass =
  'h-8 min-w-0 rounded-lg border border-transparent bg-transparent px-1.5 text-sm outline-none transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:bg-input/30 focus-visible:ring-[3px] focus-visible:ring-ring/50';

export function ItemRow({
  item,
  categoryOptions,
  assigneeOptions,
  onTogglePacked,
  onUpdate,
  onDuplicate,
  onDelete,
  hideCategory,
  hideAssignee,
  onDropBefore,
}: ItemRowProps) {
  const [editingName, setEditingName] = React.useState(false);
  const [draftName, setDraftName] = React.useState(item.name);
  const [editingQty, setEditingQty] = React.useState(false);
  const [draftQty, setDraftQty] = React.useState(item.quantity);
  const [dragOver, setDragOver] = React.useState(false);

  function commitName() {
    setEditingName(false);
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== item.name) onUpdate({ name: trimmed });
  }

  function commitQty() {
    setEditingQty(false);
    const next = draftQty > 0 ? draftQty : 1;
    if (next !== item.quantity) onUpdate({ quantity: next });
  }

  return (
    <div
      className={cn(
        'flex flex-nowrap items-center gap-1 border-b border-t-2 border-border border-t-transparent px-1 py-1.5 transition-colors',
        dragOver && 'border-t-primary'
      )}
      onDragOver={
        onDropBefore
          ? (e) => {
              e.preventDefault();
              setDragOver(true);
            }
          : undefined
      }
      onDragLeave={onDropBefore ? () => setDragOver(false) : undefined}
      onDrop={
        onDropBefore
          ? (e) => {
              e.preventDefault();
              setDragOver(false);
              const draggedId = e.dataTransfer.getData('text/plain');
              if (draggedId && draggedId !== item.id) onDropBefore(draggedId);
            }
          : undefined
      }
    >
      <span
        className="shrink-0 cursor-grab touch-none active:cursor-grabbing"
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/plain', item.id)}
      >
        <GripVertical className="text-muted-foreground/40 size-4" />
      </span>
      <Checkbox checked={item.is_packed} onCheckedChange={onTogglePacked} />
      <Input
        value={editingName ? draftName : item.name}
        onFocus={() => {
          setDraftName(item.name);
          setEditingName(true);
        }}
        onChange={(e) => setDraftName(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        className={cn(
          ghostFieldClass,
          'min-w-28 flex-1',
          item.is_packed && 'text-muted-foreground line-through opacity-60'
        )}
      />
      <Input
        type="number"
        min={1}
        value={editingQty ? draftQty : item.quantity}
        onFocus={() => {
          setDraftQty(item.quantity);
          setEditingQty(true);
        }}
        onChange={(e) => setDraftQty(Number(e.target.value))}
        onBlur={commitQty}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        className={cn(ghostFieldClass, 'w-11 shrink-0 px-1 text-center')}
      />
      {hideCategory ? null : (
        <Combobox
          value={item.category ?? ''}
          options={categoryOptions}
          placeholder="Categoría"
          clearLabel="Sin categoría"
          onChange={(v) => onUpdate({ category: v || null })}
          className="w-20 shrink-0"
        />
      )}
      {hideAssignee ? null : (
        <Combobox
          variant="avatar"
          value={item.assigned_to ?? ''}
          options={assigneeOptions}
          placeholder="Para quién"
          clearLabel="Sin asignar"
          onChange={(v) => onUpdate({ assigned_to: v || null })}
        />
      )}
      {item._status === 'pending' ? <span className="size-2 shrink-0 rounded-full bg-muted-foreground" /> : null}
      {item._status === 'error' ? <span className="text-destructive shrink-0 text-xs">error</span> : null}
      <Button variant="ghost" size="icon-sm" className="text-muted-foreground shrink-0" onClick={onDuplicate}>
        <Copy className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground shrink-0"
        onClick={onDelete}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

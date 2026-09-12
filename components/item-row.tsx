'use client';

import { Trash2 } from 'lucide-react';
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
  onDelete: () => void;
}

export function ItemRow({ item, categoryOptions, assigneeOptions, onTogglePacked, onUpdate, onDelete }: ItemRowProps) {
  const [editingName, setEditingName] = React.useState(false);
  const [draftName, setDraftName] = React.useState(item.name);
  const [editingQty, setEditingQty] = React.useState(false);
  const [draftQty, setDraftQty] = React.useState(item.quantity);

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
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-1 py-2">
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
          'h-8 min-w-28 flex-1 text-sm',
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
        className="h-8 w-14 shrink-0 px-1 text-center text-sm"
      />
      <Combobox
        value={item.category ?? ''}
        options={categoryOptions}
        placeholder="Categoría"
        clearLabel="Sin categoría"
        onChange={(v) => onUpdate({ category: v || null })}
        className="w-28 shrink-0"
      />
      <Combobox
        value={item.assigned_to ?? ''}
        options={assigneeOptions}
        placeholder="Para quién"
        clearLabel="Sin asignar"
        onChange={(v) => onUpdate({ assigned_to: v || null })}
        className="w-28 shrink-0"
      />
      {item._status === 'pending' ? <span className="size-2 rounded-full bg-muted-foreground" /> : null}
      {item._status === 'error' ? <span className="text-destructive text-xs">error</span> : null}
      <Button variant="ghost" size="icon-sm" className="text-muted-foreground" onClick={onDelete}>
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

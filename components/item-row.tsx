'use client';

import { Trash2 } from 'lucide-react';
import * as React from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { Item } from '@/hooks/useItems';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';

type Profile = Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'name' | 'email'>;

interface ItemRowProps {
  item: Item;
  members: Profile[];
  categorySuggestions: string[];
  onTogglePacked: () => void;
  onUpdate: (patch: { name?: string; quantity?: number; category?: string | null; assigned_to?: string | null }) => void;
  onDelete: () => void;
}

export function ItemRow({ item, members, categorySuggestions, onTogglePacked, onUpdate, onDelete }: ItemRowProps) {
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(item.name);
  const [quantity, setQuantity] = React.useState(item.quantity);
  const [category, setCategory] = React.useState(item.category ?? '');
  const [assignedTo, setAssignedTo] = React.useState(item.assigned_to ?? '');

  const assignedMember = members.find((m) => m.id === item.assigned_to);

  function startEditing() {
    setName(item.name);
    setQuantity(item.quantity);
    setCategory(item.category ?? '');
    setAssignedTo(item.assigned_to ?? '');
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    const trimmedName = name.trim();
    onUpdate({
      name: trimmedName || item.name,
      quantity: quantity > 0 ? quantity : 1,
      category: category.trim() || null,
      assigned_to: assignedTo || null,
    });
  }

  if (editing) {
    return (
      <form
        className="flex flex-col gap-2 border-b border-border px-1 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          commit();
        }}
      >
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
            autoFocus
            placeholder="Nombre"
          />
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-16"
          />
        </div>
        <div className="flex gap-2">
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Categoría"
            className="flex-1"
            list="category-suggestions"
          />
          <datalist id="category-suggestions">
            {categorySuggestions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="h-9 flex-1 rounded-4xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">Sin asignar</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name ?? m.email}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
          <Button type="submit" size="sm">
            Guardar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 border-b border-border px-1 py-2">
      <Checkbox checked={item.is_packed} onCheckedChange={onTogglePacked} />
      <div className="flex flex-1 cursor-pointer flex-col" onClick={startEditing}>
        <span
          className={cn(
            'text-sm',
            item.is_packed && 'text-muted-foreground line-through opacity-60'
          )}
        >
          {item.name}
          {item.quantity > 1 ? <span className="text-muted-foreground"> ×{item.quantity}</span> : null}
        </span>
        {item.category ? (
          <span className="text-muted-foreground text-xs">{item.category}</span>
        ) : null}
      </div>
      {assignedMember ? (
        <Avatar size="sm">
          <AvatarFallback>
            {(assignedMember.name ?? assignedMember.email ?? '?').slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : null}
      {item._status === 'pending' ? <span className="size-2 rounded-full bg-muted-foreground" /> : null}
      {item._status === 'error' ? <span className="text-destructive text-xs">error</span> : null}
      <Button variant="ghost" size="icon-sm" className="text-muted-foreground" onClick={onDelete}>
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

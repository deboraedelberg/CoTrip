'use client';

import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { Item } from '@/hooks/useItems';
import { cn } from '@/lib/utils';

interface ItemRowProps {
  item: Item;
  onTogglePacked: () => void;
  onDelete: () => void;
}

export function ItemRow({ item, onTogglePacked, onDelete }: ItemRowProps) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-1 py-2">
      <Checkbox checked={item.is_packed} onCheckedChange={onTogglePacked} />
      <span
        className={cn(
          'flex-1 text-sm',
          item.is_packed && 'text-muted-foreground line-through opacity-60'
        )}
      >
        {item.name}
        {item.quantity > 1 ? <span className="text-muted-foreground"> ×{item.quantity}</span> : null}
      </span>
      {item._status === 'pending' ? <span className="size-2 rounded-full bg-muted-foreground" /> : null}
      {item._status === 'error' ? <span className="text-destructive text-xs">error</span> : null}
      <Button variant="ghost" size="icon-sm" className="text-muted-foreground" onClick={onDelete}>
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

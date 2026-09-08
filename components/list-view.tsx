'use client';

import Link from 'next/link';

import { ItemRow } from '@/components/item-row';
import { QuickAddItemInput } from '@/components/quick-add-item-input';
import { useItems } from '@/hooks/useItems';
import type { Database } from '@/types/database';

type List = Database['public']['Tables']['lists']['Row'];
type ItemRowType = Database['public']['Tables']['items']['Row'];

interface ListViewProps {
  list: List;
  initialItems: ItemRowType[];
  currentUserId: string;
}

export function ListView({ list, initialItems, currentUserId }: ListViewProps) {
  const { items, addItem, togglePacked, deleteItem } = useItems(list.id, initialItems, currentUserId);
  const packedCount = items.filter((i) => i.is_packed).length;

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-4 p-6">
      <div>
        <Link href="/" className="text-muted-foreground text-sm">
          ← Mis listas
        </Link>
        <h1 className="text-xl font-semibold">{list.name}</h1>
        <p className="text-muted-foreground text-sm">
          {packedCount}/{items.length} empacados
        </p>
      </div>

      <div className="flex flex-col">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            onTogglePacked={() => togglePacked(item.id)}
            onDelete={() => deleteItem(item.id)}
          />
        ))}
      </div>

      <QuickAddItemInput onSubmit={addItem} />
    </div>
  );
}

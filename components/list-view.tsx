'use client';

import Link from 'next/link';
import * as React from 'react';

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

interface ListViewProps {
  list: List;
  initialItems: ItemRowType[];
  members: Profile[];
  initialInvites: Invite[];
  currentUserId: string;
}

export function ListView({ list, initialItems, members, initialInvites, currentUserId }: ListViewProps) {
  const { items, addItem, togglePacked, updateItem, deleteItem } = useItems(
    list.id,
    initialItems,
    currentUserId
  );
  const [name, setName] = React.useState(list.name);
  const packedCount = items.filter((i) => i.is_packed).length;
  const categorySuggestions = Array.from(
    new Set(items.map((i) => i.category).filter((c): c is string => !!c))
  );

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
      <div>
        <Link href="/" className="text-muted-foreground text-sm">
          ← Mis listas
        </Link>
        <EditableListName name={name} onRename={handleRename} />
        <p className="text-muted-foreground px-2 text-sm">
          {packedCount}/{items.length} empacados
        </p>
      </div>

      <InviteSection
        listId={list.id}
        members={members}
        initialInvites={initialInvites}
        currentUserId={currentUserId}
      />

      <div className="flex flex-col">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            members={members}
            categorySuggestions={categorySuggestions}
            onTogglePacked={() => togglePacked(item.id)}
            onUpdate={(patch) => updateItem(item.id, patch)}
            onDelete={() => deleteItem(item.id)}
          />
        ))}
      </div>

      <QuickAddItemInput onSubmit={addItem} />
    </div>
  );
}

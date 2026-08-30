import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Sortable from 'react-native-sortables';

import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';

type PackingList = Database['public']['Tables']['packing_lists']['Row'];

interface PackingListTabsProps {
  lists: PackingList[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onReorder: (orderedIds: string[]) => void;
}

export function PackingListTabs({
  lists,
  activeId,
  onSelect,
  onCreate,
  onRename,
  onReorder,
}: PackingListTabsProps) {
  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');

  function handleSubmit() {
    const trimmed = name.trim();
    if (trimmed) onCreate(trimmed);
    setName('');
    setCreating(false);
  }

  function commitRename() {
    if (editingId) onRename(editingId, editingName);
    setEditingId(null);
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="flex-none border-b border-border"
      contentContainerClassName="flex-row items-center gap-2 px-4 py-2"
    >
      <Sortable.Flex flexDirection="row" gap={8} onOrderChange={({ indexToKey }) => onReorder(indexToKey)}>
        {lists.map((list) =>
          editingId === list.id ? (
            <Input
              key={list.id}
              autoFocus
              selectTextOnFocus
              value={editingName}
              onChangeText={setEditingName}
              onSubmitEditing={commitRename}
              onBlur={commitRename}
              className="h-9 w-40 rounded-full px-4"
              returnKeyType="done"
            />
          ) : (
            <Pressable
              key={list.id}
              onPress={() => {
                if (list.id === activeId) {
                  setEditingId(list.id);
                  setEditingName(list.name);
                } else {
                  onSelect(list.id);
                }
              }}
              className={cn(
                'rounded-full px-4 py-2',
                list.id === activeId ? 'bg-primary' : 'bg-secondary'
              )}
            >
              <Text className={list.id === activeId ? 'text-primary-foreground' : 'text-secondary-foreground'}>
                {list.name}
              </Text>
            </Pressable>
          )
        )}
      </Sortable.Flex>

      {creating ? (
        <Input
          autoFocus
          value={name}
          onChangeText={setName}
          onSubmitEditing={handleSubmit}
          onBlur={handleSubmit}
          placeholder="Nombre de la lista"
          className="h-9 w-40 rounded-full px-4"
          returnKeyType="done"
        />
      ) : (
        <Pressable
          onPress={() => setCreating(true)}
          className="h-9 w-9 items-center justify-center rounded-full bg-secondary"
        >
          <Text className="text-secondary-foreground">+</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

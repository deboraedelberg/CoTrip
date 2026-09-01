import { Pencil, Trash2 } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Sortable from 'react-native-sortables';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Icon } from '@/components/ui/icon';
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
  onDelete: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
}

export function PackingListTabs({
  lists,
  activeId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
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
            <View
              key={list.id}
              className={cn(
                'flex-row items-center gap-0.5 rounded-full py-1 pl-4 pr-1',
                list.id === activeId ? 'bg-primary' : 'bg-secondary'
              )}
            >
              <Pressable onPress={() => onSelect(list.id)} hitSlop={4} className="py-1 pr-1">
                <Text className={list.id === activeId ? 'text-primary-foreground' : 'text-secondary-foreground'}>
                  {list.name}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setEditingId(list.id);
                  setEditingName(list.name);
                }}
                hitSlop={4}
                className="h-7 w-7 items-center justify-center rounded-full active:bg-black/10"
              >
                <Icon
                  as={Pencil}
                  size={13}
                  className={list.id === activeId ? 'text-primary-foreground' : 'text-muted-foreground'}
                />
              </Pressable>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Pressable hitSlop={4} className="h-7 w-7 items-center justify-center rounded-full active:bg-black/10">
                    <Icon
                      as={Trash2}
                      size={13}
                      className={list.id === activeId ? 'text-primary-foreground' : 'text-muted-foreground'}
                    />
                  </Pressable>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar &quot;{list.name}&quot;?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se eliminarán todas las categorías y artículos de esta lista. Esta acción no se puede
                      deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      <Text>Cancelar</Text>
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onPress={() => onDelete(list.id)}
                      className="bg-destructive active:bg-destructive/90"
                    >
                      <Text className="text-white">Eliminar</Text>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </View>
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

import * as React from 'react';
import { Pressable, View } from 'react-native';

import { Checkbox } from '@/components/ui/checkbox';
import { EditableText } from '@/components/ui/editable-text';
import { Text } from '@/components/ui/text';
import type { Item } from '@/hooks/useItems';
import { cn } from '@/lib/utils';

interface ItemRowProps {
  item: Item;
  onTogglePacked: () => void;
  onRename: (name: string) => void;
  onChangeQuantity: (quantity: number) => void;
  onDelete: () => void;
  onRetry: () => void;
}

export function ItemRow({
  item,
  onTogglePacked,
  onRename,
  onChangeQuantity,
  onDelete,
  onRetry,
}: ItemRowProps) {
  const [editingName, setEditingName] = React.useState(false);
  const [editingQuantity, setEditingQuantity] = React.useState(false);

  return (
    <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
      <Checkbox checked={item.is_packed} onCheckedChange={onTogglePacked} />

      <View className="flex-1">
        <EditableText
          value={item.name}
          editing={editingName}
          onStartEdit={() => setEditingName(true)}
          onFinishEdit={(name) => {
            setEditingName(false);
            onRename(name);
          }}
          textClassName={cn(item.is_packed && 'text-muted-foreground line-through')}
        />
      </View>

      {editingQuantity ? (
        <View className="flex-row items-center gap-3">
          <Pressable
            hitSlop={8}
            onPress={() => onChangeQuantity(item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Text className={cn('text-lg', item.quantity <= 1 && 'text-muted-foreground')}>−</Text>
          </Pressable>
          <Text className="w-4 text-center">{item.quantity}</Text>
          <Pressable hitSlop={8} onPress={() => onChangeQuantity(item.quantity + 1)}>
            <Text className="text-lg">+</Text>
          </Pressable>
          <Pressable hitSlop={8} onPress={() => setEditingQuantity(false)}>
            <Text className="text-primary">Listo</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={() => setEditingQuantity(true)} hitSlop={8}>
          <Text className="text-muted-foreground">×{item.quantity}</Text>
        </Pressable>
      )}

      {item._status === 'pending' ? <View className="h-2 w-2 rounded-full bg-muted-foreground" /> : null}
      {item._status === 'error' ? (
        <Pressable onPress={onRetry} hitSlop={8}>
          <Text className="text-destructive">⚠︎</Text>
        </Pressable>
      ) : null}

      <Pressable onPress={onDelete} hitSlop={8}>
        <Text className="text-muted-foreground">×</Text>
      </Pressable>
    </View>
  );
}

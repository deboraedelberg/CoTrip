import { GripVertical, Minus, Plus, Trash2 } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import Sortable from 'react-native-sortables';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EditableText } from '@/components/ui/editable-text';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import type { Item } from '@/hooks/useItems';
import { cn } from '@/lib/utils';

interface ItemRowProps {
  item: Item;
  assignedName?: string | null;
  draggable?: boolean;
  onTogglePacked: () => void;
  onRename: (name: string) => void;
  onChangeQuantity: (quantity: number) => void;
  onDelete: () => void;
  onRetry: () => void;
  onOpenEditor: () => void;
}

export function ItemRow({
  item,
  assignedName,
  draggable = false,
  onTogglePacked,
  onRename,
  onChangeQuantity,
  onDelete,
  onRetry,
  onOpenEditor,
}: ItemRowProps) {
  const [editingName, setEditingName] = React.useState(false);
  const metaLabel = [assignedName, item.category].filter(Boolean).join(' · ');

  return (
    <View className="border-b border-border px-4 py-2">
      <View className="flex-row items-center gap-2">
        {draggable ? (
          <Sortable.Handle>
            <View className="p-1">
              <Icon as={GripVertical} size={16} className="text-muted-foreground" />
            </View>
          </Sortable.Handle>
        ) : null}

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

        <View className="flex-row items-center gap-1">
          <Pressable
            hitSlop={8}
            onPress={() => onChangeQuantity(item.quantity - 1)}
            disabled={item.quantity <= 1}
            className={cn('h-7 w-7 items-center justify-center', item.quantity <= 1 && 'opacity-40')}
          >
            <Icon as={Minus} size={14} className="text-foreground" />
          </Pressable>
          <Input
            value={String(item.quantity)}
            onChangeText={(text) => {
              const parsed = parseInt(text.replace(/[^0-9]/g, ''), 10);
              if (!Number.isNaN(parsed)) onChangeQuantity(parsed);
            }}
            keyboardType="number-pad"
            className="h-7 w-10 px-1 text-center"
          />
          <Pressable
            hitSlop={8}
            onPress={() => onChangeQuantity(item.quantity + 1)}
            className="h-7 w-7 items-center justify-center"
          >
            <Icon as={Plus} size={14} className="text-foreground" />
          </Pressable>
        </View>

        {item._status === 'pending' ? <View className="h-2 w-2 rounded-full bg-muted-foreground" /> : null}
        {item._status === 'error' ? (
          <Pressable onPress={onRetry} hitSlop={8}>
            <Text className="text-destructive">⚠︎</Text>
          </Pressable>
        ) : null}

        <Button variant="ghost" size="icon" className="h-8 w-8" onPress={onDelete}>
          <Icon as={Trash2} size={16} className="text-muted-foreground" />
        </Button>
      </View>

      <Pressable onPress={onOpenEditor} hitSlop={4} className={cn('self-start', draggable ? 'ml-8' : 'ml-2')}>
        <Text className={cn('text-xs', metaLabel ? 'text-muted-foreground' : 'text-muted-foreground/60')}>
          {metaLabel || 'Asignar persona / categoría'}
        </Text>
      </Pressable>
    </View>
  );
}

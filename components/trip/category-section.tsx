import { GripVertical, Trash2 } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';
import Sortable from 'react-native-sortables';

import { ItemRow } from '@/components/trip/item-row';
import { QuickAddInput } from '@/components/trip/quick-add-input';
import { Button } from '@/components/ui/button';
import { EditableText } from '@/components/ui/editable-text';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Item } from '@/hooks/useItems';
import type { Database } from '@/types/database';

type Category = Database['public']['Tables']['packing_list_categories']['Row'];

interface CategorySectionProps {
  category: Category | null;
  items: Item[];
  autoEditName?: boolean;
  onRenameCategory?: (name: string) => void;
  onDeleteCategory?: () => void;
  onAddCategory: () => void;
  onAddItem: (name: string) => void;
  onTogglePacked: (id: string) => void;
  onRenameItem: (id: string, name: string) => void;
  onChangeQuantity: (id: string, quantity: number) => void;
  onDeleteItem: (id: string) => void;
  onRetryItem: (id: string) => void;
  onReorderItems: (orderedIds: string[]) => void;
}

export function CategorySection({
  category,
  items,
  autoEditName,
  onRenameCategory,
  onDeleteCategory,
  onAddCategory,
  onAddItem,
  onTogglePacked,
  onRenameItem,
  onChangeQuantity,
  onDeleteItem,
  onRetryItem,
  onReorderItems,
}: CategorySectionProps) {
  const [editingName, setEditingName] = React.useState(!!autoEditName);
  const packedCount = items.filter((i) => i.is_packed).length;

  return (
    <View className="border-b-8 border-background">
      <View className="flex-row items-center justify-between bg-secondary/40 px-4 py-2">
        <View className="flex-1 flex-row items-center gap-2">
          {category ? (
            <Sortable.Handle>
              <View className="p-1">
                <Icon as={GripVertical} size={16} className="text-muted-foreground" />
              </View>
            </Sortable.Handle>
          ) : null}
          {category ? (
            <EditableText
              value={category.name}
              editing={editingName}
              onStartEdit={() => setEditingName(true)}
              onFinishEdit={(name) => {
                setEditingName(false);
                onRenameCategory?.(name);
              }}
              textClassName="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              inputClassName="text-xs font-semibold uppercase tracking-wide"
            />
          ) : (
            <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sin categoría
            </Text>
          )}
        </View>
        <View className="flex-row items-center gap-3">
          {items.length > 0 ? (
            <Text className="text-xs text-muted-foreground">
              {packedCount}/{items.length}
            </Text>
          ) : null}
          {category && onDeleteCategory ? (
            <Button variant="ghost" size="icon" className="h-7 w-7" onPress={onDeleteCategory}>
              <Icon as={Trash2} size={14} className="text-muted-foreground" />
            </Button>
          ) : null}
        </View>
      </View>

      <Sortable.Flex
        flexDirection="column"
        customHandle
        onOrderChange={({ indexToKey }) => onReorderItems(indexToKey)}
      >
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            onTogglePacked={() => onTogglePacked(item.id)}
            onRename={(name) => onRenameItem(item.id, name)}
            onChangeQuantity={(quantity) => onChangeQuantity(item.id, quantity)}
            onDelete={() => onDeleteItem(item.id)}
            onRetry={() => onRetryItem(item.id)}
          />
        ))}
      </Sortable.Flex>

      <View className="flex-row flex-wrap items-center gap-2 px-4 py-3">
        <QuickAddInput onSubmit={onAddItem} />
        <Button variant="ghost" size="sm" onPress={onAddCategory}>
          <Text>+ Agregar categoría</Text>
        </Button>
      </View>
    </View>
  );
}

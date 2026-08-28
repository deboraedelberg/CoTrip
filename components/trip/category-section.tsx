import * as React from 'react';
import { Pressable, View } from 'react-native';

import { ItemRow } from '@/components/trip/item-row';
import { QuickAddInput } from '@/components/trip/quick-add-input';
import { EditableText } from '@/components/ui/editable-text';
import { Text } from '@/components/ui/text';
import type { Item } from '@/hooks/useItems';
import type { Database } from '@/types/database';

type Category = Database['public']['Tables']['packing_list_categories']['Row'];

interface CategorySectionProps {
  category: Category | null;
  items: Item[];
  onRenameCategory?: (name: string) => void;
  onDeleteCategory?: () => void;
  onAddItem: (name: string) => void;
  onTogglePacked: (id: string) => void;
  onRenameItem: (id: string, name: string) => void;
  onChangeQuantity: (id: string, quantity: number) => void;
  onDeleteItem: (id: string) => void;
  onRetryItem: (id: string) => void;
}

export function CategorySection({
  category,
  items,
  onRenameCategory,
  onDeleteCategory,
  onAddItem,
  onTogglePacked,
  onRenameItem,
  onChangeQuantity,
  onDeleteItem,
  onRetryItem,
}: CategorySectionProps) {
  const [editingName, setEditingName] = React.useState(false);
  const packedCount = items.filter((i) => i.is_packed).length;

  return (
    <View className="border-b-8 border-background">
      <View className="flex-row items-center justify-between bg-secondary/40 px-4 py-2">
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
        <View className="flex-row items-center gap-3">
          {items.length > 0 ? (
            <Text className="text-xs text-muted-foreground">
              {packedCount}/{items.length}
            </Text>
          ) : null}
          {category && onDeleteCategory ? (
            <Pressable onPress={onDeleteCategory} hitSlop={8}>
              <Text className="text-muted-foreground">×</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

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

      <QuickAddInput onSubmit={onAddItem} bordered={false} className="px-4 py-2" />
    </View>
  );
}

import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetHeader } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import type { Item } from '@/hooks/useItems';
import type { TripMember } from '@/hooks/useTripMembers';
import { cn } from '@/lib/utils';

interface ItemEditorSheetProps {
  item: Item | null;
  members: TripMember[];
  categorySuggestions: string[];
  onAssign: (userId: string | null) => void;
  onSetCategory: (category: string | null) => void;
  onClose: () => void;
}

function Chip({
  label,
  selected,
  onPress,
  leading,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  leading?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-1.5 rounded-full px-3 py-1.5',
        selected ? 'bg-primary' : 'bg-secondary'
      )}
    >
      {leading}
      <Text className={selected ? 'text-primary-foreground' : 'text-secondary-foreground'}>{label}</Text>
    </Pressable>
  );
}

export function ItemEditorSheet({
  item,
  members,
  categorySuggestions,
  onAssign,
  onSetCategory,
  onClose,
}: ItemEditorSheetProps) {
  const [newCategory, setNewCategory] = React.useState('');

  React.useEffect(() => {
    setNewCategory('');
  }, [item?.id]);

  const categoryChips = item?.category && !categorySuggestions.includes(item.category)
    ? [...categorySuggestions, item.category]
    : categorySuggestions;

  function handleAddCategory() {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    onSetCategory(trimmed);
    setNewCategory('');
  }

  return (
    <Sheet open={!!item} onOpenChange={(open) => !open && onClose()}>
      {item ? (
        <>
          <SheetHeader>
            <Text className="text-lg font-semibold">{item.name}</Text>
          </SheetHeader>

          <View className="gap-4">
            <View className="gap-2">
              <Text className="text-sm font-medium text-muted-foreground">Persona</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  <Chip label="General" selected={!item.assigned_to} onPress={() => onAssign(null)} />
                  {members.map((member) => {
                    const label = member.profile?.full_name || member.profile?.email || '?';
                    return (
                      <Chip
                        key={member.user_id}
                        label={label}
                        selected={item.assigned_to === member.user_id}
                        onPress={() => onAssign(member.user_id)}
                        leading={
                          <Avatar alt={label} className="h-5 w-5">
                            {member.profile?.avatar_url ? (
                              <AvatarImage source={{ uri: member.profile.avatar_url }} />
                            ) : null}
                            <AvatarFallback>
                              <Text className="text-[10px]">{label.charAt(0).toUpperCase()}</Text>
                            </AvatarFallback>
                          </Avatar>
                        }
                      />
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium text-muted-foreground">Categoría</Text>
              <View className="flex-row flex-wrap gap-2">
                <Chip label="Otros" selected={!item.category} onPress={() => onSetCategory(null)} />
                {categoryChips.map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    selected={item.category === category}
                    onPress={() => onSetCategory(category)}
                  />
                ))}
              </View>
              <View className="flex-row gap-2">
                <Input
                  value={newCategory}
                  onChangeText={setNewCategory}
                  onSubmitEditing={handleAddCategory}
                  placeholder="Nueva categoría…"
                  returnKeyType="done"
                  className="h-9 flex-1"
                />
                <Button variant="secondary" size="sm" onPress={handleAddCategory} disabled={!newCategory.trim()}>
                  <Text>Agregar</Text>
                </Button>
              </View>
            </View>

            <Button onPress={onClose}>
              <Text>Listo</Text>
            </Button>
          </View>
        </>
      ) : null}
    </Sheet>
  );
}

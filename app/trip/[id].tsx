import { Stack, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategorySection } from '@/components/trip/category-section';
import { InviteSheet } from '@/components/trip/invite-sheet';
import { PackingListTabs } from '@/components/trip/packing-list-tabs';
import { TripHeader } from '@/components/trip/trip-header';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useItems } from '@/hooks/useItems';
import { usePackingListCategories } from '@/hooks/usePackingListCategories';
import { usePackingLists } from '@/hooks/usePackingLists';
import { useTrip } from '@/hooks/useTrip';
import { useTripMembers } from '@/hooks/useTripMembers';

export default function TripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trip, loading: tripLoading, renameTrip } = useTrip(id);
  const { members } = useTripMembers(id);
  const { lists, createList, renameList } = usePackingLists(id);
  const [activeListId, setActiveListId] = React.useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [addingCategory, setAddingCategory] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState('');

  React.useEffect(() => {
    if (!activeListId && lists.length > 0) {
      setActiveListId(lists[0].id);
    }
  }, [lists, activeListId]);

  const { categories, createCategory, renameCategory, deleteCategory } =
    usePackingListCategories(activeListId);
  const { items, retryAdd, togglePacked, renameItem, setQuantity, deleteItem, addItem } =
    useItems(activeListId);

  if (tripLoading || !trip) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Cargando…</Text>
      </SafeAreaView>
    );
  }

  const packedCount = items.filter((i) => i.is_packed).length;
  const uncategorizedItems = items.filter((i) => !i.category_id);

  function handleAddCategory() {
    const trimmed = newCategoryName.trim();
    if (trimmed) createCategory(trimmed);
    setNewCategoryName('');
    setAddingCategory(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom', 'left', 'right']}>
      <Stack.Screen options={{ title: trip.name }} />
      <TripHeader
        trip={trip}
        members={members}
        onInvitePress={() => setInviteOpen(true)}
        onRenameTrip={renameTrip}
      />

      <PackingListTabs
        lists={lists}
        activeId={activeListId}
        onSelect={setActiveListId}
        onCreate={async (name) => {
          const result = await createList(name);
          if (result?.data) setActiveListId(result.data.id);
        }}
        onRename={renameList}
      />

      {!activeListId ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Text className="text-center text-muted-foreground">
            Este viaje todavía no tiene packing lists.
          </Text>
        </View>
      ) : (
        <>
          <Text className="px-4 py-2 text-sm text-muted-foreground">
            {packedCount}/{items.length} empacados
          </Text>
          <ScrollView className="flex-1">
            {categories.map((category) => (
              <CategorySection
                key={category.id}
                category={category}
                items={items.filter((i) => i.category_id === category.id)}
                onRenameCategory={(name) => renameCategory(category.id, name)}
                onDeleteCategory={() => deleteCategory(category.id)}
                onAddItem={(name) => addItem(name, category.id)}
                onTogglePacked={togglePacked}
                onRenameItem={renameItem}
                onChangeQuantity={setQuantity}
                onDeleteItem={deleteItem}
                onRetryItem={retryAdd}
              />
            ))}

            <CategorySection
              category={null}
              items={uncategorizedItems}
              onAddItem={(name) => addItem(name, null)}
              onTogglePacked={togglePacked}
              onRenameItem={renameItem}
              onChangeQuantity={setQuantity}
              onDeleteItem={deleteItem}
              onRetryItem={retryAdd}
            />

            {addingCategory ? (
              <View className="px-4 py-2">
                <Input
                  autoFocus
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  onSubmitEditing={handleAddCategory}
                  onBlur={handleAddCategory}
                  placeholder="Nombre de la categoría"
                  returnKeyType="done"
                />
              </View>
            ) : (
              <Pressable onPress={() => setAddingCategory(true)} className="px-4 py-3">
                <Text className="text-primary">+ nueva categoría</Text>
              </Pressable>
            )}
          </ScrollView>
        </>
      )}

      <InviteSheet
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        tripId={trip.id}
        tripName={trip.name}
      />
    </SafeAreaView>
  );
}

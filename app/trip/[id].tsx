import { Stack, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Sortable from 'react-native-sortables';

import { CategorySection } from '@/components/trip/category-section';
import { InviteSheet } from '@/components/trip/invite-sheet';
import { PackingListTabs } from '@/components/trip/packing-list-tabs';
import { TripHeader } from '@/components/trip/trip-header';
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
  const { lists, createList, renameList, deleteList, reorderLists } = usePackingLists(id);
  const [activeListId, setActiveListId] = React.useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [justCreatedCategoryId, setJustCreatedCategoryId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const activeStillExists = lists.some((l) => l.id === activeListId);
    if (!activeStillExists) {
      setActiveListId(lists.length > 0 ? lists[0].id : null);
    }
  }, [lists, activeListId]);

  const { categories, createCategory, renameCategory, deleteCategory, reorderCategories } =
    usePackingListCategories(activeListId);
  const { items, retryAdd, togglePacked, renameItem, setQuantity, deleteItem, addItem, reorderItems } =
    useItems(activeListId);

  async function handleAddCategory() {
    const result = await createCategory('Nueva categoría');
    if (result?.data) setJustCreatedCategoryId(result.data.id);
  }

  if (tripLoading || !trip) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Cargando…</Text>
      </SafeAreaView>
    );
  }

  const packedCount = items.filter((i) => i.is_packed).length;
  const uncategorizedItems = items.filter((i) => !i.category_id);

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
        onDelete={deleteList}
        onReorder={reorderLists}
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
            <Sortable.Flex
              flexDirection="column"
              customHandle
              onOrderChange={({ indexToKey }) => reorderCategories(indexToKey)}
            >
              {categories.map((category) => (
                <CategorySection
                  key={category.id}
                  category={category}
                  items={items.filter((i) => i.category_id === category.id)}
                  autoEditName={category.id === justCreatedCategoryId}
                  onRenameCategory={(name) => renameCategory(category.id, name)}
                  onDeleteCategory={() => deleteCategory(category.id)}
                  onAddCategory={handleAddCategory}
                  onAddItem={(name) => addItem(name, category.id)}
                  onTogglePacked={togglePacked}
                  onRenameItem={renameItem}
                  onChangeQuantity={setQuantity}
                  onDeleteItem={deleteItem}
                  onRetryItem={retryAdd}
                  onReorderItems={(orderedIds) => reorderItems(category.id, orderedIds)}
                />
              ))}
            </Sortable.Flex>

            <CategorySection
              category={null}
              items={uncategorizedItems}
              onAddCategory={handleAddCategory}
              onAddItem={(name) => addItem(name, null)}
              onTogglePacked={togglePacked}
              onRenameItem={renameItem}
              onChangeQuantity={setQuantity}
              onDeleteItem={deleteItem}
              onRetryItem={retryAdd}
              onReorderItems={(orderedIds) => reorderItems(null, orderedIds)}
            />
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

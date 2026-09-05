import { Stack, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Sortable from 'react-native-sortables';

import { ItemEditorSheet } from '@/components/trip/item-editor-sheet';
import { ItemGroupSection } from '@/components/trip/item-group-section';
import { ItemRow } from '@/components/trip/item-row';
import {
  ItemViewControls,
  UNASSIGNED_KEY,
  UNCATEGORIZED_KEY,
  type GroupBy,
} from '@/components/trip/item-view-controls';
import { InviteSheet } from '@/components/trip/invite-sheet';
import { PackingListTabs } from '@/components/trip/packing-list-tabs';
import { QuickAddInput } from '@/components/trip/quick-add-input';
import { TripHeader } from '@/components/trip/trip-header';
import { Text } from '@/components/ui/text';
import { useCategorySuggestions } from '@/hooks/useCategorySuggestions';
import { useItems, type Item } from '@/hooks/useItems';
import { usePackingLists } from '@/hooks/usePackingLists';
import { useTrip } from '@/hooks/useTrip';
import { useTripMembers, type TripMember } from '@/hooks/useTripMembers';

interface Group {
  key: string;
  title: string;
  member?: TripMember | null;
  items: Item[];
}

export default function TripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trip, loading: tripLoading, renameTrip } = useTrip(id);
  const { members } = useTripMembers(id);
  const { lists, createList, renameList, deleteList, reorderLists } = usePackingLists(id);
  const [activeListId, setActiveListId] = React.useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = React.useState(false);

  React.useEffect(() => {
    const activeStillExists = lists.some((l) => l.id === activeListId);
    if (!activeStillExists) {
      setActiveListId(lists.length > 0 ? lists[0].id : null);
    }
  }, [lists, activeListId]);

  const { items, retryAdd, togglePacked, renameItem, setQuantity, setAssignedTo, setCategory, deleteItem, addItem, reorderItems } =
    useItems(activeListId);
  const { suggestions: categorySuggestions, refresh: refreshCategorySuggestions } = useCategorySuggestions(id);

  const [groupBy, setGroupBy] = React.useState<GroupBy>('person');
  const [filterPersons, setFilterPersons] = React.useState<Set<string>>(new Set());
  const [filterCategories, setFilterCategories] = React.useState<Set<string>>(new Set());
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);

  if (tripLoading || !trip) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Cargando…</Text>
      </SafeAreaView>
    );
  }

  const memberById = new Map(members.map((m) => [m.user_id, m]));
  const memberName = (userId: string | null) => {
    if (!userId) return null;
    const member = memberById.get(userId);
    return member?.profile?.full_name || member?.profile?.email || null;
  };

  function togglePersonFilter(key: string) {
    setFilterPersons((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleCategoryFilter(key: string) {
    setFilterCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function clearFilters() {
    setFilterPersons(new Set());
    setFilterCategories(new Set());
  }

  const availableCategories = Array.from(new Set(items.map((i) => i.category).filter((c): c is string => !!c))).sort(
    (a, b) => a.localeCompare(b)
  );

  const filteredItems = items.filter((item) => {
    if (filterPersons.size > 0 && !filterPersons.has(item.assigned_to ?? UNASSIGNED_KEY)) return false;
    if (filterCategories.size > 0 && !filterCategories.has(item.category ?? UNCATEGORIZED_KEY)) return false;
    return true;
  });

  const groups: Group[] = [];
  if (groupBy === 'person') {
    const byKey = new Map<string, Item[]>();
    for (const item of filteredItems) {
      const key = item.assigned_to ?? UNASSIGNED_KEY;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(item);
    }
    const general = byKey.get(UNASSIGNED_KEY) ?? [];
    if (general.length > 0) groups.push({ key: UNASSIGNED_KEY, title: 'General', member: null, items: general });
    for (const member of members) {
      const memberItems = byKey.get(member.user_id);
      if (memberItems && memberItems.length > 0) {
        groups.push({
          key: member.user_id,
          title: memberName(member.user_id) || '?',
          member,
          items: memberItems,
        });
      }
    }
  } else if (groupBy === 'category') {
    const byKey = new Map<string, Item[]>();
    for (const item of filteredItems) {
      const key = item.category ?? UNCATEGORIZED_KEY;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(item);
    }
    const otros = byKey.get(UNCATEGORIZED_KEY) ?? [];
    if (otros.length > 0) groups.push({ key: UNCATEGORIZED_KEY, title: 'Otros', items: otros });
    const categoryKeys = Array.from(byKey.keys())
      .filter((k) => k !== UNCATEGORIZED_KEY)
      .sort((a, b) => a.localeCompare(b));
    for (const key of categoryKeys) {
      groups.push({ key, title: key, items: byKey.get(key)! });
    }
  }

  const editingItem = items.find((i) => i.id === editingItemId) ?? null;
  const packedCount = items.filter((i) => i.is_packed).length;

  function renderItemRow(item: Item, draggable: boolean) {
    return (
      <ItemRow
        key={item.id}
        item={item}
        assignedName={memberName(item.assigned_to)}
        draggable={draggable}
        onTogglePacked={() => togglePacked(item.id)}
        onRename={(name) => renameItem(item.id, name)}
        onChangeQuantity={(quantity) => setQuantity(item.id, quantity)}
        onDelete={() => deleteItem(item.id)}
        onRetry={() => retryAdd(item.id)}
        onOpenEditor={() => setEditingItemId(item.id)}
      />
    );
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

          <ItemViewControls
            groupBy={groupBy}
            onGroupByChange={setGroupBy}
            members={members}
            categories={availableCategories}
            filterPersons={filterPersons}
            filterCategories={filterCategories}
            onTogglePersonFilter={togglePersonFilter}
            onToggleCategoryFilter={toggleCategoryFilter}
            onClearFilters={clearFilters}
          />

          <ScrollView className="flex-1">
            {groupBy === 'none' ? (
              <Sortable.Flex
                flexDirection="column"
                customHandle
                onOrderChange={({ indexToKey }) => reorderItems(indexToKey)}
              >
                {filteredItems.map((item) => renderItemRow(item, true))}
              </Sortable.Flex>
            ) : (
              groups.map((group) => (
                <ItemGroupSection
                  key={group.key}
                  title={group.title}
                  member={group.member}
                  packedCount={group.items.filter((i) => i.is_packed).length}
                  totalCount={group.items.length}
                >
                  {group.items.map((item) => renderItemRow(item, false))}
                </ItemGroupSection>
              ))
            )}

            <View className="px-4 py-3">
              <QuickAddInput onSubmit={(name) => addItem(name)} />
            </View>
          </ScrollView>
        </>
      )}

      <ItemEditorSheet
        item={editingItem}
        members={members}
        categorySuggestions={categorySuggestions}
        onAssign={(userId) => editingItem && setAssignedTo(editingItem.id, userId)}
        onSetCategory={(category) => {
          if (!editingItem) return;
          setCategory(editingItem.id, category);
          refreshCategorySuggestions();
        }}
        onClose={() => setEditingItemId(null)}
      />

      <InviteSheet
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        tripId={trip.id}
        tripName={trip.name}
      />
    </SafeAreaView>
  );
}

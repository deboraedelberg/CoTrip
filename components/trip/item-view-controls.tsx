import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Text } from '@/components/ui/text';
import type { TripMember } from '@/hooks/useTripMembers';
import { cn } from '@/lib/utils';

export type GroupBy = 'person' | 'category' | 'none';

interface ItemViewControlsProps {
  groupBy: GroupBy;
  onGroupByChange: (groupBy: GroupBy) => void;
  members: TripMember[];
  categories: string[];
  filterPersons: Set<string>;
  filterCategories: Set<string>;
  onTogglePersonFilter: (key: string) => void;
  onToggleCategoryFilter: (key: string) => void;
  onClearFilters: () => void;
}

export const UNASSIGNED_KEY = '__unassigned__';
export const UNCATEGORIZED_KEY = '__uncategorized__';

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn('rounded-full px-3 py-1.5', selected ? 'bg-primary' : 'bg-secondary')}
    >
      <Text className={selected ? 'text-primary-foreground' : 'text-secondary-foreground'}>{label}</Text>
    </Pressable>
  );
}

export function ItemViewControls({
  groupBy,
  onGroupByChange,
  members,
  categories,
  filterPersons,
  filterCategories,
  onTogglePersonFilter,
  onToggleCategoryFilter,
  onClearFilters,
}: ItemViewControlsProps) {
  const hasFilters = filterPersons.size > 0 || filterCategories.size > 0;

  return (
    <View className="gap-3 border-b border-border px-4 py-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Agrupar por
        </Text>
        <ToggleGroup
          type="single"
          value={groupBy}
          onValueChange={(value) => value && onGroupByChange(value as GroupBy)}
          variant="outline"
        >
          <ToggleGroupItem value="person" isFirst>
            <Text>Persona</Text>
          </ToggleGroupItem>
          <ToggleGroupItem value="category">
            <Text>Categoría</Text>
          </ToggleGroupItem>
          <ToggleGroupItem value="none" isLast>
            <Text>Todo</Text>
          </ToggleGroupItem>
        </ToggleGroup>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row items-center gap-2">
          <FilterChip
            label="General"
            selected={filterPersons.has(UNASSIGNED_KEY)}
            onPress={() => onTogglePersonFilter(UNASSIGNED_KEY)}
          />
          {members.map((member) => {
            const label = member.profile?.full_name || member.profile?.email || '?';
            return (
              <FilterChip
                key={member.user_id}
                label={label}
                selected={filterPersons.has(member.user_id)}
                onPress={() => onTogglePersonFilter(member.user_id)}
              />
            );
          })}

          <View className="h-5 w-px bg-border" />

          <FilterChip
            label="Otros"
            selected={filterCategories.has(UNCATEGORIZED_KEY)}
            onPress={() => onToggleCategoryFilter(UNCATEGORIZED_KEY)}
          />
          {categories.map((category) => (
            <FilterChip
              key={category}
              label={category}
              selected={filterCategories.has(category)}
              onPress={() => onToggleCategoryFilter(category)}
            />
          ))}

          {hasFilters ? (
            <Pressable onPress={onClearFilters} hitSlop={4} className="px-2 py-1.5">
              <Text className="text-sm text-muted-foreground underline">Limpiar filtros</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

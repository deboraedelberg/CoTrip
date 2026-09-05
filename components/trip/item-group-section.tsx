import * as React from 'react';
import { View } from 'react-native';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import type { TripMember } from '@/hooks/useTripMembers';

interface ItemGroupSectionProps {
  title: string;
  member?: TripMember | null;
  packedCount: number;
  totalCount: number;
  children: React.ReactNode;
}

export function ItemGroupSection({ title, member, packedCount, totalCount, children }: ItemGroupSectionProps) {
  return (
    <View className="border-b-8 border-background">
      <View className="flex-row items-center gap-2 bg-secondary/40 px-4 py-2">
        {member ? (
          <Avatar alt={title} className="h-5 w-5">
            {member.profile?.avatar_url ? <AvatarImage source={{ uri: member.profile.avatar_url }} /> : null}
            <AvatarFallback>
              <Text className="text-[10px]">{title.charAt(0).toUpperCase()}</Text>
            </AvatarFallback>
          </Avatar>
        ) : null}
        <Text className="flex-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </Text>
        {totalCount > 0 ? (
          <Text className="text-xs text-muted-foreground">
            {packedCount}/{totalCount} empacados
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

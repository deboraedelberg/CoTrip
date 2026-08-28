import * as React from 'react';
import { View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EditableText } from '@/components/ui/editable-text';
import { Text } from '@/components/ui/text';
import type { TripMember } from '@/hooks/useTripMembers';
import type { Database } from '@/types/database';

type Trip = Database['public']['Tables']['trips']['Row'];

interface TripHeaderProps {
  trip: Trip;
  members: TripMember[];
  onInvitePress: () => void;
  onRenameTrip: (name: string) => void;
}

function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) return null;
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const startLabel = start ? new Date(start).toLocaleDateString('es-AR', opts) : null;
  const endLabel = end ? new Date(end).toLocaleDateString('es-AR', opts) : null;
  if (startLabel && endLabel) return `${startLabel} - ${endLabel}`;
  return startLabel ?? endLabel;
}

export function TripHeader({ trip, members, onInvitePress, onRenameTrip }: TripHeaderProps) {
  const dateRange = formatDateRange(trip.start_date, trip.end_date);
  const [editingName, setEditingName] = React.useState(false);

  return (
    <View className="gap-3 border-b border-border px-4 pb-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 gap-1">
          <EditableText
            value={trip.name}
            editing={editingName}
            onStartEdit={() => setEditingName(true)}
            onFinishEdit={(name) => {
              setEditingName(false);
              onRenameTrip(name);
            }}
            textClassName="text-2xl font-bold"
            inputClassName="text-2xl font-bold"
          />
          {trip.destination ? <Text className="text-muted-foreground">{trip.destination}</Text> : null}
          {dateRange ? <Text className="text-muted-foreground">{dateRange}</Text> : null}
        </View>
        <Button size="sm" onPress={onInvitePress}>
          <Text>Invitar</Text>
        </Button>
      </View>

      <View className="flex-row -space-x-2">
        {members.map((member) => (
          <Avatar
            key={member.user_id}
            name={member.profile?.full_name || member.profile?.email || '?'}
            imageUrl={member.profile?.avatar_url}
            size={32}
            className="border-2 border-background"
          />
        ))}
      </View>
    </View>
  );
}

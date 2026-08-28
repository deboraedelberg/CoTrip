import * as React from 'react';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type TripMemberRow = Database['public']['Tables']['trip_members']['Row'];

export type TripMember = TripMemberRow & { profile: Profile | null };

export function useTripMembers(tripId: string) {
  const [members, setMembers] = React.useState<TripMember[]>([]);

  const refresh = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('trip_members')
      .select('*, profile:profiles(*)')
      .eq('trip_id', tripId)
      .order('joined_at', { ascending: true });
    if (!error && data) setMembers(data as unknown as TripMember[]);
  }, [tripId]);

  React.useEffect(() => {
    refresh();

    const channel = supabase
      .channel(`trip-members-${tripId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_members', filter: `trip_id=eq.${tripId}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, refresh]);

  return { members };
}

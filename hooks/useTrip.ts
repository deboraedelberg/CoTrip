import * as React from 'react';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Trip = Database['public']['Tables']['trips']['Row'];

export function useTrip(tripId: string) {
  const [trip, setTrip] = React.useState<Trip | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single()
      .then(({ data }) => {
        if (!cancelled) {
          setTrip(data);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  async function renameTrip(name: string) {
    const trimmed = name.trim();
    if (!trimmed || !trip || trimmed === trip.name) return;

    const previous = trip;
    setTrip({ ...trip, name: trimmed });

    const { data, error } = await supabase
      .from('trips')
      .update({ name: trimmed })
      .eq('id', tripId)
      .select()
      .single();

    if (error || !data) {
      setTrip(previous);
      return { error };
    }

    setTrip(data);
    return { data };
  }

  return { trip, loading, renameTrip };
}

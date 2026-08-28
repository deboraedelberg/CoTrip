import * as React from 'react';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Trip = Database['public']['Tables']['trips']['Row'];

export function useTrips() {
  const { session } = useAuth();
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setTrips(data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (session) refresh();
  }, [session, refresh]);

  async function createTrip(input: { name: string; destination?: string }) {
    if (!session) return { error: new Error('Not signed in') };

    const tempId = `temp-${Date.now()}`;
    const optimisticTrip: Trip = {
      id: tempId,
      name: input.name,
      destination: input.destination ?? null,
      start_date: null,
      end_date: null,
      created_by: session.user.id,
      created_at: new Date().toISOString(),
    };
    setTrips((prev) => [optimisticTrip, ...prev]);

    const { data, error } = await supabase
      .from('trips')
      .insert({ name: input.name, destination: input.destination, created_by: session.user.id })
      .select()
      .single();

    if (error || !data) {
      setTrips((prev) => prev.filter((t) => t.id !== tempId));
      return { error };
    }

    setTrips((prev) => prev.map((t) => (t.id === tempId ? data : t)));
    return { data };
  }

  return { trips, loading, createTrip, refresh };
}

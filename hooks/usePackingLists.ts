import * as React from 'react';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type PackingList = Database['public']['Tables']['packing_lists']['Row'];

export function usePackingLists(tripId: string) {
  const { session } = useAuth();
  const [lists, setLists] = React.useState<PackingList[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('packing_lists')
      .select('*')
      .eq('trip_id', tripId)
      .order('position', { ascending: true });
    if (!error && data) setLists(data);
    setLoading(false);
  }, [tripId]);

  React.useEffect(() => {
    refresh();

    const channel = supabase
      .channel(`packing-lists-${tripId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'packing_lists', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as PackingList;
            setLists((prev) => (prev.some((l) => l.id === row.id) ? prev : [...prev, row]));
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as PackingList;
            setLists((prev) => prev.map((l) => (l.id === row.id ? row : l)));
          } else if (payload.eventType === 'DELETE') {
            const row = payload.old as PackingList;
            setLists((prev) => prev.filter((l) => l.id !== row.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, refresh]);

  async function createList(name: string) {
    if (!session) return { error: new Error('Not signed in') };

    const tempId = `temp-${Date.now()}`;
    const position = lists.length;
    const optimistic: PackingList = {
      id: tempId,
      trip_id: tripId,
      name,
      position,
      created_by: session.user.id,
      created_at: new Date().toISOString(),
    };
    setLists((prev) => [...prev, optimistic]);

    const { data, error } = await supabase
      .from('packing_lists')
      .insert({ trip_id: tripId, name, position, created_by: session.user.id })
      .select()
      .single();

    if (error || !data) {
      setLists((prev) => prev.filter((l) => l.id !== tempId));
      return { error };
    }

    setLists((prev) => prev.map((l) => (l.id === tempId ? data : l)));
    return { data };
  }

  async function renameList(id: string, name: string) {
    const trimmed = name.trim();
    const previous = lists.find((l) => l.id === id);
    if (!trimmed || !previous || trimmed === previous.name) return;

    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, name: trimmed } : l)));

    const { data, error } = await supabase
      .from('packing_lists')
      .update({ name: trimmed })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      setLists((prev) => prev.map((l) => (l.id === id ? previous : l)));
      return { error };
    }

    setLists((prev) => prev.map((l) => (l.id === id ? data : l)));
    return { data };
  }

  async function reorderLists(orderedIds: string[]) {
    const previous = lists;
    const byId = new Map(previous.map((l) => [l.id, l]));
    const reordered = orderedIds
      .map((id, index) => {
        const list = byId.get(id);
        return list ? { ...list, position: index } : null;
      })
      .filter((l): l is PackingList => l !== null);
    setLists(reordered);

    const results = await Promise.all(
      reordered.map((l) => supabase.from('packing_lists').update({ position: l.position }).eq('id', l.id))
    );
    if (results.some((r) => r.error)) setLists(previous);
  }

  return { lists, loading, createList, renameList, reorderLists };
}

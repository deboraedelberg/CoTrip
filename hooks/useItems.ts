import * as React from 'react';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type ItemRow = Database['public']['Tables']['items']['Row'];
export type ItemSyncStatus = 'synced' | 'pending' | 'error';
export type Item = ItemRow & { _status: ItemSyncStatus };

export function useItems(packingListId: string | null) {
  const { session } = useAuth();
  const [items, setItems] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    if (!packingListId) return;
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('packing_list_id', packingListId)
      .order('created_at', { ascending: true });
    if (!error && data) {
      setItems(data.map((row) => ({ ...row, _status: 'synced' as const })));
    }
    setLoading(false);
  }, [packingListId]);

  React.useEffect(() => {
    if (!packingListId) {
      setItems([]);
      setLoading(false);
      return;
    }

    refresh();

    const channel = supabase
      .channel(`items-${packingListId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items', filter: `packing_list_id=eq.${packingListId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as ItemRow;
            setItems((prev) =>
              prev.some((i) => i.id === row.id) ? prev : [...prev, { ...row, _status: 'synced' }]
            );
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as ItemRow;
            setItems((prev) => prev.map((i) => (i.id === row.id ? { ...row, _status: 'synced' } : i)));
          } else if (payload.eventType === 'DELETE') {
            const row = payload.old as ItemRow;
            setItems((prev) => prev.filter((i) => i.id !== row.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [packingListId, refresh]);

  async function addItem(name: string, categoryId: string | null = null) {
    const trimmed = name.trim();
    if (!trimmed || !session || !packingListId) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic: Item = {
      id: tempId,
      packing_list_id: packingListId,
      category_id: categoryId,
      name: trimmed,
      quantity: 1,
      is_packed: false,
      packed_by: null,
      packed_at: null,
      created_by: session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _status: 'pending',
    };
    setItems((prev) => [...prev, optimistic]);

    const { data, error } = await supabase
      .from('items')
      .insert({
        packing_list_id: packingListId,
        category_id: categoryId,
        name: trimmed,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error || !data) {
      setItems((prev) => prev.map((i) => (i.id === tempId ? { ...i, _status: 'error' } : i)));
      return;
    }

    setItems((prev) => prev.map((i) => (i.id === tempId ? { ...data, _status: 'synced' } : i)));
  }

  async function retryAdd(tempId: string) {
    const item = items.find((i) => i.id === tempId);
    if (!item || !session || !packingListId) return;

    setItems((prev) => prev.map((i) => (i.id === tempId ? { ...i, _status: 'pending' } : i)));

    const { data, error } = await supabase
      .from('items')
      .insert({
        packing_list_id: packingListId,
        category_id: item.category_id,
        name: item.name,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error || !data) {
      setItems((prev) => prev.map((i) => (i.id === tempId ? { ...i, _status: 'error' } : i)));
      return;
    }

    setItems((prev) => prev.map((i) => (i.id === tempId ? { ...data, _status: 'synced' } : i)));
  }

  async function togglePacked(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item || !session) return;

    const previous = item;
    const nextPacked = !item.is_packed;
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              is_packed: nextPacked,
              packed_by: nextPacked ? session.user.id : null,
              packed_at: nextPacked ? new Date().toISOString() : null,
              _status: 'pending',
            }
          : i
      )
    );

    const { data, error } = await supabase
      .from('items')
      .update({
        is_packed: nextPacked,
        packed_by: nextPacked ? session.user.id : null,
        packed_at: nextPacked ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...previous, _status: 'error' } : i)));
      return;
    }

    setItems((prev) => prev.map((i) => (i.id === id ? { ...data, _status: 'synced' } : i)));
  }

  async function renameItem(id: string, name: string) {
    const trimmed = name.trim();
    const previous = items.find((i) => i.id === id);
    if (!trimmed || !previous || trimmed === previous.name) return;

    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, name: trimmed, _status: 'pending' } : i)));

    const { data, error } = await supabase
      .from('items')
      .update({ name: trimmed })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...previous, _status: 'error' } : i)));
      return;
    }

    setItems((prev) => prev.map((i) => (i.id === id ? { ...data, _status: 'synced' } : i)));
  }

  async function setQuantity(id: string, quantity: number) {
    if (quantity < 1) return;
    const previous = items.find((i) => i.id === id);
    if (!previous) return;

    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity, _status: 'pending' } : i)));

    const { data, error } = await supabase
      .from('items')
      .update({ quantity })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...previous, _status: 'error' } : i)));
      return;
    }

    setItems((prev) => prev.map((i) => (i.id === id ? { ...data, _status: 'synced' } : i)));
  }

  async function deleteItem(id: string) {
    const previous = items;
    setItems((prev) => prev.filter((i) => i.id !== id));

    if (id.startsWith('temp-')) return;

    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) setItems(previous);
  }

  return { items, loading, addItem, retryAdd, togglePacked, renameItem, setQuantity, deleteItem };
}

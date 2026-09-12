'use client';

import * as React from 'react';

import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type ItemRow = Database['public']['Tables']['items']['Row'];
export type ItemSyncStatus = 'synced' | 'pending' | 'error';
export type Item = ItemRow & { _status: ItemSyncStatus };

export function useItems(listId: string, initialItems: ItemRow[], userId: string) {
  const [items, setItems] = React.useState<Item[]>(
    initialItems.map((row) => ({ ...row, _status: 'synced' }))
  );

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`items-${listId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items', filter: `list_id=eq.${listId}` },
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
  }, [listId]);

  async function addItem(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;

    const supabase = createClient();
    const last = items[items.length - 1] as Item | undefined;
    const defaultCategory = last?.category ?? null;
    const defaultAssignedTo = last?.assigned_to ?? null;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic: Item = {
      id: tempId,
      list_id: listId,
      name: trimmed,
      quantity: 1,
      category: defaultCategory,
      assigned_to: defaultAssignedTo,
      is_packed: false,
      packed_by: null,
      packed_at: null,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _status: 'pending',
    };
    setItems((prev) => [...prev, optimistic]);

    const { data, error } = await supabase
      .from('items')
      .insert({
        list_id: listId,
        name: trimmed,
        created_by: userId,
        category: defaultCategory,
        assigned_to: defaultAssignedTo,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('addItem failed', error);
      setItems((prev) => prev.map((i) => (i.id === tempId ? { ...i, _status: 'error' } : i)));
      return;
    }

    setItems((prev) => prev.map((i) => (i.id === tempId ? { ...data, _status: 'synced' } : i)));
  }

  async function togglePacked(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const nextPacked = !item.is_packed;
    await updateItem(id, {
      is_packed: nextPacked,
      packed_by: nextPacked ? userId : null,
      packed_at: nextPacked ? new Date().toISOString() : null,
    });
  }

  async function updateItem(id: string, patch: Partial<ItemRow>) {
    const supabase = createClient();
    const previous = items.find((i) => i.id === id);
    if (!previous) return;

    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch, _status: 'pending' } : i)));

    const { data, error } = await supabase.from('items').update(patch).eq('id', id).select().single();

    if (error || !data) {
      console.error('updateItem failed', error);
      setItems((prev) => prev.map((i) => (i.id === id ? { ...previous, _status: 'error' } : i)));
      return;
    }

    setItems((prev) => prev.map((i) => (i.id === id ? { ...data, _status: 'synced' } : i)));
  }

  async function deleteItem(id: string) {
    const supabase = createClient();
    const previous = items;
    setItems((prev) => prev.filter((i) => i.id !== id));

    if (id.startsWith('temp-')) return;

    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) {
      console.error('deleteItem failed', error);
      setItems(previous);
    }
  }

  return { items, addItem, togglePacked, updateItem, deleteItem };
}

import * as React from 'react';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Category = Database['public']['Tables']['packing_list_categories']['Row'];

export function usePackingListCategories(packingListId: string | null) {
  const { session } = useAuth();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    if (!packingListId) return;
    const { data, error } = await supabase
      .from('packing_list_categories')
      .select('*')
      .eq('packing_list_id', packingListId)
      .order('position', { ascending: true });
    if (!error && data) setCategories(data);
    setLoading(false);
  }, [packingListId]);

  React.useEffect(() => {
    if (!packingListId) {
      setCategories([]);
      setLoading(false);
      return;
    }

    refresh();

    const channel = supabase
      .channel(`packing-list-categories-${packingListId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'packing_list_categories',
          filter: `packing_list_id=eq.${packingListId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as Category;
            setCategories((prev) => (prev.some((c) => c.id === row.id) ? prev : [...prev, row]));
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as Category;
            setCategories((prev) => prev.map((c) => (c.id === row.id ? row : c)));
          } else if (payload.eventType === 'DELETE') {
            const row = payload.old as Category;
            setCategories((prev) => prev.filter((c) => c.id !== row.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [packingListId, refresh]);

  async function createCategory(name: string) {
    const trimmed = name.trim();
    if (!trimmed || !session || !packingListId) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: Category = {
      id: tempId,
      packing_list_id: packingListId,
      name: trimmed,
      position: categories.length,
      created_by: session.user.id,
      created_at: new Date().toISOString(),
    };
    setCategories((prev) => [...prev, optimistic]);

    const { data, error } = await supabase
      .from('packing_list_categories')
      .insert({
        packing_list_id: packingListId,
        name: trimmed,
        position: optimistic.position,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error || !data) {
      setCategories((prev) => prev.filter((c) => c.id !== tempId));
      return { error };
    }

    setCategories((prev) => prev.map((c) => (c.id === tempId ? data : c)));
    return { data };
  }

  async function renameCategory(id: string, name: string) {
    const trimmed = name.trim();
    const previous = categories.find((c) => c.id === id);
    if (!trimmed || !previous || trimmed === previous.name) return;

    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c)));

    const { data, error } = await supabase
      .from('packing_list_categories')
      .update({ name: trimmed })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('renameCategory failed', error);
      setCategories((prev) => prev.map((c) => (c.id === id ? previous : c)));
      return { error };
    }

    setCategories((prev) => prev.map((c) => (c.id === id ? data : c)));
  }

  async function deleteCategory(id: string) {
    const previous = categories;
    setCategories((prev) => prev.filter((c) => c.id !== id));

    const { error } = await supabase.from('packing_list_categories').delete().eq('id', id);
    if (error) {
      console.error('deleteCategory failed', error);
      setCategories(previous);
    }
  }

  async function reorderCategories(orderedIds: string[]) {
    const previous = categories;
    const byId = new Map(previous.map((c) => [c.id, c]));
    const reordered = orderedIds
      .map((id, index) => {
        const category = byId.get(id);
        return category ? { ...category, position: index } : null;
      })
      .filter((c): c is Category => c !== null);
    setCategories(reordered);

    const results = await Promise.all(
      reordered.map((c) =>
        supabase.from('packing_list_categories').update({ position: c.position }).eq('id', c.id)
      )
    );
    if (results.some((r) => r.error)) setCategories(previous);
  }

  return { categories, loading, createCategory, renameCategory, deleteCategory, reorderCategories };
}

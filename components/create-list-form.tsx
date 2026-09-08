'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export function CreateListForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [name, setName] = React.useState('');
  const [creating, setCreating] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || creating) return;

    setCreating(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('lists')
      .insert({ name: trimmed, created_by: userId })
      .select()
      .single();

    if (error || !data) {
      console.error('create list failed', error);
      setCreating(false);
      return;
    }

    router.push(`/lists/${data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre de la lista"
        className="flex-1"
      />
      <Button type="submit" disabled={!name.trim() || creating}>
        {creating ? 'Creando…' : 'Nueva lista'}
      </Button>
    </form>
  );
}

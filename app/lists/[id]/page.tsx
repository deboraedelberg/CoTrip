import { notFound, redirect } from 'next/navigation';

import { ListView } from '@/components/list-view';
import { createClient } from '@/lib/supabase/server';

export default async function ListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: list } = await supabase.from('lists').select('*').eq('id', id).maybeSingle();
  if (!list) notFound();

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('list_id', id)
    .order('created_at', { ascending: true });

  return <ListView list={list} initialItems={items ?? []} currentUserId={user.id} />;
}

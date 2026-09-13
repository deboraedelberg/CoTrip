import { notFound, redirect } from 'next/navigation';

import { ListView } from '@/components/list-view';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ListMemberRole = Database['public']['Tables']['list_members']['Row']['role'];

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
    .order('position', { ascending: true });

  const { data: memberRows } = await supabase
    .from('list_members')
    .select('user_id, role, profile:profiles(id, name, email, avatar_url)')
    .eq('list_id', id);

  const typedMemberRows = (memberRows ?? []) as unknown as {
    user_id: string;
    role: ListMemberRole;
    profile: Profile | null;
  }[];
  const members = typedMemberRows.map((m) => m.profile).filter((p): p is Profile => !!p);
  const isOwner = typedMemberRows.some((m) => m.user_id === user.id && m.role === 'owner');

  const { data: invites } = await supabase
    .from('invites')
    .select('*')
    .eq('list_id', id)
    .eq('status', 'pending');

  return (
    <ListView
      list={list}
      initialItems={items ?? []}
      members={members}
      initialInvites={invites ?? []}
      currentUserId={user.id}
      isOwner={isOwner}
    />
  );
}

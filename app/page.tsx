import Link from 'next/link';
import { redirect } from 'next/navigation';

import { CreateListForm } from '@/components/create-list-form';
import { SignOutButton } from '@/components/sign-out-button';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type List = Database['public']['Tables']['lists']['Row'];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: memberships } = await supabase
    .from('list_members')
    .select('list:lists(id, name, created_by, created_at)')
    .eq('user_id', user.id);

  const lists = ((memberships ?? []) as unknown as { list: List | null }[])
    .map((m) => m.list)
    .filter((l): l is List => !!l)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Cotrip</h1>
        <SignOutButton />
      </div>

      <CreateListForm userId={user.id} />

      {lists.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Todavía no tenés listas. Creá la primera arriba.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lists.map((list) => (
            <li key={list.id}>
              <Link
                href={`/lists/${list.id}`}
                className="block rounded-2xl border border-border px-4 py-3 hover:bg-muted"
              >
                {list.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

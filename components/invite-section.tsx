'use client';

import * as React from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Profile = Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'name' | 'email'>;
type Invite = Database['public']['Tables']['invites']['Row'];

interface InviteSectionProps {
  listId: string;
  members: Profile[];
  invites: Invite[];
  onInvited: (invite: Invite) => void;
  currentUserId: string;
}

export function InviteSection({ listId, members, invites, onInvited, currentUserId }: InviteSectionProps) {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || sending) return;

    setSending(true);
    setError(null);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from('invites')
      .insert({ list_id: listId, email: trimmed, invited_by: currentUserId })
      .select()
      .single();
    setSending(false);

    if (insertError || !data) {
      setError('No se pudo invitar. Probá de nuevo.');
      return;
    }

    onInvited(data);
    setEmail('');
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">Miembros</span>
        <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
          Invitar
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-1">
            <Avatar size="sm">
              <AvatarFallback>{(m.name ?? m.email ?? '?').slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-xs">{m.name ?? m.email}</span>
          </div>
        ))}
        {invites.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center gap-1.5 rounded-full border border-dashed border-border px-2 py-1"
          >
            <span className="text-muted-foreground text-xs">{inv.email} (pendiente)</span>
          </div>
        ))}
      </div>

      {open ? (
        <form onSubmit={handleInvite} className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@ejemplo.com"
            className="flex-1"
            required
          />
          <Button type="submit" size="sm" disabled={!email.trim() || sending}>
            {sending ? 'Enviando…' : 'Enviar'}
          </Button>
        </form>
      ) : null}
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}

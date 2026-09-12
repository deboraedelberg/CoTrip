'use client';

import * as React from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { avatarColor } from '@/lib/avatar-color';
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
      <div className="flex flex-wrap items-center gap-2">
        {members.map((m) => {
          const label = m.name ?? m.email ?? '?';
          const color = avatarColor(label);
          return (
            <Avatar key={m.id} size="sm" title={label}>
              <AvatarFallback className="font-semibold" style={{ backgroundColor: color.bg, color: color.fg }}>
                {label.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          );
        })}
        {invites.map((inv) => {
          const color = avatarColor(inv.email);
          return (
            <Avatar key={inv.id} size="sm" className="after:border-dashed" title={`${inv.email} (pendiente)`}>
              <AvatarFallback className="font-semibold" style={{ backgroundColor: color.bg, color: color.fg }}>
                {inv.email.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          );
        })}
        <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
          Invitar
        </Button>
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

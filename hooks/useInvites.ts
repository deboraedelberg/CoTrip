import * as Linking from 'expo-linking';
import * as React from 'react';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Invite = Database['public']['Tables']['invites']['Row'];

export function useInvites(tripId: string) {
  const { session } = useAuth();
  const [invites, setInvites] = React.useState<Invite[]>([]);
  const [sending, setSending] = React.useState(false);

  const refresh = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq('trip_id', tripId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (!error && data) setInvites(data);
  }, [tripId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  async function sendInvite(email: string) {
    const trimmed = email.trim();
    if (!trimmed || !session || sending) return { error: new Error('Invalid state') };

    setSending(true);

    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .insert({ trip_id: tripId, email: trimmed, invited_by: session.user.id })
      .select()
      .single();

    if (inviteError || !invite) {
      setSending(false);
      return { error: inviteError };
    }

    // Reuses Supabase's built-in auth email (magic link) to deliver the
    // invite — no separate email provider is configured for this project.
    const { error: emailError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: Linking.createURL('/'), shouldCreateUser: true },
    });

    setSending(false);
    setInvites((prev) => [invite, ...prev]);
    return { data: invite, emailError };
  }

  return { invites, sending, sendInvite };
}

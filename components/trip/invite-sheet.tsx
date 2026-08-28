import * as React from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetHeader } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { useInvites } from '@/hooks/useInvites';

interface InviteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  tripName: string;
}

export function InviteSheet({ open, onOpenChange, tripId, tripName }: InviteSheetProps) {
  const { invites, sending, sendInvite } = useInvites(tripId);
  const [email, setEmail] = React.useState('');
  const [confirmation, setConfirmation] = React.useState<string | null>(null);

  async function handleSend() {
    const trimmed = email.trim();
    if (!trimmed) return;
    const result = await sendInvite(trimmed);
    if (!result.error) {
      setConfirmation(`Invitación enviada a ${trimmed}`);
      setEmail('');
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetHeader>
        <Text className="text-lg font-semibold">Invitar a {tripName}</Text>
      </SheetHeader>

      <View className="gap-3">
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="email@ejemplo.com"
          autoCapitalize="none"
          inputMode="email"
          keyboardType="email-address"
          onSubmitEditing={handleSend}
        />
        <Button onPress={handleSend} disabled={sending || !email.trim()}>
          <Text>{sending ? 'Enviando…' : 'Enviar invitación'}</Text>
        </Button>
        {confirmation ? <Text className="text-sm text-muted-foreground">{confirmation}</Text> : null}
      </View>

      {invites.length > 0 ? (
        <View className="mt-6 gap-2">
          <Text className="text-sm font-medium text-muted-foreground">Pendientes</Text>
          {invites.map((invite) => (
            <Text key={invite.id} className="text-sm text-muted-foreground">
              · {invite.email}
            </Text>
          ))}
        </View>
      ) : null}
    </Sheet>
  );
}

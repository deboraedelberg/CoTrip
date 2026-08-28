import * as Linking from 'expo-linking';
import * as React from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';

export default function SignInScreen() {
  const [email, setEmail] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSendLink() {
    if (!email.trim() || sending) return;
    setSending(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: Linking.createURL('/') },
    });

    setSending(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setSent(true);
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center px-6 gap-6"
      >
        <View className="gap-1">
          <Text className="text-3xl font-bold">CoTrip</Text>
          <Text className="text-muted-foreground">
            Organizá y compartí tus packing lists de viaje.
          </Text>
        </View>

        {sent ? (
          <Text className="text-base">
            Te mandamos un link mágico a {email}. Abrilo desde este dispositivo para entrar.
          </Text>
        ) : (
          <View className="gap-3">
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              autoCapitalize="none"
              autoComplete="email"
              inputMode="email"
              keyboardType="email-address"
              onSubmitEditing={handleSendLink}
            />
            {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
            <Button onPress={handleSendLink} disabled={sending || !email.trim()}>
              <Text>{sending ? 'Enviando…' : 'Enviar link mágico'}</Text>
            </Button>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

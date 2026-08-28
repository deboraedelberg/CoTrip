import * as Linking from 'expo-linking';
import * as React from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

// On native, magic-link emails open the app via a deep link carrying a PKCE
// `code` param. The web build handles this itself via detectSessionInUrl.
export function useAuthDeepLink() {
  React.useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleUrl = ({ url }: { url: string }) => {
      if (url.includes('code=')) {
        supabase.auth.exchangeCodeForSession(url).catch(() => {});
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    const subscription = Linking.addEventListener('url', handleUrl);
    return () => subscription.remove();
  }, []);
}

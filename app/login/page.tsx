'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [loading, setLoading] = React.useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Cotrip</h1>
          <p className="text-muted-foreground text-sm">Listas de equipaje colaborativas</p>
        </div>
        <Button className="w-full" size="lg" onClick={handleGoogleSignIn} disabled={loading}>
          {loading ? 'Redirigiendo…' : 'Continuar con Google'}
        </Button>
      </div>
    </div>
  );
}

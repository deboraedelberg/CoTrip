import { useRouter } from 'expo-router';
import * as React from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useTrips } from '@/hooks/useTrips';
import { supabase } from '@/lib/supabase';

export default function TripsScreen() {
  const router = useRouter();
  const { trips, loading, createTrip } = useTrips();
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setName('');
    setError(null);
    const result = await createTrip({ name: trimmed });
    if (result?.error) {
      setError(result.error.message ?? 'No se pudo crear el viaje.');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 gap-4 px-4 pt-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold">Mis viajes</Text>
          <Pressable onPress={() => supabase.auth.signOut()}>
            <Text className="text-sm text-muted-foreground">Salir</Text>
          </Pressable>
        </View>

        <View className="flex-row gap-2">
          <Input
            className="flex-1"
            value={name}
            onChangeText={setName}
            placeholder="Nombre del viaje (ej: Bariloche 2026)"
            onSubmitEditing={handleCreate}
            returnKeyType="done"
          />
          <Button onPress={handleCreate} disabled={!name.trim()}>
            <Text>Crear</Text>
          </Button>
        </View>

        {error ? <Text className="text-sm text-destructive">{error}</Text> : null}

        {!loading && trips.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-2">
            <Text className="text-muted-foreground">Todavía no tenés viajes.</Text>
            <Text className="text-muted-foreground">Creá el primero arriba.</Text>
          </View>
        ) : (
          <FlatList
            data={trips}
            keyExtractor={(trip) => trip.id}
            contentContainerClassName="gap-3 pb-4"
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push(`/trip/${item.id}`)}>
                <Card>
                  <Text className="text-lg font-semibold">{item.name}</Text>
                  {item.destination ? (
                    <Text className="text-muted-foreground">{item.destination}</Text>
                  ) : null}
                </Card>
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

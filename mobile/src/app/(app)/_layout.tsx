import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { useOnline } from '@/core/network/use-online';
import { useOfflineQueue } from '@/data/offline-queue';

export default function AppLayout() {
  const online = useOnline();
  const sync = useOfflineQueue((s) => s.sync);

  // Replay queued offline check-ins as soon as the connection returns.
  useEffect(() => {
    if (online) void sync();
  }, [online, sync]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="check-in" options={{ presentation: 'modal' }} />
      <Stack.Screen name="check-out" options={{ presentation: 'modal' }} />
      <Stack.Screen name="attendance/correction" options={{ presentation: 'transparentModal', animation: 'fade' }} />
    </Stack>
  );
}

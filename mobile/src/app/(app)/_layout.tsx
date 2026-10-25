import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { useOnline } from '@/core/network/use-online';
import { startChat } from '@/data/chat';
import { useOfflineQueue } from '@/data/offline-queue';

export default function AppLayout() {
  const online = useOnline();
  const sync = useOfflineQueue((s) => s.sync);

  // Replay queued offline check-ins as soon as the connection returns.
  useEffect(() => {
    if (online) void sync();
  }, [online, sync]);

  // Chat stays connected while the app is open so messages and the unread badge are live.
  useEffect(() => startChat(), []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="check-in" options={{ presentation: 'modal' }} />
      <Stack.Screen name="check-out" options={{ presentation: 'modal' }} />
      <Stack.Screen name="attendance/correction" options={{ presentation: 'transparentModal', animation: 'fade' }} />
    </Stack>
  );
}

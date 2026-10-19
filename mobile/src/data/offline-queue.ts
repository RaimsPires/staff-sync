import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { repos } from './index';
import type { CheckEvent } from './repositories/types';

type QueueState = {
  events: CheckEvent[];
  syncing: boolean;
  enqueue: (event: CheckEvent) => void;
  /** Uploads queued events; events the server answered are dropped. */
  sync: () => Promise<{ synced: number; remaining: number }>;
};

/**
 * Check-ins taken without network. Holds GPS points and timestamps only,
 * never credentials. Each event carries a `clientEventId` so replays are idempotent.
 */
export const useOfflineQueue = create<QueueState>()(
  persist(
    (set, get) => ({
      events: [],
      syncing: false,
      enqueue: (event) =>
        set((s) =>
          s.events.some((e) => e.clientEventId === event.clientEventId) ? s : { events: [...s.events, event] },
        ),
      async sync() {
        const { events, syncing } = get();
        if (syncing || events.length === 0) return { synced: 0, remaining: events.length };
        set({ syncing: true });
        try {
          const results = await repos.attendance.sync(events);
          // The server decided on every event it answered (accepted, or rejected as a
          // duplicate/conflict), so those leave the queue. Unanswered ones are retried.
          const answered = events.filter((e) => results[e.clientEventId] !== undefined);
          const synced = answered.filter((e) => !(results[e.clientEventId] instanceof Error)).length;
          set((s) => ({ events: s.events.filter((e) => results[e.clientEventId] === undefined) }));
          return { synced, remaining: events.length - answered.length };
        } catch {
          return { synced: 0, remaining: get().events.length };
        } finally {
          set({ syncing: false });
        }
      },
    }),
    {
      name: 'staffsync.offline-queue',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ events }) => ({ events }),
    },
  ),
);

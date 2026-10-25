import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { repos } from './index';
import { AppError } from './repositories/types';
import type { CheckEvent, ProxyInput } from './repositories/types';

/** A manager's roster note written offline. */
export type QueuedNote = { id: string; employeeId: string; note: string };

/**
 * A proxy check-in/out taken offline. It never carries a PIN: the PIN can only be verified
 * online, so offline proxy checks are verified by the employee's photo instead.
 */
export type QueuedProxy = { id: string; employeeName: string; input: Omit<ProxyInput, 'pin'> };

/** Everything waiting to sync, for badges and counters. */
export const selectPending = (s: { events: unknown[]; notes: unknown[]; proxies: unknown[] }) => s.events.length + s.notes.length + s.proxies.length;

type QueueState = {
  events: CheckEvent[];
  notes: QueuedNote[];
  proxies: QueuedProxy[];
  syncing: boolean;
  enqueue: (event: CheckEvent) => void;
  enqueueNote: (note: QueuedNote) => void;
  enqueueProxy: (proxy: QueuedProxy) => void;
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
      notes: [],
      proxies: [],
      syncing: false,
      enqueue: (event) =>
        set((s) =>
          s.events.some((e) => e.clientEventId === event.clientEventId) ? s : { events: [...s.events, event] },
        ),
      // A newer note for the same employee replaces the queued one.
      enqueueNote: (note) => set((s) => ({ notes: [...s.notes.filter((n) => n.employeeId !== note.employeeId), note] })),
      enqueueProxy: (proxy) => set((s) => ({ proxies: [...s.proxies, proxy] })),
      async sync() {
        const { events, notes, proxies, syncing } = get();
        if (syncing || (events.length === 0 && notes.length === 0 && proxies.length === 0)) return { synced: 0, remaining: events.length + notes.length + proxies.length };
        set({ syncing: true });
        try {
          let syncedNotes = 0;
          for (const n of notes) {
            try {
              await repos.manager.addNote(n.employeeId, n.note);
              set((s) => ({ notes: s.notes.filter((x) => x.id !== n.id) }));
              syncedNotes += 1;
            } catch {
              // Kept for the next attempt.
            }
          }
          let syncedProxies = 0;
          for (const p of proxies) {
            try {
              await repos.manager.proxyCheck({ ...(p.input as ProxyInput), clientEventId: p.id });
              syncedProxies += 1;
              set((s) => ({ proxies: s.proxies.filter((x) => x.id !== p.id) }));
            } catch (e) {
              // The server answered with a decision (e.g. not scheduled): retrying cannot change it, so drop it.
              if (e instanceof AppError) set((s) => ({ proxies: s.proxies.filter((x) => x.id !== p.id) }));
            }
          }
          if (events.length === 0) return { synced: syncedNotes + syncedProxies, remaining: get().notes.length + get().proxies.length };
          const results = await repos.attendance.sync(events);
          // The server decided on every event it answered (accepted, or rejected as a
          // duplicate/conflict), so those leave the queue. Unanswered ones are retried.
          const answered = events.filter((e) => results[e.clientEventId] !== undefined);
          const synced = answered.filter((e) => !(results[e.clientEventId] instanceof Error)).length;
          set((s) => ({ events: s.events.filter((e) => results[e.clientEventId] === undefined) }));
          return { synced: synced + syncedNotes + syncedProxies, remaining: events.length - answered.length + get().notes.length + get().proxies.length };
        } catch {
          return { synced: 0, remaining: get().events.length + get().notes.length + get().proxies.length };
        } finally {
          set({ syncing: false });
        }
      },
    }),
    {
      name: 'staffsync.offline-queue',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ events, notes, proxies }) => ({ events, notes, proxies }),
    },
  ),
);

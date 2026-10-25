import { create } from "zustand";
import { DEFAULT_SETTINGS, SEED_HOOKS, SEED_KEYS, SEED_LEAVE_TYPES } from "@/data/settings";
import { useSyncError } from "@/store/sync-error";
import type { ApiKey, LeaveTypeDef, SettingsValues, Webhook } from "@/types/settings";

const random = (len: number) => Array.from({ length: len }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");

/** Persistence behind the store, installed once the user is signed in (see `services/settings`). */
export interface SettingsRemote {
  patch: (p: Partial<SettingsValues>) => Promise<void>;
  saveLeaveType: (t: Omit<LeaveTypeDef, "id" | "builtIn"> & { id: string | null }) => Promise<void>;
  deleteLeaveType: (id: string) => Promise<void>;
  createKey: (name: string) => Promise<string>;
  revokeKey: (id: string) => Promise<void>;
  addHook: (url: string, events: string[]) => Promise<string>;
  toggleHook: (id: string, on: boolean) => Promise<void>;
  deleteHook: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}
export const settingsRemote: { current: SettingsRemote | null } = { current: null };

/** Run a server change in the background; when it fails, say why and reload the real settings. */
function sync(send: (r: SettingsRemote) => Promise<unknown>) {
  const remote = settingsRemote.current;
  if (!remote) return;
  send(remote).catch((e: unknown) => {
    useSyncError.getState().report(e instanceof Error ? e.message : "Couldn’t save the change");
    void remote.reload();
  });
}

interface SettingsState {
  values: SettingsValues;
  leaveTypes: LeaveTypeDef[];
  keys: ApiKey[];
  hooks: Webhook[];
  /** Changes apply immediately; there is no separate save step. */
  patch: (p: Partial<SettingsValues>) => void;
  saveLeaveType: (t: Omit<LeaveTypeDef, "id" | "builtIn"> & { id: string | null }) => void;
  deleteLeaveType: (id: string) => void;
  /** Creates a key and resolves with the secret, which is shown only once. */
  createKey: (name: string) => Promise<string>;
  revokeKey: (id: string) => void;
  /** Creates a webhook and resolves with its signing secret. */
  addHook: (url: string, events: string[]) => Promise<string>;
  toggleHook: (id: string) => void;
  deleteHook: (id: string) => void;
}

export const useSettings = create<SettingsState>((set, get) => ({
  values: DEFAULT_SETTINGS,
  leaveTypes: SEED_LEAVE_TYPES,
  keys: SEED_KEYS,
  hooks: SEED_HOOKS,
  patch: (p) => {
    set((s) => ({ values: { ...s.values, ...p } }));
    sync((r) => r.patch(p));
  },
  saveLeaveType: ({ id, ...rest }) => {
    if (settingsRemote.current) return sync((r) => r.saveLeaveType({ id, ...rest })); // the list refreshes from the server afterwards
    set((s) => ({
      leaveTypes: id ? s.leaveTypes.map((x) => (x.id === id ? { ...rest, id, builtIn: x.builtIn } : x)) : [...s.leaveTypes, { ...rest, id: `t${Date.now()}`, builtIn: false }],
    }));
  },
  deleteLeaveType: (id) => {
    set((s) => ({ leaveTypes: s.leaveTypes.filter((x) => x.id !== id) }));
    sync((r) => r.deleteLeaveType(id));
  },
  createKey: async (name) => {
    const remote = settingsRemote.current;
    if (remote) return remote.createKey(name);
    const secret = `ss_live_${random(24)}`;
    set((s) => ({ keys: [...s.keys, { id: `k${Date.now()}`, name, prefix: `${secret.slice(0, 12)}…`, created: "now" }] }));
    return secret;
  },
  revokeKey: (id) => {
    set((s) => ({ keys: s.keys.filter((k) => k.id !== id) }));
    sync((r) => r.revokeKey(id));
  },
  addHook: async (url, events) => {
    const remote = settingsRemote.current;
    if (remote) return remote.addHook(url, events);
    set((s) => ({ hooks: [...s.hooks, { id: `h${Date.now()}`, url, events, on: true }] }));
    return `whsec_${random(24)}`;
  },
  toggleHook: (id) => {
    const on = !get().hooks.find((h) => h.id === id)?.on;
    set((s) => ({ hooks: s.hooks.map((h) => (h.id === id ? { ...h, on } : h)) }));
    sync((r) => r.toggleHook(id, on));
  },
  deleteHook: (id) => {
    set((s) => ({ hooks: s.hooks.filter((h) => h.id !== id) }));
    sync((r) => r.deleteHook(id));
  },
}));

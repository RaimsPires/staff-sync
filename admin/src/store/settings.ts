import { create } from "zustand";
import { DEFAULT_SETTINGS, SEED_HOOKS, SEED_KEYS, SEED_LEAVE_TYPES } from "@/data/settings";
import type { ApiKey, LeaveTypeDef, SettingsValues, Webhook } from "@/types/settings";

const random = (len: number) => Array.from({ length: len }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");

interface SettingsState {
  values: SettingsValues;
  leaveTypes: LeaveTypeDef[];
  keys: ApiKey[];
  hooks: Webhook[];
  /** Changes apply immediately; there is no separate save step. */
  patch: (p: Partial<SettingsValues>) => void;
  saveLeaveType: (t: Omit<LeaveTypeDef, "id" | "builtIn"> & { id: string | null }) => void;
  deleteLeaveType: (id: string) => void;
  /** Creates a key and returns the secret, which is shown only once. */
  createKey: (name: string) => string;
  revokeKey: (id: string) => void;
  /** Creates a webhook and returns its signing secret. */
  addHook: (url: string, events: string[]) => string;
  toggleHook: (id: string) => void;
  deleteHook: (id: string) => void;
}

export const useSettings = create<SettingsState>((set) => ({
  values: DEFAULT_SETTINGS,
  leaveTypes: SEED_LEAVE_TYPES,
  keys: SEED_KEYS,
  hooks: SEED_HOOKS,
  patch: (p) => set((s) => ({ values: { ...s.values, ...p } })),
  saveLeaveType: ({ id, ...rest }) =>
    set((s) => ({
      leaveTypes: id ? s.leaveTypes.map((x) => (x.id === id ? { ...rest, id, builtIn: x.builtIn } : x)) : [...s.leaveTypes, { ...rest, id: `t${Date.now()}`, builtIn: false }],
    })),
  deleteLeaveType: (id) => set((s) => ({ leaveTypes: s.leaveTypes.filter((x) => x.id !== id) })),
  createKey: (name) => {
    const secret = `ss_live_${random(24)}`;
    set((s) => ({ keys: [...s.keys, { id: `k${Date.now()}`, name, prefix: `${secret.slice(0, 12)}…`, created: "now" }] }));
    return secret;
  },
  revokeKey: (id) => set((s) => ({ keys: s.keys.filter((k) => k.id !== id) })),
  addHook: (url, events) => {
    set((s) => ({ hooks: [...s.hooks, { id: `h${Date.now()}`, url, events, on: true }] }));
    return `whsec_${random(24)}`;
  },
  toggleHook: (id) => set((s) => ({ hooks: s.hooks.map((h) => (h.id === id ? { ...h, on: !h.on } : h)) })),
  deleteHook: (id) => set((s) => ({ hooks: s.hooks.filter((h) => h.id !== id) })),
}));

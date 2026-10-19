import { create } from "zustand";

export interface ProfileOverrides { name?: string; email?: string; phone: string; lang: "en" | "fr"; tz: string }
export type PersonalEvent = "fraud" | "noshow" | "miss" | "lvnew" | "lvdec" | "unc";
export interface Session { id: string; device: string; place: string; when: "now" | "hours" | "days"; current?: boolean }

interface ProfileState {
  details: ProfileOverrides;
  /** In-app, push, email per event. */
  notif: Record<PersonalEvent, [boolean, boolean, boolean]>;
  sessions: Session[];
  twoFactor: boolean;
  setDetails: (p: Partial<ProfileOverrides>) => void;
  setNotif: (event: PersonalEvent, channel: number) => void;
  signOut: (id: string) => void;
  signOutOthers: () => void;
  setTwoFactor: (on: boolean) => void;
}

const row = (a: number, b: number, c: number): [boolean, boolean, boolean] => [!!a, !!b, !!c];

export const useProfile = create<ProfileState>((set) => ({
  details: { phone: "06 12 45 78 99", lang: "en", tz: "Europe/Paris" },
  notif: { fraud: row(1, 1, 1), noshow: row(1, 1, 0), miss: row(1, 0, 1), lvnew: row(1, 1, 1), lvdec: row(1, 0, 1), unc: row(1, 1, 1) },
  sessions: [
    { id: "s1", device: "Chrome · macOS", place: "Lyon", when: "now", current: true },
    { id: "s2", device: "Safari · iPhone", place: "Lyon", when: "hours" },
    { id: "s3", device: "Edge · Windows", place: "Paris", when: "days" },
  ],
  twoFactor: false,
  setDetails: (p) => set((s) => ({ details: { ...s.details, ...p } })),
  setNotif: (event, channel) => set((s) => ({ notif: { ...s.notif, [event]: s.notif[event].map((x, i) => (i === channel ? !x : x)) as [boolean, boolean, boolean] } })),
  signOut: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),
  signOutOthers: () => set((s) => ({ sessions: s.sessions.filter((x) => x.current) })),
  setTwoFactor: (twoFactor) => set({ twoFactor }),
}));

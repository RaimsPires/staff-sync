import { create } from "zustand";
import { defaultConfig } from "@/features/reports/model";
import { useSyncError } from "@/store/sync-error";
import type { ReportConfig, ReportSchedule, SavedReport } from "@/types/reports";

const seed = (id: string, name: string, cfg: Partial<ReportConfig> & Pick<ReportConfig, "type">, schedule: ReportSchedule | null, delivery: SavedReport["delivery"]): SavedReport => ({
  ...defaultConfig(cfg.type), ...cfg, id, name, schedule, delivery,
});

const SEED: SavedReport[] = [
  seed("r1", "Weekly lateness", { type: "lateness", range: "7" }, { freq: "weekly", day: "monday", time: "08:00", recipients: ["manager@example.com"], format: "pdf", on: true }, { kind: "never" }),
  seed("r2", "Monthly timesheets – all sites", { type: "timesheet", range: "last" }, null, { kind: "never" }),
];

/** Persistence behind the store, installed once the user is signed in (see `services/reports`). */
export interface ReportsRemote {
  create: (name: string, cfg: ReportConfig, schedule: ReportSchedule | null) => Promise<string>;
  update: (id: string, cfg: ReportConfig, name: string, schedule: ReportSchedule | null) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}
export const reportsRemote: { current: ReportsRemote | null } = { current: null };

function sync(send: (r: ReportsRemote) => Promise<unknown>) {
  const remote = reportsRemote.current;
  if (!remote) return;
  send(remote).catch((e: unknown) => {
    useSyncError.getState().report(e instanceof Error ? e.message : "Couldn’t save the change");
    void remote.reload();
  });
}

interface ReportsState {
  saved: SavedReport[];
  /** Saves a new report; resolves with its id. */
  create: (name: string, cfg: ReportConfig, schedule?: ReportSchedule | null, delivery?: SavedReport["delivery"]) => Promise<string>;
  update: (id: string, cfg: ReportConfig, name: string) => void;
  setSchedule: (id: string, schedule: ReportSchedule | null, delivery: SavedReport["delivery"]) => void;
  remove: (id: string) => void;
}

export const useReports = create<ReportsState>((set, get) => ({
  saved: SEED,
  create: async (name, cfg, schedule = null, delivery = { kind: "never" }) => {
    const remote = reportsRemote.current;
    if (remote) return remote.create(name, cfg, schedule);
    const id = `r${Date.now()}`;
    set((s) => ({ saved: [...s.saved, { ...cfg, id, name, schedule, delivery }] }));
    return id;
  },
  update: (id, cfg, name) => {
    const current = get().saved.find((r) => r.id === id);
    set((s) => ({ saved: s.saved.map((r) => (r.id === id ? { ...r, ...cfg, name } : r)) }));
    sync((r) => r.update(id, cfg, name, current?.schedule ?? null));
  },
  setSchedule: (id, schedule, delivery) => {
    const current = get().saved.find((r) => r.id === id);
    set((s) => ({ saved: s.saved.map((r) => (r.id === id ? { ...r, schedule, delivery } : r)) }));
    if (current) sync((r) => r.update(id, current, current.name, schedule));
  },
  remove: (id) => {
    set((s) => ({ saved: s.saved.filter((r) => r.id !== id) }));
    sync((r) => r.remove(id));
  },
}));

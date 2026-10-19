import { create } from "zustand";
import { defaultConfig } from "@/features/reports/model";
import type { ReportConfig, ReportSchedule, SavedReport } from "@/types/reports";

const seed = (id: string, name: string, cfg: Partial<ReportConfig> & Pick<ReportConfig, "type">, schedule: ReportSchedule | null, delivery: SavedReport["delivery"]): SavedReport => ({
  ...defaultConfig(cfg.type), ...cfg, id, name, schedule, delivery,
});

const SEED: SavedReport[] = [
  seed("r1", "Weekly lateness – Paris Nord", { type: "lateness", range: "7", branches: ["pn"] }, { freq: "weekly", day: "monday", time: "08:00", recipients: ["marc.olivier@staffsync.io", "claire.vasseur@staffsync.io"], format: "pdf", on: true }, { kind: "sent", iso: "2026-10-12" }),
  seed("r2", "Monthly timesheets – all sites", { type: "timesheet", range: "last" }, { freq: "monthly", day: "1", time: "07:00", recipients: ["payroll@staffsync.io"], format: "xlsx", on: true }, { kind: "sent", iso: "2026-10-01" }),
  seed("r3", "Flag review – Lyon", { type: "flagged", branches: ["lyon"], group: "site" }, null, { kind: "never" }),
];

interface ReportsState {
  saved: SavedReport[];
  /** Saves a new report and returns its id. */
  create: (name: string, cfg: ReportConfig, schedule?: ReportSchedule | null, delivery?: SavedReport["delivery"]) => string;
  update: (id: string, cfg: ReportConfig, name: string) => void;
  setSchedule: (id: string, schedule: ReportSchedule | null, delivery: SavedReport["delivery"]) => void;
  remove: (id: string) => void;
}

export const useReports = create<ReportsState>((set) => ({
  saved: SEED,
  create: (name, cfg, schedule = null, delivery = { kind: "never" }) => {
    const id = `r${Date.now()}`;
    set((s) => ({ saved: [...s.saved, { ...cfg, id, name, schedule, delivery }] }));
    return id;
  },
  update: (id, cfg, name) => set((s) => ({ saved: s.saved.map((r) => (r.id === id ? { ...r, ...cfg, name } : r)) })),
  setSchedule: (id, schedule, delivery) => set((s) => ({ saved: s.saved.map((r) => (r.id === id ? { ...r, schedule, delivery } : r)) })),
  remove: (id) => set((s) => ({ saved: s.saved.filter((r) => r.id !== id) })),
}));

import type { LeaveRequest } from "@/types/leave";

type Seed = Omit<LeaveRequest, "log" | "waitingOnMe"> & { waitingOnMe?: boolean };

const SEEDS: Seed[] = [
  { id: "L-2041", name: "Amélie Fontaine", role: "machinist", site: "sd", type: "annual", from: "2026-10-26", to: "2026-10-30", days: 5, balance: 8, attachment: false, stage: "rec", stageBy: "Marc Olivier", stageOn: "2026-10-14", submitted: "2026-10-13", status: "pending", waitingOnMe: true },
  { id: "L-2042", name: "Karim Benali", role: "forkliftOperator", site: "rl", type: "annual", from: "2026-10-26", to: "2026-10-28", days: 3, balance: 4, attachment: false, stage: "rec", stageBy: "Marc Olivier", stageOn: "2026-10-14", submitted: "2026-10-12", status: "pending", waitingOnMe: true },
  { id: "L-2043", name: "Léa Moreau", role: "cleaner", site: "pd", type: "sick", from: "2026-10-14", to: "2026-10-16", days: 3, balance: 2, attachment: true, stage: "hr", note: "certificate", submitted: "2026-10-14", status: "pending", waitingOnMe: true },
  { id: "L-2044", name: "Thomas Girard", role: "technician", site: "cf", type: "rtt", from: "2026-10-23", to: "2026-10-23", days: 1, balance: 6, attachment: false, stage: "site", stageBy: "Julien Roche", submitted: "2026-10-15", status: "pending" },
  { id: "L-2045", name: "Inès Haddad", role: "electrician", site: "pv", type: "family", from: "2026-10-21", to: "2026-10-21", days: 0.5, balance: 3.5, attachment: true, stage: "site", stageBy: "Sarah Benoît", submitted: "2026-10-15", status: "pending", half: "AM" },
  { id: "L-2046", name: "Paul Lambert", role: "driver", site: "sd", type: "annual", from: "2026-11-02", to: "2026-11-13", days: 10, balance: -2, attachment: false, stage: "rec", stageBy: "Marc Olivier", stageOn: "2026-10-13", submitted: "2026-10-10", status: "pending", waitingOnMe: true },
  { id: "L-2047", name: "Sofia Rossi", role: "loader", site: "rl", type: "annual", from: "2026-10-27", to: "2026-10-29", days: 3, balance: 9, attachment: false, stage: "hr", stageBy: "Marc Olivier", note: "recommended", submitted: "2026-10-09", status: "pending", waitingOnMe: true },
  { id: "L-2048", name: "Hugo Petit", role: "welder", site: "sd", type: "unpaid", from: "2026-11-09", to: "2026-11-10", days: 2, balance: 0, attachment: true, stage: "site", stageBy: "Marc Olivier", submitted: "2026-10-14", status: "pending" },
  { id: "L-2049", name: "Nora Diallo", role: "inspector", site: "cf", type: "annual", from: "2026-10-22", to: "2026-10-23", days: 2, balance: 12, attachment: false, stage: "rec", stageBy: "Julien Roche", stageOn: "2026-10-12", submitted: "2026-10-11", status: "pending", waitingOnMe: true },
  { id: "L-2030", name: "Elena Marchand", role: "cleaner", site: "cf", type: "rtt", from: "2026-10-19", to: "2026-10-19", days: 1, balance: 5, attachment: false, stage: "done", stageBy: "Claire Vasseur", submitted: "2026-10-08", status: "approved" },
  { id: "L-2031", name: "Bastien Leroy", role: "driver", site: "pv", type: "annual", from: "2026-10-19", to: "2026-10-23", days: 5, balance: 6, attachment: false, stage: "done", stageBy: "Claire Vasseur", submitted: "2026-10-05", status: "approved" },
  { id: "L-2032", name: "Amélie Fontaine", role: "machinist", site: "sd", type: "sick", from: "2026-10-06", to: "2026-10-07", days: 2, balance: 3, attachment: true, stage: "done", stageBy: "Marc Olivier", submitted: "2026-10-06", status: "approved" },
  { id: "L-2033", name: "Georges Aubert", role: "cleaner", site: "pd", type: "annual", from: "2026-12-21", to: "2026-12-31", days: 8, balance: 10, attachment: false, stage: "done", stageBy: "Claire Vasseur", submitted: "2026-10-02", status: "approved" },
  { id: "L-2020", name: "Camille Roux", role: "warehouseAgent", site: "rl", type: "annual", from: "2026-10-26", to: "2026-10-30", days: 5, balance: 2, attachment: false, stage: "no", note: "insufficient", submitted: "2026-10-07", status: "rejected", rejection: "Not enough annual leave left; please split across two periods." },
  { id: "L-2021", name: "Yanis Boucher", role: "machinist", site: "sd", type: "rtt", from: "2026-10-16", to: "2026-10-16", days: 1, balance: 0, attachment: false, stage: "no", stageBy: "Marc Olivier", note: "shortNotice", submitted: "2026-10-15", status: "rejected", rejection: "Two machinists are already off on the 16th." },
  { id: "L-2010", name: "Mehdi Cherif", role: "technician", site: "pd", type: "annual", from: "2026-10-20", to: "2026-10-21", days: 2, balance: 7, attachment: false, stage: "can", stageOn: "2026-10-11", submitted: "2026-10-04", status: "cancelled" },
  { id: "L-2011", name: "Monique Vidal", role: "cleaner", site: "pv", type: "family", from: "2026-10-12", to: "2026-10-12", days: 1, balance: 2, attachment: false, stage: "can", stageOn: "2026-10-09", submitted: "2026-10-08", status: "cancelled" },
];

export const LEAVE_REQUESTS: LeaveRequest[] = SEEDS.map((s) => ({ ...s, waitingOnMe: s.waitingOnMe ?? false, log: [] }));

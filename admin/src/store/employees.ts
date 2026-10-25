import { create } from "zustand";
import { EMPLOYEES } from "@/data/employees";
import { useSyncError } from "@/store/sync-error";
import type { Employee, EmployeeDraft, EmployeeStatus } from "@/types/employee";

/** Persistence behind the store; see `SitesRemote`. */
export interface EmployeesRemote {
  create: (draft: EmployeeDraft) => Promise<Employee>;
  update: (id: string, draft: EmployeeDraft) => Promise<Employee>;
  setStatus: (id: string, status: EmployeeStatus) => Promise<void>;
  reload: () => Promise<void>;
}
export const employeesRemote: { current: EmployeesRemote | null } = { current: null };

interface EmployeesState {
  employees: Employee[];
  /** Creates or updates; resolves once saved (rejects with the server's message). */
  upsert: (draft: EmployeeDraft, originalId?: string) => Promise<void>;
  addMany: (list: Employee[]) => void;
  setStatus: (id: string, status: EmployeeStatus) => void;
}

const fromDraft = (d: EmployeeDraft, prev?: Employee): Employee => ({
  id: d.id,
  name: d.name,
  branchId: d.branchId,
  siteIds: d.siteIds,
  title: d.title,
  phone: d.phone || "—",
  email: d.email,
  app: d.smartphone ? (prev?.app === "installed" ? "installed" : d.invite ? "invited" : "installed") : "none",
  attendance: prev?.attendance ?? 0,
  status: prev?.status ?? "invited",
  access: d.access,
  contract: d.contract,
  startDate: d.startDate,
  selfie: d.selfie,
});

export const useEmployees = create<EmployeesState>((set, get) => ({
  employees: EMPLOYEES,
  upsert: async (draft, originalId) => {
    const remote = employeesRemote.current;
    const prev = originalId ? get().employees.find((e) => e.id === originalId) : undefined;
    if (remote) {
      const saved = prev ? await remote.update(originalId!, draft) : await remote.create(draft);
      set((s) => ({ employees: prev ? s.employees.map((e) => (e.id === originalId ? saved : e)) : [...s.employees, saved] }));
      return;
    }
    const next = fromDraft(draft, prev);
    set((s) => (prev ? { employees: s.employees.map((e) => (e.id === originalId ? next : e)) } : { employees: [...s.employees, { ...next, status: draft.smartphone ? "invited" : "active" }] }));
  },
  addMany: (list) => set((s) => ({ employees: [...s.employees, ...list] })),
  setStatus: (id, status) => {
    set((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, status } : e)) }));
    const remote = employeesRemote.current;
    remote?.setStatus(id, status).catch((e: unknown) => {
      useSyncError.getState().report(e instanceof Error ? e.message : "Couldn’t save the change");
      void remote.reload();
    });
  },
}));

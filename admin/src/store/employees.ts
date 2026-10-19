import { create } from "zustand";
import { EMPLOYEES } from "@/data/employees";
import type { Employee, EmployeeDraft, EmployeeStatus } from "@/types/employee";

interface EmployeesState {
  employees: Employee[];
  upsert: (draft: EmployeeDraft, originalId?: string) => void;
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
  pin: d.smartphone ? undefined : d.pin,
});

export const useEmployees = create<EmployeesState>((set) => ({
  employees: EMPLOYEES,
  upsert: (draft, originalId) =>
    set((s) => {
      const prev = originalId ? s.employees.find((e) => e.id === originalId) : undefined;
      const next = fromDraft(draft, prev);
      if (!prev) return { employees: [...s.employees, { ...next, status: draft.smartphone ? "invited" : "active" }] };
      return { employees: s.employees.map((e) => (e.id === originalId ? next : e)) };
    }),
  addMany: (list) => set((s) => ({ employees: [...s.employees, ...list] })),
  setStatus: (id, status) => set((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, status } : e)) })),
}));

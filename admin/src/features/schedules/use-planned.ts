import { useMemo } from "react";
import { useEmployees } from "@/store/employees";
import { plannedFrom, type Planned } from "./model";

/** People the planner can schedule: the active employees who have a site. */
export function usePlanned(): Planned[] {
  const employees = useEmployees((s) => s.employees);
  return useMemo(() => plannedFrom(employees), [employees]);
}

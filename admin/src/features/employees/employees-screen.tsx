"use client";

import { Download, MoreHorizontal, Plus, Search, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Chip } from "@/components/ui/chip";
import { Popover } from "@/components/ui/popover";
import { useToast } from "@/components/ui/toast";
import { JOB_TITLES, PLAN_LIMIT } from "@/data/employees";
import { useOrg } from "@/lib/org";
import { exportCsv } from "@/lib/export";
import { cn } from "@/lib/utils";
import { useAccess } from "@/store/use-access";
import { useEmployees } from "@/store/employees";
import type { Employee } from "@/types/employee";
import { EmployeeFormDrawer } from "./employee-form-drawer";
import { ImportWizard } from "./import-wizard";
import { appTone, attendanceTone, DEFAULT_EMPLOYEE_FILTERS, filterEmployees, hasActiveFilter, statusTone, type EmployeeFilters } from "./model";

const select = "h-[34px] rounded-[9px] border border-solid border-border-strong bg-surface px-2.5 text-[13px] text-text";
const BAR = { ok: "bg-ok-dot", warn: "bg-warn-dot", bad: "bg-bad-dot" } as const;

export function EmployeesScreen() {
  const org = useOrg();
  const t = useTranslations("Employees");
  const tTitles = useTranslations("Employees.titles");
  const toast = useToast();
  const { siteIds, perms } = useAccess();
  const employees = useEmployees((s) => s.employees);
  const setStatus = useEmployees((s) => s.setStatus);

  const [filters, setFilters] = useState<EmployeeFilters>(DEFAULT_EMPLOYEE_FILTERS);
  const [form, setForm] = useState<{ employee: Employee | null } | null>(null);
  const [importing, setImporting] = useState(false);
  const [deactivating, setDeactivating] = useState<Employee | null>(null);

  const canManage = perms.admin || perms.edit;
  const visible = useMemo(() => filterEmployees(employees, filters, siteIds), [employees, filters, siteIds]);
  const scoped = employees.filter((e) => e.siteIds.some((s) => siteIds.includes(s)));
  const sitesAvailable = siteIds.filter((id) => filters.branch === "all" || org.branches.find((b) => b.id === filters.branch)?.siteIds.includes(id));
  const set = (patch: Partial<EmployeeFilters>) => setFilters((f) => ({ ...f, ...patch }));

  const exportList = () => {
    exportCsv("employees.csv", [
      [t("columns.name"), t("columns.id"), t("columns.branch"), t("columns.title"), t("columns.phone"), t("columns.status")],
      ...visible.map((e) => [e.name, e.id, org.branches.find((b) => b.id === e.branchId)?.name ?? "", tTitles(e.title), e.phone, t(`status.${e.status}`)]),
    ]);
    toast(t("exported", { count: visible.length }));
  };

  const reactivate = (e: Employee) => {
    setStatus(e.id, e.app === "invited" ? "invited" : "active");
    toast(t("reactivated", { name: e.name }));
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="m-0 text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <div className="mt-1 text-[13.5px] text-text-2">
            {t("subtitle", { total: scoped.length, active: scoped.filter((e) => e.status === "active").length, invited: scoped.filter((e) => e.status === "invited").length })}
            {perms.admin && <span className="text-text-3"> · {t("planUsage", { used: employees.length, limit: PLAN_LIMIT })}</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={exportList}>
            <Download size={15} /> {t("export")}
          </Button>
          {canManage && (
            <>
              <Button onClick={() => setImporting(true)}>
                <Upload size={15} /> {t("importCsv")}
              </Button>
              <Button variant="primary" onClick={() => setForm({ employee: null })}>
                <Plus size={15} /> {t("add")}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-3 shadow-card">
        <label className="flex h-[34px] w-[230px] items-center gap-2 rounded-[9px] border border-solid border-border px-2.5 text-text-3">
          <Search size={15} />
          <input value={filters.query} onChange={(e) => set({ query: e.target.value })} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-text outline-0" />
        </label>
        <select value={filters.branch} onChange={(e) => set({ branch: e.target.value, site: "all" })} aria-label={t("filters.branch")} className={select}>
          <option value="all">{t("filters.allBranches")}</option>
          {org.branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select value={filters.site} onChange={(e) => set({ site: e.target.value })} aria-label={t("filters.site")} className={select}>
          <option value="all">{t("filters.allSites")}</option>
          {sitesAvailable.map((id) => (
            <option key={id} value={id}>{org.siteById(id).name}</option>
          ))}
        </select>
        <select value={filters.title} onChange={(e) => set({ title: e.target.value as EmployeeFilters["title"] })} aria-label={t("filters.title")} className={select}>
          <option value="all">{t("filters.allTitles")}</option>
          {JOB_TITLES.map((j) => (
            <option key={j} value={j}>{tTitles(j)}</option>
          ))}
        </select>
        <select value={filters.status} onChange={(e) => set({ status: e.target.value as EmployeeFilters["status"] })} aria-label={t("filters.status")} className={select}>
          <option value="all">{t("filters.anyStatus")}</option>
          {(["active", "invited", "deactivated"] as const).map((s) => (
            <option key={s} value={s}>{t(`status.${s}`)}</option>
          ))}
        </select>
        <select value={filters.smartphone} onChange={(e) => set({ smartphone: e.target.value as EmployeeFilters["smartphone"] })} aria-label={t("filters.smartphone")} className={select}>
          <option value="all">{t("filters.smartphoneAny")}</option>
          <option value="yes">{t("filters.hasSmartphone")}</option>
          <option value="no">{t("filters.noSmartphone")}</option>
        </select>
        {hasActiveFilter(filters) && (
          <button onClick={() => setFilters(DEFAULT_EMPLOYEE_FILTERS)} className="h-[34px] border-0 bg-transparent px-2.5 text-[13px] text-accent">
            {t("filters.clear")}
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState title={t("empty.title")} hint={t("empty.hint")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
          <table className="w-full min-w-[980px] border-collapse text-[13.5px]">
            <thead>
              <tr className="bg-surface-2 text-left text-[12px] text-text-3">
                {(["name", "branch", "sites", "title", "phone", "app", "attendance", "status"] as const).map((c) => (
                  <th key={c} className="h-[38px] whitespace-nowrap border-b border-border px-3 font-medium first:pl-4">{t(`columns.${c}`)}</th>
                ))}
                <th className="w-12 border-b border-border" />
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => {
                const tone = attendanceTone(e.attendance);
                const noData = e.status === "deactivated" || e.app === "invited";
                return (
                  <tr key={e.id} className={cn("border-b border-border last:border-b-0 hover:bg-hover", e.status === "deactivated" && "opacity-60")}>
                    <td className="py-2.5 pl-4 pr-3">
                      <Link href={`/employees/${e.id}`} className="flex items-center gap-2.5 text-text no-underline hover:no-underline">
                        <Avatar name={e.name} size={34} />
                        <span>
                          <span className="block font-medium">{e.name}</span>
                          <span className="block font-mono text-[11.5px] text-text-3">{e.id}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">{org.branches.find((b) => b.id === e.branchId)?.name}</td>
                    <td className="px-3 py-2.5">
                      {e.siteIds.map((id) => (
                        <div key={id} className="whitespace-nowrap text-[12.5px]">{org.siteById(id).name}</div>
                      ))}
                    </td>
                    <td className="px-3 py-2.5">{tTitles(e.title)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[12.5px]">{e.phone}</td>
                    <td className="px-3 py-2.5"><Chip tone={appTone[e.app]}>{t(`app.${e.app}`)}</Chip></td>
                    <td className="px-3 py-2.5">
                      {e.app === "invited" ? "—" : (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-neutral-bg"><div className={cn("h-full", BAR[tone])} style={{ width: `${e.attendance}%` }} /></div>
                          <span className="font-mono text-[12.5px]">{noData ? "—" : `${e.attendance}%`}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5"><Chip tone={statusTone[e.status]}>{t(`status.${e.status}`)}</Chip></td>
                    <td className="px-2 py-2.5">
                      <Popover
                        align="right"
                        panelClassName="w-[190px] p-1.5"
                        trigger={({ toggle }) => (
                          <button onClick={toggle} aria-label={t("actions.menu", { name: e.name })} className="grid size-8 place-items-center rounded-lg border-0 bg-transparent text-text-2 hover:bg-hover">
                            <MoreHorizontal size={17} />
                          </button>
                        )}
                      >
                        {(close) => {
                          const item = "flex h-9 w-full items-center rounded-lg border-0 bg-transparent px-2.5 text-left text-[13px] hover:bg-hover";
                          return (
                            <>
                              <Link href={`/employees/${e.id}`} className={cn(item, "text-text no-underline hover:no-underline")}>{t("actions.view")}</Link>
                              {canManage && <button onClick={() => { close(); setForm({ employee: e }); }} className={cn(item, "text-text")}>{t("actions.edit")}</button>}
                              {canManage && (e.app === "invited" || e.status === "invited") && <button onClick={() => { close(); toast(t("inviteResent", { name: e.name })); }} className={cn(item, "text-text")}>{t("actions.resend")}</button>}
                              {canManage && e.app === "installed" && <button onClick={() => { close(); toast(t("deviceReset", { name: e.name })); }} className={cn(item, "text-text")}>{t("actions.resetDevice")}</button>}
                              {canManage && (e.status === "deactivated"
                                ? <button onClick={() => { close(); reactivate(e); }} className={cn(item, "text-ok")}>{t("actions.reactivate")}</button>
                                : <button onClick={() => { close(); setDeactivating(e); }} className={cn(item, "text-bad")}>{t("actions.deactivate")}</button>)}
                            </>
                          );
                        }}
                      </Popover>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <EmployeeFormDrawer open={form !== null} employee={form?.employee ?? null} onClose={() => setForm(null)} />
      <ImportWizard open={importing} onClose={() => setImporting(false)} />
      <ConfirmDialog
        open={deactivating !== null}
        danger
        title={t("deactivate.title", { name: deactivating?.name ?? "" })}
        message={t("deactivate.message")}
        cancelLabel={t("deactivate.cancel")}
        okLabel={t("deactivate.confirm")}
        onCancel={() => setDeactivating(null)}
        onOk={() => { if (deactivating) { setStatus(deactivating.id, "deactivated"); toast(t("deactivated", { name: deactivating.name })); } setDeactivating(null); }}
      />
    </div>
  );
}

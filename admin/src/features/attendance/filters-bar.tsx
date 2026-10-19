"use client";

import { Calendar, ChevronDown, Columns3, Search } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Popover } from "@/components/ui/popover";
import { DEMO_MONTH, DEMO_TODAY, DEMO_YEAR } from "@/data/live";
import { useOrg } from "@/lib/org";
import { cn } from "@/lib/utils";
import { activeFilterCount, RANGE_DAYS, rangeOf, type Filters, type RangeKey } from "./model";
import type { RecordStatus } from "@/types/domain";

export const ALL_COLUMNS = ["date", "employee", "site", "scheduled", "in", "out", "worked", "status", "method", "flag", "edited"] as const;
export type Column = (typeof ALL_COLUMNS)[number];

export const STATUS_OPTIONS: RecordStatus[] = ["ontime", "late", "early", "absent", "missing", "overtime", "leave", "holiday", "flagged", "scheduled"];
const STATUS_DOT: Record<RecordStatus, string> = {
  ontime: "ok", late: "warn", early: "warn", absent: "bad", missing: "orange", overtime: "violet", leave: "info", holiday: "neutral", flagged: "bad", scheduled: "neutral",
};
const FIXED_RANGES = ["today", "yesterday", "7d", "month"] as const;

const control = "h-[34px] rounded-[9px] border border-solid bg-surface px-2.5 text-[13px] text-text";
const controlLabel = (active: boolean) => (active ? "border-accent" : "border-border-strong");
const dayInput = (d: number) => `${DEMO_YEAR}-${String(DEMO_MONTH + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export function FiltersBar({
  filters,
  onChange,
  onClear,
  statusCounts,
  accessibleSites,
  hidden,
  onToggleColumn,
  onSaveView,
}: {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onClear: () => void;
  /** How many records each status would match with the other filters applied. */
  statusCounts: Record<RecordStatus, number>;
  accessibleSites: string[];
  hidden: Partial<Record<Column, boolean>>;
  onToggleColumn: (c: Column) => void;
  onSaveView: (name: string) => void;
}) {
  const org = useOrg();
  const t = useTranslations("Attendance");
  const tStatus = useTranslations("Status");
  const format = useFormatter();
  const [viewName, setViewName] = useState("");

  const [from, to] = rangeOf(filters);
  const day = (d: number) => format.dateTime(new Date(DEMO_YEAR, DEMO_MONTH, d), { day: "numeric", month: "short" });
  const rangeLabel = filters.range === "custom" ? `${day(from)} – ${day(to)}` : t(`ranges.${filters.range}`);
  const accessibleBranches = org.branches.filter((b) => b.siteIds.some((s) => accessibleSites.includes(s)));
  const sites = accessibleSites.filter((id) => filters.branch === "all" || org.branchOfSite(id).id === filters.branch).map(org.siteById);
  const active = activeFilterCount(filters);
  const statusLabel = filters.statuses.length === 1 ? tStatus(filters.statuses[0]) : t("filters.status");

  const summary = [
    rangeLabel,
    filters.branch !== "all" && org.branches.find((b) => b.id === filters.branch)?.name,
    filters.site !== "all" && org.siteById(filters.site).name,
    filters.employee.trim() && `“${filters.employee}”`,
    filters.statuses.length > 0 && filters.statuses.map((s) => tStatus(s)).join(", "),
    filters.method !== "all" && t(`methods.${filters.method}`),
    filters.flaggedOnly && t("filters.flaggedOnly"),
    filters.offlineOnly && t("filters.offline"),
  ].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-3.5 py-3">
      {/* Date range */}
      <Popover
        panelClassName="w-[260px] p-2"
        trigger={({ toggle }) => (
          <button onClick={toggle} className={cn(control, "flex items-center gap-2 font-medium", controlLabel(filters.range !== "7d"))}>
            <Calendar size={14} className="text-text-3" /> {rangeLabel} <ChevronDown size={13} className="text-text-3" />
          </button>
        )}
      >
        {(close) => (
          <>
            {FIXED_RANGES.map((k) => (
              <button
                key={k}
                onClick={() => { onChange({ range: k }); close(); }}
                className={cn("flex h-[34px] w-full items-center justify-between rounded-lg border-0 px-2.5 text-[13px] font-medium", filters.range === k ? "bg-accent-soft text-accent" : "bg-transparent text-text hover:bg-hover")}
              >
                {t(`ranges.${k}`)}
                <span className="text-[11.5px] font-normal text-text-3">{RANGE_DAYS[k][0] === RANGE_DAYS[k][1] ? day(RANGE_DAYS[k][0]) : `${day(RANGE_DAYS[k][0])} – ${day(RANGE_DAYS[k][1])}`}</span>
              </button>
            ))}
            <div className="-mx-2 mt-1.5 grid grid-cols-2 gap-2 border-t border-border px-2.5 pb-0.5 pt-2.5">
              {(["from", "to"] as const).map((k) => (
                <label key={k} className="flex flex-col gap-1 text-[11.5px] text-text-3">
                  {t(`filters.${k}`)}
                  <input
                    type="date"
                    min={dayInput(1)}
                    max={dayInput(DEMO_TODAY)}
                    value={dayInput(k === "from" ? from : to)}
                    onChange={(e) => {
                      const v = Number(e.target.value.slice(8, 10));
                      if (v) onChange({ range: "custom", from: k === "from" ? v : from, to: k === "to" ? v : to });
                    }}
                    className="h-8 rounded-lg border border-solid border-border-strong bg-surface px-1.5 text-[12px] text-text"
                  />
                </label>
              ))}
            </div>
          </>
        )}
      </Popover>

      {accessibleBranches.length > 1 && (
        <select
          value={filters.branch}
          onChange={(e) => onChange({ branch: e.target.value, site: "all" })}
          aria-label={t("filters.branch")}
          className={cn(control, "max-w-[150px]", controlLabel(filters.branch !== "all"))}
        >
          <option value="all">{t("filters.allBranches")}</option>
          {accessibleBranches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      )}
      {accessibleSites.length > 1 && (
        <select
          value={filters.site}
          onChange={(e) => onChange({ site: e.target.value })}
          aria-label={t("filters.site")}
          className={cn(control, "max-w-[170px]", controlLabel(filters.site !== "all"))}
        >
          <option value="all">{t("filters.allSites")}</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}

      <label className={cn(control, "box-border flex w-[190px] items-center gap-[7px] text-text-3", filters.employee.trim() ? "border-accent" : "border-border")}>
        <Search size={14} />
        <input
          value={filters.employee}
          onChange={(e) => onChange({ employee: e.target.value })}
          placeholder={t("filters.employeePlaceholder")}
          aria-label={t("filters.employeePlaceholder")}
          className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-text outline-0"
        />
      </label>

      {/* Status multi-select */}
      <Popover
        panelClassName="w-[230px] p-1.5"
        trigger={({ toggle }) => (
          <button onClick={toggle} className={cn(control, "flex items-center gap-2 font-medium", controlLabel(filters.statuses.length > 0))}>
            {statusLabel}
            {filters.statuses.length > 1 && <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-[5px] text-[11px] font-semibold text-white">{filters.statuses.length}</span>}
            <ChevronDown size={13} className="text-text-3" />
          </button>
        )}
      >
        {(close) => (
          <>
            {STATUS_OPTIONS.map((s) => (
              <label key={s} className="flex h-[34px] cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-[13px] hover:bg-hover">
                <input
                  type="checkbox"
                  checked={filters.statuses.includes(s)}
                  onChange={() => onChange({ statuses: filters.statuses.includes(s) ? filters.statuses.filter((x) => x !== s) : [...filters.statuses, s] })}
                  className="m-0 size-[15px] accent-accent"
                />
                <span className="size-[7px] rounded-full" style={{ background: `var(--${STATUS_DOT[s]}-dot)` }} />
                <span className="flex-1">{tStatus(s)}</span>
                <span className="font-mono text-[11.5px] text-text-3">{statusCounts[s]}</span>
              </label>
            ))}
            <div className="-mx-1.5 -mb-1.5 mt-1.5 flex justify-between border-t border-border px-3 py-2">
              <button onClick={() => onChange({ statuses: [] })} className="border-0 bg-transparent p-0 text-[12.5px] text-text-2">
                {t("filters.clear")}
              </button>
              <button onClick={close} className="border-0 bg-transparent p-0 text-[12.5px] font-semibold text-accent">
                {t("filters.done")}
              </button>
            </div>
          </>
        )}
      </Popover>

      <select
        value={filters.method}
        onChange={(e) => onChange({ method: e.target.value as Filters["method"] })}
        aria-label={t("filters.method")}
        className={cn(control, "max-w-[160px]", controlLabel(filters.method !== "all"))}
      >
        <option value="all">{t("filters.allMethods")}</option>
        {(["app", "proxy", "qr", "admin"] as const).map((m) => (
          <option key={m} value={m}>
            {t(`methods.${m}`)}
          </option>
        ))}
      </select>

      {([["flaggedOnly", "filters.flaggedOnly"], ["offlineOnly", "filters.offline"]] as const).map(([key, label]) => {
        const on = filters[key];
        return (
          <button
            key={key}
            role="switch"
            aria-checked={on}
            onClick={() => onChange({ [key]: !on })}
            className={cn("flex h-[34px] items-center gap-2 rounded-[9px] border border-solid pl-2 pr-2.5 text-[13px] font-medium", on ? "border-accent bg-accent-soft text-accent" : "border-border-strong bg-surface text-text")}
          >
            <span className={cn("relative h-4 w-7 flex-none rounded-full transition-colors", on ? "bg-accent" : "bg-border-strong")}>
              <span className={cn("absolute top-0.5 size-3 rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.25)] transition-[left]", on ? "left-3.5" : "left-0.5")} />
            </span>
            {t(label)}
          </button>
        );
      })}

      <div className="flex-1" />

      {active > 0 && (
        <button onClick={onClear} className="whitespace-nowrap border-0 bg-transparent px-1.5 text-[13px] font-medium text-text-2">
          {t("filters.clearAll", { count: active })}
        </button>
      )}

      <Popover
        align="right"
        panelClassName="w-[300px] p-3.5"
        trigger={({ toggle }) => (
          <button onClick={toggle} disabled={active === 0} className={cn(control, "border-border-strong font-medium disabled:cursor-not-allowed disabled:opacity-50")}>
            {t("filters.saveView")}
          </button>
        )}
      >
        {(close) => (
          <div className="flex flex-col gap-2.5">
            <div className="text-[13.5px] font-semibold">{t("filters.saveTitle")}</div>
            <input
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              autoFocus
              placeholder={t("filters.viewPlaceholder")}
              className="h-9 rounded-[9px] border border-solid border-border-strong bg-surface px-2.5 text-[13px] text-text outline-none focus:border-accent"
            />
            <div className="text-[12px] text-text-3">{summary}</div>
            <div className="flex justify-end gap-2">
              <button onClick={close} className={cn(control, "border-border-strong font-medium")}>
                {t("cancel")}
              </button>
              <button
                disabled={!viewName.trim()}
                onClick={() => { onSaveView(viewName.trim()); setViewName(""); close(); }}
                className={cn(control, "border-0 bg-accent font-medium text-white disabled:opacity-50")}
              >
                {t("filters.save")}
              </button>
            </div>
          </div>
        )}
      </Popover>

      <Popover
        align="right"
        panelClassName="w-[210px] p-1.5"
        trigger={({ toggle }) => (
          <button onClick={toggle} title={t("filters.columns")} aria-label={t("filters.columns")} className={cn(control, "grid place-items-center border-border-strong px-3")}>
            <Columns3 size={15} />
          </button>
        )}
      >
        {() => (
          <>
            <div className="px-2.5 py-1.5 text-[12px] text-text-3">{t("filters.showColumns")}</div>
            {ALL_COLUMNS.map((c) => (
              <label key={c} className={cn("flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] hover:bg-hover", c === "employee" ? "cursor-default text-text-3" : "cursor-pointer text-text")}>
                <input type="checkbox" checked={!hidden[c]} disabled={c === "employee"} onChange={() => onToggleColumn(c)} className="m-0 size-[15px] accent-accent" />
                {t(`columns.${c}`)}
              </label>
            ))}
          </>
        )}
      </Popover>
    </div>
  );
}

export const isRangeKey = (v: string): v is RangeKey => ["today", "yesterday", "7d", "month", "custom"].includes(v);

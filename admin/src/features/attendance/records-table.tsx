"use client";

import { ArrowDown, ArrowUp, ShieldAlert, WifiOff } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { MethodIcon } from "@/components/ui/method-icon";
import { Avatar } from "@/components/ui/misc";
import { StatusChip } from "@/components/ui/status-chip";
import { DEMO_MONTH, DEMO_TODAY, DEMO_YEAR } from "@/data/live";
import { branchOfSite, siteById } from "@/data/org";
import { cn } from "@/lib/utils";
import type { AttendanceRecord } from "@/types/domain";
import type { Column } from "./filters-bar";
import { employeeCode, isFlagged, methodOf, type Sort, type SortKey } from "./model";

const SORTABLE: Partial<Record<Column, SortKey>> = { date: "date", employee: "employee", site: "site", in: "in", out: "out", worked: "worked", status: "status", edited: "edited" };

interface Props {
  rows: AttendanceRecord[];
  hidden: Partial<Record<Column, boolean>>;
  columns: readonly Column[];
  sort: Sort;
  onSort: (key: SortKey) => void;
  selected: Set<number>;
  onToggle: (id: number) => void;
  onTogglePage: () => void;
  openId: number | null;
  onOpen: (id: number) => void;
}

const th = "h-[38px] whitespace-nowrap border-b border-border px-3 font-medium";
const td = "px-3 py-2.5 align-middle";

export function RecordsTable({ rows, hidden, columns, sort, onSort, selected, onToggle, onTogglePage, openId, onOpen }: Props) {
  const t = useTranslations("Attendance");
  const tKinds = useTranslations("Drawer.kinds");
  const format = useFormatter();
  const shown = columns.filter((c) => !hidden[c]);
  const pageAllSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13.5px]" style={{ minWidth: 240 + shown.length * 100 }}>
        <thead>
          <tr className="bg-surface-2 text-left text-text-3">
            <th className="w-10 border-b border-border pl-4 pr-0">
              <input type="checkbox" checked={pageAllSelected} onChange={onTogglePage} aria-label={t("selectPage")} className="m-0 size-4 cursor-pointer accent-accent" />
            </th>
            {shown.map((c) => {
              const key = SORTABLE[c];
              const active = key === sort.key;
              return (
                <th key={c} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined} className={cn(th, "text-[12px]", c === "worked" && "text-right")}>
                  {key ? (
                    <button onClick={() => onSort(key)} className={cn("inline-flex items-center gap-[5px] border-0 bg-transparent p-0 text-[12px] font-medium", active ? "text-text" : "text-text-3")}>
                      {t(`columns.${c}`)}
                      {active && sort.dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} className={cn(!active && "opacity-35")} />}
                    </button>
                  ) : (
                    t(`columns.${c}`)
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const day = r.date ?? DEMO_TODAY;
            const site = siteById(r.site);
            const flagged = isFlagged(r) || r.fraud;
            const method = methodOf({ ...r, date: day });
            const edit = r.approved ? { by: t("approvedBy", { name: r.approved }), at: r.approvedAt ?? "" } : (r.edit ?? (r.proxyBy ? { by: r.proxyBy, at: "15 Oct" } : null));
            const isSelected = selected.has(r.id);
            return (
              <tr
                key={r.id}
                onClick={() => onOpen(r.id)}
                className={cn("cursor-pointer border-b border-border", isSelected ? "bg-accent-soft" : openId === r.id ? "bg-surface-2" : "hover:bg-hover")}
              >
                <td className="py-2.5 pl-4 pr-0" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={isSelected} onChange={() => onToggle(r.id)} aria-label={r.name} className="m-0 size-4 cursor-pointer accent-accent" />
                </td>
                {shown.map((c) => {
                  switch (c) {
                    case "date":
                      return (
                        <td key={c} className={cn(td, "whitespace-nowrap")}>
                          <div className="font-medium">{format.dateTime(new Date(DEMO_YEAR, DEMO_MONTH, day), { day: "numeric", month: "short" })}</div>
                          <div className="text-[11.5px] text-text-3">{day === DEMO_TODAY ? t("today") : format.dateTime(new Date(DEMO_YEAR, DEMO_MONTH, day), { weekday: "short" })}</div>
                        </td>
                      );
                    case "employee":
                      return (
                        <td key={c} className={td}>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={r.name} size={32} />
                            <div className="min-w-0">
                              <div className="whitespace-nowrap font-medium">{r.name}</div>
                              <div className="font-mono text-[11.5px] text-text-3">{employeeCode(r)}</div>
                            </div>
                          </div>
                        </td>
                      );
                    case "site":
                      return (
                        <td key={c} className={td}>
                          <div className="whitespace-nowrap">{site.name}</div>
                          <div className="text-[11.5px] text-text-3">{branchOfSite(r.site).name}</div>
                        </td>
                      );
                    case "scheduled":
                      return (
                        <td key={c} className={td}>
                          <div className="whitespace-nowrap font-mono text-[12.5px]">{r.sched}</div>
                          <div className="text-[11.5px] text-text-3">{tKinds(r.kind)}</div>
                        </td>
                      );
                    case "in":
                      return (
                        <td key={c} className={cn(td, "font-mono text-[12.5px]", r.status === "late" ? "text-warn" : flagged ? "text-bad" : r.in ? "text-text" : "text-text-3")}>
                          {r.in || "—"}
                        </td>
                      );
                    case "out":
                      return (
                        <td key={c} className={cn(td, "font-mono text-[12.5px]", r.status === "early" ? "text-warn" : r.status === "overtime" ? "text-violet" : r.status === "missing" ? "text-orange" : r.out ? "text-text" : "text-text-3")}>
                          {r.out || (r.in && day === DEMO_TODAY && r.status !== "missing" ? "…" : "—")}
                        </td>
                      );
                    case "worked":
                      return (
                        <td key={c} className={cn(td, "text-right font-mono text-[12.5px]")}>
                          {r.worked && r.worked !== "—" ? r.worked + (day === DEMO_TODAY && !r.out && r.in ? " ·" : "") : "—"}
                        </td>
                      );
                    case "status":
                      return (
                        <td key={c} className={td}>
                          <StatusChip status={r.fraud ? "fraud" : r.status} />
                        </td>
                      );
                    case "method":
                      return (
                        <td key={c} className={td}>
                          <div className="flex items-center gap-1.5">
                            <MethodIcon method={method} />
                            {r.offline && (
                              <span title={t("offlineTip")} className="grid size-[26px] flex-none place-items-center rounded-[7px] bg-info-bg text-info">
                                <WifiOff size={14} />
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    case "flag":
                      return (
                        <td key={c} className={td}>
                          {flagged && (
                            <span
                              title={r.fraud ? t("flag.fraud") : r.flag === "dist" ? t("flag.distance", { distance: r.dist ?? "" }) : t("flag.mock")}
                              className={cn("grid size-[26px] place-items-center rounded-[7px]", r.fraud ? "bg-bad-dot text-white" : "bg-bad-bg text-bad")}
                            >
                              <ShieldAlert size={14} />
                            </span>
                          )}
                        </td>
                      );
                    case "edited":
                      return (
                        <td key={c} className={td}>
                          {edit ? (
                            <div className="flex items-center gap-2">
                              <Avatar name={edit.by.replace(/^.*· /, "")} size={22} />
                              <div className="min-w-0 text-[12px]">
                                <div className="whitespace-nowrap">{edit.by}</div>
                                <div className="text-text-3">{edit.at}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-text-3">—</span>
                          )}
                        </td>
                      );
                  }
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

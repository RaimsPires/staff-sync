"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useOrg } from "@/lib/org";
import { formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { useSchedule } from "@/store/schedule";
import { useAccess } from "@/store/use-access";
import { dragState } from "./drag-state";
import { PublishDialog } from "./publish-dialog";
import { ScheduleModal } from "./schedule-modal";
import { ShiftDialog, draftOf, newDraft, type ShiftDraft } from "./shift-dialog";
import { ShiftBlock, type DragHandlers, type ViewMode } from "./shift-block";
import { useSettings } from "@/store/settings";
import {
  dateOf, DAY_END, DAY_START, DEFAULT_FILTERS, findConflicts, HOLIDAYS, LEAVE_DAYS, weekStartOf, WEEK_START_OFFSET, PLANNED, plannedBy, PX_PER_HOUR, TODAY_INDEX, TRACK_WIDTH,
  type Filters, type Shift,
} from "./model";

const select = "h-[34px] max-w-[170px] rounded-[9px] border border-solid border-border-strong bg-surface px-2.5 text-[13px] text-text";
type Group = "emp" | "site";
interface Row { key: string; label: string; sub: string; emp?: string | null; site?: string }

export function SchedulesScreen() {
  const org = useOrg();
  const t = useTranslations("Schedules");
  const tj = useTranslations("Employees.titles");
  const th = useTranslations("Schedules.holidays");
  const format = useFormatter();
  const toast = useToast();
  const { perms, siteIds } = useAccess();
  const shifts = useSchedule((s) => s.shifts);
  const interventions = useSchedule((s) => s.interventions);
  const dirty = useSchedule((s) => s.dirty);
  const deleted = useSchedule((s) => s.deleted);
  const addShift = useSchedule((s) => s.addShift);
  const addMany = useSchedule((s) => s.addMany);
  const updateShift = useSchedule((s) => s.updateShift);
  const scheduleIntervention = useSchedule((s) => s.scheduleIntervention);
  const publish = useSchedule((s) => s.publish);

  const [view, setView] = useState<ViewMode>("week");
  const [group, setGroup] = useState<Group>("emp");
  const [anchor, setAnchor] = useState(14);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<ShiftDraft | null>(null);
  const [modal, setModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dropKey, setDropKey] = useState<string | null>(null);
  const resizeRef = useRef<{ id: string; x: number; y: number; e0: number; mode: ViewMode; moved: boolean } | null>(null);
  const justResized = useRef(false);
  const canEdit = perms.admin || perms.edit || perms.org;

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const sitesAvailable = org.sites.filter((s) => siteIds.includes(s.id) && (filters.branch === "all" || s.branchId === filters.branch));
  const people = PLANNED.filter((p) => siteIds.includes(p.site) && (filters.branch === "all" || org.siteById(p.site).branchId === filters.branch));
  const visible = useCallback(
    (x: Shift) => siteIds.includes(x.site) && (filters.site === "all" || x.site === filters.site) && (filters.type === "all" || x.type === filters.type) && (filters.emp === "all" || x.emp === filters.emp) && (filters.branch === "all" || org.siteById(x.site).branchId === filters.branch),
    [filters, siteIds, org],
  );

  const conflicts = useMemo(() => findConflicts(shifts), [shifts]);
  const conflictCount = Object.keys(conflicts).filter((id) => { const x = shifts.find((y) => y.id === id); return x && visible(x); }).length;
  const dirtyCount = Object.keys(dirty).filter((id) => shifts.some((x) => x.id === id)).length + deleted;
  const weekOffset = WEEK_START_OFFSET[useSettings((s) => s.values.wk)];
  const monday = weekStartOf(anchor, weekOffset);

  // Resize an end time by dragging the handle; the move/up listeners live on the window.
  useEffect(() => {
    const move = (e: MouseEvent) => {
      const r = resizeRef.current;
      if (!r) return;
      const shift = useSchedule.getState().shifts.find((x) => x.id === r.id);
      if (!shift) return;
      const step = r.mode === "week" ? Math.round((e.clientY - r.y) / 10) * 15 : Math.round(((e.clientX - r.x) / PX_PER_HOUR) * 60 / 15) * 15;
      const end = Math.max(shift.s + 15, Math.min(1439, r.e0 + step));
      if (end !== shift.e) { r.moved = true; useSchedule.getState().updateShift(r.id, { e: end }); }
    };
    const up = () => {
      if (resizeRef.current) {
        justResized.current = true;
        resizeRef.current = null;
        setTimeout(() => { justResized.current = false; }, 50);
      }
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, []);

  const drag: DragHandlers = {
    start: (e, payload) => { dragState.set(payload); e.dataTransfer.setData("text/plain", JSON.stringify(payload)); e.dataTransfer.effectAllowed = "move"; },
    end: () => { dragState.set(null); setDropKey(null); },
    startResize: (e, shift, mode) => { e.stopPropagation(); e.preventDefault(); resizeRef.current = { id: shift.id, x: e.clientX, y: e.clientY, e0: shift.e, mode, moved: false }; },
    overShift: (e, shift) => { if (!shift.emp && dragState.get()?.k === "emp") { e.preventDefault(); e.stopPropagation(); } },
    dropOnShift: (e, shift) => {
      const p = dragState.get();
      if (!shift.emp && p?.k === "emp") {
        e.preventDefault(); e.stopPropagation();
        dragState.set(null); setDropKey(null);
        updateShift(shift.id, { emp: p.name });
        toast(t("toasts.assigned", { name: p.name.split(" ")[0] }));
      }
    },
  };

  const openShift = (x: Shift) => { if (!justResized.current && canEdit) setDraft(draftOf(x)); };
  const openNew = (d: number, emp: string | null, site: string | null, start?: number) => canEdit && setDraft(newDraft(d, emp, site, org, start));

  /** Drop a dragged shift, intervention or employee onto a row/day (and minute in the day view). */
  const dropOn = (e: React.DragEvent, rowKey: string | null, d: number, minute: number | null) => {
    e.preventDefault();
    const p = dragState.take();
    setDropKey(null);
    if (!p || !canEdit) return;
    if (p.k === "shift") {
      const sh = shifts.find((x) => x.id === p.id);
      if (!sh) return;
      const patch: Partial<Shift> = { d };
      if (rowKey !== null) { if (group === "emp") patch.emp = rowKey || null; else patch.site = rowKey; }
      if (minute !== null) { const len = sh.e - sh.s; const ns = Math.max(DAY_START, Math.min(1439 - len, Math.round(minute / 15) * 15)); patch.s = ns; patch.e = ns + len; }
      updateShift(p.id, patch);
      toast(t("toasts.moved"));
    } else if (p.k === "int") {
      const it = interventions.find((x) => x.id === p.id);
      if (!it) return;
      const s0 = minute !== null ? Math.round(minute / 15) * 15 : it.s;
      const emp = rowKey !== null && group === "emp" && rowKey ? rowKey : null;
      scheduleIntervention(it.id, { d, emp, site: rowKey !== null && group === "site" ? rowKey : it.site, s: s0, e: Math.min(1439, s0 + (it.e - it.s)), type: "int", title: it.title });
      toast(emp ? t("toasts.assignedTo", { title: it.title, name: emp.split(" ")[0] }) : t("toasts.scheduledOpen", { title: it.title }));
    } else {
      const site = rowKey !== null && group === "site" ? rowKey : filters.site !== "all" ? filters.site : (plannedBy(p.name)?.site ?? org.sites[0].id);
      const s0 = minute !== null ? Math.round(minute / 15) * 15 : 480;
      addShift({ d, emp: p.name, site, s: s0, e: Math.min(1439, s0 + 480), type: "rec", title: "" });
      toast(t("toasts.added", { name: p.name.split(" ")[0] }));
    }
  };
  const over = (key: string) => (e: React.DragEvent) => { e.preventDefault(); if (dropKey !== key) setDropKey(key); };

  const rowsFor = (from: number, to: number): { rows: Row[]; list: Shift[] } => {
    const list = shifts.filter((x) => x.d >= from && x.d <= to && visible(x));
    let rows: Row[];
    if (group === "emp") {
      rows = people.filter((p) => filters.emp === "all" || p.name === filters.emp).map((p) => ({ key: p.name, label: p.name, sub: `${tj(p.title)} · ${org.siteById(p.site).name.split(" ")[0]}`, emp: p.name }));
      if (list.some((x) => !x.emp)) rows.unshift({ key: "", label: t("unassigned"), sub: t("needsEmployee"), emp: null });
    } else rows = sitesAvailable.filter((s) => filters.site === "all" || s.id === filters.site).map((s) => ({ key: s.id, label: s.name, sub: s.branchId, site: s.id }));
    return { rows, list };
  };
  const shiftsOf = (list: Shift[], r: Row, d: number) => list.filter((x) => x.d === d && (group === "emp" ? (x.emp ?? "") === r.key : x.site === r.key)).sort((a, b) => a.s - b.s);
  const onLeave = (r: Row, d: number) => group === "emp" && !!r.emp && (LEAVE_DAYS[r.emp] ?? []).includes(d) && filters.type === "all";
  const block = (x: Shift, mode: ViewMode, extra?: { style?: React.CSSProperties; className?: string }) => (
    <ShiftBlock key={x.id} shift={x} conflict={conflicts[x.id]} dirty={!!dirty[x.id]} mode={mode} showEmployee={group === "site"} drag={drag} onOpen={openShift} {...extra} />
  );

  const rangeLabel = view === "week"
    ? `${format.dateTime(dateOf(monday), { day: "numeric", month: "short", timeZone: "UTC" })} – ${format.dateTime(dateOf(monday + 6), { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`
    : view === "day" ? format.dateTime(dateOf(anchor), { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    : format.dateTime(dateOf(anchor), { month: "long", year: "numeric", timeZone: "UTC" });
  const step = view === "week" ? 7 : view === "day" ? 1 : 30;
  const hasFilter = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  const copyPreviousWeek = () => {
    const prev = shifts.filter((x) => x.d >= monday - 7 && x.d <= monday - 1 && visible(x));
    const have = new Set(shifts.filter((x) => x.d >= monday && x.d <= monday + 6).map((x) => [x.d, x.emp, x.site, x.s, x.e].join()));
    const add = prev.filter((x) => !HOLIDAYS[x.d + 7] && !have.has([x.d + 7, x.emp, x.site, x.s, x.e].join())).map((x) => ({ d: x.d + 7, emp: x.emp, site: x.site, s: x.s, e: x.e, type: x.type, title: x.title }));
    if (!add.length) return toast(t("toasts.nothingToCopy"), "info");
    addMany(add, true);
    toast(t("toasts.copied", { count: add.length }));
  };

  const publishSummary = publishing
    ? { changed: Object.keys(dirty).filter((id) => shifts.some((x) => x.id === id)).length, deleted, employees: new Set(Object.keys(dirty).map((id) => shifts.find((x) => x.id === id)?.emp).filter(Boolean)).size, conflicts: conflictCount }
    : null;

  const weekdayNames = Array.from({ length: 7 }, (_, i) => format.dateTime(dateOf(weekOffset + i), { weekday: "short", timeZone: "UTC" }));
  const holidayName = (d: number) => (HOLIDAYS[d] ? th(HOLIDAYS[d]) : "");

  // ------------------------------------------------------------------ grids
  const weekGrid = () => {
    const { rows, list } = rowsFor(monday, monday + 6);
    return (
      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
        <div className="min-w-[1064px]">
          <div className="grid grid-cols-[168px_repeat(7,minmax(128px,1fr))] rounded-t-xl border-b border-border bg-surface-2">
            <div className="px-3.5 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-text-3">{t(group === "emp" ? "groupEmployee" : "groupSite")}</div>
            {weekdayNames.map((n, i) => {
              const d = monday + i;
              const today = d === TODAY_INDEX;
              return (
                <div key={d} className={cn("border-l border-border px-2 py-2", HOLIDAYS[d] ? "bg-hover" : today && "bg-accent-soft")}>
                  <div className={cn("text-[11.5px] font-semibold uppercase", today ? "text-accent" : "text-text")}>{n}</div>
                  <div className={cn("text-[15px] font-semibold", today ? "text-accent" : "text-text")}>{dateOf(d).getUTCDate()}</div>
                  <div className="min-h-[14px] text-[11px] text-text-3">{holidayName(d)}</div>
                </div>
              );
            })}
          </div>
          {rows.map((r) => (
            <div key={r.key || "open"} className="grid grid-cols-[168px_repeat(7,minmax(128px,1fr))] border-b border-border">
              <div className="flex flex-col justify-center px-3.5 py-2.5"><div className="text-[13px] font-medium">{r.label}</div><div className="text-[12px] text-text-3">{r.sub}</div></div>
              {Array.from({ length: 7 }, (_, i) => {
                const d = monday + i;
                const key = `${r.key}|${d}`;
                const cell = shiftsOf(list, r, d);
                const leave = onLeave(r, d);
                return (
                  <div key={d} onClick={() => openNew(d, r.emp ?? null, r.site ?? null)} onDragOver={over(key)} onDrop={(e) => dropOn(e, r.key, d, null)}
                    className={cn("flex min-h-[72px] cursor-cell flex-col gap-1 border-l border-border p-[5px]", dropKey === key ? "bg-accent-soft" : HOLIDAYS[d] && "bg-hover")}>
                    {leave && <div title={t("approvedLeave", { name: r.emp ?? "" })} className={cn("rounded-[7px] bg-info-bg px-2 py-1.5 text-[12px] font-medium text-info", cell.some((x) => conflicts[x.id]?.kind === "leave") ? "border-2 border-solid border-bad-dot" : "border border-solid border-transparent")}>{t("leave")}</div>}
                    {cell.map((x) => block(x, "week"))}
                  </div>
                );
              })}
            </div>
          ))}
          {rows.length === 0 && <div className="px-4 py-12 text-center text-[13.5px] text-text-3">{t("nothingMatches")}</div>}
        </div>
      </div>
    );
  };

  const dayGrid = () => {
    const { rows, list } = rowsFor(anchor, anchor);
    const hours = Array.from({ length: (DAY_END - DAY_START) / 60 }, (_, i) => DAY_START + i * 60);
    const minuteAt = (e: React.DragEvent | React.MouseEvent) => DAY_START + ((e.clientX - e.currentTarget.getBoundingClientRect().left) / PX_PER_HOUR) * 60;
    return (
      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
        <div style={{ minWidth: 168 + TRACK_WIDTH }}>
          <div className="flex rounded-t-xl border-b border-border bg-surface-2">
            <div className="w-[168px] flex-none px-3.5 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-text-3">{t(group === "emp" ? "groupEmployee" : "groupSite")}<div className="mt-0.5 font-medium normal-case text-text-2">{holidayName(anchor)}</div></div>
            <div className="relative h-[46px] flex-none" style={{ width: TRACK_WIDTH }}>
              {hours.map((m) => <div key={m} className="absolute inset-y-0 border-l border-border pl-[5px] pt-3.5 font-mono text-[11px] text-text-3" style={{ left: ((m - DAY_START) / 60) * PX_PER_HOUR }}>{formatTime(m)}</div>)}
            </div>
          </div>
          {rows.map((r) => {
            const cell = shiftsOf(list, r, anchor);
            const lanes: number[] = [];
            const placed = cell.map((x) => { let ln = lanes.findIndex((end) => end <= x.s); if (ln < 0) { ln = lanes.length; lanes.push(0); } lanes[ln] = x.e; return { x, ln }; });
            const key = `${r.key}|${anchor}`;
            return (
              <div key={r.key || "open"} className="flex border-b border-border">
                <div className="flex w-[168px] flex-none flex-col justify-center px-3.5 py-2.5"><div className="text-[13px] font-medium">{r.label}</div><div className="text-[12px] text-text-3">{r.sub}</div></div>
                <div
                  onClick={(e) => openNew(anchor, r.emp ?? null, r.site ?? null, Math.round(minuteAt(e) / 30) * 30)}
                  onDragOver={over(key)} onDrop={(e) => dropOn(e, r.key, anchor, minuteAt(e))}
                  className={cn("relative flex-none cursor-cell", dropKey === key ? "bg-accent-soft" : HOLIDAYS[anchor] && "bg-hover")}
                  style={{ width: TRACK_WIDTH, height: Math.max(1, lanes.length) * 36 + 8 }}
                >
                  {hours.map((m) => <div key={m} className="pointer-events-none absolute inset-y-0 border-l border-border" style={{ left: ((m - DAY_START) / 60) * PX_PER_HOUR }} />)}
                  {onLeave(r, anchor) && <div className="pointer-events-none absolute inset-x-0 inset-y-1 rounded-lg bg-info-bg px-2.5 py-1.5 text-[12.5px] font-medium text-info">{t("onApprovedLeave")}</div>}
                  {placed.map(({ x, ln }) => block(x, "day", { className: "absolute h-8", style: { left: Math.max(0, ((x.s - DAY_START) / 60) * PX_PER_HOUR), width: Math.max(40, ((x.e - x.s) / 60) * PX_PER_HOUR - 2), top: 4 + ln * 36 } }))}
                </div>
              </div>
            );
          })}
          {rows.length === 0 && <div className="px-4 py-12 text-center text-[13.5px] text-text-3">{t("nothingMatches")}</div>}
        </div>
      </div>
    );
  };

  const monthGrid = () => {
    const a = dateOf(anchor);
    const first = Math.round((Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), 1) - dateOf(0).getTime()) / 864e5);
    const last = Math.round((Date.UTC(a.getUTCFullYear(), a.getUTCMonth() + 1, 0) - dateOf(0).getTime()) / 864e5);
    const weeks: number[] = [];
    for (let w = weekStartOf(first, weekOffset); w <= last; w += 7) weeks.push(w);
    return (
      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-7 rounded-t-xl border-b border-border bg-surface-2">{weekdayNames.map((n) => <div key={n} className="px-2.5 py-2 text-[11.5px] font-semibold uppercase text-text-3">{n}</div>)}</div>
          {weeks.map((w) => (
            <div key={w} className="grid grid-cols-7">
              {Array.from({ length: 7 }, (_, i) => {
                const d = w + i;
                const inMonth = d >= first && d <= last;
                const cs = shifts.filter((x) => x.d === d && visible(x)).sort((p, q) => p.s - q.s);
                const key = `m|${d}`;
                return (
                  <div key={d} onClick={() => { setAnchor(d); setView("day"); }} onDragOver={over(key)} onDrop={(e) => dropOn(e, null, d, null)}
                    className={cn("flex min-h-[104px] cursor-pointer flex-col gap-[3px] border-l border-t border-border p-1.5", !inMonth && "opacity-45", dropKey === key ? "bg-accent-soft" : HOLIDAYS[d] && "bg-hover")}>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("grid size-[22px] place-items-center rounded-full text-[12px] font-semibold", d === TODAY_INDEX ? "bg-accent text-white" : "text-text")}>{dateOf(d).getUTCDate()}</span>
                      <span className="truncate text-[11px] text-text-3">{holidayName(d)}</span>
                      {cs.some((x) => conflicts[x.id]) && <span className="ml-auto size-2 rounded-full bg-bad-dot" />}
                    </div>
                    {cs.slice(0, 3).map((x) => block(x, "month"))}
                    {cs.length > 3 && <div className="pl-1 text-[11px] text-text-3">{t("more", { count: cs.length - 3 })}</div>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex flex-col gap-3.5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="m-0 text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[13.5px] text-text-2">
            <span className={cn("flex items-center gap-[7px]", dirtyCount ? "text-warn" : "text-ok")}><span className={cn("size-2 rounded-full", dirtyCount ? "bg-warn-dot" : "bg-ok-dot")} />{dirtyCount ? t("unpublished", { count: dirtyCount }) : t("allPublished")}</span>
            {conflictCount > 0 && <span className="flex items-center gap-[7px] text-bad"><span className="size-2 rounded-[2px] border-2 border-solid border-bad-dot" />{t("conflictCount", { count: conflictCount })}</span>}
          </div>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            {view === "week" && <Button onClick={copyPreviousWeek}>{t("copyWeek")}</Button>}
            <Button onClick={() => openNew(view === "day" ? anchor : Math.max(monday, Math.min(monday + 4, TODAY_INDEX >= monday && TODAY_INDEX <= monday + 6 ? TODAY_INDEX : monday)), null, null)}><Plus size={15} /> {t("addShift")}</Button>
            <Button className="border-accent bg-accent-soft text-accent" onClick={() => setModal(true)}>{t("newSchedule")}</Button>
            <Button variant="primary" disabled={dirtyCount === 0} onClick={() => setPublishing(true)}>{t("publishChanges")}</Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label={t("view")} className="flex overflow-hidden rounded-[9px] border border-border-strong">
          {(["day", "week", "month"] as const).map((k) => <button key={k} aria-pressed={view === k} onClick={() => setView(k)} className={cn("h-[34px] border-0 px-3.5 text-[13px] font-medium", view === k ? "bg-accent text-white" : "bg-surface text-text-2")}>{t(`views.${k}`)}</button>)}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setAnchor(anchor - step)} aria-label={t("previous")} className="grid size-[34px] place-items-center rounded-[9px] border border-solid border-border-strong bg-surface text-text"><ChevronLeft size={16} /></button>
          <button onClick={() => setAnchor(TODAY_INDEX)} className="h-[34px] rounded-[9px] border border-solid border-border-strong bg-surface px-3 text-[13px] text-text">{t("today")}</button>
          <button onClick={() => setAnchor(anchor + step)} aria-label={t("next")} className="grid size-[34px] place-items-center rounded-[9px] border border-solid border-border-strong bg-surface text-text"><ChevronRight size={16} /></button>
        </div>
        <div className="min-w-[150px] text-[15px] font-semibold">{rangeLabel}</div>
        {view !== "month" && (
          <div role="group" aria-label={t("groupBy")} className="flex overflow-hidden rounded-[9px] border border-border-strong">
            {(["emp", "site"] as const).map((k) => <button key={k} aria-pressed={group === k} onClick={() => setGroup(k)} className={cn("h-[34px] border-0 px-3 text-[13px]", group === k ? "bg-accent text-white" : "bg-surface text-text-2")}>{t(k === "emp" ? "employees" : "sites")}</button>)}
          </div>
        )}
        <select value={filters.branch} onChange={(e) => set({ branch: e.target.value, site: "all", emp: "all" })} aria-label={t("filters.branch")} className={select}>
          <option value="all">{t("filters.allBranches")}</option>{org.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={filters.site} onChange={(e) => set({ site: e.target.value })} aria-label={t("filters.site")} className={select}>
          <option value="all">{t("filters.allSites")}</option>{sitesAvailable.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filters.emp} onChange={(e) => set({ emp: e.target.value })} aria-label={t("filters.employee")} className={select}>
          <option value="all">{t("filters.allEmployees")}</option>{people.map((p) => <option key={p.name}>{p.name}</option>)}
        </select>
        <select value={filters.type} onChange={(e) => set({ type: e.target.value as Filters["type"] })} aria-label={t("filters.type")} className={select}>
          <option value="all">{t("filters.allTypes")}</option><option value="rec">{t("recurring")}</option><option value="int">{t("intervention")}</option>
        </select>
        {hasFilter && <button onClick={() => setFilters(DEFAULT_FILTERS)} className="h-[34px] border-0 bg-transparent px-2.5 text-[13px] text-accent">{t("clear")}</button>}
      </div>

      <div className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-0 flex-[1_1_640px] flex-col gap-2.5">
          <ul className="m-0 flex list-none flex-wrap gap-4 p-0 text-[12px] text-text-2">
            {([["bg-accent-soft border border-solid border-accent", "recurring"], ["bg-orange-bg border border-solid border-orange", "intervention"], ["bg-info-bg border border-solid border-info", "leave"], ["border-[1.5px] border-dashed border-border-strong", "unassigned"], ["bg-hover border border-solid border-border-strong", "holiday"], ["border-2 border-solid border-bad-dot", "conflict"]] as const).map(([cls, k]) => (
              <li key={k} className="flex items-center gap-1.5"><span className={cn("size-3 rounded", cls)} />{t(k)}</li>
            ))}
          </ul>
          {view === "week" ? weekGrid() : view === "day" ? dayGrid() : monthGrid()}
        </div>

        {canEdit && (
          <aside className="flex w-[260px] max-w-full flex-none flex-col gap-3.5">
            <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
              <div className="border-b border-border px-3.5 py-3"><div className="text-[14px] font-semibold">{t("openInterventions")}</div><div className="mt-0.5 text-[12px] text-text-3">{t("dragHint")}</div></div>
              {interventions.filter((i) => siteIds.includes(i.site) && (filters.site === "all" || i.site === filters.site) && (filters.branch === "all" || org.siteById(i.site).branchId === filters.branch)).map((i) => (
                <div key={i.id} draggable onDragStart={(e) => drag.start(e, { k: "int", id: i.id })} onDragEnd={drag.end} className="flex cursor-grab items-start gap-2.5 border-t border-border px-3.5 py-2.5">
                  <span className="mt-1.5 size-2 flex-none rounded-full bg-orange-dot" />
                  <div className="min-w-0"><div className="text-[13px] font-medium">{i.title}</div><div className="text-[12px] text-text-3">{org.siteById(i.site).name}</div><div className="font-mono text-[11.5px] text-text-2">{format.dateTime(dateOf(i.d), { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })} · {formatTime(i.s)}–{formatTime(i.e)}</div></div>
                </div>
              ))}
              {interventions.length === 0 && <div className="border-t border-border px-3.5 py-6 text-center text-[13px] text-text-3">{t("noOpen")}</div>}
            </section>
            <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
              <div className="border-b border-border px-3.5 py-3"><div className="text-[14px] font-semibold">{t("employeesPanel")}</div><div className="mt-0.5 text-[12px] text-text-3">{t("employeesHint")}</div></div>
              <div className="flex flex-wrap gap-1.5 p-3">
                {people.map((p) => <span key={p.name} draggable onDragStart={(e) => drag.start(e, { k: "emp", name: p.name })} onDragEnd={drag.end} className="cursor-grab rounded-full border border-solid border-border-strong bg-surface px-2.5 py-1 text-[12px] text-text">{p.name}</span>)}
              </div>
            </section>
          </aside>
        )}
      </div>

      <ShiftDialog draft={draft} onClose={() => setDraft(null)} onSaved={(editing) => toast(t(editing ? "toasts.updated" : "toasts.shiftAdded"))} onDeleted={() => toast(t("toasts.deleted"))} />
      <ScheduleModal
        open={modal}
        onClose={() => setModal(false)}
        onSaved={({ mode, count, notify, firstDay }) => {
          if (firstDay !== null) setAnchor(firstDay);
          toast(`${t(mode === "draft" ? "toasts.draftSaved" : "toasts.published")} · ${t("toasts.shifts", { count })}${notify ? ` · ${t("toasts.notified")}` : ""}`);
        }}
      />
      <PublishDialog summary={publishSummary} onClose={() => setPublishing(false)} onConfirm={(notify) => { const n = publishSummary?.employees ?? 0; publish(); setPublishing(false); toast(`${t("toasts.schedulePublished")}${notify ? ` · ${t("toasts.employeesNotified", { count: n })}` : ""}`); }} />
    </div>
  );
}

"use client";

import { ChevronRight, Download, Search } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { Popover } from "@/components/ui/popover";
import { useToast } from "@/components/ui/toast";
import { ACTION_TONES, AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/data/audit";
import { loadAudit } from "@/services/audit";
import { exportTable } from "@/lib/export";
import { cn } from "@/lib/utils";
import type { AuditEntry } from "@/types/audit";
import { useDateFormat } from "@/lib/preferences";

const DAY = 864e5;
const PAGE = 12;
const GRID = "grid grid-cols-[24px_148px_minmax(190px,1.2fr)_minmax(190px,1.3fr)_minmax(170px,1.2fr)_120px_150px] items-center gap-3";
const select = "h-[34px] max-w-[180px] rounded-[9px] border border-solid border-border-strong bg-surface px-2.5 text-[13px] text-text";
const dateInput = "h-[34px] rounded-[9px] border border-solid bg-surface px-2.5 text-[13px] text-text";

const NEUTRAL = "bg-neutral-bg text-neutral";
const isoDay = (e: AuditEntry) => localDate(new Date(e.at));
const localDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const clock = (e: AuditEntry) => new Date(e.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
/** Whole days between an entry and today, by calendar date. */
const daysAgo = (e: AuditEntry) => Math.round((Date.parse(localDate(new Date())) - Date.parse(isoDay(e))) / DAY);
const NARROW = { weekday: "short", day: "numeric", month: "short" } as const;

interface Filters { q: string; range: string; from: string; to: string; actor: string; action: string; type: string }
const DEFAULTS: Filters = { q: "", range: "30", from: "", to: "", actor: "all", action: "all", type: "all" };

export function AuditScreen() {
  const t = useTranslations("Audit");
  const tAction = useTranslations("Audit.actions");
  const tType = useTranslations("Audit.targetTypes");
  const format = useFormatter();
  const toast = useToast();
  const numericDate = useDateFormat();
  const [f, setF] = useState<Filters>(DEFAULTS);
  const [open, setOpen] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const set = (p: Partial<Filters>) => { setF((x) => ({ ...x, ...p })); setOpen(null); setShown(PAGE); };

  // The server filters by date; everything else is filtered here on the entries loaded.
  const window = useMemo(() => {
    const today = new Date();
    if (f.range === "custom") return { from: f.from || undefined, to: f.to || undefined };
    if (f.range === "all") return {};
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - Number(f.range));
    return { from: localDate(from) };
  }, [f.range, f.from, f.to]);
  useEffect(() => {
    let live = true;
    loadAudit(window).then(
      (list) => live && (setEntries(list), setLoading(false)),
      (e: unknown) => {
        if (!live) return;
        setLoading(false);
        toast(e instanceof Error ? e.message : t("loadFailed"), "bad");
      },
    );
    return () => {
      live = false;
    };
    // `toast` and `t` are stable for the life of the screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window]);

  const actors = useMemo(() => [...new Map(entries.map((e) => [e.actorId, e.actorName])).entries()].map(([id, name]) => ({ id, name })), [entries]);
  const actionLabel = (e: AuditEntry) => (e.action ? tAction(e.action) : e.actionText);
  const tone = (e: AuditEntry) => (e.action ? ACTION_TONES[e.action] : NEUTRAL);
  const stamp = (e: AuditEntry) => format.dateTime(new Date(e.at), { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const dayLabel = (e: AuditEntry) => (daysAgo(e) === 0 ? t("today") : daysAgo(e) === 1 ? t("yesterday") : format.dateTime(new Date(e.at), NARROW));

  const list = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return entries.filter((e) => {
      if (f.actor !== "all" && e.actorId !== f.actor) return false;
      if (f.action !== "all" && e.action !== f.action) return false;
      if (f.type !== "all" && e.targetType !== f.type) return false;
      return !q || e.target.toLowerCase().includes(q) || e.reason.toLowerCase().includes(q) || e.actorName.toLowerCase().includes(q) || e.actionText.toLowerCase().includes(q);
    });
  }, [f, entries]);

  const badRange = f.range === "custom" && f.from && f.to && f.to < f.from;
  const hasFilter = JSON.stringify(f) !== JSON.stringify(DEFAULTS);

  const exportList = async (kind: "csv" | "xlsx") => {
    if (!list.length) return toast(t("nothingToExport"), "bad");
    const head = [t("export.timestamp"), t("export.actor"), t("export.role"), t("export.action"), t("export.targetType"), t("export.target"), t("export.scope"), t("export.ip"), t("export.device"), t("export.reason"), t("export.changes")];
    const rows = list.map((e) => [`${numericDate(new Date(e.at))}, ${clock(e)}`, e.actorName, e.actorRole, actionLabel(e), e.targetType ? tType(e.targetType) : "", e.target, t("company"), e.ip, e.device, e.reason, e.diff.map((d) => `${d.field}: ${d.before} → ${d.after}`).join("; ")]);
    await exportTable(kind, "audit-log", t("title"), [head, ...rows]);
    toast(t("exported", { count: list.length }));
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div><h1 className="m-0 text-2xl font-semibold tracking-tight">{t("title")}</h1><p className="mt-1 text-[13.5px] text-text-2">{t("subtitle")}</p></div>
        <Popover align="right" panelClassName="w-[240px] p-1.5" trigger={({ toggle }) => <Button onClick={toggle}><Download size={15} /> {t("export.button")}</Button>}>
          {(close) => (["csv", "xlsx"] as const).map((k) => <button key={k} onClick={() => { close(); void exportList(k); }} className="block h-[34px] w-full rounded-lg border-0 bg-transparent px-2.5 text-left text-[13px] text-text hover:bg-hover">{t(`export.${k}`)}</button>)}
        </Popover>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-[34px] max-w-[260px] flex-[1_1_200px] items-center gap-2 rounded-[9px] border border-solid border-border-strong bg-surface px-[11px] text-text-3"><Search size={14} /><input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder={t("search")} aria-label={t("search")} className="w-full border-0 bg-transparent text-[13px] text-text outline-0" /></label>
        <select value={f.range} onChange={(e) => set({ range: e.target.value })} aria-label={t("filters.range")} className={select}>{["all", "0", "7", "30", "custom"].map((k) => <option key={k} value={k}>{t(`ranges.${k}`)}</option>)}</select>
        <select value={f.actor} onChange={(e) => set({ actor: e.target.value })} aria-label={t("filters.actor")} className={select}><option value="all">{t("filters.allUsers")}</option>{actors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <select value={f.action} onChange={(e) => set({ action: e.target.value })} aria-label={t("filters.action")} className={select}><option value="all">{t("filters.allActions")}</option>{AUDIT_ACTIONS.map((a) => <option key={a} value={a}>{tAction(a)}</option>)}</select>
        <select value={f.type} onChange={(e) => set({ type: e.target.value })} aria-label={t("filters.type")} className={select}><option value="all">{t("filters.allTypes")}</option>{AUDIT_TARGET_TYPES.map((k) => <option key={k} value={k}>{tType(k)}</option>)}</select>
        {f.range === "custom" && (<>
          <input type="date" value={f.from} onChange={(e) => set({ from: e.target.value })} aria-label={t("filters.from")} className={cn(dateInput, "border-border-strong")} />
          <span className="text-text-3">→</span>
          <input type="date" value={f.to} onChange={(e) => set({ to: e.target.value })} aria-label={t("filters.to")} aria-invalid={!!badRange} className={cn(dateInput, badRange ? "border-bad-dot" : "border-border-strong")} />
        </>)}
        {hasFilter && <button onClick={() => set(DEFAULTS)} className="h-[34px] border-0 bg-transparent px-2 text-[13px] text-accent">{t("filters.clear")}</button>}
      </div>
      <div className="text-[12.5px] text-text-3">{t("count", { count: list.length })}{badRange && ` · ${t("badRange")}`}</div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
        <div className="min-w-[1040px]">
          <div className={cn(GRID, "h-[38px] border-b border-border bg-surface-2 px-4 text-[11.5px] font-semibold uppercase tracking-[.04em] text-text-3")}>
            <div /><div>{t("columns.when")}</div><div>{t("columns.actor")}</div><div>{t("columns.action")}</div><div>{t("columns.target")}</div><div>{t("columns.scope")}</div><div>{t("columns.ipDevice")}</div>
          </div>
          {list.slice(0, shown).map((e) => {
            const a = { name: e.actorName, role: e.actorRole, ip: e.ip, device: e.device };
            const isOpen = open === e.id;
            return (
              <div key={e.id} className="border-b border-border last:border-b-0">
                <div role="button" tabIndex={0} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : e.id)} onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && (ev.preventDefault(), setOpen(isOpen ? null : e.id))} className={cn(GRID, "cursor-pointer px-4 py-[11px] text-[13px] hover:bg-hover", isOpen && "bg-accent-soft")}>
                  <ChevronRight size={14} className={cn("text-text-3 transition-transform", isOpen && "rotate-90")} />
                  <div><div className="font-medium">{dayLabel(e)}</div><div className="font-mono text-[12px] text-text-3">{clock(e)}</div></div>
                  <div className="flex min-w-0 items-center gap-2.5"><Avatar name={a.name} size={30} /><div className="min-w-0"><div className="truncate font-medium">{a.name}</div><div className="truncate text-[12px] text-text-3">{a.role}</div></div></div>
                  <div><span className={cn("rounded-full px-[9px] py-[3px] text-[12px] font-medium", tone(e))}>{actionLabel(e)}</span></div>
                  <div className="min-w-0"><button onClick={(ev) => { ev.stopPropagation(); toast(t("opening", { target: e.target })); }} className="block max-w-full truncate border-0 bg-transparent p-0 text-left text-[13px] text-accent">{e.target}</button><div className="text-[12px] text-text-3">{e.targetType ? tType(e.targetType) : ""}</div></div>
                  <div className="text-text-2">{t("company")}</div>
                  <div><div className="font-mono text-[12px]">{a.ip}</div><div className="truncate text-[12px] text-text-3">{a.device}</div></div>
                </div>
                {isOpen && (
                  <div className="flex flex-col gap-3 bg-surface-2 px-4 pb-[18px] pl-[52px] pt-1">
                    {e.reason && <div className="max-w-[640px] rounded-[9px] border border-border bg-surface px-3 py-[9px] text-[13px]"><div className="mb-0.5 text-[11.5px] text-text-3">{t("reasonGiven")}</div>{e.reason}</div>}
                    {e.diff.length > 0 && (
                      <div className="max-w-[760px] overflow-hidden rounded-[10px] border border-border bg-surface">
                        <div className="grid grid-cols-[1fr_1fr_1fr] gap-3 border-b border-border bg-surface-2 px-3 py-2 text-[11.5px] font-semibold uppercase tracking-[.04em] text-text-3"><div>{t("diff.field")}</div><div>{t("diff.before")}</div><div>{t("diff.after")}</div></div>
                        {e.diff.map((d) => <div key={d.field} className="grid grid-cols-[1fr_1fr_1fr] gap-3 border-t border-border px-3 py-2 text-[13px] first:border-t-0"><div className="font-medium">{d.field}</div><div className="text-bad">{d.before}</div><div className="text-ok">{d.after}</div></div>)}
                      </div>
                    )}
                    {!e.reason && e.diff.length === 0 && <div className="text-[13px] text-text-3">{t("noChanges")}</div>}
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-text-3"><span>{t("entry")} <span className="font-mono">{e.id}</span></span><span>{stamp(e)}, {clock(e)}</span></div>
                  </div>
                )}
              </div>
            );
          })}
          {loading && <div className="px-4 py-12 text-center text-[13px] text-text-3">{t("loading")}</div>}
          {!loading && list.length === 0 && <div className="px-4 py-12 text-center"><div className="font-semibold">{t("empty.title")}</div><div className="text-[13px] text-text-3">{t("empty.hint")}</div></div>}
        </div>
      </div>
      {list.length > shown && <div className="flex justify-center"><Button onClick={() => setShown(shown + PAGE)}>{t("showMore", { count: Math.min(PAGE, list.length - shown) })}</Button></div>}
    </div>
  );
}

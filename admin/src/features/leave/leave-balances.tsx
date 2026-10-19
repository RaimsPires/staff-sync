"use client";

import { ChevronLeft, ChevronRight, Download, Minus, Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { ENTITLEMENT } from "@/data/leave";
import { BRANCHES, SITES, branchOfSite, siteById } from "@/data/org";
import { hashOf } from "@/features/employees/profile/profile-model";
import { exportCsv } from "@/lib/export";
import { cn } from "@/lib/utils";
import { useLeave } from "@/store/leave";
import { useAccess } from "@/store/use-access";
import type { LeaveType } from "@/types/leave";
import { TYPE_STYLE } from "./model";

const TYPES = ["annual", "rtt", "sick", "family"] as const satisfies readonly LeaveType[];
const select = "h-[34px] max-w-[190px] rounded-[9px] border border-solid border-border-strong bg-surface px-2.5 text-[13px] text-text";
const round1 = (n: number) => String(Math.round(n * 10) / 10);

interface Adjustment { name: string; type: LeaveType; days: number; reason: string; year: number }
interface Balance { entitled: number; used: number; pending: number; remaining: number }

export function LeaveBalances() {
  const t = useTranslations("Leave.balances");
  const tt = useTranslations("Leave.types");
  const tRoles = useTranslations("Alerts.roles");
  const toast = useToast();
  const { siteIds } = useAccess();
  const requests = useLeave((s) => s.requests);

  const [year, setYear] = useState(2026);
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("all");
  const [site, setSite] = useState("all");
  const [type, setType] = useState<"all" | (typeof TYPES)[number]>("all");
  const [low, setLow] = useState(false);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [adjusting, setAdjusting] = useState<{ name: string; type: LeaveType; days: string; reason: string; tried: boolean } | null>(null);

  const people = useMemo(() => [...new Map(requests.filter((r) => siteIds.includes(r.site)).map((r) => [r.name, { name: r.name, site: r.site, role: r.role }])).values()], [requests, siteIds]);
  const types = type === "all" ? TYPES : [type];

  const balance = (name: string, tp: LeaveType, y: number): Balance => {
    const adj = adjustments.filter((a) => a.year === y && a.name === name && a.type === tp).reduce((sum, a) => sum + a.days, 0);
    const entitled = ENTITLEMENT[tp] + adj;
    const h = hashOf(name + tp + y);
    const raw = tp === "annual" ? 8 + (h % 10) : tp === "rtt" ? h % 5 : tp === "sick" ? h % 3 : h % 2;
    let used = Math.min(entitled, Math.round(raw * (y === 2026 && tp === "annual" ? 0.8 : 1)));
    let pending = 0;
    if (y === 2026) {
      requests.filter((r) => r.name === name && r.type === tp && r.from.startsWith("2026")).forEach((r) => {
        if (r.status === "approved" && r.from > "2026-10-15") used += r.days;
        else if (r.status === "pending") pending += r.days;
      });
    }
    if (y === 2027) { used = 0; pending = 0; }
    return { entitled, used, pending, remaining: entitled - used - pending };
  };
  const isLow = (name: string) => types.some((tp) => balance(name, tp, year).remaining <= (tp === "annual" ? 3 : 1));

  const q = query.trim().toLowerCase();
  const base = people.filter((p) => (branch === "all" || branchOfSite(p.site).id === branch) && (site === "all" || p.site === site) && (!q || p.name.toLowerCase().includes(q)));
  const lowCount = base.filter((p) => isLow(p.name)).length;
  const rows = base.filter((p) => !low || isLow(p.name));
  const sitesAvailable = SITES.filter((s) => siteIds.includes(s.id) && (branch === "all" || s.branchId === branch));
  const tone = (r: number, tp: LeaveType) => (r < 0 ? "text-bad" : r <= (tp === "annual" ? 3 : 1) ? "text-warn" : "text-text");

  const exportRows = () => {
    exportCsv(`leave-balances-${year}.csv`, [
      [t("export.employee"), t("export.site"), ...types.flatMap((tp) => [t("export.entitled"), t("export.used"), t("export.pending"), t("export.remaining")].map((k) => `${tt(tp)} ${k}`))],
      ...rows.map((p) => [p.name, siteById(p.site).name, ...types.flatMap((tp) => { const b = balance(p.name, tp, year); return [b.entitled, b.used, b.pending, b.remaining]; })]),
    ]);
    toast(t("exported", { count: rows.length }));
  };

  const current = adjusting ? balance(adjusting.name, adjusting.type, year) : null;
  const delta = adjusting ? parseFloat(adjusting.days) : NaN;
  const okDelta = !Number.isNaN(delta) && delta !== 0;
  const okReason = !!adjusting && adjusting.reason.trim().length >= 3;
  const bump = (d: number) => adjusting && setAdjusting({ ...adjusting, days: round1((parseFloat(adjusting.days) || 0) + d) });
  const apply = () => {
    if (!adjusting) return;
    if (!okDelta || !okReason) return setAdjusting({ ...adjusting, tried: true });
    setAdjustments((a) => [{ name: adjusting.name, type: adjusting.type, days: delta, reason: adjusting.reason.trim(), year }, ...a]);
    toast(t("adjusted", { type: tt(adjusting.type), days: `${delta > 0 ? "+" : "−"}${round1(Math.abs(delta))}` }));
    setAdjusting(null);
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <button onClick={() => setYear(year - 1)} aria-label={t("previousYear")} className="grid size-[34px] place-items-center rounded-[9px] border border-solid border-border-strong bg-surface text-text"><ChevronLeft size={16} /></button>
          <span className="min-w-14 text-center text-[15px] font-semibold">{year}</span>
          <button onClick={() => setYear(year + 1)} aria-label={t("nextYear")} className="grid size-[34px] place-items-center rounded-[9px] border border-solid border-border-strong bg-surface text-text"><ChevronRight size={16} /></button>
        </div>
        <label className="flex h-[34px] w-[210px] items-center gap-2 rounded-[9px] border border-solid border-border px-2.5 text-text-3"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-text outline-0" /></label>
        <select value={branch} onChange={(e) => { setBranch(e.target.value); setSite("all"); }} aria-label={t("filters.branch")} className={select}><option value="all">{t("filters.allBranches")}</option>{BRANCHES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
        <select value={site} onChange={(e) => setSite(e.target.value)} aria-label={t("filters.site")} className={select}><option value="all">{t("filters.allSites")}</option>{sitesAvailable.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <select value={type} onChange={(e) => setType(e.target.value as typeof type)} aria-label={t("filters.type")} className={select}><option value="all">{t("filters.allTypes")}</option>{TYPES.map((k) => <option key={k} value={k}>{tt(k)}</option>)}</select>
        <button aria-pressed={low} onClick={() => setLow(!low)} className={cn("h-[34px] rounded-[9px] border border-solid px-3 text-[13px] font-medium", low ? "border-accent bg-accent text-white" : "border-border-strong bg-surface text-text-2")}>{t("lowBalance")} <span className="font-mono text-[11.5px] opacity-80">{lowCount}</span></button>
        <div className="flex-1" />
        <Button onClick={exportRows}><Download size={15} /> {t("export.button")}</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
        <div style={{ minWidth: 210 + 88 + types.length * 230 }}>
          <div className="flex border-b border-border bg-surface-2">
            <div className="w-[210px] flex-none px-4 py-2.5 text-[12px] font-medium text-text-3">{t("columns.employee")}</div>
            {types.map((tp) => <div key={tp} className="flex-1 border-l border-border px-3 py-2.5 text-[12px] font-semibold" style={{ color: TYPE_STYLE[tp].color }}>{tt(tp)}</div>)}
            <div className="w-[88px] flex-none" />
          </div>
          {rows.map((p) => (
            <div key={p.name} className="flex items-center border-b border-border last:border-b-0">
              <div className="flex w-[210px] flex-none items-center gap-2.5 px-4 py-2.5"><Avatar name={p.name} size={32} /><div className="min-w-0"><div className="truncate text-[13.5px] font-medium">{p.name}</div><div className="truncate text-[12px] text-text-3">{tRoles(p.role)} · {siteById(p.site).name.split(" ")[0]}</div></div></div>
              {types.map((tp) => {
                const b = balance(p.name, tp, year);
                return (
                  <div key={tp} className="grid flex-1 grid-cols-4 gap-1 border-l border-border px-3 py-2 text-center font-mono text-[12.5px]">
                    {([["entitled", round1(b.entitled), "text-text-2"], ["used", round1(b.used), "text-text-2"], ["pending", b.pending ? round1(b.pending) : "–", b.pending ? "text-info" : "text-text-3"], ["remaining", b.remaining < 0 ? `−${round1(Math.abs(b.remaining))}` : round1(b.remaining), `font-semibold ${tone(b.remaining, tp)}`]] as const).map(([k, v, c]) => (
                      <div key={k}><div className="font-sans text-[10.5px] text-text-3">{t(`cells.${k}`)}</div><div className={c}>{v}</div></div>
                    ))}
                  </div>
                );
              })}
              <div className="w-[88px] flex-none px-2"><Button size="sm" onClick={() => setAdjusting({ name: p.name, type: types[0], days: "", reason: "", tried: false })}>{t("adjust")}</Button></div>
            </div>
          ))}
          {rows.length === 0 && <div className="px-4 py-12 text-center text-[13.5px] text-text-3">{t("empty")}</div>}
        </div>
      </div>

      {adjustments.length > 0 && (
        <section className="rounded-xl border border-border bg-surface shadow-card">
          <h2 className="m-0 border-b border-border px-4 py-3 text-[14.5px] font-semibold">{t("log.title")}</h2>
          {adjustments.map((a, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-border px-4 py-2.5 text-[13px] last:border-b-0">
              <span className={cn("font-mono font-semibold", a.days > 0 ? "text-ok" : "text-bad")}>{a.days > 0 ? "+" : "−"}{round1(Math.abs(a.days))} d</span>
              <span className="font-medium">{a.name}</span><span className="text-text-3">{tt(a.type)} {a.year}</span><span className="ml-auto text-text-2">{a.reason}</span>
            </div>
          ))}
        </section>
      )}

      <Modal
        open={adjusting !== null}
        onClose={() => setAdjusting(null)}
        title={t("modal.title", { name: adjusting?.name ?? "" })}
        className="max-w-[460px]"
        footer={<><Button onClick={() => setAdjusting(null)}>{t("modal.cancel")}</Button><Button variant="primary" onClick={apply}>{t("modal.apply")}</Button></>}
      >
        {adjusting && current && (
          <div className="flex flex-col gap-3.5">
            <label className="flex flex-col gap-1.5 text-[13px] font-medium">{t("modal.type")}
              <select value={adjusting.type} onChange={(e) => setAdjusting({ ...adjusting, type: e.target.value as LeaveType })} className="h-10 rounded-[9px] border border-solid border-border-strong bg-surface px-3 text-[14px] text-text">{TYPES.map((k) => <option key={k} value={k}>{tt(k)}</option>)}</select>
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium">{t("modal.days")}</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => bump(-0.5)} aria-label={t("modal.minus")} className="grid size-10 place-items-center rounded-[9px] border border-solid border-border-strong bg-surface"><Minus size={15} /></button>
                <input type="number" step={0.5} value={adjusting.days} onChange={(e) => setAdjusting({ ...adjusting, days: e.target.value })} aria-invalid={adjusting.tried && !okDelta} className={cn("h-10 w-28 rounded-[9px] border border-solid bg-surface px-3 text-center font-mono text-[15px] text-text outline-none focus:border-accent", adjusting.tried && !okDelta ? "border-bad-dot" : "border-border-strong")} />
                <button type="button" onClick={() => bump(0.5)} aria-label={t("modal.plus")} className="grid size-10 place-items-center rounded-[9px] border border-solid border-border-strong bg-surface"><Plus size={15} /></button>
                <span className="ml-auto text-[13px] text-text-2">{t("modal.before", { value: round1(current.remaining) })} → <strong className={cn("font-mono", okDelta && current.remaining + delta < 0 ? "text-bad" : "text-text")}>{okDelta ? round1(current.remaining + delta) : "—"}</strong></span>
              </div>
              {adjusting.tried && !okDelta && <span className="text-[12.5px] text-bad">{t("modal.deltaError")}</span>}
            </div>
            <label className="flex flex-col gap-1.5 text-[13px] font-medium">{t("modal.reason")}
              <textarea value={adjusting.reason} onChange={(e) => setAdjusting({ ...adjusting, reason: e.target.value })} rows={3} aria-invalid={adjusting.tried && !okReason} placeholder={t("modal.reasonPlaceholder")} className={cn("resize-y rounded-[9px] border border-solid bg-surface p-2.5 text-[13.5px] font-normal text-text outline-none focus:border-accent", adjusting.tried && !okReason ? "border-bad-dot" : "border-border-strong")} />
              {adjusting.tried && !okReason && <span className="text-[12.5px] font-normal text-bad">{t("modal.reasonError")}</span>}
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}

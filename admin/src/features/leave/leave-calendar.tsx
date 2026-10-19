"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useOrg } from "@/lib/org";
import { cn } from "@/lib/utils";
import { useLeave } from "@/store/leave";
import { useAccess } from "@/store/use-access";
import { DAY_MS, HOLIDAY_ISO, parseIso, toIso, TODAY_ISO, weekdayOf } from "./model";
import { useLeaveTypes } from "./use-leave-types";

const select = "h-[34px] max-w-[190px] rounded-[9px] border border-solid border-border-strong bg-surface px-2.5 text-[13px] text-text";
const TODAY = parseIso(TODAY_ISO);

export function LeaveCalendar({ onOpen }: { onOpen: (id: string) => void }) {
  const org = useOrg();
  const t = useTranslations("Leave.calendar");
  const leaveTypes = useLeaveTypes();
  const tRoles = useTranslations("Alerts.roles");
  const tHol = useTranslations("Leave.calendar.holidays");
  const format = useFormatter();
  const { siteIds } = useAccess();
  const requests = useLeave((s) => s.requests);

  const [scale, setScale] = useState<"month" | "quarter">("month");
  const [anchor, setAnchor] = useState(TODAY);
  const [group, setGroup] = useState<"site" | "branch">("site");
  const [branch, setBranch] = useState("all");
  const [site, setSite] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState<"all" | "approved" | "pending">("all");
  const [emp, setEmp] = useState("all");
  const [only, setOnly] = useState(false);

  const a = new Date(anchor);
  const y = a.getUTCFullYear();
  const m = a.getUTCMonth();
  const q = Math.floor(m / 3) * 3;
  const period = scale === "month" ? { a: Date.UTC(y, m, 1), b: Date.UTC(y, m + 1, 0) } : { a: Date.UTC(y, q, 1), b: Date.UTC(y, q + 3, 0) };
  const n = Math.round((period.b - period.a) / DAY_MS) + 1;
  const cw = scale === "month" ? 32 : Math.max(10, Math.floor(1080 / n));
  const shift = (dir: number) => { const step = scale === "month" ? 1 : 3; setAnchor(Date.UTC(y, m + dir * step, 1)); };

  const people = useMemo(() => [...new Map(requests.filter((r) => siteIds.includes(r.site)).map((r) => [r.name, { name: r.name, site: r.site, role: r.role }])).values()], [requests, siteIds]);
  const items = requests.filter((r) => (r.status === "approved" || r.status === "pending") && (status === "all" || r.status === status) && (type === "all" || r.type === type));
  const visiblePeople = people.filter((p) => (branch === "all" || org.branchOfSite(p.site).id === branch) && (site === "all" || p.site === site) && (emp === "all" || p.name === emp));
  const sitesAvailable = org.sites.filter((s) => siteIds.includes(s.id) && (branch === "all" || s.branchId === branch));
  const keyOf = (siteId: string) => (group === "site" ? siteId : org.branchOfSite(siteId).id);

  const barsOf = (name: string) =>
    items.filter((r) => r.name === name && parseIso(r.to) >= period.a && parseIso(r.from) <= period.b).map((r) => {
      const f = Math.max(parseIso(r.from), period.a);
      const e = Math.min(parseIso(r.to), period.b);
      const w = (Math.round((e - f) / DAY_MS) + 1) * cw - 2;
      return { r, x: Math.round((f - period.a) / DAY_MS) * cw + 1, w };
    });

  const groups = [...new Set(visiblePeople.map((p) => keyOf(p.site)))].map((k) => {
    let rows = visiblePeople.filter((p) => keyOf(p.site) === k).map((p) => ({ p, bars: barsOf(p.name) }));
    if (only) rows = rows.filter((x) => x.bars.length > 0);
    let peak = 0;
    for (let i = 0; i < n; i++) {
      const d = period.a + i * DAY_MS;
      const c = new Set(items.filter((r) => keyOf(r.site) === k && parseIso(r.from) <= d && parseIso(r.to) >= d).map((r) => r.name)).size;
      peak = Math.max(peak, c);
    }
    return { key: k, rows, peak };
  }).filter((g) => g.rows.length > 0);

  const days = Array.from({ length: n }, (_, i) => {
    const d = period.a + i * DAY_MS;
    const w = weekdayOf(d);
    const iso = toIso(d);
    return { d, w, iso, holiday: HOLIDAY_ISO[iso], today: d === TODAY, weekend: w >= 5, dom: new Date(d).getUTCDate() };
  });
  const months: { label: string; width: number }[] = [];
  for (let d = period.a; d <= period.b; ) {
    const dt = new Date(d);
    const end = Math.min(period.b, Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0));
    months.push({ label: format.dateTime(dt, { month: "long", year: "numeric", timeZone: "UTC" }), width: (Math.round((end - d) / DAY_MS) + 1) * cw });
    d = end + DAY_MS;
  }
  const cellBg = (x: (typeof days)[number]) => (x.holiday ? "bg-warn-bg" : x.today ? "bg-accent-soft" : x.weekend ? "bg-surface-2" : "bg-transparent");
  const rangeLabel = scale === "month" ? format.dateTime(new Date(period.a), { month: "long", year: "numeric", timeZone: "UTC" }) : `Q${Math.floor(m / 3) + 1} ${y}`;
  const weekdayLetters = Array.from({ length: 7 }, (_, i) => format.dateTime(new Date(Date.UTC(2026, 9, 12 + i)), { weekday: "narrow", timeZone: "UTC" }));
  const groupName = (k: string) => (group === "site" ? org.siteById(k).name : (org.branches.find((b) => b.id === k)?.name ?? k));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label={t("scale")} className="flex overflow-hidden rounded-[9px] border border-border-strong">{(["month", "quarter"] as const).map((k) => <button key={k} aria-pressed={scale === k} onClick={() => setScale(k)} className={cn("h-[34px] border-0 px-3.5 text-[13px] font-medium", scale === k ? "bg-accent text-white" : "bg-surface text-text-2")}>{t(`scales.${k}`)}</button>)}</div>
        <div className="flex items-center gap-1">
          <button onClick={() => shift(-1)} aria-label={t("previous")} className="grid size-[34px] place-items-center rounded-[9px] border border-solid border-border-strong bg-surface text-text"><ChevronLeft size={16} /></button>
          <button onClick={() => setAnchor(TODAY)} className="h-[34px] rounded-[9px] border border-solid border-border-strong bg-surface px-3 text-[13px] text-text">{t("today")}</button>
          <button onClick={() => shift(1)} aria-label={t("next")} className="grid size-[34px] place-items-center rounded-[9px] border border-solid border-border-strong bg-surface text-text"><ChevronRight size={16} /></button>
        </div>
        <div className="min-w-[130px] text-[15px] font-semibold">{rangeLabel}</div>
        <div role="group" aria-label={t("groupBy")} className="flex overflow-hidden rounded-[9px] border border-border-strong">{(["site", "branch"] as const).map((k) => <button key={k} aria-pressed={group === k} onClick={() => setGroup(k)} className={cn("h-[34px] border-0 px-3 text-[13px]", group === k ? "bg-accent text-white" : "bg-surface text-text-2")}>{t(`groups.${k}`)}</button>)}</div>
        <select value={branch} onChange={(e) => { setBranch(e.target.value); setSite("all"); setEmp("all"); }} aria-label={t("filters.branch")} className={select}><option value="all">{t("filters.allBranches")}</option>{org.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
        <select value={site} onChange={(e) => setSite(e.target.value)} aria-label={t("filters.site")} className={select}><option value="all">{t("filters.allSites")}</option>{sitesAvailable.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label={t("filters.type")} className={select}><option value="all">{t("filters.allTypes")}</option>{leaveTypes.types.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label={t("filters.status")} className={select}><option value="all">{t("filters.both")}</option><option value="approved">{t("filters.approvedOnly")}</option><option value="pending">{t("filters.pendingOnly")}</option></select>
        <select value={emp} onChange={(e) => setEmp(e.target.value)} aria-label={t("filters.employee")} className={select}><option value="all">{t("filters.allEmployees")}</option>{people.map((p) => p.name).sort().map((n2) => <option key={n2}>{n2}</option>)}</select>
        <button aria-pressed={only} onClick={() => setOnly(!only)} className={cn("h-[34px] rounded-[9px] border border-solid px-3 text-[13px] font-medium", only ? "border-accent bg-accent text-white" : "border-border-strong bg-surface text-text-2")}>{t("onlyWithLeave")}</button>
      </div>

      <ul className="m-0 flex list-none flex-wrap gap-4 p-0 text-[12px] text-text-2">
        {leaveTypes.types.map((x) => <li key={x.id} className="flex items-center gap-1.5"><span className="size-3 rounded" style={{ background: x.color }} />{x.label}</li>)}
        <li className="flex items-center gap-1.5"><span className="size-3 rounded border border-solid border-info bg-[repeating-linear-gradient(135deg,var(--info)_0_2px,transparent_2px_7px)]" />{t("pendingHatched")}</li>
      </ul>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
        <div style={{ width: 190 + n * cw, minWidth: "100%" }}>
          <div className="flex border-b border-border bg-surface-2">
            <div className="sticky left-0 z-[3] w-[190px] flex-none border-r border-border bg-surface-2" />
            <div className="flex">{months.map((mo) => <div key={mo.label} className="truncate border-l border-border px-2 py-1.5 text-[12px] font-semibold" style={{ width: mo.width }}>{mo.label}</div>)}</div>
          </div>
          <div className="flex border-b border-border">
            <div className="sticky left-0 z-[3] w-[190px] flex-none border-r border-border bg-surface px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-text-3">{t("employee")}</div>
            <div className="flex">
              {days.map((x) => (
                <div key={x.iso} title={x.holiday ? t("holidayTitle", { name: tHol(x.holiday) }) : undefined} className={cn("flex-none py-1 text-center text-[10.5px]", cellBg(x), x.holiday ? "text-warn" : x.today ? "font-semibold text-accent" : "text-text-3")} style={{ width: cw }}>
                  <div>{scale === "month" || x.w === 0 || x.dom === 1 ? x.dom : ""}</div>
                  {scale === "month" && <div>{weekdayLetters[x.w]}</div>}
                </div>
              ))}
            </div>
          </div>
          {groups.map((g) => (
            <div key={g.key}>
              <div className="sticky left-0 flex items-center gap-2 border-b border-border bg-surface-2 px-3 py-1.5">
                <span className="text-[13px] font-semibold">{groupName(g.key)}</span>
                <span className="text-[12px] text-text-3">{t("groupMeta", { count: g.rows.length, peak: g.peak })}</span>
              </div>
              {g.rows.map(({ p, bars }) => (
                <div key={p.name} className="flex border-b border-border last:border-b-0">
                  <div className="sticky left-0 z-[2] flex w-[190px] flex-none flex-col justify-center border-r border-border bg-surface px-3 py-1.5"><div className="truncate text-[13px] font-medium">{p.name}</div><div className="truncate text-[11.5px] text-text-3">{tRoles(p.role)} · {org.siteById(p.site).name.split(" ")[0]}</div></div>
                  <div className="relative h-11 flex-none" style={{ width: n * cw }}>
                    <div className="absolute inset-0 flex">{days.map((x) => <div key={x.iso} className={cn("flex-none border-l border-border/40", cellBg(x))} style={{ width: cw }} />)}</div>
                    {bars.map(({ r, x, w }) => {
                      const st = { color: leaveTypes.get(r.type).color, soft: `color-mix(in srgb, ${leaveTypes.get(r.type).color} 16%, transparent)` };
                      const pending = r.status === "pending";
                      const label = w >= 72 ? `${leaveTypes.label(r.type).split(" ")[0]} · ${r.half ? "½d" : `${r.days}d`}` : w >= 38 ? (r.half ? "½d" : `${r.days}d`) : "";
                      return (
                        <button key={r.id} onClick={() => onOpen(r.id)} title={`${r.name} · ${leaveTypes.label(r.type)} · ${r.half ? "½d" : `${r.days}d`} · ${t(pending ? "pending" : "approved")}`}
                          className="absolute top-2 h-7 overflow-hidden whitespace-nowrap rounded-md border border-solid px-1.5 text-left text-[11.5px] font-medium"
                          style={{ left: x, width: w, borderColor: st.color, color: pending ? st.color : "#fff", background: pending ? `repeating-linear-gradient(135deg, ${st.color} 0 2px, transparent 2px 7px), ${st.soft}` : st.color }}>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
          {groups.length === 0 && <div className="px-4 py-12 text-center text-[13.5px] text-text-3">{t("empty")}</div>}
        </div>
      </div>
    </div>
  );
}

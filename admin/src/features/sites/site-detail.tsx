"use client";

import { useHeadcounts } from "./use-headcounts";
import { ArrowLeft, Plus, QrCode, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PointsMap, type MapPoint } from "@/components/map/points-map";
import { Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { DEMO_MONTH, DEMO_YEAR } from "@/data/live";
import { geofenceMetrics, offsetMeters } from "@/lib/geo";
import { formatTime, parseTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { useAccess } from "@/store/use-access";
import { useSites } from "@/store/sites";
import type { ManagedSite } from "@/types/site";
import { historyFor, nowMinutes, rosterFor, weekFor, type RosterEntry, type RosterStatus } from "./site-model";
import { proxyCheck } from "@/services/attendance";
import { setSiteEmployees, setSiteManager } from "@/services/org";
import { useData } from "@/store/data";
import { useEmployees } from "@/store/employees";
import { useSchedule } from "@/store/schedule";
import { useUsers } from "@/store/users";
import { dateOf, TODAY_INDEX } from "@/features/schedules/model";
import { SiteQrDialog } from "./site-qr-dialog";

const card = "rounded-xl border border-border bg-surface shadow-card";
const TABS = ["today", "employees", "schedule", "history", "managers", "settings"] as const;
type Tab = (typeof TABS)[number];
const STATUS_TONE: Record<RosterStatus, "ok" | "warn" | "neutral" | "bad" | "info" | "orange"> = { in: "ok", late: "warn", out: "neutral", absent: "bad", expected: "info", flagged: "orange" };
const POINT_COLOR: Partial<Record<RosterStatus, string>> = { in: "#16A34A", late: "#E59A00", out: "#97A1B0", flagged: "#E5372A" };

export function SiteDetailScreen({ id }: { id: string }) {
  useHeadcounts();
  const site = useSites((s) => s.sites.find((x) => x.id === id));
  const { role, siteIds } = useAccess();
  if (!site) notFound();
  const visible = role === "admin" || siteIds.includes(site.id);
  if (!visible) return <div className="p-8 text-center text-text-3">—</div>;
  return <Detail key={site.id} site={site} />;
}

function Detail({ site }: { site: ManagedSite }) {
  const t = useTranslations("Sites.detail");
  const tc = useTranslations("Sites");
  const router = useRouter();
  const { perms } = useAccess();
  const branch = useSites((s) => s.branches.find((b) => b.id === site.branchId));
  const [tab, setTab] = useState<Tab>("today");
  const [qr, setQr] = useState(false);
  const today = useData((s) => s.today);
  const history = useData((s) => s.history);
  const employees = useEmployees((s) => s.employees);
  const roster = useMemo(() => rosterFor(site, today, employees), [site, today, employees]);
  // This month so far at this site: earlier days plus today.
  const month = useMemo(() => [...history, ...today].filter((r) => r.site === site.id && r.status !== "holiday" && r.status !== "leave"), [history, today, site.id]);
  const counted = month.filter((r) => r.in || r.status === "absent");
  const rate = counted.length ? Math.round((counted.filter((r) => r.in).length / counted.length) * 100) : 0;
  const lates = month.filter((r) => r.status === "late").length;
  const flags = month.filter((r) => r.flag && !r.cleared).length;
  const arrivals = month.filter((r) => r.in).map((r) => r.in);
  const meanArrival = arrivals.length ? Math.round(arrivals.reduce((a, b) => a + parseTime(b), 0) / arrivals.length) : null;
  const canManage = perms.admin || perms.org;
  const fence = site.geofence.kind === "circle" ? tc("fence.circle", { radius: site.geofence.radius }) : tc("fence.polygon", { area: site.geofence.hectares });

  const stats = [
    { k: "rate", v: site.active && counted.length ? `${rate}%` : "—", tone: rate >= 93 ? "text-ok" : "text-text", hint: t("stats.thisMonth") },
    { k: "arrival", v: site.active && meanArrival !== null ? formatTime(meanArrival) : "—", tone: "text-text", hint: t("stats.fourBefore") },
    { k: "lates", v: site.active ? lates : "—", tone: "text-text", hint: t("stats.thisMonth") },
    { k: "flags", v: site.active ? flags : "—", tone: flags > 2 ? "text-bad" : "text-text", hint: t("stats.thisMonth") },
  ];

  return (
    <div className="relative flex flex-col gap-4">
      <Link href="/sites" className="flex h-[30px] items-center gap-1.5 self-start rounded-lg py-0 pl-1.5 pr-2.5 text-[13px] font-medium text-text-2 no-underline hover:bg-hover hover:no-underline"><ArrowLeft size={15} /> {tc("title")}</Link>
      <div className={cn(card, "flex flex-wrap items-center gap-4 rounded-[14px] px-5 py-[18px]")}>
        <div className="min-w-0 flex-[1_1_280px]">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="m-0 text-2xl font-semibold tracking-tight">{site.name}</h1>
            <Chip tone={site.active ? "ok" : "neutral"} dot={false}>{tc(site.active ? "status.active" : "status.inactive")}</Chip>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3.5 gap-y-1 text-[13.5px] text-text-2"><span>{branch?.name}</span><span>{site.address}</span><span>{fence}</span></div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setQr(true)}><QrCode size={15} /> {t("qr")}</Button>
          {canManage && <Button variant="primary" onClick={() => router.push(`/sites/${site.id}/edit`)}>{t("edit")}</Button>}
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
        {stats.map((s) => (
          <div key={s.k} className={cn(card, "px-4 py-3.5")}>
            <div className="text-[12.5px] text-text-3">{t(`stats.${s.k}`)}</div>
            <div className={cn("mt-0.5 text-[26px] font-semibold tracking-tight", s.tone)}>{s.v}</div>
            <div className="text-[12px] text-text-3">{s.hint}</div>
          </div>
        ))}
      </div>

      <MapCard site={site} roster={roster} />

      <div role="tablist" className="flex gap-0.5 overflow-x-auto border-b border-border">
        {TABS.map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("-mb-px h-10 whitespace-nowrap border-0 border-b-2 border-solid bg-transparent px-3.5 text-[13.5px]", tab === k ? "border-b-accent font-semibold text-text" : "border-b-transparent font-medium text-text-2")}>{t(`tabs.${k}`)}</button>
        ))}
      </div>

      {tab === "today" && <TodayTab roster={roster} />}
      {tab === "employees" && <EmployeesTab site={site} />}
      {tab === "schedule" && <ScheduleTab site={site} />}
      {tab === "history" && <HistoryTab site={site} />}
      {tab === "managers" && <ManagersTab site={site} />}
      {tab === "settings" && <SettingsTab site={site} />}
      <SiteQrDialog site={qr ? site : null} onClose={() => setQr(false)} />
    </div>
  );
}

function MapCard({ site, roster }: { site: ManagedSite; roster: RosterEntry[] }) {
  const t = useTranslations("Sites.detail");
  const ts = useTranslations("Sites.detail.rosterStatus");
  const metrics = geofenceMetrics(site.geofence, site.position);
  const reach = Math.max(30, metrics.radius);
  const points: MapPoint[] = roster
    .filter((r) => POINT_COLOR[r.status])
    .map((r) => ({
      id: r.id, color: POINT_COLOR[r.status]!, emphasised: r.status === "flagged",
      position: offsetMeters(site.position, Math.cos(r.angle) * r.distance * reach, Math.sin(r.angle) * r.distance * reach),
      label: `${r.name} · ${ts(r.status)} ${r.inMin != null ? formatTime(r.inMin) : ""}${r.status === "flagged" ? ` · ${t("outside")}` : ""}`,
    }));
  return (
    <section className={cn(card, "overflow-hidden")}>
      <div className="relative z-0 h-[300px] bg-map-bg"><div className="absolute inset-0"><PointsMap center={site.position} geofence={site.geofence} points={points} /></div></div>
      <ul className="m-0 flex list-none flex-wrap gap-3.5 border-t border-border bg-surface-2 px-3.5 py-2 text-[12px] text-text-2">
        {([["in", "#16A34A"], ["late", "#E59A00"], ["flagged", "#E5372A"], ["out", "#97A1B0"]] as const).map(([k, c]) => <li key={k} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: c }} />{ts(k)}</li>)}
      </ul>
    </section>
  );
}

function TodayTab({ roster }: { roster: RosterEntry[] }) {
  const t = useTranslations("Sites.detail");
  const ts = useTranslations("Sites.detail.rosterStatus");
  const tj = useTranslations("Employees.titles");
  const toast = useToast();
  const [proxy, setProxy] = useState<{ id: string; type: "in" | "out"; time: string; reason: string; tried: boolean } | null>(null);
  const counts = (["in", "late", "flagged", "out", "expected", "absent"] as const).map((k) => [k, roster.filter((r) => r.status === k).length] as const).filter(([, n]) => n > 0);

  const confirm = async () => {
    if (!proxy) return;
    if (!proxy.reason.trim()) return setProxy({ ...proxy, tried: true });
    try {
      await proxyCheck(Number(proxy.id), proxy.type, { time: proxy.time, reason: proxy.reason.trim(), note: "" });
    } catch (e) {
      return toast(e instanceof Error ? e.message : t("proxy.failed"), "bad");
    }
    toast(t(proxy.type === "in" ? "proxy.doneIn" : "proxy.doneOut"));
    setProxy(null);
  };

  return (
    <section className={cn(card, "overflow-hidden")}>
      <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
        {counts.map(([k, n]) => <Chip key={k} tone={STATUS_TONE[k]} dot={false}>{n} {ts(k)}</Chip>)}
      </div>
      {roster.length === 0 && <div className="px-4 py-10 text-center text-[13px] text-text-3">{t("noRoster")}</div>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-[13.5px]">
          <thead><tr className="bg-surface-2 text-left text-[12px] text-text-3">{(["employee", "shift", "in", "out", "status", "method", "actions"] as const).map((c) => <th key={c} className="h-9 border-b border-border px-3 font-medium first:pl-4">{t(`columns.${c}`)}</th>)}</tr></thead>
          <tbody>
            {roster.map((r) => {
              const canProxy = r.status !== "out";
              const isIn = r.status === "in" || r.status === "late" || r.status === "flagged";
              return (
                <tr key={r.id} className="border-b border-border align-top last:border-b-0">
                  <td className="py-2.5 pl-4 pr-3"><div className="flex items-center gap-2.5"><Avatar name={r.name} size={30} /><div><div className="font-medium">{r.name}</div><div className="text-[12px] text-text-3">{tj(r.title)}</div></div></div></td>
                  <td className="px-3 py-2.5 font-mono text-[12.5px]">{formatTime(r.shiftStart)}–{formatTime(r.shiftEnd)}</td>
                  <td className="px-3 py-2.5 font-mono text-[12.5px]">{r.inMin != null ? formatTime(r.inMin) : "—"}</td>
                  <td className="px-3 py-2.5 font-mono text-[12.5px]">{r.outMin != null ? formatTime(r.outMin) : "—"}</td>
                  <td className="px-3 py-2.5"><Chip tone={STATUS_TONE[r.status]}>{ts(r.status)}</Chip></td>
                  <td className="px-3 py-2.5 text-[12.5px] text-text-2">{r.proxyBy ? t("proxyBy", { name: r.proxyBy }) : r.status === "absent" || r.status === "expected" ? "—" : t(`methods.${r.method}`)}</td>
                  <td className="px-3 py-2.5">
                    {proxy?.id === r.id ? (
                      <div className="flex min-w-[260px] flex-col gap-2">
                        <div className="grid grid-cols-[90px_1fr] gap-2">
                          <input type="time" value={proxy.time} onChange={(e) => setProxy({ ...proxy, time: e.target.value })} aria-label={t("proxy.time")} className="h-8 rounded-lg border border-solid border-border-strong bg-surface px-2 font-mono text-[12.5px] text-text" />
                          <input value={proxy.reason} onChange={(e) => setProxy({ ...proxy, reason: e.target.value })} placeholder={t("proxy.reason")} aria-label={t("proxy.reason")} aria-invalid={proxy.tried && !proxy.reason.trim()} className={cn("h-8 rounded-lg border border-solid bg-surface px-2 text-[12.5px] text-text", proxy.tried && !proxy.reason.trim() ? "border-bad-dot" : "border-border-strong")} />
                        </div>
                        <div className="flex gap-2"><Button size="sm" variant="primary" onClick={confirm}>{t("proxy.confirm")}</Button><Button size="sm" onClick={() => setProxy(null)}>{t("proxy.cancel")}</Button></div>
                      </div>
                    ) : canProxy ? (
                      <Button size="sm" onClick={() => setProxy({ id: r.id, type: isIn ? "out" : "in", time: formatTime(nowMinutes()), reason: "", tried: false })}>{t(isIn ? "proxy.checkOut" : "proxy.checkIn")}</Button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EmployeesTab({ site }: { site: ManagedSite }) {
  const t = useTranslations("Sites.detail.team");
  const tj = useTranslations("Employees.titles");
  const toast = useToast();
  const employees = useEmployees((st) => st.employees);
  const team = employees.filter((e) => e.siteIds.includes(site.id) && e.status !== "deactivated");
  const available = employees.filter((e) => !e.siteIds.includes(site.id) && e.status !== "deactivated");
  const [pick, setPick] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  const save = async (nos: string[], done: string) => {
    try {
      await setSiteEmployees(site.id, nos);
    } catch (e) {
      return toast(e instanceof Error ? e.message : t("failed"), "bad");
    }
    toast(done);
  };
  return (
    <section className={cn(card, "px-[18px] py-4")}>
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <h2 className="m-0 mr-auto text-[14.5px] font-semibold">{t("assigned", { count: team.length })}</h2>
        <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label={t("add")} className="h-9 rounded-[9px] border border-solid border-border-strong bg-surface px-2.5 text-[13px] text-text">
          <option value="">{t("add")}</option>
          {available.map((e) => <option key={e.id} value={e.id}>{e.name} · {tj(e.title)}</option>)}
        </select>
        <Button size="sm" variant="primary" disabled={!pick} onClick={() => { const who = available.find((e) => e.id === pick); if (!who) return; void save([...team.map((m) => m.id), who.id], t("added", { name: who.name, site: site.name })); setPick(""); }}><Plus size={14} /> {t("addButton")}</Button>
      </div>
      {team.length === 0 && <div className="py-8 text-center text-[13px] text-text-3">{t("none")}</div>}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-2.5">
        {team.map((m) => (
          <div key={m.id} className="flex items-center gap-2.5 rounded-[10px] border border-border px-3 py-2.5">
            <Avatar name={m.name} size={34} />
            <div className="min-w-0 flex-1"><div className="truncate text-[13.5px] font-medium">{m.name}</div><div className="text-[12px] text-text-3">{tj(m.title)}</div></div>
            {removing === m.id ? (
              <span className="flex gap-1.5"><Button size="sm" variant="danger" onClick={() => { void save(team.filter((x) => x.id !== m.id).map((x) => x.id), t("removed", { name: m.name })); setRemoving(null); }}>{t("confirmRemove")}</Button><Button size="sm" onClick={() => setRemoving(null)}>{t("cancel")}</Button></span>
            ) : (
              <button onClick={() => setRemoving(m.id)} aria-label={t("remove", { name: m.name })} className="grid size-8 place-items-center rounded-lg border border-solid border-border bg-transparent text-text-3 hover:text-bad"><X size={14} /></button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ScheduleTab({ site }: { site: ManagedSite }) {
  const t = useTranslations("Sites.detail.schedule");
  const format = useFormatter();
  const employees = useEmployees((st) => st.employees);
  const shifts = useSchedule((st) => st.shifts);
  const team = employees.filter((e) => e.siteIds.includes(site.id) && e.status !== "deactivated").map((e) => ({ name: e.name }));
  const monday = 0; // day 0 of the planner is this week's Monday
  const week = weekFor(team, shifts.filter((x) => x.site === site.id), monday);
  const todayWeekday = TODAY_INDEX;
  const days = Array.from({ length: 7 }, (_, i) => dateOf(monday + i));
  return (
    <section className={cn(card, "overflow-x-auto")}>
      <table className="w-full min-w-[760px] border-collapse text-[13px]">
        <thead>
          <tr className="text-left text-[12px] text-text-3">
            <th className="h-9 border-b border-border px-4 font-medium">{t("employee")}</th>
            {days.map((d, i) => <th key={i} className={cn("h-9 border-b border-border px-2 text-center font-medium", i === todayWeekday && "text-accent")}>{format.dateTime(d, { weekday: "short", day: "numeric", timeZone: "UTC" })}</th>)}
          </tr>
        </thead>
        <tbody>
          {week.map((row) => (
            <tr key={row.name} className="border-b border-border last:border-b-0">
              <td className="whitespace-nowrap px-4 py-2 font-medium">{row.name}</td>
              {row.cells.map((c, i) => (
                <td key={i} className="p-1.5">
                  <div className={cn("rounded-md px-1.5 py-1.5 text-center font-mono text-[12px]", i === todayWeekday && "outline outline-[1.5px] outline-accent", c.kind === "shift" || c.kind === "half" ? "bg-accent-soft text-accent" : c.kind === "leave" ? "bg-violet-bg text-violet" : "text-text-3")}>
                    {c.kind === "off" ? t("off") : c.kind === "leave" ? t("leave") : `${c.from}–${c.to}`}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function HistoryTab({ site }: { site: ManagedSite }) {
  const t = useTranslations("Sites.detail.history");
  const format = useFormatter();
  const [filter, setFilter] = useState<"all" | "in" | "late" | "absent" | "flagged">("all");
  const [query, setQuery] = useState("");
  const history = useData((st) => st.history);
  const all = useMemo(() => historyFor(site, history), [site, history]);
  const q = query.trim().toLowerCase();
  const rows = all.filter((h) => (filter === "all" || h.status === filter) && (!q || h.name.toLowerCase().includes(q))).slice(0, 24);
  const tone = { in: "ok", late: "warn", absent: "bad", flagged: "orange" } as const;
  return (
    <section className={cn(card, "overflow-hidden")}>
      <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-4 py-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="h-9 w-[220px] rounded-[9px] border border-solid border-border-strong bg-surface px-2.5 text-[13px] text-text" />
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label={t("status")} className="h-9 rounded-[9px] border border-solid border-border-strong bg-surface px-2.5 text-[13px] text-text">
          <option value="all">{t("all")}</option>
          {(["in", "late", "absent", "flagged"] as const).map((k) => <option key={k} value={k}>{t(`statuses.${k}`)}</option>)}
        </select>
      </div>
      {rows.length === 0 && <div className="px-4 py-8 text-center text-[13px] text-text-3">{t("none")}</div>}
      {rows.map((h, i) => (
        <div key={i} className="grid grid-cols-[110px_1fr_150px_60px_90px] items-center gap-3 border-b border-border px-4 py-2.5 text-[13px] last:border-b-0">
          <span className="font-medium">{format.dateTime(new Date(DEMO_YEAR, DEMO_MONTH, h.day), { weekday: "short", day: "numeric", month: "short" })}</span>
          <span>{h.name}</span>
          <span className="font-mono text-[12.5px] text-text-2">{h.inMin != null && h.outMin != null ? `${formatTime(h.inMin)} → ${formatTime(h.outMin)}` : t("noCheckIn")}</span>
          <span className="text-right text-text-3">{h.inMin != null && h.outMin != null ? `${((h.outMin - h.inMin) / 60).toFixed(1)} h` : ""}</span>
          <Chip tone={tone[h.status]} dot={false} className="justify-self-end">{t(`statuses.${h.status}`)}</Chip>
        </div>
      ))}
    </section>
  );
}

function ManagersTab({ site }: { site: ManagedSite }) {
  const t = useTranslations("Sites.detail.managers");
  const toast = useToast();
  const users = useUsers((st) => st.users);
  const [pick, setPick] = useState("");
  const list = site.managers.map((n) => ({ name: n, id: users.find((u) => u.name === n)?.id, phone: n === site.managers[0] ? site.phone || "—" : "—" }));
  const pool = users.filter((u) => u.status === "active" && !site.managers.includes(u.name));
  const change = async (userId: string | undefined, add: boolean, done: string) => {
    if (!userId) return toast(t("notAUser"), "bad");
    try {
      await setSiteManager(site.id, userId, add);
    } catch (e) {
      return toast(e instanceof Error ? e.message : t("failed"), "bad");
    }
    toast(done);
  };
  return (
    <section className={cn(card, "px-[18px] py-4")}>
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <h2 className="m-0 mr-auto text-[14.5px] font-semibold">{t("title")}</h2>
        <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label={t("add")} className="h-9 rounded-[9px] border border-solid border-border-strong bg-surface px-2.5 text-[13px] text-text">
          <option value="">{t("add")}</option>
          {pool.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <Button size="sm" variant="primary" disabled={!pick} onClick={() => { const who = pool.find((u) => u.id === pick); void change(pick, true, t("added", { name: who?.name ?? "" })); setPick(""); }}><Plus size={14} /> {t("addButton")}</Button>
      </div>
      {list.length === 0 && <div className="py-8 text-center text-[13px] text-text-3">{t("none")}</div>}
      {list.map((m, i) => (
        <div key={m.name} className={cn("flex items-center gap-3 py-3", i > 0 && "border-t border-border")}>
          <Avatar name={m.name} size={38} />
          <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium">{m.name}</div><div className="text-[12px] text-text-3">{m.phone}</div></div>
          <button onClick={() => void change(m.id, false, t("removed", { name: m.name }))} aria-label={t("remove", { name: m.name })} className="grid size-8 place-items-center rounded-lg border border-solid border-border bg-transparent text-text-3 hover:text-bad"><X size={14} /></button>
        </div>
      ))}
    </section>
  );
}

function SettingsTab({ site }: { site: ManagedSite }) {
  const t = useTranslations("Sites.detail.settings");
  const toast = useToast();
  const patchSite = useSites((s) => s.patchSite);
  const { perms } = useAccess();
  const [draft, setDraft] = useState({ requireSelfie: site.requireSelfie, requireQr: site.requireQr, registeredDeviceOnly: site.registeredDeviceOnly, allowOffline: site.allowOffline, minAccuracy: String(site.minAccuracy) });
  const accuracy = Number(draft.minAccuracy);
  const valid = accuracy >= 5 && accuracy <= 500;
  const dirty = draft.requireSelfie !== site.requireSelfie || draft.requireQr !== site.requireQr || draft.registeredDeviceOnly !== site.registeredDeviceOnly || draft.allowOffline !== site.allowOffline || accuracy !== site.minAccuracy;
  const readOnly = !(perms.admin || perms.org);
  return (
    <section className={cn(card, "flex max-w-[640px] flex-col gap-4 px-[18px] py-4")}>
      {(["requireSelfie", "requireQr", "registeredDeviceOnly", "allowOffline"] as const).map((k) => (
        <div key={k} className="flex items-center justify-between gap-3">
          <div><div className="text-[13.5px] font-medium">{t(`${k}.title`)}</div><div className="text-[12.5px] text-text-3">{t(`${k}.hint`)}</div></div>
          <Switch checked={draft[k]} onChange={(v) => !readOnly && setDraft({ ...draft, [k]: v })} label={t(`${k}.title`)} />
        </div>
      ))}
      <label className="flex flex-col gap-1.5 text-[13px] font-medium">{t("accuracy")}
        <input type="number" value={draft.minAccuracy} readOnly={readOnly} onChange={(e) => setDraft({ ...draft, minAccuracy: e.target.value })} aria-invalid={!valid} className={cn("h-10 w-32 rounded-[9px] border border-solid bg-surface px-3 text-[14px] text-text outline-none focus:border-accent", valid ? "border-border-strong" : "border-bad-dot")} />
        {!valid && <span className="text-[12.5px] font-normal text-bad">{t("accuracyError")}</span>}
      </label>
      <div className="flex items-center gap-3">
        <span className="text-[12.5px] text-text-3">{dirty ? t("unsaved") : t("saved")}</span>
        <Button variant="primary" disabled={!dirty || !valid || readOnly} onClick={() => { patchSite(site.id, { ...draft, minAccuracy: accuracy }); toast(t("done")); }}>{t("save")}</Button>
      </div>
    </section>
  );
}

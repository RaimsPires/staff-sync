"use client";

import { ChevronRight, LayoutGrid, List, Pause, Play, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/misc";
import { EmptyState } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { useOrg } from "@/lib/org";
import { FENCE_HEALTH } from "@/data/live";
import { sitesIn } from "@/lib/scope";
import { parseTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { useAccess } from "@/store/use-access";
import { useData } from "@/store/data";
import type { AttendanceRecord, JobKey } from "@/types/domain";
import { GridCard, ListRow } from "./board-row";
import { countFor, isFlagged, matchesFilter, presenceOf, PRESENCE_ORDER, type CounterKey, type StatusFilter } from "./board-model";
import { ProxyCheckDialog, type ProxyCheckResult } from "./proxy-check-dialog";
import { useBoardFeed } from "./use-board-feed";
import { useRuledRecords } from "@/lib/attendance-rules";

const COUNTERS: { key: CounterKey; filter: StatusFilter; dot: string }[] = [
  { key: "expected", filter: "all", dot: "var(--neutral-dot)" },
  { key: "present", filter: "present", dot: "var(--ok-dot)" },
  { key: "not", filter: "not", dot: "var(--warn-dot)" },
  { key: "left", filter: "left", dot: "var(--violet-dot)" },
  { key: "absent", filter: "absent", dot: "var(--bad-dot)" },
  { key: "leave", filter: "leave", dot: "var(--info-dot)" },
];
const CHIPS: { filter: StatusFilter; dot?: string }[] = [
  { filter: "all" },
  { filter: "present", dot: "var(--ok-dot)" },
  { filter: "not", dot: "var(--warn-dot)" },
  { filter: "left", dot: "var(--violet-dot)" },
  { filter: "absent", dot: "var(--bad-dot)" },
  { filter: "leave", dot: "var(--info-dot)" },
  { filter: "flagged", dot: "var(--bad-dot)" },
];
const FENCE_TONE = { ok: "bg-ok-bg text-ok", warn: "bg-warn-bg text-warn", bad: "bg-bad-bg text-bad" } as const;
const FENCE_DOT = { ok: "bg-ok-dot", warn: "bg-warn-dot", bad: "bg-bad-dot" } as const;

export function LiveBoardScreen({ initialSite = "all" }: { initialSite?: string }) {
  const org = useOrg();
  const t = useTranslations("Live");
  const tj = useTranslations("Data.jobs");
  const router = useRouter();
  const toast = useToast();
  const { role, siteIds, perms, me } = useAccess();
  const today = useRuledRecords(useData((s) => s.today));
  const updateRecord = useData((s) => s.updateRecord);

  const [site, setSite] = useState(initialSite);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [paused, setPaused] = useState(false);
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [dialog, setDialog] = useState<{ id: number; kind: "in" | "out" } | null>(null);

  const feed = useBoardFeed(siteIds, paused, (f) => toast(t("flagToast", { name: f.name, distance: f.distance, site: f.siteName }), "bad"));

  const records = useMemo(() => today.filter((r) => siteIds.includes(r.site)), [today, siteIds]);
  const inSite = site === "all" ? records : records.filter((r) => r.site === site);
  const q = query.trim().toLowerCase();
  const searched = q ? inSite.filter((r) => r.name.toLowerCase().includes(q) || tj(r.job).toLowerCase().includes(q)) : inSite;
  const sites = sitesIn(siteIds, org);
  const shownSites = site === "all" ? sites : sites.filter((s) => s.id === site);

  const sections = shownSites
    .map((s) => {
      const rows = searched.filter((r) => r.site === s.id && matchesFilter(r, filter)).sort((a, b) => PRESENCE_ORDER[presenceOf(a)] - PRESENCE_ORDER[presenceOf(b)]);
      const expected = records.filter((r) => r.site === s.id && r.status !== "leave").length;
      const present = records.filter((r) => r.site === s.id && presenceOf(r) === "present").length;
      return { site: s, rows, expected, present };
    })
    .filter((sec) => sec.rows.length > 0 || (!q && filter === "all"));

  const selectedIds = [...selected].filter((id) => records.some((r) => r.id === id));
  const selectedRecords = records.filter((r) => selectedIds.includes(r.id));
  const dialogRecord = dialog ? (records.find((r) => r.id === dialog.id) ?? null) : null;

  const toggle = (id: number) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const rowProps = (r: AttendanceRecord) => {
    const p = presenceOf(r);
    return {
      record: r,
      selected: selected.has(r.id),
      fresh: feed.isFresh(r.id),
      canIn: perms.behalf && (p === "not" || p === "absent"),
      canOut: perms.behalf && p === "present",
      nowMinutes: feed.nowMinutes,
      jobLabel: tj(r.job as JobKey),
      onToggle: () => toggle(r.id),
      onCheckIn: () => setDialog({ id: r.id, kind: "in" }),
      onCheckOut: () => setDialog({ id: r.id, kind: "out" }),
      onView: () => router.push(`/attendance?drawer=${r.id}&date=today`),
      onCall: () => toast(t("calling", { name: r.name, phone: `${org.siteById(r.site).phone} ${10 + r.id}` }), "info"),
    };
  };

  const confirmProxy = (result: ProxyCheckResult) => {
    const r = dialogRecord;
    if (!r) return;
    const method = role === "admin" ? "admin" : "behalf";
    if (result.kind === "in") {
      const late = parseTime(result.time) > parseTime(r.sched.split("–")[0]) + 10;
      updateRecord(r.id, { in: result.time, method, status: late ? "late" : "ontime", proxyBy: me.name, worked: "0m" });
      toast(t("checkedInToast", { name: r.name, time: result.time }));
    } else {
      const early = parseTime(result.time) < parseTime(r.sched.split("–")[1]) - 15;
      const status = r.status === "flagged" ? "flagged" : r.status === "missing" ? "ontime" : early ? "early" : r.status;
      updateRecord(r.id, { out: result.time, status, proxyBy: me.name });
      toast(t("checkedOutToast", { name: r.name, time: result.time }));
    }
    feed.markFresh(r.id);
    setDialog(null);
  };

  const bulkRemind = () => {
    const count = selectedRecords.filter((r) => ["not", "present"].includes(presenceOf(r))).length;
    setSelected(new Set());
    toast(t("bulk.reminded", { count }));
  };
  const bulkAbsent = () => {
    const targets = selectedRecords.filter((r) => presenceOf(r) === "not");
    targets.forEach((r) => updateRecord(r.id, { status: "absent" }));
    const skipped = selectedRecords.length - targets.length;
    setSelected(new Set());
    toast(`${t("bulk.markedAbsent", { count: targets.length })}${skipped ? ` · ${t("bulk.skipped", { count: skipped })}` : ""}`, targets.length ? "bad" : "info");
  };

  return (
    <div className={cn("flex flex-col gap-4", selectedIds.length > 0 && "pb-[72px]")}>
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="m-0 text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <div className="mt-1.5 flex items-center gap-2 text-[13.5px] text-text-2">
            <span className={cn("size-2 flex-none rounded-full", paused ? "bg-[#97A1B0]" : "animate-pulse-ring bg-[#22C55E]")} />
            <span>{t("subtitle", { state: paused ? t("paused") : t("live"), time: feed.nowLabel, count: records.length })}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaused((p) => !p)}
            className="flex h-[34px] items-center gap-1.5 rounded-[9px] border border-solid border-border-strong bg-surface px-3 text-[13px] font-medium text-text"
          >
            {paused ? <Play size={13} /> : <Pause size={13} />}
            {paused ? t("resume") : t("pause")}
          </button>
          <select
            value={site}
            onChange={(e) => setSite(e.target.value)}
            aria-label={t("allSites")}
            className="h-9 cursor-pointer rounded-[9px] border border-solid border-border-strong bg-surface px-2.5 text-[13px] font-medium text-text"
          >
            <option value="all">{t("allSites")}</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2.5">
        {COUNTERS.map(({ key, filter: f, dot }) => (
          <button
            key={key}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cn(
              "flex cursor-pointer flex-col gap-1.5 rounded-xl border border-solid bg-surface px-3.5 py-3 text-left shadow-card",
              filter === f ? "border-accent shadow-[0_0_0_3px_var(--accent-soft)]" : "border-border",
            )}
          >
            <span className="flex items-center gap-[7px] whitespace-nowrap text-[12.5px] font-medium text-text-2">
              <span className="size-2 rounded-full" style={{ background: dot }} />
              {t(`counters.${key}`)}
            </span>
            <span className="text-[26px] font-semibold tracking-tight tabular-nums">{countFor(inSite, key)}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-3 shadow-card">
        <label className="flex h-[34px] flex-[0_1_240px] items-center gap-2 rounded-lg border border-solid border-border px-2.5 text-text-3">
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-text outline-0"
          />
        </label>
        <div className="flex flex-1 flex-wrap gap-1.5">
          {CHIPS.map(({ filter: f, dot }) => {
            const count = f === "all" ? searched.length : f === "flagged" ? searched.filter(isFlagged).length : searched.filter((r) => presenceOf(r) === f).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={cn(
                  "flex h-[30px] items-center gap-1.5 whitespace-nowrap rounded-full border border-solid px-2.5 text-[12.5px] font-medium",
                  filter === f ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-text-2",
                )}
              >
                {dot && <span className="size-[7px] rounded-full" style={{ background: dot }} />}
                {t(`chips.${f}`)}
                <span className="font-mono text-[11.5px] opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
        <div role="group" aria-label={t("view")} className="flex gap-0.5 rounded-[9px] border border-border bg-surface-2 p-[3px]">
          {([["list", List], ["grid", LayoutGrid]] as const).map(([k, Icon]) => (
            <button
              key={k}
              onClick={() => setView(k)}
              aria-pressed={view === k}
              title={t(k)}
              aria-label={t(k)}
              className={cn("grid h-7 w-[34px] place-items-center rounded-md border-0", view === k ? "bg-surface text-text shadow-[0_1px_2px_rgb(0_0_0/0.1)]" : "bg-transparent text-text-3")}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
      </div>

      {sections.map(({ site: s, rows, expected, present }) => {
        const isClosed = !!closed[s.id];
        const health = FENCE_HEALTH[s.id] ?? "ok";
        const fence =
          health === "bad" ? t("fence.flags") : health === "warn" ? t("fence.lowGps") : s.geofence.kind === "circle" ? t("fence.circle", { radius: s.geofence.radius }) : t("fence.polygon");
        const ids = rows.map((r) => r.id);
        const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
        return (
          <section key={s.id} className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
            <div className={cn("flex flex-wrap items-center gap-3 px-4 py-3", !isClosed && "border-b border-border")}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() =>
                  setSelected((prev) => {
                    const next = new Set(prev);
                    ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
                    return next;
                  })
                }
                aria-label={t("selectAll", { site: s.name })}
                className="m-0 size-4 flex-none cursor-pointer accent-accent"
              />
              <button
                onClick={() => setClosed((c) => ({ ...c, [s.id]: !c[s.id] }))}
                aria-expanded={!isClosed}
                className="flex min-w-0 items-center gap-2.5 border-0 bg-transparent p-0 text-left text-text"
              >
                <ChevronRight size={16} className={cn("text-text-3 transition-transform", !isClosed && "rotate-90")} />
                <span>
                  <span className="block text-[15px] font-semibold">{s.name}</span>
                  <span className="block text-[12px] text-text-3">
                    {org.branchOfSite(s.id).name} · {s.address}
                  </span>
                </span>
              </button>
              <span className="flex items-center gap-[7px] text-[12.5px] text-text-2">
                <Avatar name={s.manager} size={24} />
                {s.manager}
              </span>
              <span className={cn("inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-[9px] text-[12px] font-medium", FENCE_TONE[health])}>
                <span className={cn("size-1.5 rounded-full", FENCE_DOT[health])} />
                {fence}
              </span>
              <div className="flex-1" />
              <div className="flex min-w-[170px] items-center gap-2.5">
                <div className="h-1.5 flex-1 overflow-hidden rounded-md bg-neutral-bg">
                  <div className="h-full rounded-md bg-ok-dot transition-[width] duration-500" style={{ width: `${expected ? (present / expected) * 100 : 0}%` }} />
                </div>
                <span className="whitespace-nowrap font-mono text-[12.5px] font-medium text-text-2">
                  {present}/{expected} {t("presentShort")}
                </span>
              </div>
            </div>

            {!isClosed && rows.length > 0 && view === "list" && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1040px] border-collapse text-[13.5px]">
                  <thead>
                    <tr className="bg-surface-2 text-left text-[12px] text-text-3">
                      <th className="w-11 border-b border-border py-2 pl-4 pr-0" />
                      {(["employee", "scheduled", "checkIn", "checkOut", "status", "method", "distance"] as const).map((c) => (
                        <th key={c} className="border-b border-border px-3 py-2 font-medium first:pl-0">
                          {t(`columns.${c}`)}
                        </th>
                      ))}
                      <th className="border-b border-border py-2 pl-3 pr-4 text-right font-medium">{t("columns.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <ListRow key={r.id} {...rowProps(r)} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!isClosed && rows.length > 0 && view === "grid" && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3 px-4 pb-4 pt-3.5">
                {rows.map((r) => (
                  <GridCard key={r.id} {...rowProps(r)} />
                ))}
              </div>
            )}

            {!isClosed && rows.length === 0 && <div className="px-4 py-[22px] text-center text-[13px] text-text-3">{t("noMatch")}</div>}
          </section>
        );
      })}

      {sections.length === 0 && (
        <EmptyState
          title={t("emptyTitle")}
          hint={t("emptyHint")}
          action={
            <button
              onClick={() => {
                setFilter("all");
                setQuery("");
                setSite("all");
              }}
              className="h-[34px] rounded-[9px] border border-solid border-border-strong bg-surface px-3 text-[13px] font-medium text-text"
            >
              {t("clearFilters")}
            </button>
          }
        />
      )}

      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-[35] flex -translate-x-1/2 items-center gap-2.5 rounded-xl bg-text py-2 pl-4 pr-2 text-surface shadow-pop">
          <span className="text-[13.5px] font-semibold">{t("bulk.selected", { count: selectedIds.length })}</span>
          <span className="h-5 w-px bg-white/20" />
          <button onClick={bulkRemind} className="h-8 rounded-lg border-0 bg-white/10 px-3 text-[13px] font-medium text-inherit">
            {t("bulk.remind")}
          </button>
          {perms.edit && (
            <button onClick={bulkAbsent} className="h-8 rounded-lg border-0 bg-bad-dot px-3 text-[13px] font-medium text-white">
              {t("bulk.markAbsent")}
            </button>
          )}
          <button onClick={() => setSelected(new Set())} title={t("bulk.clear")} aria-label={t("bulk.clear")} className="grid size-8 place-items-center rounded-lg border-0 bg-transparent text-inherit">
            <X size={16} />
          </button>
        </div>
      )}

      <ProxyCheckDialog
        record={dialogRecord}
        kind={dialog?.kind ?? "in"}
        defaultTime={feed.nowLabel}
        actor={me.name}
        asAdmin={role === "admin"}
        onCancel={() => setDialog(null)}
        onConfirm={confirmProxy}
      />
    </div>
  );
}

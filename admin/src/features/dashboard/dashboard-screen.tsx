"use client";

import { Building2, GitBranch, MapPin, RefreshCw, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { DEMO_TODAY } from "@/data/live";
import { lateShiftBySite, useAttendanceRules } from "@/lib/attendance-rules";
import { useOrg } from "@/lib/org";
import { sitesIn } from "@/lib/scope";
import { cn } from "@/lib/utils";
import { useData } from "@/store/data";
import { useAccess } from "@/store/use-access";
import { pendingIn, useLeave } from "@/store/leave";
import { ActivityCard } from "./activity-card";
import { AttentionPanel } from "./attention-panel";
import { DatePicker } from "./date-picker";
import { KpiCards, type Kpi } from "./kpi-cards";
import { LiveMapCard } from "./live-map-card";
import { MethodsCard } from "./methods-card";
import { NewCompanyView } from "./new-company-view";
import { kpiDelta, methodCounts, punctuality, siteDay, sumBy, trendSeries } from "./metrics";
import { PunctualityCard, type PunctualityGroup } from "./punctuality-card";
import { TrendCard, type TrendRange } from "./trend-card";
import { useLiveFeed } from "./use-live-feed";
import { useSettings } from "@/store/settings";

const SCOPE_ICON: Record<string, { icon: LucideIcon; chip: string }> = {
  company: { icon: Building2, chip: "bg-neutral-bg text-text" },
  branch: { icon: GitBranch, chip: "bg-violet-bg text-violet" },
  site: { icon: MapPin, chip: "bg-accent-soft text-accent" },
};

export function DashboardScreen({ isNew = false, initialSite = null }: { isNew?: boolean; initialSite?: string | null }) {
  const org = useOrg();
  const t = useTranslations("Dashboard");
  const tk = useTranslations("Dashboard.kpi");
  const { role, scope, siteIds, perms, me } = useAccess();
  const companyName = useSettings((st) => st.values.name);
  const leaveRequests = useLeave((s) => s.requests);

  const [day, setDay] = useState(DEMO_TODAY);
  const [paused, setPaused] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [pinOpen, setPinOpen] = useState<string | null>(initialSite);
  const [range, setRange] = useState<TrendRange>(7);
  const [by, setBy] = useState<PunctualityGroup>("branch");
  const spinTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(spinTimer.current), []);

  const isToday = day === DEMO_TODAY;
  const feed = useLiveFeed(!isNew, isToday && !paused, siteIds);

  const rules = useAttendanceRules();
  const todayRecords = useData((s) => s.today);
  const lateShift = useMemo(() => lateShiftBySite(todayRecords, rules), [todayRecords, rules]);
  const rows = useMemo(() => sitesIn(siteIds, org).map((s) => siteDay(s, day, lateShift[s.id] ?? 0)), [siteIds, day, org, lateShift]);
  const expected = sumBy(rows, "expected");
  const present = sumBy(rows, "present");
  const pending = pendingIn(leaveRequests, siteIds).length;
  const trend = useMemo(() => trendSeries(rows, day, range), [rows, day, range]);
  const methods = useMemo(() => methodCounts(rows), [rows]);
  const canGroup = scope.kind === "company";
  const punct = useMemo(() => punctuality(rows, canGroup ? by : "site", org), [rows, by, canGroup, org]);

  if (isNew) return <NewCompanyView firstName={me.name.split(" ")[0]} />;

  const kpi = (key: Kpi["key"], value: number, polarity: "up" | "down" | "neutral", dot: string, href: string, suffix?: string): Kpi => ({
    key, value, dot, href, suffix, label: key === "expected" ? tk(isToday ? "expected" : "expectedPast") : key === "present" ? tk(isToday ? "present" : "presentPast") : tk(key),
    delta: kpiDelta(key as "expected", value, expected, day, polarity),
  });
  const kpis: Kpi[] = [
    kpi("expected", expected, "neutral", "var(--neutral-dot)", "/attendance?status=all"),
    kpi("present", present, "up", "var(--ok-dot)", "/attendance?status=ontime", `${Math.round((present / expected) * 100)}%`),
    kpi("late", sumBy(rows, "late"), "down", "var(--warn-dot)", "/attendance?status=late"),
    kpi("absent", sumBy(rows, "absent"), "down", "var(--bad-dot)", "/attendance?status=absent"),
    kpi("leave", sumBy(rows, "leave"), "neutral", "var(--info-dot)", "/attendance?status=leave"),
    kpi("flagged", sumBy(rows, "flagged"), "down", "var(--bad-dot)", "/attendance?status=flagged"),
    kpi("pending", pending, "down", "var(--warn-dot)", "/leave?tab=pending"),
  ];

  const branch = scope.kind === "branch" ? org.branchById(scope.id ?? "") : undefined;
  const scopedSite = scope.kind === "site" ? rows[0] : undefined;
  const scopeLabel =
    scope.kind === "company"
      ? t("scope.company", { company: companyName })
      : scope.kind === "branch"
        ? t("scope.branch", { branch: branch?.name ?? "" })
        : t("scope.site", { site: scopedSite?.name ?? "", branch: org.branchById(scopedSite?.branchId ?? "")?.name ?? "" });
  const { icon: ScopeIcon, chip } = SCOPE_ICON[scope.kind];

  const ago = feed.tick - feed.refreshedAt;
  const liveOn = isToday && !paused;
  const agoText = spinning ? t("live.refreshing") : paused ? t("live.paused") : ago < 5 ? t("live.justNow") : t("live.ago", { seconds: ago });

  const refresh = () => {
    if (!isToday) return;
    setSpinning(true);
    clearTimeout(spinTimer.current);
    spinTimer.current = setTimeout(() => {
      setSpinning(false);
      feed.refresh();
    }, 600);
  };

  return (
    <div className="flex flex-col gap-[18px]" data-role={role}>
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div className="min-w-0">
          <h1 className="m-0 text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex h-[26px] items-center gap-[7px] rounded-full px-2.5 text-[12.5px] font-semibold", chip)}>
              <ScopeIcon size={13} />
              {scopeLabel}
            </span>
            <span className="text-[13px] text-text-3">{t("scope.meta", { sites: rows.length, employees: expected })}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={refresh}
            title={t("live.refresh")}
            className={cn(
              "flex h-9 items-center gap-2 rounded-[9px] border border-solid px-3 text-[12.5px] font-semibold",
              liveOn ? "border-[rgb(34_197_94/0.35)] bg-ok-bg text-ok" : "border-border bg-surface text-text-2",
            )}
          >
            <span className={cn("size-2 flex-none rounded-full", liveOn ? "animate-pulse-ring bg-[#22C55E]" : "bg-[#97A1B0]")} />
            <span>{isToday ? (paused ? t("live.pausedLabel") : t("live.label")) : t("live.final")}</span>
            <span className="font-normal opacity-80">· {isToday ? agoText : t("live.dayClosed")}</span>
            {isToday && <RefreshCw size={13} className={cn(spinning && "animate-spin-fast")} />}
          </button>
          <DatePicker day={day} onChange={(d) => { setDay(d); setPinOpen(null); }} />
        </div>
      </div>

      <KpiCards items={kpis} />

      <div className="flex flex-wrap items-stretch gap-4">
        <LiveMapCard rows={rows} selectedId={pinOpen} onSelect={setPinOpen} />
        <AttentionPanel siteIds={siteIds} perms={perms} />
      </div>

      <div className="flex flex-wrap items-stretch gap-4">
        <TrendCard points={trend.points} average={trend.average} delta={trend.delta} range={range} onRange={setRange} />
        <MethodsCard shares={methods} day={day} />
      </div>

      <div className="flex flex-wrap items-stretch gap-4">
        <PunctualityCard rows={punct} by={canGroup ? by : "site"} canGroup={canGroup} day={day} onBy={setBy} />
        <ActivityCard day={day} siteIds={siteIds} live={feed.events} tick={feed.tick} paused={paused} onTogglePause={() => setPaused((p) => !p)} />
      </div>
    </div>
  );
}

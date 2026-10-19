"use client";

import { CalendarCheck, CalendarX, Check, LogOut, ShieldAlert, UserX, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { UNCOVERED, UNSCHEDULED } from "@/data/live";
import { useOrg } from "@/lib/org";
import { RejectLeaveDialog } from "@/features/leave/reject-leave-dialog";
import { useLeaveFormat } from "@/features/leave/use-leave-format";
import { cn } from "@/lib/utils";
import { useData } from "@/store/data";
import { pendingIn, useLeave } from "@/store/leave";
import { useAccess as useAccessStore } from "@/store/use-access";
import type { Permissions } from "@/types/auth";
import { useLeaveTypes } from "@/features/leave/use-leave-types";
import { useRuledRecords } from "@/lib/attendance-rules";

type AttentionType = "fraud" | "missing" | "unsched" | "leave" | "uncov";
type TabKey = "all" | AttentionType;

interface Action {
  label: string;
  primary?: boolean;
  run: () => void;
}
interface Item {
  id: string;
  type: AttentionType;
  title: string;
  description: string;
  time: string;
  actions: Action[];
}

const STYLE: Record<AttentionType, { icon: LucideIcon; box: string }> = {
  fraud: { icon: ShieldAlert, box: "bg-bad-bg text-bad" },
  missing: { icon: LogOut, box: "bg-orange-bg text-orange" },
  unsched: { icon: CalendarX, box: "bg-violet-bg text-violet" },
  leave: { icon: CalendarCheck, box: "bg-info-bg text-info" },
  uncov: { icon: UserX, box: "bg-warn-bg text-warn" },
};
const TABS: TabKey[] = ["all", "fraud", "missing", "unsched", "leave", "uncov"];

export function AttentionPanel({ siteIds, perms }: { siteIds: string[]; perms: Permissions }) {
  const org = useOrg();
  const t = useTranslations("Dashboard.attention");
  const leaveTypes = useLeaveTypes();
  const tData = useTranslations("Data.interventions");
  const router = useRouter();
  const toast = useToast();
  const leaveFormat = useLeaveFormat();
  const today = useRuledRecords(useData((s) => s.today));
  const leaveRequests = useLeave((s) => s.requests);
  const handled = useData((s) => s.handled);
  const updateRecord = useData((s) => s.updateRecord);
  const decide = useLeave((s) => s.decide);
  const { me } = useAccessStore();
  const markHandled = useData((s) => s.markHandled);
  const [tab, setTab] = useState<TabKey>("all");
  const [rejecting, setRejecting] = useState<string | null>(null);

  const items = useMemo<Item[]>(() => {
    const list: Item[] = [];
    const inScope = today.filter((r) => siteIds.includes(r.site));
    const siteName = (id: string) => org.siteById(id).name;
    const view = (href: string): Action => ({ label: t("view"), run: () => router.push(href) });

    inScope
      .filter((r) => r.flag && !r.cleared && !r.fraud)
      .forEach((r) =>
        list.push({
          id: `f${r.id}`, type: "fraud", title: t("fraud.title", { name: r.name }),
          description: `${r.flag === "dist" ? t("fraud.distance", { distance: r.dist ?? "" }) : t("fraud.mock")} · ${siteName(r.site)}`,
          time: r.in,
          actions: perms.review
            ? [
                { label: t("review"), primary: true, run: () => router.push(`/attendance?drawer=${r.id}&date=today`) },
                {
                  label: t("dismiss"),
                  run: () => {
                    updateRecord(r.id, { cleared: true, status: r.lateBy ? "late" : "ontime" });
                    toast(t("fraud.dismissed"));
                  },
                },
              ]
            : [view(`/attendance?drawer=${r.id}&date=today`)],
        }),
      );

    inScope
      .filter((r) => r.status === "missing")
      .forEach((r) =>
        list.push({
          id: `m${r.id}`, type: "missing", title: t("missing.title", { name: r.name }),
          description: `${t("missing.description", { time: r.sched.split("–")[1] })} · ${siteName(r.site)}`,
          time: "06:15",
          actions: [
            ...(perms.edit
              ? [{
                  label: t("missing.setOut"), primary: true,
                  run: () => {
                    updateRecord(r.id, { out: "06:00", status: "ontime", worked: "8h 05m" });
                    toast(t("missing.done", { name: r.name }));
                  },
                }]
              : []),
            { label: t("remind"), run: () => { markHandled(`m${r.id}`); toast(t("reminderSent")); } },
          ],
        }),
      );

    UNSCHEDULED.filter((u) => siteIds.includes(u.site)).forEach((u) =>
      list.push({
        id: `s${u.id}`, type: "unsched", title: t("unsched.title", { name: u.name }),
        description: `${t("unsched.description")} · ${siteName(u.site)}`, time: u.time,
        actions: perms.edit
          ? [
              { label: t("unsched.add"), primary: true, run: () => { markHandled(`s${u.id}`); toast(t("unsched.added", { name: u.name })); } },
              { label: t("reject"), run: () => { markHandled(`s${u.id}`); toast(t("unsched.rejected"), "bad"); } },
            ]
          : [view("/attendance")],
      }),
    );

    pendingIn(leaveRequests, siteIds).forEach((l) =>
        list.push({
          id: `l-${l.id}`, type: "leave", title: t("leave.title", { name: l.name }),
          description: `${leaveTypes.label(l.type)} · ${leaveFormat.range(l.from, l.to)} · ${siteName(l.site)}`,
          time: leaveFormat.submitted(l.submitted),
          actions: perms.approve
            ? [
                { label: t("approve"), primary: true, run: () => { decide([l.id], "approve", me.name); toast(t("leave.approved", { name: l.name })); } },
                { label: t("reject"), run: () => setRejecting(l.id) },
              ]
            : [view("/leave")],
        }),
      );

    UNCOVERED.filter((u) => siteIds.includes(u.site)).forEach((u) =>
      list.push({
        id: `u${u.id}`, type: "uncov", title: t("uncov.title"),
        description: `${tData(u.kind)} · ${siteName(u.site)}`,
        time: u.time === "yesterday" ? t("yesterday") : u.time,
        actions: [
          { label: t("uncov.assign"), primary: true, run: () => router.push("/schedules") },
          { label: t("uncov.notify"), run: () => { markHandled(`u${u.id}`); toast(t("uncov.notified")); } },
        ],
      }),
    );
    return list.filter((i) => !handled[i.id]);
  }, [today, leaveRequests, handled, siteIds, perms, t, leaveTypes, tData, router, toast, leaveFormat, updateRecord, decide, me.name, markHandled, org]);

  const visibleTabs = TABS.filter((k) => k === "all" || k === tab || items.some((i) => i.type === k));
  const shown = tab === "all" ? items : items.filter((i) => i.type === tab);

  return (
    <section className="flex max-h-[560px] min-w-0 flex-[1_1_360px] flex-col rounded-xl border border-border bg-surface shadow-card">
      <div className="flex flex-col gap-2.5 px-[18px] pb-2.5 pt-4">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold">{t("title")}</span>
          <span className="rounded-full bg-bad-bg px-2 py-px text-[12px] font-semibold text-bad">{items.length}</span>
        </div>
        <div className="flex flex-wrap gap-1.5" role="tablist">
          {visibleTabs.map((k) => {
            const count = k === "all" ? items.length : items.filter((i) => i.type === k).length;
            const on = tab === k;
            return (
              <button
                key={k}
                role="tab"
                aria-selected={on}
                onClick={() => setTab(k)}
                className={cn(
                  "flex h-[26px] items-center gap-[5px] whitespace-nowrap rounded-full border border-solid px-[9px] text-[12px] font-medium",
                  on ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-text-2",
                )}
              >
                {t(`tabs.${k}`)}
                <span className="font-mono text-[11px] opacity-75">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto border-t border-border">
        {shown.map((item) => {
          const { icon: Icon, box } = STYLE[item.type];
          return (
            <div key={item.id} className="flex gap-3 border-b border-border px-[18px] py-3">
              <span className={cn("grid size-8 flex-none place-items-center rounded-[9px]", box)}>
                <Icon size={16} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="flex-1 text-[13.5px] font-semibold">{item.title}</span>
                    <span className="whitespace-nowrap font-mono text-[11.5px] text-text-3">{item.time}</span>
                  </div>
                  <div className="text-[12.5px] text-text-2">{item.description}</div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {item.actions.map((a) => (
                    <button
                      key={a.label}
                      onClick={a.run}
                      className={cn(
                        "h-[30px] whitespace-nowrap rounded-lg border border-solid px-2.5 text-[12.5px] font-medium",
                        a.primary ? "border-accent bg-accent text-white" : "border-border-strong bg-surface text-text",
                      )}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {shown.length === 0 && (
          <div className="px-[18px] py-10 text-center">
            <div className="mx-auto mb-2.5 grid size-10 place-items-center rounded-full bg-ok-bg text-ok">
              <Check size={20} />
            </div>
            <div className="font-semibold">{t("emptyTitle")}</div>
            <div className="text-[12.5px] text-text-3">{t("emptyHint")}</div>
          </div>
        )}
      </div>

      <RejectLeaveDialog leaveId={rejecting} onClose={() => setRejecting(null)} />
    </section>
  );
}

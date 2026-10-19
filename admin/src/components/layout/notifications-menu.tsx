"use client";

import { Bell, CalendarCheck, CalendarX, Check, LogOut, ShieldAlert, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { UNCOVERED } from "@/data/live";
import { useOrg } from "@/lib/org";
import { useLeaveFormat } from "@/features/leave/use-leave-format";
import { usePresence } from "@/lib/use-presence";
import { cn } from "@/lib/utils";
import { useData } from "@/store/data";
import { pendingIn, useLeave } from "@/store/leave";
import { useAccess } from "@/store/use-access";
import { useLeaveTypes } from "@/features/leave/use-leave-types";

type Kind = "fraud" | "leave" | "missing" | "uncov";
const KIND: Record<Kind, { icon: LucideIcon; tile: string }> = {
  fraud: { icon: ShieldAlert, tile: "bg-bad-bg text-bad" },
  leave: { icon: CalendarCheck, tile: "bg-info-bg text-info" },
  missing: { icon: LogOut, tile: "bg-orange-bg text-orange" },
  uncov: { icon: CalendarX, tile: "bg-warn-bg text-warn" },
};

interface Item {
  id: string;
  kind: Kind;
  title: string;
  description: string;
  site: string;
  time: string;
  href: string;
}

export function NotificationsMenu({ open, onToggle, onClose }: { open: boolean; onToggle: () => void; onClose: () => void }) {
  const { mounted, state } = usePresence(open, 120);
  const org = useOrg();
  const t = useTranslations("Shell.notifications");
  const ta = useTranslations("Dashboard.attention");
  const leaveTypes = useLeaveTypes();
  const tData = useTranslations("Data.interventions");
  const router = useRouter();
  const leaveFormat = useLeaveFormat();
  const { siteIds } = useAccess();
  const today = useData((s) => s.today);
  const leaveRequests = useLeave((s) => s.requests);
  const [read, setRead] = useState<Record<string, true>>({ "l-L-2043": true });
  const [tab, setTab] = useState<"all" | "unread">("all");

  const items = useMemo<Item[]>(() => {
    const list: Item[] = [];
    const inScope = today.filter((r) => siteIds.includes(r.site));
    inScope.filter((r) => r.flag && !r.cleared && !r.fraud).forEach((r) =>
      list.push({ id: `f${r.id}`, kind: "fraud", title: `${t("kinds.fraudTitle")} · ${r.name}`, description: r.flag === "dist" ? ta("fraud.distance", { distance: r.dist ?? "" }) : ta("fraud.mock"), site: org.siteById(r.site).name, time: r.in, href: `/attendance?drawer=${r.id}&date=today` }));
    inScope.filter((r) => r.status === "missing").forEach((r) =>
      list.push({ id: `m${r.id}`, kind: "missing", title: `${t("kinds.missingTitle")} · ${r.name}`, description: t("missingDescription", { time: r.sched.split("–")[1] }), site: org.siteById(r.site).name, time: "06:15", href: `/attendance?drawer=${r.id}&date=today` }));
    UNCOVERED.filter((u) => siteIds.includes(u.site)).forEach((u) =>
      list.push({ id: `u${u.id}`, kind: "uncov", title: t("kinds.uncovTitle"), description: tData(u.kind), site: org.siteById(u.site).name, time: u.time === "yesterday" ? ta("yesterday") : u.time, href: "/schedules" }));
    pendingIn(leaveRequests, siteIds).slice(0, 3).forEach((l) =>
      list.push({ id: `l-${l.id}`, kind: "leave", title: `${t("kinds.leaveTitle")} · ${l.name}`, description: `${leaveTypes.label(l.type)} · ${leaveFormat.range(l.from, l.to)}`, site: org.siteById(l.site).name, time: leaveFormat.submitted(l.submitted), href: "/leave?tab=pending" }));
    return list;
  }, [today, leaveRequests, siteIds, t, ta, leaveTypes, tData, leaveFormat, org]);

  const unread = items.filter((n) => !read[n.id]);
  const shown = tab === "unread" ? unread : items;
  const toggleRead = (id: string) => setRead((r) => { const n = { ...r }; if (n[id]) delete n[id]; else n[id] = true; return n; });

  return (
    <div className="relative z-[1]">
      <button onClick={onToggle} title={t("title")} aria-label={t("title")} aria-expanded={open} className={cn("relative grid size-[38px] place-items-center rounded-[10px] border border-solid bg-surface text-text-2 hover:bg-hover", open ? "border-accent" : "border-border")}>
        <Bell size={17} />
        {unread.length > 0 && (
          <span className="absolute -right-[5px] -top-[5px] box-border grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-solid border-surface bg-bad-dot px-[5px] text-[10.5px] font-bold text-white">{unread.length}</span>
        )}
      </button>
      {mounted && (
        <div data-state={state} role="dialog" aria-label={t("title")} className="absolute -right-24 top-[calc(100%+8px)] z-[2] flex w-[400px] max-w-[calc(100vw-24px)] ss-drop flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-pop lg:right-0">
          <div className="flex items-center justify-between gap-2.5 px-4 pt-3.5">
            <span className="text-[15px] font-semibold">{t("title")}</span>
            <button onClick={() => setRead(Object.fromEntries(items.map((n) => [n.id, true])))} disabled={unread.length === 0} className={cn("border-0 bg-transparent py-1 text-[12.5px] font-medium", unread.length ? "text-accent" : "text-text-3")}>{t("markAll")}</button>
          </div>
          <div role="tablist" className="mt-2 flex gap-[18px] border-b border-border px-4">
            {(["all", "unread"] as const).map((k) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("-mb-px flex items-center gap-1.5 border-0 border-b-2 border-solid bg-transparent pb-[9px] pt-2 text-[13px] font-medium", tab === k ? "border-b-accent text-text" : "border-b-transparent text-text-3")}>
                {t(`tabs.${k}`)}
                <span className="rounded-full bg-neutral-bg px-1.5 font-mono text-[11px] text-text-2">{k === "all" ? items.length : unread.length}</span>
              </button>
            ))}
          </div>
          <ul className="m-0 max-h-[400px] list-none overflow-auto p-0">
            {shown.map((n) => {
              const { icon: Icon, tile } = KIND[n.kind];
              const isUnread = !read[n.id];
              return (
                <li key={n.id} className={cn("flex gap-3 border-b border-border px-4 py-3 hover:bg-hover", isUnread && "bg-accent-soft")}>
                  <button onClick={() => { setRead((r) => ({ ...r, [n.id]: true })); router.push(n.href); onClose(); }} className="flex min-w-0 flex-1 gap-3 border-0 bg-transparent p-0 text-left text-text">
                    <span className={cn("grid size-8 flex-none place-items-center rounded-[9px]", tile)}><Icon size={16} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2"><span className={cn("flex-1 text-[13px]", isUnread ? "font-semibold" : "font-medium")}>{n.title}</span><span className="whitespace-nowrap font-mono text-[11.5px] text-text-3">{n.time}</span></span>
                      <span className="mt-px block text-[12.5px] text-text-2">{n.description}</span>
                      <span className="mt-1 flex items-center gap-1.5 text-[11.5px] text-text-3"><span className={cn("rounded-full px-[7px] py-px font-semibold", tile)}>{t(`kinds.${n.kind}`)}</span>{n.site}</span>
                    </span>
                  </button>
                  <button onClick={() => toggleRead(n.id)} title={t(isUnread ? "markRead" : "markUnread")} aria-label={t(isUnread ? "markRead" : "markUnread")} className="grid size-6 flex-none place-items-center self-center rounded-md border-0 bg-transparent p-0 hover:bg-neutral-bg">
                    <span className={cn("box-border size-2 rounded-full border-[1.5px] border-solid", isUnread ? "border-accent bg-accent" : "border-border-strong bg-transparent")} />
                  </button>
                </li>
              );
            })}
            {shown.length === 0 && (
              <li className="px-4 py-9 text-center">
                <div className="mx-auto mb-2.5 grid size-10 place-items-center rounded-full bg-ok-bg text-ok"><Check size={20} /></div>
                <div className="font-semibold">{t("caughtUp")}</div>
                <div className="text-[12.5px] text-text-3">{t("caughtUpHint")}</div>
              </li>
            )}
          </ul>
          <button onClick={() => { router.push("/alerts"); onClose(); }} className="h-[42px] border-0 bg-surface-2 text-[13px] font-semibold text-accent hover:bg-hover">{t("viewAll")}</button>
        </div>
      )}
    </div>
  );
}

"use client";

import { MoreHorizontal } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { useToast } from "@/components/ui/toast";
import { useOrg } from "@/lib/org";
import { cn } from "@/lib/utils";
import { useReports } from "@/store/reports";
import type { SavedReport } from "@/types/reports";

interface Props { onOpen: (r: SavedReport) => void; onSchedule: (r: SavedReport) => void }

export function SavedReports({ onOpen, onSchedule }: Props) {
  const org = useOrg();
  const t = useTranslations("Reports.saved");
  const tType = useTranslations("Reports.types");
  const tRange = useTranslations("Reports.ranges");
  const tFreq = useTranslations("Reports.schedule.freqs");
  const tDay = useTranslations("Reports.schedule.weekdays");
  const tMonth = useTranslations("Reports.schedule.monthDays");
  const tFmt = useTranslations("Reports.export.formats");
  const format = useFormatter();
  const toast = useToast();
  const { saved, remove } = useReports();
  const [asking, setAsking] = useState<string | null>(null);
  const day = (iso: string) => format.dateTime(new Date(iso), { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

  const scope = (r: SavedReport) => [
    r.branches.length ? r.branches.map((id) => org.branches.find((b) => b.id === id)?.name ?? id).join(", ") : t("allBranches"),
    r.sites.length ? t("sitesCount", { count: r.sites.length }) : t("allSites"),
    r.range === "custom" ? t("customDates") : tRange(`${r.range}.label`).toLowerCase(),
  ].join(" · ");
  const schedule = (r: SavedReport) => {
    const s = r.schedule;
    if (!s) return t("notScheduled");
    const when = s.freq === "weekly" ? `${tDay(s.day as "monday").slice(0, 3)} ` : s.freq === "monthly" ? `${tMonth(s.day as "1")} ` : "";
    return `${s.on ? "" : `${t("paused")} · `}${tFreq(s.freq)} · ${when}${s.time} · ${tFmt(s.format)}`;
  };
  const delivery = (r: SavedReport) => (r.delivery.kind === "never" ? t("neverSent") : t(r.delivery.kind === "sent" ? "lastSent" : "nextSend", { date: day(r.delivery.iso) }));

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
      <div className="min-w-[760px]">
        {saved.map((r) => (
          <div key={r.id} className="border-b border-border last:border-b-0">
            <div className="grid grid-cols-[minmax(200px,1.4fr)_140px_minmax(190px,1.2fr)_200px] items-center gap-3 px-[18px] py-[13px] text-[13px]">
              <div className="min-w-0"><div className="font-medium">{r.name}</div><div className="text-[12px] text-text-3">{scope(r)}</div></div>
              <div><span className="rounded-full bg-accent-soft px-[9px] py-[3px] text-[12px] font-medium text-accent">{tType(`${r.type}.name`)}</span></div>
              <div className="flex flex-col gap-0.5"><span className={cn("text-[12.5px] font-medium", r.schedule ? (r.schedule.on ? "text-ok" : "text-warn") : "text-text-3")}>{schedule(r)}</span><span className="text-[12px] text-text-3">{delivery(r)}</span></div>
              <div className="flex justify-end gap-1.5">
                <Button variant="primary" size="sm" onClick={() => onOpen(r)}>{t("open")}</Button>
                <Popover align="right" panelClassName="w-[180px] p-1.5" trigger={({ toggle }) => <button onClick={toggle} aria-label={t("more", { name: r.name })} className="grid size-[30px] place-items-center rounded-lg border border-solid border-border-strong bg-surface text-text-2"><MoreHorizontal size={15} /></button>}>
                  {(close) => (<>
                    <button onClick={() => { close(); onSchedule(r); }} className="block h-[34px] w-full rounded-lg border-0 bg-transparent px-2.5 text-left text-[13px] text-text hover:bg-hover">{t(r.schedule ? "editSchedule" : "scheduleEmail")}</button>
                    <button onClick={() => { close(); setAsking(r.id); }} className="block h-[34px] w-full rounded-lg border-0 bg-transparent px-2.5 text-left text-[13px] text-bad hover:bg-hover">{t("delete")}</button>
                  </>)}
                </Popover>
              </div>
            </div>
            {asking === r.id && (
              <div className="flex items-center gap-2.5 bg-bad-bg px-[18px] py-2.5 text-[13px] text-bad">
                {t("confirmDelete", { name: r.name, scheduled: r.schedule ? "yes" : "no" })}
                <div className="flex-1" />
                <button onClick={() => { remove(r.id); setAsking(null); toast(t("deleted")); }} className="h-7 rounded-lg border-0 bg-bad-dot px-3 text-[12.5px] text-white">{t("delete")}</button>
                <button onClick={() => setAsking(null)} className="h-7 border-0 bg-transparent px-2.5 text-[12.5px] text-bad">{t("cancel")}</button>
              </div>
            )}
          </div>
        ))}
        {saved.length === 0 && <div className="px-4 py-11 text-center text-[13.5px] text-text-3">{t("empty")}</div>}
      </div>
    </div>
  );
}

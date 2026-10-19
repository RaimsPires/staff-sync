"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { useReports } from "@/store/reports";
import type { ReportConfig, ReportSchedule, ReportType, SavedReport } from "@/types/reports";
import { SaveDialog, ScheduleDialog, type ScheduleResult } from "./dialogs";
import { DAY_MS, defaultConfig, REPORTS, WEEKDAYS } from "./model";
import { ReportLibrary } from "./report-library";
import { ReportView } from "./report-view";
import { SavedReports } from "./saved-reports";

const TODAY = Date.UTC(2026, 9, 15);

/** The next planned delivery for a schedule, relative to the demo "today". */
function nextDelivery(s: ReportSchedule): SavedReport["delivery"] {
  const next = s.freq === "daily" ? TODAY + DAY_MS
    : s.freq === "weekly" ? TODAY + (((WEEKDAYS.indexOf(s.day as (typeof WEEKDAYS)[number]) + 1 - new Date(TODAY).getUTCDay() + 7) % 7) || 7) * DAY_MS
    : Date.UTC(2026, 10, 1);
  return { kind: "next", iso: new Date(next).toISOString().slice(0, 10) };
}

export function ReportsScreen() {
  const t = useTranslations("Reports");
  const tType = useTranslations("Reports.types");
  const toast = useToast();
  const { saved, create, update, setSchedule } = useReports();
  const [tab, setTab] = useState<"lib" | "saved">("lib");
  const [config, setConfig] = useState<ReportConfig | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [scheduling, setScheduling] = useState<{ id: string | null } | null>(null);

  const loaded = saved.find((r) => r.id === loadedId) ?? null;
  const openType = (type: ReportType) => { setConfig(defaultConfig(type)); setLoadedId(null); };
  const openSaved = (r: SavedReport) => {
    setConfig({ type: r.type, range: r.range, from: r.from, to: r.to, branches: r.branches, sites: r.sites, emps: r.emps, group: r.group, cols: r.cols });
    setLoadedId(r.id);
  };
  const patch = (p: Partial<ReportConfig>) => setConfig((c) => (c ? { ...c, ...p } : c));

  if (config) {
    const target = scheduling ? saved.find((r) => r.id === scheduling.id) ?? null : null;
    return (
      <>
        <ReportView
          config={config}
          onChange={patch}
          title={`${tType(`${config.type}.name`)}${loaded ? ` · ${loaded.name}` : ""}`}
          onBack={() => { setConfig(null); setLoadedId(null); }}
          onSave={() => setSaving(true)}
          onSchedule={() => setScheduling({ id: loadedId })}
        />
        {saving && (
          <SaveDialog
            initialName={loaded?.name ?? ""}
            updating={!!loaded}
            onClose={() => setSaving(false)}
            onSave={(name) => {
              if (loaded) update(loaded.id, config, name);
              else setLoadedId(create(name, config));
              setSaving(false);
              toast(t("save.saved"));
            }}
          />
        )}
        {scheduling && (
          <ScheduleDialog
            reportName={target?.name ?? null}
            existing={target?.schedule ?? null}
            onClose={() => setScheduling(null)}
            onRemove={() => { if (target) setSchedule(target.id, null, { kind: "never" }); setScheduling(null); toast(t("schedule.removed")); }}
            onSave={({ name, schedule }: ScheduleResult) => {
              if (target) setSchedule(target.id, schedule, nextDelivery(schedule));
              else setLoadedId(create(name, config, schedule, nextDelivery(schedule)));
              setScheduling(null);
              toast(t("schedule.saved", { count: schedule.recipients.length }));
            }}
          />
        )}
      </>
    );
  }

  const target = scheduling ? saved.find((r) => r.id === scheduling.id) ?? null : null;
  return (
    <div className="flex flex-col gap-4">
      <div><h1 className="m-0 text-2xl font-semibold tracking-tight">{t("title")}</h1><p className="mt-1 text-[13.5px] text-text-2">{t("subtitle")}</p></div>
      <Tabs value={tab} onChange={setTab} items={[{ id: "lib", label: `${t("tabs.library")} · ${Object.keys(REPORTS).length}` }, { id: "saved", label: `${t("tabs.saved")} · ${saved.length}` }]} />
      {tab === "lib" ? <ReportLibrary onOpen={openType} /> : <SavedReports onOpen={openSaved} onSchedule={(r) => setScheduling({ id: r.id })} />}
      {scheduling && target && (
        <ScheduleDialog
          reportName={target.name}
          existing={target.schedule}
          onClose={() => setScheduling(null)}
          onRemove={() => { setSchedule(target.id, null, { kind: "never" }); setScheduling(null); toast(t("schedule.removed")); }}
          onSave={({ schedule }) => { setSchedule(target.id, schedule, nextDelivery(schedule)); setScheduling(null); toast(t("schedule.saved", { count: schedule.recipients.length })); }}
        />
      )}
    </div>
  );
}

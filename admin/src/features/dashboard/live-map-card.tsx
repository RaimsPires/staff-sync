"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo } from "react";
import { SitesMap, type SitePin } from "@/components/map/sites-map";
import { Avatar } from "@/components/ui/misc";
import { useOrg } from "@/lib/org";
import { cn } from "@/lib/utils";
import { siteHealth, type SiteDay } from "./metrics";

const TONES = ["ok", "warn", "bad"] as const;
const TONE_VAR = ["var(--ok-dot)", "var(--warn-dot)", "var(--bad-dot)"] as const;

/** "Part-Dieu Tower" -> "Part-Dieu"; "Saint-Denis Hub" -> "Saint-Denis". */
const shortName = (name: string) => name.split(" ")[0];

export function LiveMapCard({
  rows,
  selectedId,
  onSelect,
}: {
  rows: SiteDay[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const org = useOrg();
  const t = useTranslations("Dashboard");
  const pins: SitePin[] = useMemo(
    () =>
      rows.map((r) => ({
        id: r.id,
        position: org.siteById(r.id).position,
        tone: TONES[siteHealth(r)],
        count: `${r.present}/${r.expected}`,
        label: shortName(r.name),
      })),
    [rows, org],
  );
  const selected = rows.find((r) => r.id === selectedId);

  return (
    <section className="flex min-w-0 flex-[1.55_1_520px] flex-col rounded-xl border border-border bg-surface px-[18px] pb-[18px] pt-4 shadow-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[15px] font-semibold">{t("map.title")}</div>
          <div className="text-[12.5px] text-text-3">{t("map.subtitle", { count: rows.length })}</div>
        </div>
        <ul className="m-0 flex list-none gap-3 p-0 text-[12px] text-text-2">
          {(["good", "watch", "risk"] as const).map((k, i) => (
            <li key={k} className="flex items-center gap-[5px]">
              <span className="size-[9px] rounded-full" style={{ background: TONE_VAR[i] }} />
              {t(`map.${k}`)}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-0 min-h-[340px] flex-1 overflow-hidden rounded-[10px] border border-border bg-map-bg">
        <div className="absolute inset-0">
          <SitesMap pins={pins} selectedId={selectedId} onSelect={onSelect} />
        </div>
        {selected && <SitePopup row={selected} onClose={() => onSelect(null)} />}
      </div>
    </section>
  );
}

function SitePopup({ row, onClose }: { row: SiteDay; onClose: () => void }) {
  const org = useOrg();
  const t = useTranslations("Dashboard");
  const site = org.siteById(row.id);
  const branch = org.branches.find((b) => b.id === row.branchId);
  const health = siteHealth(row);
  const pct = Math.round((row.present / row.expected) * 100);

  return (
    <div className="absolute right-[52px] top-3 z-[500] max-h-[calc(100%-24px)] w-[268px] animate-rise overflow-auto rounded-xl border border-border bg-surface shadow-pop">
      <div className="flex items-start gap-2.5 px-3.5 pb-2.5 pt-3.5">
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{row.name}</div>
          <div className="text-[12px] text-text-3">
            {branch?.name} · {row.address.split(", ").pop()}
          </div>
        </div>
        <button onClick={onClose} title={t("close")} aria-label={t("close")} className="grid size-6 place-items-center rounded-md border-0 bg-transparent p-0 text-text-3 hover:bg-hover">
          <X size={14} />
        </button>
      </div>
      <div className="flex items-center gap-2 px-3.5 pb-3">
        <Avatar name={site.manager} size={26} />
        <span className="text-[12.5px]">
          <span className="text-text-3">{t("manager")}</span> <strong className="font-semibold">{site.manager}</strong>
        </span>
      </div>
      <div className="px-3.5 pb-3">
        <div className="mb-1.5 flex justify-between text-[12.5px]">
          <span className="text-text-2">{t("presentLabel")}</span>
          <span className="font-mono text-[12.5px] font-semibold">
            {row.present}/{row.expected} · {pct}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-md bg-neutral-bg">
          <div className="h-full" style={{ width: `${pct}%`, background: TONE_VAR[health] }} />
        </div>
      </div>
      <div className="grid grid-cols-3 border-t border-border">
        {[
          { k: "late", v: row.late, c: "text-warn" },
          { k: "absent", v: row.absent, c: "text-bad" },
          { k: "flagged", v: row.flagged, c: "text-bad" },
        ].map(({ k, v, c }) => (
          <div key={k} className="border-r border-border px-3 py-[9px] last:border-r-0">
            <div className="text-[11px] text-text-3">{t(`kpi.${k}`)}</div>
            <div className={cn("font-semibold", v ? c : "text-text")}>{v}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 rounded-b-xl border-t border-border bg-surface-2 px-3.5 py-2.5">
        <Link
          href={`/attendance?site=${row.id}&date=today`}
          className="flex h-[30px] items-center rounded-lg border border-solid border-border-strong bg-surface px-2.5 text-[12.5px] font-medium text-text no-underline hover:no-underline"
        >
          {t("viewAttendance")}
        </Link>
        <Link
          href={`/sites?site=${row.id}`}
          className="flex h-[30px] items-center rounded-lg border border-solid border-border-strong bg-surface px-2.5 text-[12.5px] font-medium text-text no-underline hover:no-underline"
        >
          {t("openSite")}
        </Link>
      </div>
    </div>
  );
}

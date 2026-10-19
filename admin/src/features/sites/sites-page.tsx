"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useAccess } from "@/store/use-access";
import { useSites } from "@/store/sites";
import { cn } from "@/lib/utils";
import { BranchesScreen } from "./branches-screen";
import { SitesBrowser } from "./sites-browser";

/** "Branches & sites" page: branches on the left tab, every site with its geofence on the right. */
export function SitesPage({ initialView, initialSite }: { initialView: "branches" | "sites"; initialSite?: string }) {
  const t = useTranslations("Sites");
  const [view, setView] = useState(initialView);
  const { role, siteIds } = useAccess();
  const sites = useSites((s) => s.sites);
  const visible = sites.filter((s) => role === "admin" || siteIds.includes(s.id));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="m-0 text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <div className="mt-1 text-[13.5px] text-text-2">{view === "sites" ? t("subtitleSites", { count: visible.length }) : t("subtitleBranches")}</div>
        </div>
        <div role="tablist" className="flex overflow-hidden rounded-[9px] border border-border-strong">
          {(["branches", "sites"] as const).map((k) => <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)} className={cn("h-[34px] border-0 px-4 text-[13px] font-medium", view === k ? "bg-accent text-white" : "bg-surface text-text-2")}>{t(`tabs.${k}`)}</button>)}
        </div>
      </div>
      {view === "branches" ? <BranchesScreen /> : <SitesBrowser initialSelected={initialSite} />}
    </div>
  );
}

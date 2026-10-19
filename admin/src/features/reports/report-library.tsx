"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ReportType } from "@/types/reports";
import { CATEGORIES, REPORTS } from "./model";

export function ReportLibrary({ onOpen }: { onOpen: (type: ReportType) => void }) {
  const t = useTranslations("Reports");
  const tType = useTranslations("Reports.types");
  const tCat = useTranslations("Reports.categories");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const groups = CATEGORIES.map((c) => ({ ...c, types: c.types.filter((k) => !q || tType(`${k}.name`).toLowerCase().includes(q) || tType(`${k}.desc`).toLowerCase().includes(q)) })).filter((c) => c.types.length);

  return (
    <div className="flex flex-col gap-4">
      <label className="flex h-9 max-w-[340px] items-center gap-2 rounded-[9px] border border-solid border-border-strong bg-surface px-3 text-text-3"><Search size={14} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="w-full border-0 bg-transparent text-[13px] text-text outline-0" /></label>
      {groups.map((g) => (
        <section key={g.id} className="flex flex-col gap-2.5">
          <h2 className="m-0 text-[12px] font-semibold uppercase tracking-[.05em] text-text-3">{tCat(g.id)}</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3">
            {g.types.map((k) => (
              <button key={k} onClick={() => onOpen(k)} className="flex cursor-pointer items-start gap-3 rounded-xl border border-solid border-border bg-surface px-4 py-3.5 text-left shadow-card hover:border-accent">
                <span className="grid size-[34px] flex-none place-items-center rounded-[9px] bg-accent-soft text-accent"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={REPORTS[k].icon} /></svg></span>
                <span><span className="block text-[14px] font-semibold text-text">{tType(`${k}.name`)}</span><span className="mt-0.5 block text-[12.5px] leading-[1.4] text-text-3">{tType(`${k}.desc`)}</span></span>
              </button>
            ))}
          </div>
        </section>
      ))}
      {groups.length === 0 && <div className="px-4 py-10 text-center text-[13.5px] text-text-3">{t("noMatch", { query })}</div>}
    </div>
  );
}

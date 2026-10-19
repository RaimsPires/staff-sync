"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BillingSection } from "./billing";
import { DangerSection } from "./danger";
import { FormCard } from "./form-card";
import { IntegrationsSection } from "./integrations";
import { LeaveTypesCard } from "./leave-types";
import { GROUPS, SECTIONS, type SectionId } from "./model";
import { NotificationMatrix } from "./notifications";

export function SettingsScreen({ initialSection = "company" }: { initialSection?: SectionId }) {
  const t = useTranslations("Settings");
  const tNav = useTranslations("Settings.nav");
  const [section, setSection] = useState<SectionId>(initialSection);

  return (
    <div className="flex flex-wrap items-start gap-5">
      <nav aria-label={t("title")} className="flex w-[220px] max-w-full flex-[0_0_220px] flex-col gap-0.5 rounded-xl border border-border bg-surface p-2 shadow-card lg:sticky lg:top-[88px]">
        <div className="px-2.5 pb-1.5 pt-2 text-[11.5px] font-semibold uppercase tracking-[.05em] text-text-3">{t("title")}</div>
        {SECTIONS.map((id) => (
          <button key={id} aria-current={section === id ? "page" : undefined} onClick={() => setSection(id)}
            className={cn("flex h-9 items-center gap-2.5 rounded-lg border-0 px-2.5 text-left text-[13.5px] hover:bg-hover", section === id ? "bg-accent-soft font-semibold text-accent" : id === "danger" ? "bg-transparent font-medium text-bad" : "bg-transparent font-medium text-text")}>
            <span className={cn("size-1.5 rounded-full", section === id ? "bg-accent" : "bg-border-strong")} />{tNav(`${id}.label`)}
          </button>
        ))}
      </nav>
      <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-3.5">
        <div>
          <h1 className="m-0 text-2xl font-semibold tracking-tight">{tNav(`${section}.label`)}</h1>
          <p className="mt-1 text-[13.5px] text-text-2">{tNav(`${section}.desc`)}</p>
        </div>
        {section === "company" && GROUPS.company.map((g) => <FormCard key={g.id} group={g} />)}
        {section === "attendance" && GROUPS.attendance.map((g) => <FormCard key={g.id} group={g} />)}
        {section === "leave" && (<><FormCard group={GROUPS.leave[0]} /><LeaveTypesCard /><FormCard group={GROUPS.leave[1]} /></>)}
        {section === "notif" && <NotificationMatrix />}
        {section === "integ" && (<><FormCard group={GROUPS.payroll[0]} /><IntegrationsSection /></>)}
        {section === "billing" && <BillingSection />}
        {section === "danger" && <DangerSection />}
      </div>
    </div>
  );
}

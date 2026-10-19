"use client";

import { ImagePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { SelectField, TextField } from "@/components/ui/text-field";
import { cn } from "@/lib/utils";
import { COUNTRY_TIMEZONES, INDUSTRIES, SIZES, TIMEZONES } from "../constants";
import { FormCard } from "../form-card";
import { useOnboarding } from "../store";
import { useStepErrors } from "../use-step-errors";

const OFFSET_REFERENCE = new Date(Date.UTC(2026, 9, 19));

/** "Europe/Paris (UTC+2)" for the October reference date. */
function timezoneLabel(zone: string): string {
  const part = new Intl.DateTimeFormat("en", { timeZone: zone, timeZoneName: "shortOffset" })
    .formatToParts(OFFSET_REFERENCE)
    .find((p) => p.type === "timeZoneName")?.value;
  const offset = part?.replace("GMT", "UTC").replace("-", "−") ?? "UTC";
  return `${zone} (${offset === "UTC" ? "UTC+0" : offset})`;
}

export function CompanyStep() {
  const t = useTranslations("Onboarding.company");
  const form = useOnboarding((s) => s.form);
  const set = useOnboarding((s) => s.set);
  const { error } = useStepErrors(3);

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) set("logo", URL.createObjectURL(file));
  };

  const onCountry = (country: string) => {
    set("country", country);
    set("timezone", COUNTRY_TIMEZONES[country] ?? form.timezone);
  };

  return (
    <FormCard>
      <div className="flex items-center gap-4">
        <label className="grid size-[72px] flex-none cursor-pointer place-items-center overflow-hidden rounded-[14px] border-[1.5px] border-dashed border-border-strong bg-surface-2 text-text-3 hover:border-accent">
          <input type="file" accept="image/*" onChange={onLogo} className="hidden" aria-label={t("logoLabel")} />
          {form.logo ? (
            <div
              role="img"
              aria-label={t("logoLabel")}
              className="size-full bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${form.logo})` }}
            />
          ) : (
            <ImagePlus size={22} />
          )}
        </label>
        <div>
          <div className="text-[13.5px] font-medium">
            {t("logoLabel")} <span className="font-normal text-text-3">{t("optional")}</span>
          </div>
          <div className="text-[12.5px] text-text-3">{t("logoHint")}</div>
        </div>
      </div>

      <TextField label={t("name")} value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Batiplus Group" error={error("company")} />

      <SelectField label={t("industry")} value={form.industry} onChange={(e) => set("industry", e.target.value)} error={error("industry")}>
        <option value="">{t("industryPlaceholder")}</option>
        {INDUSTRIES.map((i) => (
          <option key={i} value={i}>
            {t(`industries.${i}`)}
          </option>
        ))}
      </SelectField>

      <div className="flex flex-col gap-1.5" role="group" aria-labelledby="company-size">
        <span id="company-size" className="text-[13px] font-medium">
          {t("size")}
        </span>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => {
            const active = form.size === size;
            return (
              <button
                key={size}
                type="button"
                aria-pressed={active}
                onClick={() => set("size", size)}
                className={cn(
                  "h-9 rounded-[9px] border border-solid px-3.5 text-[13px] font-medium",
                  active
                    ? "border-accent bg-accent-soft text-accent"
                    : cn("bg-surface text-text-2", error("size") ? "border-bad-dot" : "border-border-strong"),
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
        {error("size") && <span className="text-[12.5px] text-bad">{error("size")}</span>}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <SelectField label={t("country")} value={form.country} onChange={(e) => onCountry(e.target.value)}>
          {Object.keys(COUNTRY_TIMEZONES).map((c) => (
            <option key={c} value={c}>
              {t(`countries.${c}`)}
            </option>
          ))}
        </SelectField>
        <SelectField label={t("timezone")} value={form.timezone} onChange={(e) => set("timezone", e.target.value)}>
          {TIMEZONES.map((z) => (
            <option key={z} value={z}>
              {timezoneLabel(z)}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium">
          {t("language")} <span className="font-normal text-text-3">{t("languageHint")}</span>
        </span>
        <div className="flex gap-[3px] self-start rounded-[10px] border border-border bg-surface-2 p-[3px]">
          {(["en", "fr"] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={form.language === l}
              onClick={() => set("language", l)}
              className={cn(
                "h-8 rounded-[7px] border-0 px-4 text-[13px] font-medium",
                form.language === l ? "bg-surface text-text shadow-[0_1px_2px_rgb(0_0_0/0.1)]" : "bg-transparent text-text-2",
              )}
            >
              {t(l === "en" ? "english" : "french")}
            </button>
          ))}
        </div>
      </div>
    </FormCard>
  );
}

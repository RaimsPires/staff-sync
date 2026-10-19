"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { GeofenceMap } from "@/components/map/geofence-map";
import { TextField } from "@/components/ui/text-field";
import { useDebounced } from "@/lib/use-debounced";
import { cn } from "@/lib/utils";
import { searchAddress, type GeocodeResult } from "@/services/geocode";
import { useOnboarding } from "../store";
import { useStepErrors } from "../use-step-errors";
import type { LatLng } from "../types";

export function SiteStep() {
  const t = useTranslations("Onboarding.site");
  const locale = useLocale();
  const form = useOnboarding((s) => s.form);
  const set = useOnboarding((s) => s.set);
  const { error } = useStepErrors(5);
  const [open, setOpen] = useState(false);
  const [focusKey, setFocusKey] = useState(0);

  const query = useDebounced(form.siteAddress.trim(), 450);
  const results = useQuery({
    queryKey: ["geocode", locale, query],
    queryFn: ({ signal }) => searchAddress(query, locale, signal),
    enabled: open && query.length >= 3,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const pick = (r: GeocodeResult) => {
    set("siteAddress", [r.line1, r.line2].filter(Boolean).join(", "));
    set("pin", r.position);
    setFocusKey((k) => k + 1);
    setOpen(false);
  };

  const onMapPick = (position: LatLng) => {
    set("pin", position);
    setOpen(false);
  };

  const [lat, lng] = form.pin;
  const hint = form.radius < 100 ? "tight" : form.radius > 300 ? "wide" : "recommended";
  const addressError = error("siteAddress");

  return (
    <div className="flex flex-wrap overflow-hidden rounded-[14px] border border-border bg-surface shadow-card">
      <div className="box-border flex flex-[1_1_300px] flex-col gap-[18px] p-6">
        <TextField label={t("name")} value={form.siteName} onChange={(e) => set("siteName", e.target.value)} placeholder="Part-Dieu Tower" error={error("siteName")} />

        <div className="relative flex flex-col gap-1.5">
          <label htmlFor="site-address" className="text-[13px] font-medium">
            {t("address")}
          </label>
          <div
            className={cn(
              "flex h-10 items-center gap-2 rounded-[9px] border border-solid bg-surface px-3 text-text-3 focus-within:border-accent",
              addressError ? "border-bad-dot" : "border-border-strong",
            )}
          >
            <Search size={16} />
            <input
              id="site-address"
              value={form.siteAddress}
              onChange={(e) => {
                set("siteAddress", e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder={t("searchAddress")}
              autoComplete="off"
              role="combobox"
              aria-expanded={open}
              aria-controls="site-address-results"
              aria-invalid={!!addressError}
              className="min-w-0 flex-1 border-0 bg-transparent text-[14px] text-text outline-0"
            />
          </div>

          {open && query.length >= 3 && (
            <ul
              id="site-address-results"
              role="listbox"
              className="absolute inset-x-0 top-[70px] z-[1000] m-0 list-none overflow-hidden rounded-[10px] border border-border bg-surface p-0 shadow-pop"
            >
              {results.isFetching && <li className="px-3 py-2.5 text-[13px] text-text-3">{t("searching")}</li>}
              {!results.isFetching && results.isError && <li className="px-3 py-2.5 text-[13px] text-bad">{t("searchFailed")}</li>}
              {!results.isFetching && !results.isError && results.data?.length === 0 && (
                <li className="px-3 py-2.5 text-[13px] text-text-3">{t("noResults")}</li>
              )}
              {!results.isFetching &&
                results.data?.map((r) => (
                  <li key={r.id} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onClick={() => pick(r)}
                      className="flex w-full items-start gap-2.5 border-0 bg-transparent px-3 py-2.5 text-left text-text hover:bg-hover"
                    >
                      <MapPin size={16} className="mt-0.5 flex-none text-text-3" />
                      <span>
                        <span className="block text-[13.5px] font-medium">{r.line1}</span>
                        <span className="block text-[12px] text-text-3">{r.line2}</span>
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          )}
          {addressError && <span className="text-[12.5px] text-bad">{addressError}</span>}
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="site-radius" className="text-[13px] font-medium">
              {t("radius")}
            </label>
            <span className="font-mono text-[15px] font-semibold text-accent">{t("radiusValue", { value: form.radius })}</span>
          </div>
          <input
            id="site-radius"
            type="range"
            min={50}
            max={500}
            step={10}
            value={form.radius}
            onChange={(e) => set("radius", Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between font-mono text-[11px] text-text-3">
            <span>50 m</span>
            <span>500 m</span>
          </div>
        </div>

        <p className="m-0 rounded-[9px] bg-surface-2 px-3 py-2.5 text-[12.5px] text-text-2 text-pretty">{t(`hints.${hint}`)}</p>
      </div>

      <div className="relative z-0 min-h-[360px] flex-[1.4_1_380px] overflow-hidden border-l border-border">
        <div className="absolute inset-0">
          <GeofenceMap pin={form.pin} radius={form.radius} onPick={onMapPick} focusKey={focusKey} />
        </div>
        <div className="pointer-events-none absolute left-3.5 top-3.5 z-[500] flex items-center gap-[7px] rounded-[9px] border border-border bg-surface px-[11px] py-[7px] text-[12.5px] text-text-2 shadow-card">
          <MapPin size={14} /> {t("mapHint")}
        </div>
        <div className="pointer-events-none absolute bottom-6 right-3.5 z-[500] rounded-lg border border-border bg-surface px-2.5 py-1.5 font-mono text-[11.5px] font-medium text-text-2">
          {lat.toFixed(5)}° N, {lng.toFixed(5)}° E
        </div>
      </div>
    </div>
  );
}

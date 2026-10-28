"use client";

import { AsYouType } from "libphonenumber-js";
import { Check, ChevronDown, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { FALLBACK_COUNTRY, flagOf, listCountries, searchCountries, splitPhone, toE164, type CountryCode } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { Popover } from "./popover";
import { controlClass, FieldShell } from "./text-field";

interface PhoneFieldProps {
  label: React.ReactNode;
  /** The number in international form (`+237695681690`), or "" when empty. */
  value: string;
  /** Called with the international form, or "" when no digits are typed. */
  onChange: (value: string) => void;
  error?: string;
  /** Country shown while the field is empty. */
  defaultCountry?: CountryCode;
  placeholder?: string;
}

/** A phone number with a searchable country selector (flag and dialling code) in front of the local digits. */
export function PhoneField({ label, value, onChange, error, defaultCountry = FALLBACK_COUNTRY, placeholder }: PhoneFieldProps) {
  const t = useTranslations("Common.phone");
  const locale = useLocale();
  const countries = useMemo(() => listCountries(locale), [locale]);
  const initial = splitPhone(value, defaultCountry);
  const [country, setCountry] = useState<CountryCode>(initial.country);
  const [digits, setDigits] = useState(initial.national);
  const emitted = useRef(value);

  // The form was reset or filled from outside (for example "add another"): follow it.
  useEffect(() => {
    if (value === emitted.current) return;
    emitted.current = value;
    const next = splitPhone(value, defaultCountry);
    setCountry(next.country);
    setDigits(next.national);
  }, [value, defaultCountry]);

  const emit = (c: CountryCode, d: string) => {
    const e164 = toE164(c, d);
    emitted.current = e164;
    onChange(e164);
  };

  const current = countries.find((c) => c.code === country);
  // Local digits shown the way people write them in that country (spaces added as they type).
  const shown = digits ? new AsYouType(country).input(digits) : "";

  const type = (raw: string) => {
    if (raw.trim().startsWith("+")) {
      // A pasted international number picks its own country.
      const next = splitPhone(raw.replace(/[^\d+]/g, ""), country);
      setCountry(next.country);
      setDigits(next.national);
      emit(next.country, next.national);
      return;
    }
    const only = raw.replace(/\D/g, "");
    setDigits(only);
    emit(country, only);
  };

  return (
    <FieldShell label={label} error={error}>
      {({ id, invalid, describedBy }) => (
        <div className="flex">
          <Popover
            panelClassName="w-[300px] p-2"
            trigger={({ toggle, open }) => (
              <button
                type="button"
                onClick={toggle}
                aria-label={t("selectCountry")}
                aria-expanded={open}
                className={cn(
                  "flex h-10 items-center gap-1.5 rounded-l-[9px] rounded-r-none border border-r-0 border-solid bg-surface px-2.5 text-[14px] text-text hover:bg-hover",
                  invalid ? "border-bad-dot" : "border-border-strong",
                )}
              >
                <span aria-hidden className="text-[17px] leading-none">{flagOf(country)}</span>
                <span className="font-medium">{current?.dial}</span>
                <ChevronDown size={14} className="text-text-3" />
              </button>
            )}
          >
            {(close) => (
              <CountryList
                countries={countries}
                selected={country}
                onPick={(c) => {
                  setCountry(c);
                  emit(c, digits);
                  close();
                }}
              />
            )}
          </Popover>
          <input
            id={id}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={shown}
            onChange={(e) => type(e.target.value)}
            placeholder={placeholder}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={cn(controlClass(invalid), "rounded-l-none")}
          />
        </div>
      )}
    </FieldShell>
  );
}

function CountryList({ countries, selected, onPick }: { countries: ReturnType<typeof listCountries>; selected: CountryCode; onPick: (c: CountryCode) => void }) {
  const t = useTranslations("Common.phone");
  const [query, setQuery] = useState("");
  const rows = useMemo(() => searchCountries(countries, query), [countries, query]);
  return (
    <div className="flex flex-col gap-2">
      <label className="relative block">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-3" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchCountry")}
          aria-label={t("searchCountry")}
          className="h-9 w-full rounded-[9px] border border-solid border-border-strong bg-surface pl-8 pr-2.5 text-[13px] text-text outline-none focus:border-accent"
        />
      </label>
      <ul role="listbox" aria-label={t("selectCountry")} className="m-0 max-h-64 list-none overflow-y-auto p-0">
        {rows.map((c) => (
          <li key={c.code} role="option" aria-selected={c.code === selected}>
            <button type="button" onClick={() => onPick(c.code)} className="flex w-full items-center gap-2.5 rounded-lg border-0 bg-transparent px-2.5 py-2 text-left text-[13.5px] text-text hover:bg-hover">
              <span aria-hidden className="text-[17px] leading-none">{c.flag}</span>
              <span className="min-w-0 flex-1 truncate">{c.name}</span>
              <span className="font-medium text-accent">{c.dial}</span>
              {c.code === selected ? <Check size={14} className="text-accent" /> : <span className="w-3.5" />}
            </button>
          </li>
        ))}
        {rows.length === 0 && <li className="px-2.5 py-4 text-center text-[13px] text-text-3">{t("noCountry")}</li>}
      </ul>
    </div>
  );
}


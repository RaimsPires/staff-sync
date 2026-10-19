"use client";

import { Globe, Moon, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTransition } from "react";
import { setLocale } from "@/i18n/actions";
import { locales, type Locale } from "@/i18n/config";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

/** Theme toggle and EN/FR switch shown at the top of the pre-login screens. */
export function AuthToolbar() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const locale = useLocale() as Locale;
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const [, startTransition] = useTransition();
  const dark = hydrated && resolvedTheme === "dark";

  const change = (l: Locale) =>
    startTransition(async () => {
      await setLocale(l);
      router.refresh();
    });

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setTheme(dark ? "light" : "dark")}
        title={t("theme")}
        aria-label={t("theme")}
        className="grid size-8 place-items-center rounded-lg border border-border bg-transparent text-text-2 hover:bg-hover"
      >
        {dark ? <Sun size={15} /> : <Moon size={15} />}
      </button>
      <div role="group" aria-label={t("language")} className="flex items-center gap-0.5 rounded-[9px] border border-border p-[3px]">
        <Globe size={15} className="mx-1 text-text-3" aria-hidden />
        {locales.map((l) => (
          <button
            key={l}
            onClick={() => change(l)}
            aria-pressed={locale === l}
            className={cn(
              "h-6 rounded-md border-0 px-[9px] text-[12px] font-semibold uppercase",
              locale === l ? "bg-accent-soft text-accent" : "bg-transparent text-text-3",
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

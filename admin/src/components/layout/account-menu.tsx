"use client";

import { ChevronDown, Lock, LogOut, Monitor, Moon, Repeat, Sun, UserRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTransition } from "react";
import { avatarColors, initials } from "@/components/ui/misc";
import { setLocale } from "@/i18n/actions";
import { locales, type Locale } from "@/i18n/config";
import { useHydrated } from "@/lib/use-hydrated";
import { usePresence } from "@/lib/use-presence";
import { cn } from "@/lib/utils";
import { useAccess } from "@/store/use-access";
import { markSignedOut } from "@/lib/auth-cookie";
import { useSettings } from "@/store/settings";

const THEMES = [
  { id: "light", icon: Sun },
  { id: "dark", icon: Moon },
  { id: "system", icon: Monitor },
] as const;

const seg = "flex gap-0.5 rounded-lg border border-solid border-border bg-surface-2 p-0.5";
const segButton = (on: boolean) => cn("h-[26px] rounded-md border-0 text-[12px] font-semibold", on ? "bg-surface text-text shadow-[0_1px_2px_rgb(0_0_0/0.12)]" : "bg-transparent text-text-3");

export function AccountMenu({ open, onToggle, onClose }: { open: boolean; onToggle: () => void; onClose: () => void }) {
  const { mounted, state } = usePresence(open, 120);
  const t = useTranslations("Shell.account");
  const router = useRouter();
  const locale = useLocale() as Locale;
  const { theme = "system", setTheme } = useTheme();
  const hydrated = useHydrated();
  const { role, me } = useAccess();
  const companyName = useSettings((st) => st.values.name);
  const [, startTransition] = useTransition();
  const go = (href: string) => { onClose(); router.push(href); };
  const changeLocale = (l: Locale) => startTransition(async () => { await setLocale(l); router.refresh(); });
  const colors = avatarColors(me.name);

  return (
    <div className="relative z-[1]">
      <button onClick={onToggle} aria-label={t("title")} aria-expanded={open} className={cn("flex h-10 items-center gap-1.5 rounded-full border border-solid bg-surface py-0 pl-1 pr-1.5 text-text-3 hover:bg-hover", open ? "border-accent" : "border-border")}>
        <span className="grid size-8 place-items-center rounded-full text-[12px] font-semibold" style={colors}>{initials(me.name)}</span>
        <ChevronDown size={15} />
      </button>
      {mounted && (
        <div data-state={state} role="menu" className="absolute right-0 top-[calc(100%+8px)] z-[2] w-[300px] ss-drop overflow-hidden rounded-xl border border-border bg-surface shadow-pop">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
            <span className="grid size-10 flex-none place-items-center rounded-full text-[14px] font-semibold" style={colors}>{initials(me.name)}</span>
            <div className="min-w-0">
              <div className="font-semibold">{me.name}</div>
              <div className="truncate text-[12px] text-text-3">{me.email}</div>
              <div className="mt-1"><span className="rounded-full bg-accent-soft px-[7px] py-0.5 text-[11px] font-semibold text-accent">{t("roleAt", { role: t(`roles.${role}`), company: companyName })}</span></div>
            </div>
          </div>
          <div className="p-1.5">
            <button role="menuitem" onClick={() => go("/profile")} className="flex h-[38px] w-full items-center gap-2.5 rounded-lg border-0 bg-transparent px-2.5 text-left text-[13.5px] text-text hover:bg-hover"><UserRound size={17} strokeWidth={1.8} className="text-text-2" /><span className="flex-1">{t("profile")}</span></button>
            <button role="menuitem" onClick={() => go("/profile?tab=security")} className="flex h-[38px] w-full items-center gap-2.5 rounded-lg border-0 bg-transparent px-2.5 text-left text-[13.5px] text-text hover:bg-hover"><Lock size={17} strokeWidth={1.8} className="text-text-2" /><span className="flex-1">{t("security")}</span><span className="rounded-full bg-ok-bg px-[7px] py-0.5 text-[11px] font-semibold text-ok">{t("twofa")}</span></button>
          </div>
          <div className="flex flex-col gap-2.5 border-t border-border px-4 py-2.5">
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-[13.5px]">{t("language")}</span>
              <div role="group" aria-label={t("language")} className={seg}>
                {locales.map((l) => <button key={l} aria-pressed={locale === l} onClick={() => changeLocale(l)} className={cn(segButton(locale === l), "px-2.5 uppercase")}>{l}</button>)}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-[13.5px]">{t("theme")}</span>
              <div role="group" aria-label={t("theme")} className={seg}>
                {THEMES.map(({ id, icon: Icon }) => <button key={id} aria-pressed={hydrated && theme === id} title={t(`themes.${id}`)} aria-label={t(`themes.${id}`)} onClick={() => setTheme(id)} className={cn(segButton(hydrated && theme === id), "grid w-8 place-items-center")}><Icon size={14} /></button>)}
              </div>
            </div>
          </div>
          <div className="border-t border-border p-1.5">
            <button role="menuitem" onClick={() => go("/workspaces")} className="flex h-[38px] w-full items-center gap-2.5 rounded-lg border-0 bg-transparent px-2.5 text-left text-[13.5px] text-text hover:bg-hover"><Repeat size={17} strokeWidth={1.8} className="text-text-2" /><span className="flex-1">{t("switch")}</span><span className="text-[12px] text-text-3">5</span></button>
            <button role="menuitem" onClick={() => { markSignedOut(); go("/sign-in"); }} className="flex h-[38px] w-full items-center gap-2.5 rounded-lg border-0 bg-transparent px-2.5 text-left text-[13.5px] text-bad hover:bg-bad-bg"><LogOut size={17} strokeWidth={1.8} /><span>{t("signOut")}</span></button>
          </div>
        </div>
      )}
    </div>
  );
}

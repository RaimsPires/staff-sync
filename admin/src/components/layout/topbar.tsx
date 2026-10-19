"use client";

import { Menu } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { DEMO_MONTH, DEMO_TODAY, DEMO_YEAR } from "@/data/live";
import { cn } from "@/lib/utils";
import { AccountMenu } from "./account-menu";
import { GlobalSearch } from "./global-search";
import { HelpMenu } from "./help-menu";
import { NotificationsMenu } from "./notifications-menu";
import { ScopeSwitcher } from "./scope-switcher";

type Menu = "scope" | "search" | "notif" | "help" | "user";

/** Sticky top bar: scope, search, date, notifications, help and account. One menu is open at a time. */
export function Topbar({ onMenu }: { onMenu: () => void }) {
  const t = useTranslations("Shell");
  const format = useFormatter();
  const [open, setOpen] = useState<Menu | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const toggle = (m: Menu) => () => setOpen((cur) => (cur === m ? null : m));
  const close = () => setOpen(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen("search");
        requestAnimationFrame(() => searchRef.current?.focus());
      } else if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const today = new Date(DEMO_YEAR, DEMO_MONTH, DEMO_TODAY);

  return (
    <header className={cn("sticky top-0 flex h-16 flex-none items-center gap-2.5 border-b border-border bg-surface px-3.5 lg:px-[22px]", open ? "z-40" : "z-[5]")}>
      {open && <div className="fixed inset-0 z-0" onClick={close} aria-hidden />}
      <button onClick={onMenu} title={t("menu")} aria-label={t("menu")} className="relative z-[1] grid size-[38px] flex-none place-items-center rounded-[10px] border border-solid border-border bg-surface text-text-2 lg:hidden">
        <Menu size={18} />
      </button>
      <ScopeSwitcher open={open === "scope"} onToggle={toggle("scope")} onClose={close} />
      <GlobalSearch ref={searchRef} open={open === "search"} onOpen={() => setOpen("search")} onToggle={toggle("search")} onClose={close} />
      <div className="flex-1" />
      <div className="relative z-[1] hidden h-10 items-center gap-[9px] whitespace-nowrap rounded-[10px] border border-solid border-border px-3 text-text-2 lg:flex" title={t("timezone")}>
        <span className="flex flex-col leading-tight">
          <span className="text-[13px] font-semibold text-text">{t("today")} · {format.dateTime(today, { weekday: "short", day: "numeric", month: "short" })}</span>
          <span className="text-[11px] text-text-3">10:42 · Europe/Paris</span>
        </span>
      </div>
      <NotificationsMenu open={open === "notif"} onToggle={toggle("notif")} onClose={close} />
      <HelpMenu open={open === "help"} onToggle={toggle("help")} onClose={close} />
      <AccountMenu open={open === "user"} onToggle={toggle("user")} onClose={close} />
    </header>
  );
}

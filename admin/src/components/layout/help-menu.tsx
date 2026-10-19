"use client";

import { BookOpen, CircleHelp, Keyboard, MessageCircle, Smartphone, Sparkles, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const ITEMS: { key: string; icon: LucideIcon; kbd?: string; tag?: boolean }[] = [
  { key: "helpCenter", icon: BookOpen },
  { key: "shortcuts", icon: Keyboard, kbd: "⌘K" },
  { key: "whatsNew", icon: Sparkles, tag: true },
  { key: "contact", icon: MessageCircle },
  { key: "mobileApp", icon: Smartphone },
];

export function HelpMenu({ open, onToggle, onClose }: { open: boolean; onToggle: () => void; onClose: () => void }) {
  const t = useTranslations("Shell.help");
  const toast = useToast();
  return (
    <div className="relative z-[1]">
      <button onClick={onToggle} title={t("title")} aria-label={t("title")} aria-expanded={open} className={cn("grid size-[38px] place-items-center rounded-[10px] border border-solid bg-surface text-text-2 hover:bg-hover", open ? "border-accent" : "border-border")}>
        <CircleHelp size={17} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-[2] w-[280px] animate-rise overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-pop">
          {ITEMS.map(({ key, icon: Icon, kbd, tag }) => (
            <button key={key} role="menuitem" onClick={() => { onClose(); toast(t(`items.${key}`), "info"); }} className="flex h-[38px] w-full items-center gap-2.5 rounded-lg border-0 bg-transparent px-2.5 text-left text-[13.5px] text-text hover:bg-hover">
              <Icon size={17} strokeWidth={1.8} className="text-text-2" />
              <span className="flex-1">{t(`items.${key}`)}</span>
              {kbd && <kbd className="rounded-[5px] border border-solid border-border px-1.5 py-0.5 font-mono text-[11px] text-text-3">{kbd}</kbd>}
              {tag && <span className="rounded-full bg-accent-soft px-[7px] py-0.5 text-[10.5px] font-semibold text-accent">{t("new")}</span>}
            </button>
          ))}
          <div className="-mx-1.5 -mb-1.5 mt-1.5 flex items-center gap-2 border-t border-border bg-surface-2 px-4 py-2.5 text-[12px] text-text-3">
            <span className="size-[7px] rounded-full bg-ok-dot" />
            {t("status")}
            <span className="ml-auto font-mono">v4.2.1</span>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { QrCode, ShieldCheck, Smartphone, UserCheck, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type MethodKey = "app" | "proxy" | "qr" | "admin";

const ICONS: Record<MethodKey, LucideIcon> = { app: Smartphone, proxy: UserCheck, qr: QrCode, admin: ShieldCheck };

/** Small square badge showing how a check-in was recorded. Renders a placeholder for manual absences. */
export function MethodIcon({ method, className }: { method: MethodKey | ""; className?: string }) {
  const t = useTranslations("Methods");
  if (!method) return <span className={cn("size-[26px] flex-none", className)} aria-hidden />;
  const Icon = ICONS[method];
  return (
    <span
      title={t(method)}
      className={cn("grid size-[26px] flex-none place-items-center rounded-[7px] border border-border bg-surface-2 text-text-2", className)}
    >
      <Icon size={14} aria-label={t(method)} />
    </span>
  );
}

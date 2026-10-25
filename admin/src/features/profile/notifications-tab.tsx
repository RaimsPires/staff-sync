"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { saveNotifications } from "@/services/profile";
import { useToast } from "@/components/ui/toast";
import { type PersonalEvent, useProfile } from "@/store/profile";

const EVENTS: PersonalEvent[] = ["fraud", "noshow", "miss", "lvnew", "lvdec", "unc"];
const CHANNELS = ["inApp", "push", "email"] as const;

export function NotificationsTab() {
  const t = useTranslations("Profile.notifications");
  const tEvent = useTranslations("Settings.notifications.events");
  const tChannel = useTranslations("Settings.notifications.channels");
  const { notif, setNotif } = useProfile();
  const toast = useToast();
  const flip = (id: PersonalEvent, channel: number) => {
    setNotif(id, channel);
    saveNotifications().catch((e: unknown) => toast(e instanceof Error ? e.message : t("failed"), "bad"));
  };
  const GRID = "grid grid-cols-[minmax(200px,1.6fr)_repeat(3,72px)] items-center gap-1.5";
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="border-b border-border px-[18px] py-3.5"><h2 className="m-0 text-[14.5px] font-semibold">{t("title")}</h2><p className="mt-0.5 text-[12.5px] text-text-3">{t("sub")}</p></div>
      <div className="overflow-x-auto"><div className="min-w-[480px]">
        <div className={cn(GRID, "h-9 bg-surface-2 px-[18px] text-[11.5px] font-semibold uppercase tracking-[.04em] text-text-3")}><div>{t("event")}</div>{CHANNELS.map((c) => <div key={c} className="text-center">{tChannel(c)}</div>)}</div>
        {EVENTS.map((id) => (
          <div key={id} className={cn(GRID, "border-t border-border px-[18px] py-2.5")}>
            <div className="text-[13.5px] font-medium">{tEvent(`${id}.name`)}</div>
            {CHANNELS.map((c, i) => (
              <div key={c} className="grid place-items-center">
                <button type="button" role="checkbox" aria-checked={notif[id][i]} aria-label={`${tEvent(`${id}.name`)} · ${tChannel(c)}`} onClick={() => flip(id, i)}
                  className={cn("grid size-[18px] place-items-center rounded-[5px] border-[1.5px] border-solid p-0 text-white", notif[id][i] ? "border-accent bg-accent" : "border-border-strong bg-transparent text-transparent")}><Check size={12} strokeWidth={3.4} /></button>
              </div>
            ))}
          </div>
        ))}
      </div></div>
    </section>
  );
}

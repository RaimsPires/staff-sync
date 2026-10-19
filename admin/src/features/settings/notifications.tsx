"use client";

import { Check, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Popover } from "@/components/ui/popover";
import { NOTIF_CHANNELS, NOTIF_EVENTS, NOTIF_ROLES } from "@/data/settings";
import { cn } from "@/lib/utils";
import { useSettings } from "@/store/settings";
import type { NotifEvent, NotifRule } from "@/types/settings";

const GRID = "grid grid-cols-[minmax(210px,1.6fr)_repeat(4,64px)_190px] items-center gap-1.5";

function Box({ on, label, onClick, size = 18 }: { on: boolean; label: string; onClick: () => void; size?: number }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} aria-label={label} onClick={onClick} style={{ width: size, height: size }}
      className={cn("grid place-items-center rounded-[5px] border-[1.5px] border-solid p-0 text-white", on ? "border-accent bg-accent" : "border-border-strong bg-transparent text-transparent")}>
      <Check size={size - 6} strokeWidth={3.4} />
    </button>
  );
}

export function NotificationMatrix() {
  const t = useTranslations("Settings.notifications");
  const tEvent = useTranslations("Settings.notifications.events");
  const tChannel = useTranslations("Settings.notifications.channels");
  const tRole = useTranslations("Settings.notifications.roles");
  const { values, patch } = useSettings();

  const update = (id: NotifEvent, rule: NotifRule) => patch({ notif: { ...values.notif, [id]: rule } });
  const flip = <T extends boolean[]>(arr: T, i: number) => arr.map((x, j) => (j === i ? !x : x)) as T;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="border-b border-border px-[18px] py-3.5"><h2 className="m-0 text-[14.5px] font-semibold">{t("title")}</h2><p className="mt-0.5 text-[12.5px] text-text-3">{t("sub")}</p></div>
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className={cn(GRID, "h-9 bg-surface-2 px-[18px] text-[11.5px] font-semibold uppercase tracking-[.04em] text-text-3")}>
            <div>{t("event")}</div>{NOTIF_CHANNELS.map((c) => <div key={c} className="text-center">{tChannel(c)}</div>)}<div>{t("sentTo")}</div>
          </div>
          {NOTIF_EVENTS.map((id) => {
            const rule = values.notif[id];
            const names = NOTIF_ROLES.filter((_, i) => rule.roles[i]).map((r) => tRole(r));
            return (
              <div key={id} className={cn(GRID, "border-t border-border px-[18px] py-2.5")}>
                <div><div className="text-[13.5px] font-medium">{tEvent(`${id}.name`)}</div><div className="text-[12px] text-text-3">{tEvent(`${id}.desc`)}</div></div>
                {NOTIF_CHANNELS.map((c, i) => <div key={c} className="grid place-items-center"><Box on={rule.channels[i]} label={`${tEvent(`${id}.name`)} · ${tChannel(c)}`} onClick={() => update(id, { ...rule, channels: flip(rule.channels, i) })} /></div>)}
                <Popover
                  align="right"
                  panelClassName="w-[200px] p-1.5"
                  className="min-w-0"
                  trigger={({ toggle, open }) => (
                    <button onClick={toggle} aria-expanded={open} className={cn("flex h-8 w-full items-center justify-between gap-1 overflow-hidden whitespace-nowrap rounded-lg border border-solid bg-surface px-2.5 text-left text-[12.5px] text-text", names.length ? "border-border-strong" : "border-warn-dot")}>
                      <span className="truncate">{names.length ? names.map((n) => n.split(" ")[0]).join(", ") : t("nobody")}</span><ChevronDown size={13} className="flex-none" />
                    </button>
                  )}
                >
                  {() => NOTIF_ROLES.map((r, i) => (
                    <div key={r} role="menuitemcheckbox" aria-checked={rule.roles[i]} tabIndex={0} onClick={() => update(id, { ...rule, roles: flip(rule.roles, i) })} onKeyDown={(e) => (e.key === " " || e.key === "Enter") && update(id, { ...rule, roles: flip(rule.roles, i) })} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] text-text hover:bg-hover">
                      <span aria-hidden className={cn("grid size-4 place-items-center rounded-[4px] border-[1.5px] border-solid text-white", rule.roles[i] ? "border-accent bg-accent" : "border-border-strong text-transparent")}><Check size={10} strokeWidth={3.4} /></span>{tRole(r)}
                    </div>
                  ))}
                </Popover>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

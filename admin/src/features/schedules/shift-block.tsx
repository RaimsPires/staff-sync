"use client";

import { RefreshCw, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOrg, type Org } from "@/lib/org";
import { formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Conflict, Shift } from "./model";
import { useClock } from "@/lib/preferences";

export interface DragHandlers {
  start: (e: React.DragEvent, payload: DragPayload) => void;
  end: () => void;
  startResize: (e: React.MouseEvent, shift: Shift, mode: "week" | "day" | "month") => void;
  /** Dropping an employee on an unassigned shift assigns them. */
  dropOnShift: (e: React.DragEvent, shift: Shift) => void;
  overShift: (e: React.DragEvent, shift: Shift) => void;
}
export type DragPayload = { k: "shift"; id: string } | { k: "int"; id: string } | { k: "emp"; name: string };

export type ViewMode = "week" | "day" | "month";

const message = (c: Conflict, t: ReturnType<typeof useTranslations>, org: Org) =>
  c.kind === "leave" ? t("leave", { name: c.emp }) : t("overlap", { site: org.siteById(c.site).name, from: formatTime(c.from), to: formatTime(c.to) });

interface Props {
  shift: Shift;
  conflict?: Conflict;
  dirty: boolean;
  mode: ViewMode;
  /** Show the employee instead of the site (site grouping or month view). */
  showEmployee: boolean;
  drag: DragHandlers;
  onOpen: (s: Shift) => void;
  style?: React.CSSProperties;
  className?: string;
}

export function ShiftBlock({ shift: x, conflict, dirty, mode, showEmployee, drag, onOpen, style, className }: Props) {
  const org = useOrg();
  const clock = useClock();
  const tc = useTranslations("Schedules.conflicts");
  const t = useTranslations("Schedules");
  const unassigned = !x.emp;
  const site = org.siteById(x.site).name;
  const first = x.emp ? x.emp.split(" ")[0] : t("open");
  const tone = unassigned ? "bg-transparent text-text-2" : x.type === "int" ? "bg-orange-bg text-orange" : "bg-accent-soft text-accent";
  const line = showEmployee || mode === "month" ? `${x.emp ?? t("unassigned")}${x.type === "int" && x.title ? ` · ${x.title}` : ""}` : `${site}${x.type === "int" && x.title ? ` · ${x.title}` : ""}`;
  const Icon = x.type === "int" ? Wrench : RefreshCw;
  const border = conflict ? "border-2 border-solid border-bad-dot" : unassigned ? "border-[1.5px] border-dashed border-border-strong" : "border border-solid border-transparent";

  if (mode === "month") {
    return (
      <div
        draggable
        onDragStart={(e) => drag.start(e, { k: "shift", id: x.id })}
        onDragEnd={drag.end}
        onClick={(e) => { e.stopPropagation(); onOpen(x); }}
        title={conflict ? message(conflict, tc, org) : `${site}${x.title ? ` · ${x.title}` : ""}`}
        className={cn("cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap rounded-[5px] px-1.5 py-0.5 text-[11px]", tone, border)}
      >
        {clock.time(formatTime(x.s))} {first} · {site.split(" ")[0]}
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={(e) => drag.start(e, { k: "shift", id: x.id })}
      onDragEnd={drag.end}
      onDragOver={(e) => drag.overShift(e, x)}
      onDrop={(e) => drag.dropOnShift(e, x)}
      onClick={(e) => { e.stopPropagation(); onOpen(x); }}
      title={conflict ? message(conflict, tc, org) : `${site}${x.title ? ` · ${x.title}` : ""}`}
      style={style}
      className={cn("relative cursor-grab select-none overflow-hidden rounded-[7px] text-[12px]", mode === "week" ? "px-2 pb-2 pt-[5px]" : "px-2 py-[3px]", tone, border, className)}
    >
      <div className="flex items-center gap-[5px] whitespace-nowrap font-mono text-[11.5px] font-semibold">
        <Icon size={11} className="flex-none" aria-hidden />
        {clock.time(formatTime(x.s))}–{clock.time(formatTime(x.e))}
        {conflict && <span className="ml-auto grid size-[15px] place-items-center rounded-full bg-bad-dot text-[10px] font-bold text-white" aria-label={message(conflict, tc, org)}>!</span>}
      </div>
      <div className="overflow-hidden text-ellipsis whitespace-nowrap">{line}</div>
      {dirty && <span className={cn("absolute top-1 size-1.5 rounded-full bg-warn-dot", conflict ? "right-6" : "right-1.5")} aria-hidden />}
      <div
        onMouseDown={(e) => drag.startResize(e, x, mode)}
        onClick={(e) => e.stopPropagation()}
        draggable={false}
        title={t("resizeHint")}
        className={cn("absolute bg-current opacity-25 hover:opacity-50", mode === "week" ? "bottom-0.5 left-2 right-2 h-[5px] cursor-ns-resize rounded" : "inset-y-0 right-0 w-2 cursor-ew-resize")}
      />
    </div>
  );
}

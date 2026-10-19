"use client";

import { Eye, LogIn, LogOut, Phone, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Chip } from "@/components/ui/chip";
import { MethodIcon } from "@/components/ui/method-icon";
import { Avatar } from "@/components/ui/misc";
import { StatusChip } from "@/components/ui/status-chip";
import { cn } from "@/lib/utils";
import { parseTime } from "@/lib/time";
import type { AttendanceRecord } from "@/types/domain";
import { distanceLabel, isFlagged, methodOf, presenceOf } from "./board-model";

export interface RowHandlers {
  selected: boolean;
  fresh: boolean;
  canIn: boolean;
  canOut: boolean;
  nowMinutes: number;
  jobLabel: string;
  onToggle: () => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onView: () => void;
  onCall: () => void;
}

interface Props extends RowHandlers {
  record: AttendanceRecord;
}

/** Status pill plus the small explanatory line under it. */
function StatusCell({ record, nowMinutes }: { record: AttendanceRecord; nowMinutes: number }) {
  const t = useTranslations("Live.row");
  const presence = presenceOf(record);
  const start = record.sched.split("–")[0];
  const lateBy = nowMinutes - parseTime(start);
  let chip: React.ReactNode;
  let note = "";

  if (presence === "not") {
    chip =
      lateBy > 0 ? (
        <Chip tone="warn">{t("notArrived")}</Chip>
      ) : (
        <StatusChip status="scheduled" />
      );
    note = lateBy > 0 ? t("minutesLate", { count: lateBy }) : t("dueAt", { time: start });
  } else if (presence === "left") {
    chip = record.status === "early" || record.status === "overtime" ? <StatusChip status={record.status} /> : <Chip tone="neutral">{t("left")}</Chip>;
  } else {
    chip = <StatusChip status={record.fraud ? "fraud" : record.status} />;
  }
  if (record.proxyBy) note = t("by", { name: record.proxyBy });

  return (
    <div className="flex flex-col items-start gap-0.5">
      {chip}
      {note && <span className="pl-0.5 text-[11.5px] text-text-3">{note}</span>}
    </div>
  );
}

function FlagBadge({ record }: { record: AttendanceRecord }) {
  const t = useTranslations("Live.row");
  if (!isFlagged(record)) return null;
  return (
    <span
      title={record.flag === "dist" ? t("flagDistance", { distance: record.dist ?? "" }) : t("flagMock")}
      className="grid size-[26px] flex-none place-items-center rounded-[7px] bg-bad-bg text-bad"
    >
      <ShieldAlert size={14} />
    </span>
  );
}

const iconButton =
  "grid size-[30px] place-items-center rounded-lg border border-solid border-border bg-surface text-text-2 hover:bg-hover";

function Actions({ record, canIn, canOut, onCheckIn, onCheckOut, onView, onCall }: Props) {
  const t = useTranslations("Live");
  const who = record.name;
  return (
    <div className="flex justify-end gap-1.5">
      {canIn && (
        <button onClick={onCheckIn} title={t("checkIn")} aria-label={`${t("checkIn")} — ${who}`} className={iconButton}>
          <LogIn size={15} />
        </button>
      )}
      {canOut && (
        <button onClick={onCheckOut} title={t("checkOut")} aria-label={`${t("checkOut")} — ${who}`} className={iconButton}>
          <LogOut size={15} />
        </button>
      )}
      <button onClick={onView} title={t("viewRecord")} aria-label={`${t("viewRecord")} — ${who}`} className={iconButton}>
        <Eye size={15} />
      </button>
      <button onClick={onCall} title={t("call")} aria-label={`${t("call")} — ${who}`} className={iconButton}>
        <Phone size={15} />
      </button>
    </div>
  );
}

const timeClass = "whitespace-nowrap p-[10px_12px] font-mono text-[12.5px]";

/** One employee as a table row. */
export function ListRow(props: Props) {
  const t = useTranslations("Live");
  const { record: r, selected, fresh, nowMinutes, jobLabel, onToggle } = props;
  const flagged = isFlagged(r);
  return (
    <tr className={cn("border-b border-border transition-colors duration-[1400ms]", fresh ? "bg-accent-soft" : selected && "bg-surface-2")}>
      <td className="pb-2.5 pl-4 pr-0 pt-2.5">
        <input type="checkbox" checked={selected} onChange={onToggle} aria-label={r.name} className="m-0 size-4 flex-none accent-accent" />
      </td>
      <td className="py-2.5 pl-0 pr-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={r.name} size={32} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-medium">
              {r.name}
              {fresh && <span className="rounded-full bg-accent px-1.5 py-px text-[10px] font-bold tracking-wide text-white">{t("newTag")}</span>}
            </div>
            <div className="text-[12px] text-text-3">{jobLabel}</div>
          </div>
        </div>
      </td>
      <td className={timeClass}>{r.sched}</td>
      <td className={cn(timeClass, r.status === "late" ? "text-warn" : flagged ? "text-bad" : r.in ? "text-text" : "text-text-3")}>{r.in || "—"}</td>
      <td className={cn(timeClass, r.status === "early" ? "text-warn" : r.status === "overtime" ? "text-violet" : r.out ? "text-text" : "text-text-3")}>
        {r.out || "—"}
      </td>
      <td className="p-[10px_12px]">
        <StatusCell record={r} nowMinutes={nowMinutes} />
      </td>
      <td className="p-[10px_12px]">
        <div className="flex items-center gap-1.5">
          <MethodIcon method={methodOf(r)} />
          <FlagBadge record={r} />
        </div>
      </td>
      <td className={cn(timeClass, "font-medium", r.flag === "dist" && !r.cleared ? "text-bad" : r.in ? "text-text-2" : "text-text-3")}>{distanceLabel(r)}</td>
      <td className="p-[10px_16px_10px_12px]">
        <Actions {...props} />
      </td>
    </tr>
  );
}

/** One employee as a card. */
export function GridCard(props: Props) {
  const t = useTranslations("Live");
  const { record: r, selected, fresh, nowMinutes, jobLabel, onToggle } = props;
  const flagged = isFlagged(r);
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 rounded-[11px] border border-solid p-3 transition-colors duration-[1400ms]",
        flagged ? "border-bad-dot" : "border-border",
        fresh ? "bg-accent-soft" : selected && "bg-surface-2",
      )}
    >
      <div className="flex items-center gap-2.5">
        <input type="checkbox" checked={selected} onChange={onToggle} aria-label={r.name} className="m-0 size-4 flex-none accent-accent" />
        <Avatar name={r.name} size={34} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-semibold">{r.name}</div>
          <div className="truncate text-[12px] text-text-3">{jobLabel}</div>
        </div>
        <FlagBadge record={r} />
      </div>
      <StatusCell record={r} nowMinutes={nowMinutes} />
      <div className="grid grid-cols-3 gap-1.5 text-[11px] text-text-3">
        <div>
          <div>{t("columns.scheduled")}</div>
          <div className="font-mono text-[12px] font-medium text-text">{r.sched}</div>
        </div>
        <div>
          <div>{t("in")}</div>
          <div className={cn("font-mono text-[12px] font-medium", r.status === "late" ? "text-warn" : flagged ? "text-bad" : r.in ? "text-text" : "text-text-3")}>{r.in || "—"}</div>
        </div>
        <div>
          <div>{t("out")}</div>
          <div className={cn("font-mono text-[12px] font-medium", r.out ? "text-text" : "text-text-3")}>{r.out || "—"}</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 border-t border-border pt-2.5">
        <MethodIcon method={methodOf(r)} />
        <span className={cn("font-mono text-[12px] font-medium", r.flag === "dist" && !r.cleared ? "text-bad" : r.in ? "text-text-2" : "text-text-3")}>{distanceLabel(r)}</span>
        <div className="flex-1" />
        <Actions {...props} />
      </div>
    </div>
  );
}

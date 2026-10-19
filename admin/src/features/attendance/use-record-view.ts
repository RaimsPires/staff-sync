import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { DEMO_MONTH, DEMO_TODAY, DEMO_YEAR } from "@/data/live";
import { siteById } from "@/data/org";
import { offsetMeters } from "@/lib/geo";
import { formatDuration, formatTime, parseTime, wrapDelta } from "@/lib/time";
import type { AttendanceRecord, LatLng } from "@/types/domain";
import { methodOf, scheduleMinutes, type Method } from "./model";

type Tone = "ok" | "warn" | "bad" | "info" | "orange" | "violet" | "neutral";

export interface TimeRow {
  key: "checkIn" | "checkOut" | "worked";
  scheduled: string;
  actual: string;
  actualTone: "default" | "warn" | "bad" | "violet";
  diff: string;
  diffTone: Tone;
}
export interface Fact {
  key: string;
  value: string;
  tone: "default" | "bad" | "warn";
}
export interface TimelineEvent {
  time: string;
  label: string;
  detail: string;
  color: string;
}

/** Hours and minutes as "1h 05" or "20 min". */
export const formatSpan = (minutes: number): string => {
  const a = Math.abs(minutes);
  return a >= 60 ? `${Math.floor(a / 60)}h ${String(a % 60).padStart(2, "0")}` : `${a} min`;
};

const DEVICES = ["iPhone 13 · iOS 18.1", "Pixel 7 · Android 15", "Galaxy A54 · Android 14"];

/**
 * Everything the record drawer shows that is derived from a record: schedule differences,
 * location facts, map points and the event timeline. Pure data plus translated strings.
 */
export function useRecordView(record: AttendanceRecord | null, actor: string, manager: (siteId: string) => string) {
  const t = useTranslations("Drawer");
  const tEvents = useTranslations("Drawer.events");
  const tStatus = useTranslations("Status");
  const tKinds = useTranslations("Drawer.kinds");

  return useMemo(() => {
    if (!record) return null;
    const site = siteById(record.site);
    const day = record.date ?? DEMO_TODAY;
    const outside = record.flag === "dist" && !record.cleared;
    const mock = record.flag === "mock" && !record.cleared;
    const method: Method = methodOf({ ...record, date: day });
    const [startS, endS] = record.sched.split("–");
    const [start, end] = scheduleMinutes(record.sched);
    const planned = formatDuration(startS, endS);
    const inDelta = record.in ? wrapDelta(parseTime(record.in), start) : null;
    const outDelta = record.out ? wrapDelta(parseTime(record.out), end) : null;

    const inDiff: [string, Tone] =
      inDelta === null ? ["—", "neutral"] : inDelta > 10 ? [t("diff.late", { span: formatSpan(inDelta) }), "warn"] : inDelta < 0 ? [t("diff.early", { span: formatSpan(inDelta) }), "ok"] : [t("diff.onTime"), "ok"];
    const outDiff: [string, Tone] =
      outDelta === null
        ? record.in && day === DEMO_TODAY && record.status !== "missing"
          ? [t("diff.inProgress"), "info"]
          : record.status === "missing"
            ? [t("diff.missing"), "orange"]
            : ["—", "neutral"]
        : outDelta < -5 ? [t("diff.earlier", { span: formatSpan(outDelta) }), "warn"] : outDelta > 20 ? [`+${formatSpan(outDelta)}`, "violet"] : [t("diff.onTime"), "ok"];
    const workedDiff: [string, Tone] = record.worked && record.worked !== "—" && record.out ? [record.worked, "neutral"] : ["—", "neutral"];

    const times: TimeRow[] = [
      { key: "checkIn", scheduled: startS, actual: record.in || "—", actualTone: inDelta !== null && inDelta > 10 ? "warn" : outside || mock ? "bad" : "default", diff: inDiff[0], diffTone: inDiff[1] },
      { key: "checkOut", scheduled: endS, actual: record.out || "—", actualTone: outDelta !== null && outDelta < -5 ? "warn" : outDelta !== null && outDelta > 20 ? "violet" : "default", diff: outDiff[0], diffTone: outDiff[1] },
      { key: "worked", scheduled: planned, actual: record.out ? record.worked : "—", actualTone: "default", diff: workedDiff[0], diffTone: workedDiff[1] },
    ];

    const proxyBy = record.proxyBy || manager(record.site);
    const j = (record.emp || record.id) * 7 + day;
    const insideLabel = (m: number) => `${m} m · ${t("inside")}`;
    const checkInDistance = !record.in || method === "admin" ? "—" : outside ? `${record.dist} · ${t("outside")}` : insideLabel(6 + (j % 30));
    const checkOutDistance = !record.out || method === "admin" ? "—" : insideLabel(4 + (j % 22));
    const accuracy = !record.in
      ? "—"
      : method === "admin" ? t("na") : mock ? t("accuracy.suspicious") : method === "proxy" ? "±12 m" : method === "qr" ? t("accuracy.kiosk") : `±${5 + (j % 9)} m`;
    const device = !record.in
      ? "—"
      : method === "proxy" ? t("devices.tablet") : method === "qr" ? t("devices.kiosk") : method === "admin" ? t("devices.web") : DEVICES[j % 3];
    const methodLabel = method === "app" ? t("methodLong.app") : method === "proxy" ? t("methodLong.proxy", { name: proxyBy }) : method === "qr" ? t("methodLong.qr") : method === "admin" ? t("methodLong.admin", { name: record.edit?.by || actor }) : "—";

    const facts: Fact[] = [
      { key: "method", value: method ? methodLabel : "—", tone: "default" },
      { key: "accuracy", value: accuracy, tone: mock ? "bad" : "default" },
      { key: "distanceIn", value: checkInDistance, tone: outside ? "bad" : "default" },
      { key: "distanceOut", value: checkOutDistance, tone: "default" },
      { key: "device", value: device, tone: "default" },
      { key: "appVersion", value: method === "app" || method === "proxy" ? (mock ? `v4.1.0 · ${t("outdated")}` : "v4.2.1") : "—", tone: mock ? "warn" : "default" },
    ];

    // Check-in/out positions around the site centre, deterministic per record.
    const metersPerUnit = (site.geofence.kind === "circle" ? site.geofence.radius : 80) / 20;
    const fenceReach = site.geofence.kind === "circle" ? site.geofence.radius : 90;
    const distanceOutside = Number.parseInt(record.dist ?? "0", 10) || 0;
    const checkInPosition: LatLng | null =
      !record.in || method === "admin" ? null : outside ? offsetMeters(site.position, fenceReach + distanceOutside, 0) : offsetMeters(site.position, (((j * 13) % 30) - 12) * metersPerUnit, (((j * 7) % 22) - 14) * metersPerUnit);
    const checkOutPosition: LatLng | null =
      !record.out || method === "admin" ? null : offsetMeters(site.position, (((j * 5) % 26) - 16) * metersPerUnit, (((j * 11) % 24) - 6) * metersPerUnit);
    const inColor = outside || mock ? "#E5372A" : inDelta !== null && inDelta > 10 ? "#E59A00" : "#16A34A";

    const flagReason = record.flag === "dist" ? t("flag.distance", { distance: record.dist ?? "" }) : record.flag === "mock" ? t("flag.mock") : "";
    const offlineAt = record.in ? formatTime(parseTime(record.in) + 134) : "";

    const events: TimelineEvent[] = [{ time: startS, label: tEvents("scheduledStart"), detail: tKinds(record.kind), color: "var(--neutral-dot)" }];
    if (record.in) {
      events.push({ time: record.in, label: tEvents("checkedIn", { method: method ? methodLabel : "" }), detail: outside || mock ? flagReason : checkInDistance, color: outside || mock ? "var(--bad-dot)" : inDelta !== null && inDelta > 10 ? "var(--warn-dot)" : "var(--ok-dot)" });
    }
    if (record.flag) events.push({ time: record.in, label: tEvents("flagged"), detail: flagReason, color: "var(--bad-dot)" });
    if (record.offline) events.push({ time: offlineAt, label: tEvents("synced"), detail: tEvents("syncedDetail"), color: "var(--info-dot)" });
    if (record.out) events.push({ time: record.out, label: tEvents("checkedOut"), detail: checkOutDistance, color: "var(--violet-dot)" });
    if (record.status === "missing") events.push({ time: endS, label: tEvents("noCheckOut"), detail: tEvents("reminderSent"), color: "var(--orange-dot)" });
    if (record.status === "absent" && !record.in) {
      events.push({ time: `${String(Number(startS.slice(0, 2))).padStart(2, "0")}:15`, label: tEvents("markedAbsent"), detail: tEvents("markedAbsentDetail"), color: "var(--bad-dot)" });
    }

    const date = new Date(DEMO_YEAR, DEMO_MONTH, day);
    return {
      site, day, date, outside, mock, method, proxyBy, times, facts, events, flagReason, offlineAt,
      checkInPosition, checkOutPosition, inColor, checkInDistance, checkOutDistance,
      statusLabel: tStatus(record.fraud ? "fraud" : record.status),
      recordCode: `REC-${record.id < 1000 ? `15${String(record.id).padStart(3, "0")}` : record.id}`,
    };
  }, [record, actor, manager, t, tEvents, tStatus, tKinds]);
}

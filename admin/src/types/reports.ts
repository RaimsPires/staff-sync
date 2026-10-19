export type ReportType = "timesheet" | "hours" | "lateness" | "absences" | "overtime" | "leave" | "flagged" | "site" | "proxy";
export type GroupBy = "employee" | "site" | "branch" | "day";
export type RangeKey = "month" | "last" | "7" | "q" | "custom";
export type ExportKind = "csv" | "xlsx" | "pdf";
export type Frequency = "daily" | "weekly" | "monthly";

export interface ReportConfig {
  type: ReportType;
  range: RangeKey;
  /** ISO dates, used when range is "custom". */
  from: string;
  to: string;
  branches: string[];
  sites: string[];
  emps: string[];
  group: GroupBy;
  cols: string[];
}

export interface ReportSchedule {
  freq: Frequency;
  /** Weekday key for weekly, day-of-month key for monthly, empty for daily. */
  day: string;
  time: string;
  recipients: string[];
  format: ExportKind;
  on: boolean;
}

export interface SavedReport extends ReportConfig {
  id: string;
  name: string;
  schedule: ReportSchedule | null;
  /** Last delivery, or the next planned one. */
  delivery: { kind: "never" } | { kind: "sent" | "next"; iso: string };
}

import type { ThemeColors } from '@/core/theme/tokens';
import type { AttendanceStatus } from '@/domain';
import type { PillTone } from '@/ui';

export const STATUS_TONE: Record<AttendanceStatus, PillTone> = {
  on_time: 'success',
  late: 'warning',
  early_leave: 'warning',
  overtime: 'info',
  missing_checkout: 'danger',
  absent: 'danger',
  on_leave: 'info',
  holiday: 'neutral',
  flagged: 'warning',
};

/** Calendar cell background per status. */
export const STATUS_BG: Record<AttendanceStatus, keyof ThemeColors> = {
  on_time: 'successBg',
  late: 'warningBg',
  early_leave: 'warningBg',
  overtime: 'infoBg',
  missing_checkout: 'dangerBg',
  absent: 'dangerBg',
  on_leave: 'infoBg',
  holiday: 'soft',
  flagged: 'warningBg',
};

/** The four design filter groups; statuses outside every group (holiday) only show under "All". */
export type StatusGroup = 'present' | 'late' | 'absent' | 'leave';

export const GROUP_STATUSES: Record<StatusGroup, readonly AttendanceStatus[]> = {
  present: ['on_time', 'overtime', 'early_leave', 'flagged', 'missing_checkout'],
  late: ['late'],
  absent: ['absent'],
  leave: ['on_leave'],
};

export const GROUPS = Object.keys(GROUP_STATUSES) as StatusGroup[];

export const GROUP_DOT: Record<StatusGroup, keyof ThemeColors> = { present: 'success', late: 'warning', absent: 'danger', leave: 'primary' };

export const inGroup = (status: AttendanceStatus, group: StatusGroup | null) => !group || GROUP_STATUSES[group].includes(status);

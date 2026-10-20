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

export const ALL_STATUSES = Object.keys(STATUS_TONE) as AttendanceStatus[];

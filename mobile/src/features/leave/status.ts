import type { LeaveStatus } from '@/domain';
import type { PillTone } from '@/ui';

export const LEAVE_TONE: Record<LeaveStatus, PillTone> = {
  pending: 'warning',
  changes_requested: 'orange',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'gray',
};

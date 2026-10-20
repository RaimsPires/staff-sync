import type { Assignment } from '@/domain';
import { atLocal } from '@/domain';
import type { PillTone } from '@/ui';

export type AssignmentStatus = 'upcoming' | 'in_progress' | 'completed';

/** Time-based status used by the Schedule list cards (the record is not loaded per card). */
export function assignmentStatus(a: Assignment, now = new Date()): AssignmentStatus {
  if (atLocal(a.date, a.end) <= now) return 'completed';
  if (atLocal(a.date, a.start) <= now) return 'in_progress';
  return 'upcoming';
}

export const STATUS_TONE: Record<AssignmentStatus, PillTone> = { upcoming: 'info', in_progress: 'success', completed: 'gray' };

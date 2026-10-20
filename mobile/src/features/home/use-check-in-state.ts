import { useMemo } from 'react';

import { resolveCheckInButton, type Assignment, type CheckInButtonState } from '@/domain';
import type { Fix } from '@/core/location/use-site-proximity';
import { useAssignmentRecord } from './queries';

/** Combines the live GPS fix and the stored record into the Home button state. */
export function useCheckInState(assignment: Assignment | undefined, fix: Fix | undefined): CheckInButtonState | undefined {
  const { data: record } = useAssignmentRecord(assignment?.id);

  return useMemo(() => {
    if (!assignment) return undefined;
    return resolveCheckInButton({
      site: assignment.site,
      position: fix,
      checkedInAt: record?.checkInAt ? new Date(record.checkInAt) : undefined,
      checkedOutAt: record?.checkOutAt ? new Date(record.checkOutAt) : undefined,
    });
  }, [assignment, fix, record]);
}

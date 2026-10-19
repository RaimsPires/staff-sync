import { mockAttendance } from './mock/attendance';
import { mockAuth } from './mock/auth';
import { mockLeave } from './mock/leave';
import { mockManager } from './mock/manager';
import { mockNotifications } from './mock/notifications';
import { mockProfile } from './mock/profile';
import { mockSchedule } from './mock/schedule';

/**
 * Single composition point. To go live, swap these for HTTP-backed implementations
 * of the interfaces in `./repositories/types`; no screen or hook changes.
 */
export const repos = {
  auth: mockAuth,
  attendance: mockAttendance,
  schedule: mockSchedule,
  leave: mockLeave,
  notifications: mockNotifications,
  profile: mockProfile,
  manager: mockManager,
};

export { AppError } from './repositories/types';
export type * from './repositories/types';

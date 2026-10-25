import { USE_MOCK } from './http/client';
import { httpAuth } from './repositories/http/auth';
import { httpProfile } from './repositories/http/profile';
import { httpAttendance } from './repositories/http/attendance';
import { mockAttendance } from './mock/attendance';
import { mockAuth } from './mock/auth';
import { httpLeave } from './repositories/http/leave';
import { mockLeave } from './mock/leave';
import { httpManager } from './repositories/http/manager';
import { mockManager } from './mock/manager';
import { httpNotifications } from './repositories/http/notifications';
import { mockNotifications } from './mock/notifications';
import { mockProfile } from './mock/profile';
import { httpSchedule } from './repositories/http/schedule';
import { mockSchedule } from './mock/schedule';

/**
 * Single composition point. To go live, swap these for HTTP-backed implementations
 * of the interfaces in `./repositories/types`; no screen or hook changes.
 */
export const repos = {
  auth: USE_MOCK ? mockAuth : httpAuth,
  attendance: USE_MOCK ? mockAttendance : httpAttendance,
  schedule: USE_MOCK ? mockSchedule : httpSchedule,
  leave: USE_MOCK ? mockLeave : httpLeave,
  notifications: USE_MOCK ? mockNotifications : httpNotifications,
  profile: USE_MOCK ? mockProfile : httpProfile,
  manager: USE_MOCK ? mockManager : httpManager,
};

export { AppError } from './repositories/types';
export type * from './repositories/types';

import { http } from '../../http/client';
import { toAssignment } from '../../http/mappers';
import type { ScheduleRepository } from '../types';

export const httpSchedule: ScheduleRepository = {
  async getRange(from, to) {
    return (await http.get<unknown[]>('/me/shifts', { query: { from, to } })).map(toAssignment);
  },
  async getAssignment(id) {
    return toAssignment(await http.get(`/me/shifts/${id}`));
  },
  async getToday() {
    return (await http.get<unknown[]>('/me/shifts/today')).map(toAssignment);
  },
  async getHolidays(from, to) {
    return http.get<string[]>('/me/holidays', { query: { from, to } });
  },
  async getApprovedLeave(from, to) {
    return http.get('/me/leave/approved', { query: { from, to } });
  },
};

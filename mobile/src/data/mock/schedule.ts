import { AppError, type ScheduleRepository } from '../repositories/types';
import { db, delay } from './db';

export const mockSchedule: ScheduleRepository = {
  async getRange(from, to) {
    await delay();
    return db.assignments
      .filter((a) => a.date >= from && a.date <= to)
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  },

  async getAssignment(id) {
    await delay(100);
    const found = db.assignments.find((a) => a.id === id);
    if (!found) throw new AppError('NOT_FOUND');
    return found;
  },

  async getToday() {
    await delay();
    const approved = db.leave.some((l) => l.status === 'approved' && l.start <= db.today && l.end >= db.today);
    if (approved) return [];
    return db.assignments.filter((a) => a.date === db.today).sort((a, b) => a.start.localeCompare(b.start));
  },

  async getHolidays(from, to) {
    await delay(50);
    return db.holidays.filter((h) => h >= from && h <= to);
  },

  async getApprovedLeave(from, to) {
    await delay(50);
    return db.leave
      .filter((l) => l.status === 'approved' && l.end >= from && l.start <= to)
      .map(({ start, end, typeId }) => ({ start, end, typeId }));
  },
};

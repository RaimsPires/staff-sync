import { assignmentStatus } from '../status';

const a = { date: '2026-10-19', start: '08:00', end: '17:00' } as Parameters<typeof assignmentStatus>[0];

describe('assignmentStatus', () => {
  it('is upcoming before the shift starts', () => {
    expect(assignmentStatus(a, new Date('2026-10-19T07:00:00'))).toBe('upcoming');
    expect(assignmentStatus(a, new Date('2026-10-18T12:00:00'))).toBe('upcoming');
  });
  it('is in progress between start and end', () => {
    expect(assignmentStatus(a, new Date('2026-10-19T08:00:00'))).toBe('in_progress');
    expect(assignmentStatus(a, new Date('2026-10-19T16:59:00'))).toBe('in_progress');
  });
  it('is completed once the shift has ended', () => {
    expect(assignmentStatus(a, new Date('2026-10-19T17:00:00'))).toBe('completed');
    expect(assignmentStatus(a, new Date('2026-10-20T09:00:00'))).toBe('completed');
  });
});

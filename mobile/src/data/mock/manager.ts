import { collectFlags, type Flag } from '@/domain';

import { AppError, type ManagerRepository, type RosterEntry } from '../repositories/types';
import { BADGES, PINS, SITES, SITE_A, db, delay } from './db';

const MAX_PIN_ATTEMPTS = 5;
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

function entryOrThrow(id: string): RosterEntry {
  const e = db.roster.find((r) => r.employeeId === id);
  if (!e) throw new AppError('NOT_FOUND');
  return e;
}

export const mockManager: ManagerRepository = {
  async getSites() {
    await delay(80);
    return SITES.map(({ id, name }) => ({ id, name }));
  },

  async getSummary() {
    await delay(150);
    const r = db.roster;
    const count = (...s: string[]) => r.filter((e) => s.includes(e.status)).length;
    return {
      expected: r.length,
      present: count('on_time', 'late', 'flagged'),
      notArrived: count('not_arrived'),
      left: count('left'),
      absent: count('absent'),
      onLeave: count('on_leave'),
      flagged: count('flagged'),
      alerts: [
        ...r.filter((e) => e.status === 'late').map((e) => ({ kind: 'late' as const, text: `${e.name} arrived at ${e.checkInAt}` })),
        ...r.filter((e) => e.status === 'flagged').map((e) => ({ kind: 'flag' as const, text: `${e.name}'s check-in was flagged` })),
        { kind: 'leave_request' as const, text: `${db.managerLeave.filter((l) => !l.recommendation).length} leave requests waiting` },
      ],
    };
  },

  async getRoster() {
    await delay(150);
    return db.roster;
  },

  async findByBadge(token) {
    await delay(150);
    const id = BADGES[token];
    if (!id) throw new AppError('NOT_FOUND');
    return entryOrThrow(id);
  },

  async proxyCheck(input) {
    await delay(400);
    const employeeId = input.employeeId ?? (input.badgeToken ? BADGES[input.badgeToken] : undefined);
    if (!employeeId) throw new AppError('NOT_FOUND');
    const entry = entryOrThrow(employeeId);

    const used = db.pinAttempts[employeeId] ?? 0;
    if (used >= MAX_PIN_ATTEMPTS) throw new AppError('PIN_LOCKED');
    if (input.pin !== PINS[employeeId]) {
      db.pinAttempts[employeeId] = used + 1;
      throw new AppError('PIN_INVALID', { attemptsLeft: MAX_PIN_ATTEMPTS - used - 1 });
    }
    db.pinAttempts[employeeId] = 0;

    // The manager's own phone must be inside the site boundary.
    const at = new Date(input.managerPosition.capturedAt);
    const flags: Flag[] = collectFlags({
      site: SITE_A,
      deviceRegistered: true,
      scheduled: true,
      position: { ...input.managerPosition, capturedAt: at },
    }).filter((f) => f.reason === 'OUTSIDE_GEOFENCE');
    if (flags.length) throw new AppError('VALIDATION');

    const updated: RosterEntry =
      input.type === 'check_in'
        ? { ...entry, status: 'on_time', checkInAt: hhmm(at), note: input.note }
        : { ...entry, status: 'left', checkOutAt: hhmm(at), note: input.note ?? entry.note };
    db.roster = db.roster.map((r) => (r.employeeId === employeeId ? updated : r));
    return { entry: updated, flags: [] };
  },

  async addNote(employeeId, note) {
    await delay(150);
    db.roster = db.roster.map((r) => (r.employeeId === employeeId ? { ...r, note } : r));
  },

  async leaveInbox() {
    await delay(150);
    return db.managerLeave;
  },

  async recommend(id, decision) {
    await delay(300);
    db.managerLeave = db.managerLeave.map((l) => (l.id === id ? { ...l, recommendation: decision } : l));
  },
};

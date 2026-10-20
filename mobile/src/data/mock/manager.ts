import { collectFlags, toIsoDate, type Flag } from '@/domain';

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
    return SITES.map(({ id, name, address }) => ({ id, name, address, expected: db.roster.length }));
  },

  async getSummary() {
    await delay(150);
    const r = db.roster;
    const count = (...st: string[]) => r.filter((e) => st.includes(e.status)).length;
    const waiting = db.managerLeave.filter((l) => l.status === 'pending' && !l.recommendation);
    return {
      expected: r.length,
      present: count('on_time', 'late', 'flagged', 'overtime'),
      notArrived: count('not_arrived'),
      left: count('left'),
      absent: count('absent'),
      onLeave: count('on_leave'),
      flagged: count('flagged'),
      pendingLeave: waiting.length,
      alerts: [
        ...r
          .filter((e) => e.status === 'not_arrived' && e.hasSmartphone)
          .map((e) => ({ id: `late-${e.employeeId}`, kind: 'late' as const, employeeId: e.employeeId, name: e.name, phone: e.phone, time: e.scheduled.start })),
        ...r.filter((e) => e.status === 'flagged').map((e) => ({ id: `flag-${e.employeeId}`, kind: 'flag' as const, employeeId: e.employeeId, name: e.name, time: e.checkInAt })),
        ...r.filter((e) => e.status === 'missing_checkout').map((e) => ({ id: `out-${e.employeeId}`, kind: 'missing_checkout' as const, employeeId: e.employeeId, name: e.name })),
        ...(waiting.length ? [{ id: 'leave', kind: 'leave_request' as const, count: waiting.length }] : []),
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

  async verifyPin(employeeId, pin) {
    await delay(200);
    entryOrThrow(employeeId);
    const used = db.pinAttempts[employeeId] ?? 0;
    if (used >= MAX_PIN_ATTEMPTS) throw new AppError('PIN_LOCKED');
    if (pin !== PINS[employeeId]) {
      db.pinAttempts[employeeId] = used + 1;
      throw new AppError('PIN_INVALID', { attemptsLeft: MAX_PIN_ATTEMPTS - used - 1 });
    }
    db.pinAttempts[employeeId] = 0;
  },

  async proxyCheck(input) {
    await delay(400);
    const employeeId = input.employeeId ?? (input.badgeToken ? BADGES[input.badgeToken] : undefined);
    if (!employeeId) throw new AppError('NOT_FOUND');
    const entry = entryOrThrow(employeeId);

    if (!input.photoUri) {
      const used = db.pinAttempts[employeeId] ?? 0;
      if (used >= MAX_PIN_ATTEMPTS) throw new AppError('PIN_LOCKED');
      if (input.pin !== PINS[employeeId]) {
        db.pinAttempts[employeeId] = used + 1;
        throw new AppError('PIN_INVALID', { attemptsLeft: MAX_PIN_ATTEMPTS - used - 1 });
      }
      db.pinAttempts[employeeId] = 0;
    }

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
        ? { ...entry, status: 'on_time', checkInAt: hhmm(at), checkInMethod: 'manager' as const, note: input.note }
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

  async employeeShifts(employeeId, start, end) {
    await delay(100);
    const e = entryOrThrow(employeeId);
    const out: { date: string; start: string; end: string }[] = [];
    for (let d = new Date(`${start}T12:00:00`); d <= new Date(`${end}T12:00:00`); d.setDate(d.getDate() + 1)) {
      const iso = toIsoDate(d);
      if (d.getDay() === 0 || d.getDay() === 6 || db.holidays.includes(iso)) continue;
      out.push({ date: iso, start: e.scheduled.start, end: e.scheduled.end });
    }
    return out;
  },

  async recommend(id, decision, comment) {
    await delay(300);
    db.managerLeave = db.managerLeave.map((l) =>
      l.id === id
        ? {
            ...l,
            recommendation: decision,
            recommendationComment: comment || undefined,
            timeline: [...l.timeline, { actor: db.signedIn?.name ?? 'Manager', action: 'recommended' as const, at: new Date().toISOString(), comment: comment || undefined }],
          }
        : l,
    );
  },
};

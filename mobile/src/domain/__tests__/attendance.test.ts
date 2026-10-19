import {
  collectFlags,
  evaluateCheckIn,
  evaluateCheckOut,
  resolveCheckInButton,
  workedMinutes,
} from '../attendance';
import type { Site } from '../types';

const site: Site = {
  id: 's1',
  name: 'Site A',
  address: 'Rue 1',
  center: { lat: 4.0511, lng: 9.7679 },
  geofence: { kind: 'circle', center: { lat: 4.0511, lng: 9.7679 }, radiusM: 100 },
  minAccuracyM: 30,
  requires: [],
  managerName: 'M',
  managerPhone: '+237600000000',
};
const shift = { date: '2026-10-19', start: '08:00', end: '17:00', graceMinutes: 10, earlyLeaveToleranceMinutes: 10 };
const at = (hhmm: string) => new Date(`2026-10-19T${hhmm}:00`);

describe('check-in status', () => {
  it('is on time inside grace', () => {
    expect(evaluateCheckIn(shift, at('08:10'))).toEqual({ status: 'on_time', lateByMinutes: 0 });
    expect(evaluateCheckIn(shift, at('07:56')).status).toBe('on_time');
  });
  it('is late after grace, counting past grace', () => {
    expect(evaluateCheckIn(shift, at('08:22'))).toEqual({ status: 'late', lateByMinutes: 12 });
  });
});

describe('check-out status', () => {
  it('flags early leave beyond tolerance', () => {
    expect(evaluateCheckOut(shift, at('16:15'))).toMatchObject({ status: 'early_leave', earlyByMinutes: 45 });
  });
  it('accepts leaving within tolerance', () => {
    expect(evaluateCheckOut(shift, at('16:55')).status).toBe('on_time');
  });
  it('counts overtime', () => {
    expect(evaluateCheckOut(shift, at('17:30'))).toMatchObject({ status: 'overtime', overtimeMinutes: 30 });
  });
  it('computes worked minutes', () => {
    expect(workedMinutes(at('08:00'), at('17:00'))).toBe(540);
  });
});

describe('verification flags', () => {
  const base = {
    site,
    deviceRegistered: true,
    scheduled: true,
    position: { ...site.center, accuracyM: 10, mocked: false, capturedAt: at('08:00') },
  };
  it('returns no flags for a clean check-in', () => {
    expect(collectFlags(base)).toEqual([]);
  });
  it('reports every failed rule', () => {
    const flags = collectFlags({
      ...base,
      deviceRegistered: false,
      scheduled: false,
      serverNow: at('07:00'),
      position: { lat: site.center.lat + 0.005, lng: site.center.lng, accuracyM: 80, mocked: true, capturedAt: at('08:00') },
    });
    expect(flags.map((f) => f.reason).sort()).toEqual(
      ['DEVICE_MISMATCH', 'LOW_ACCURACY', 'MOCK_LOCATION', 'OUTSIDE_GEOFENCE', 'TIME_TAMPERED', 'UNSCHEDULED'].sort(),
    );
    expect(flags.find((f) => f.reason === 'OUTSIDE_GEOFENCE')?.distanceM).toBeGreaterThan(400);
  });
});

describe('check-in button state', () => {
  it('waits for an accurate GPS fix', () => {
    expect(resolveCheckInButton({ site }).kind).toBe('waiting_gps');
    expect(resolveCheckInButton({ site, position: { ...site.center, accuracyM: 90 } }).kind).toBe('waiting_gps');
  });
  it('is disabled outside, ready inside', () => {
    expect(resolveCheckInButton({ site, position: { lat: 4.06, lng: 9.7679, accuracyM: 5 } }).kind).toBe('outside');
    expect(resolveCheckInButton({ site, position: { ...site.center, accuracyM: 5 } }).kind).toBe('ready');
  });
  it('moves through checked in to done', () => {
    expect(resolveCheckInButton({ site, checkedInAt: at('08:00') }).kind).toBe('checked_in');
    expect(resolveCheckInButton({ site, checkedInAt: at('08:00'), checkedOutAt: at('10:00') })).toEqual({
      kind: 'done',
      workedMinutes: 120,
    });
  });
});

import { BREAK_MINUTES, daySummary, resolveGate, type GateInput } from '../attendance';
import { halfDayChoices } from '../leave';

const at = (hhmm: string) => new Date(`2026-10-19T${hhmm}:00`);
const shift = { date: '2026-10-19', start: '08:00', end: '17:00' };

describe('daySummary (check-out summary)', () => {
  it('takes the break off both worked and scheduled time', () => {
    expect(daySummary(shift, at('08:00'), at('17:00'))).toEqual({ gross: 540, total: 540 - BREAK_MINUTES, scheduled: 540 - BREAK_MINUTES, difference: 0 });
  });
  it('reports early leave as a negative difference', () => {
    // Left at 16:15: 45 minutes early.
    expect(daySummary(shift, at('08:00'), at('16:15')).difference).toBe(-45);
  });
  it('reports overtime as a positive difference', () => {
    expect(daySummary(shift, at('08:00'), at('18:20')).difference).toBe(80);
  });
  it('never goes below zero for a very short day', () => {
    const s = daySummary(shift, at('08:00'), at('08:20'));
    expect(s.total).toBe(0);
    expect(s.difference).toBe(-s.scheduled);
  });
});

describe('resolveGate (check flow blocking screens)', () => {
  const ok: GateInput = {
    mocked: false,
    deviceRegistered: true,
    scheduledHere: true,
    insideGeofence: true,
    mode: 'check_in',
    unscheduledOk: false,
    outsideOk: false,
  };
  it('goes straight to confirm when nothing blocks', () => {
    expect(resolveGate(ok)).toBe('confirm');
  });
  it('blocks a fake location before anything else', () => {
    expect(resolveGate({ ...ok, mocked: true, deviceRegistered: false, scheduledHere: false })).toBe('mock_location');
  });
  it('blocks an unregistered device next', () => {
    expect(resolveGate({ ...ok, deviceRegistered: false, scheduledHere: false })).toBe('device_unregistered');
  });
  it('asks before checking in at a site with no shift, until the user accepts', () => {
    expect(resolveGate({ ...ok, scheduledHere: false })).toBe('not_scheduled');
    expect(resolveGate({ ...ok, scheduledHere: false, unscheduledOk: true })).toBe('confirm');
  });
  it('only warns about being outside the site on check-out', () => {
    expect(resolveGate({ ...ok, insideGeofence: false })).toBe('confirm');
    expect(resolveGate({ ...ok, insideGeofence: false, mode: 'check_out' })).toBe('not_at_site');
    expect(resolveGate({ ...ok, insideGeofence: false, mode: 'check_out', outsideOk: true })).toBe('confirm');
  });
});

describe('halfDayChoices (new leave request)', () => {
  it('offers full, morning and afternoon for a single day', () => {
    expect(halfDayChoices(true)).toEqual({ first: ['full', 'morning', 'afternoon'], last: [] });
  });
  it('lets the first day start in the afternoon and the last day end in the morning', () => {
    expect(halfDayChoices(false)).toEqual({ first: ['full', 'afternoon'], last: ['full', 'morning'] });
  });
});

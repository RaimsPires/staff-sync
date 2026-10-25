import { camelize, snakeize } from '../case';
import { toAssignment, toLeave, toProfile, toRecord, toTimeline } from '../mappers';

// Payloads captured from the running API (seeded demo company).
const shift = {
  id: 'bc0bad11', type: 'shift',
  site: {
    id: 's1', name: 'Bonanjo Tower', address: 'Douala', center: [9.7679, 4.0511], min_accuracy_m: 50, requires: [], manager_name: 'Karim', manager_phone: null,
    geofence: { type: 'Polygon', coordinates: [[[9.1, 4.1], [9.2, 4.1], [9.2, 4.2], [9.1, 4.1]]] },
  },
  date: '2026-10-23', start: '08:00', end: '17:00', grace_min: 10, early_leave_tol_min: 10, instructions: null, updated_by_admin: false, previous_start: null, attachments: [],
};

describe('http mappers', () => {
  it('converts keys both ways', () => {
    expect(camelize({ a_b: { c_d: [{ e_f: 1 }] } })).toEqual({ aB: { cD: [{ eF: 1 }] } });
    expect(snakeize({ clientEventId: 'x', position: { accuracyM: 1 } })).toEqual({ client_event_id: 'x', position: { accuracy_m: 1 } });
  });

  it('maps a shift to an assignment with a polygon geofence', () => {
    const a = toAssignment(camelize(shift));
    expect(a.graceMinutes).toBe(10);
    expect(a.site.center).toEqual({ lat: 4.0511, lng: 9.7679 });
    expect(a.site.geofence).toEqual({ kind: 'polygon', points: [{ lat: 4.1, lng: 9.1 }, { lat: 4.1, lng: 9.2 }, { lat: 4.2, lng: 9.2 }] });
    expect(a.site.managerPhone).toBe('');
    expect(a.attachments).toBeUndefined();
  });

  it('maps an attendance record, dropping nulls', () => {
    const r = toRecord(camelize({
      id: 'r1', date: '2026-10-23', site: { id: 's1', name: 'A' }, scheduled_start: '08:00', scheduled_end: '17:00', check_in_at: '2026-10-23T11:52:30Z', check_out_at: null,
      status: 'late', late_by_minutes: 292, method: 'self', proxy_by: null, flags: [{ reason: 'OUTSIDE_GEOFENCE', distance_m: 12, detail: null }], flag_outcome: null, offline_synced: false,
    }));
    expect(r.checkOutAt).toBeUndefined();
    expect(r.flags).toEqual([{ reason: 'OUTSIDE_GEOFENCE', distanceM: 12 }]);
    expect(r.offlineSynced).toBeUndefined();
  });

  it('maps a leave request and the profile', () => {
    const l = toLeave(camelize({
      id: 'l1', leave_type_id: 't1', start_date: '2026-11-10', end_date: '2026-11-12', start_half: null, end_half: null, days: 3, reason: 'family', attachment_keys: [], status: 'pending', approver: 'Admin',
      timeline: [{ actor: 'Amina', action: 'submitted', at: '2026-10-23T11:52:30Z', comment: 'family' }],
    }));
    expect(l).toMatchObject({ typeId: 't1', start: '2026-11-10', days: 3, startHalf: undefined });
    expect(toProfile(camelize({ id: 'u', name: 'A', role: 'admin', site_ids: [], site_names: [] })).role).toBe('employee');
  });
});

describe('toTimeline', () => {
  it('keeps known steps, reads a resubmission as a submission and drops edits and unknown actions', () => {
    const out = toTimeline([
      { actor: 'Amina', action: 'submitted', at: '2026-10-20T08:00:00Z', comment: null },
      { actor: 'Amina', action: 'edited', at: '2026-10-20T09:00:00Z' },
      { actor: 'Amina', action: 'resubmitted', at: '2026-10-20T10:00:00Z' },
      { actor: 'Amina', action: 'cancellation_requested', at: '2026-10-21T10:00:00Z' },
      { actor: 'System', action: 'something_new', at: '2026-10-21T11:00:00Z' },
    ]);
    expect(out.map((e) => e.action)).toEqual(['submitted', 'submitted', 'cancelled']);
    expect(out[0].comment).toBeUndefined();
  });

  it('tolerates a missing timeline', () => {
    expect(toTimeline(undefined)).toEqual([]);
  });
});

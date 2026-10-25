import * as Crypto from 'expo-crypto';

import type { Flag } from '@/domain';

import { stripNulls } from '../../http/case';
import { guarded, http } from '../../http/client';
import { toLeave } from '../../http/mappers';
import { uploadFile } from '../../http/upload';
import { type ManagerLeaveItem, type ManagerRepository, type ManagerSummary, type RosterEntry } from '../types';

const METHOD = { self: 'gps', qr: 'qr', proxy: 'manager' } as const;

const toEntry = (r: any): RosterEntry => {
  const x = stripNulls(r);
  return {
    employeeId: x.employeeId,
    name: x.name ?? x.employeeName ?? '',
    scheduled: { start: x.scheduledStart ?? '', end: x.scheduledEnd ?? '' },
    checkInAt: x.checkInAt,
    checkOutAt: x.checkOutAt,
    status: x.status ?? 'not_arrived',
    hasSmartphone: x.hasSmartphone ?? true,
    phone: x.phone ?? '',
    note: x.note,
    role: x.role,
    checkInMethod: METHOD[x.method as keyof typeof METHOD],
  };
};

const toFlags = (flags: any[] = []): Flag[] => flags.map((f) => ({ reason: f.reason, distanceM: f.distanceM ?? undefined }));

export const httpManager: ManagerRepository = {
  getSites: () => http.get('/manager/sites'),
  async getSummary(siteId) {
    const s = await http.get<ManagerSummary>(`/manager/sites/${siteId}/summary`);
    return stripNulls(s);
  },
  async getRoster(siteId) {
    return (await http.get<unknown[]>(`/manager/sites/${siteId}/roster`)).map(toEntry);
  },
  async findByBadge(token, siteId) {
    return toEntry(await guarded(() => http.get(`/manager/badges/${encodeURIComponent(token)}`, { query: { siteId } })));
  },
  async verifyPin(employeeId, pin) {
    await guarded(() => http.post('/attendance/proxy/verify-pin', { body: { employeeId, pin } }));
  },
  async proxyCheck(input) {
    const res = await guarded(async () =>
      http.post<{ record: any; flags: any[] }>(`/attendance/proxy/${input.type === 'check_in' ? 'check-in' : 'check-out'}`, {
        body: {
          clientEventId: input.clientEventId ?? Crypto.randomUUID(),
          siteId: input.siteId,
          employeeId: input.employeeId,
          badgeToken: input.badgeToken,
          pin: input.pin,
          photoKey: input.photoUri ? await uploadFile('proxy-photo', input.photoUri) : undefined,
          note: input.note,
          lat: input.managerPosition.lat,
          lng: input.managerPosition.lng,
          accuracyM: input.managerPosition.accuracyM,
          capturedAt: input.managerPosition.capturedAt,
          acceptUnscheduled: input.acceptUnscheduled,
        },
      }),
    );
    return { entry: toEntry({ ...res.record, checkInAt: res.record.checkInAt, method: 'proxy' }), flags: toFlags(res.flags) };
  },
  async addNote(employeeId, note) {
    await guarded(() => http.post(`/employees/${employeeId}/notes`, { body: { body: note } }));
  },
  async leaveInbox(siteId) {
    const items = await http.get<any[]>(`/manager/sites/${siteId}/leave`);
    return items.map<ManagerLeaveItem>((i) => ({
      ...toLeave(i),
      employeeId: i.employeeId,
      sentAt: i.createdAt,
      others: (i.others ?? []).map((o: any) => ({ name: o.name, start: o.start, end: o.end, typeId: o.leaveTypeId })),
    }));
  },
  async employeeShifts(employeeId, start, end) {
    return http.get(`/manager/employees/${employeeId}/shifts`, { query: { start, end } });
  },
  async recommend(id, decision, comment) {
    await guarded(() => http.post(`/leave/requests/${id}/recommend`, { body: { decision, comment } }));
  },
};


jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { repos } from '..';
import { AppError } from '../repositories/types';
import { selectPending, useOfflineQueue } from '../offline-queue';

const proxy = {
  id: 'p1',
  employeeName: 'Awa Sanogo',
  input: {
    employeeId: 'u-joseph',
    photoUri: 'file:///photo.jpg',
    type: 'check_in' as const,
    managerPosition: { lat: 4.05, lng: 9.76, accuracyM: 8, mocked: false, capturedAt: new Date().toISOString() },
  },
};

beforeEach(() => useOfflineQueue.setState({ events: [], notes: [], proxies: [], syncing: false }));

describe('offline queue', () => {
  it('counts events, notes and proxy checks together', () => {
    const q = useOfflineQueue.getState();
    q.enqueueNote({ id: 'n1', employeeId: 'u-paul', note: 'late' });
    q.enqueueProxy(proxy);
    expect(selectPending(useOfflineQueue.getState())).toBe(2);
  });

  it('keeps only the newest note per employee', () => {
    const q = useOfflineQueue.getState();
    q.enqueueNote({ id: 'n1', employeeId: 'u-paul', note: 'first' });
    q.enqueueNote({ id: 'n2', employeeId: 'u-paul', note: 'second' });
    expect(useOfflineQueue.getState().notes).toEqual([{ id: 'n2', employeeId: 'u-paul', note: 'second' }]);
  });

  it('never stores a PIN on a queued proxy check', () => {
    useOfflineQueue.getState().enqueueProxy(proxy);
    expect(JSON.stringify(useOfflineQueue.getState().proxies)).not.toMatch(/pin/i);
  });

  it('replays queued notes and proxy checks, then empties the queue', async () => {
    const note = jest.spyOn(repos.manager, 'addNote').mockResolvedValue(undefined);
    const check = jest.spyOn(repos.manager, 'proxyCheck').mockResolvedValue({ entry: {} as never, flags: [] });
    const q = useOfflineQueue.getState();
    q.enqueueNote({ id: 'n1', employeeId: 'u-paul', note: 'late' });
    q.enqueueProxy(proxy);
    const result = await useOfflineQueue.getState().sync();
    expect(note).toHaveBeenCalledWith('u-paul', 'late');
    expect(check).toHaveBeenCalledWith(proxy.input);
    expect(result).toEqual({ synced: 2, remaining: 0 });
    expect(selectPending(useOfflineQueue.getState())).toBe(0);
  });

  it('keeps items that failed for network reasons and drops ones the server decided', async () => {
    jest.spyOn(repos.manager, 'proxyCheck').mockRejectedValueOnce(new Error('network')).mockRejectedValueOnce(new AppError('UNSCHEDULED'));
    const q = useOfflineQueue.getState();
    q.enqueueProxy({ ...proxy, id: 'a' });
    q.enqueueProxy({ ...proxy, id: 'b' });
    await useOfflineQueue.getState().sync();
    expect(useOfflineQueue.getState().proxies.map((p) => p.id)).toEqual(['a']);
  });
});

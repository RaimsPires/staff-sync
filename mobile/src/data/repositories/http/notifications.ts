import { http } from '../../http/client';
import { toNotification } from '../../http/mappers';
import type { NotificationRepository } from '../types';

export const httpNotifications: NotificationRepository = {
  async list() {
    return (await http.get<unknown[]>('/me/notifications')).map(toNotification);
  },
  async markRead(id) {
    await http.post('/me/notifications/read', { body: { ids: [id] } });
  },
  async markAllRead() {
    await http.post('/me/notifications/read', { body: {} });
  },
  async remove(id) {
    await http.delete(`/me/notifications/${id}`);
  },
};

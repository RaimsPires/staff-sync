import type { NotificationRepository } from '../repositories/types';
import { db, delay } from './db';

export const mockNotifications: NotificationRepository = {
  async list() {
    await delay(150);
    return [...db.notifications].sort((a, b) => b.at.localeCompare(a.at));
  },
  async markRead(id) {
    db.notifications = db.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  },
  async markAllRead() {
    await delay(80);
    db.notifications = db.notifications.map((n) => ({ ...n, read: true }));
  },
  async remove(id) {
    db.notifications = db.notifications.filter((n) => n.id !== id);
  },
};

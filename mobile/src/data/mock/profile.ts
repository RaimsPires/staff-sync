import { AppError, type ProfileRepository } from '../repositories/types';
import { db, delay } from './db';

export const mockProfile: ProfileRepository = {
  async get() {
    await delay(100);
    if (!db.signedIn) throw new AppError('NOT_FOUND');
    return db.signedIn;
  },
  async getPhotoUrl() {
    return null;
  },
  async setPhoto() {
    await delay(100);
  },
  async getDevice() {
    await delay(80);
    return db.device;
  },
  async isDeviceRegistered() {
    await delay(60);
    return !db.boundDevice || db.boundDevice === db.deviceId;
  },
  async registerPushToken() {},
};

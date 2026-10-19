import { AppError, type ProfileRepository } from '../repositories/types';
import { db, delay } from './db';

export const mockProfile: ProfileRepository = {
  async get() {
    await delay(100);
    if (!db.signedIn) throw new AppError('NOT_FOUND');
    return db.signedIn;
  },
  async getDevice() {
    await delay(80);
    return db.device;
  },
};

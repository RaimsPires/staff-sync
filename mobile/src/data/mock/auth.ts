import { AppError, type AuthRepository, type Session } from '../repositories/types';
import { ACCOUNTS, COMPANIES, MOCK_OTP, db, delay } from './db';

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '');
const MAX_OTP_ATTEMPTS = 5;

function sessionFor(): Session {
  if (!db.signedIn) throw new AppError('NOT_FOUND');
  return { accessToken: `mock-access-${Date.now()}`, refreshToken: `mock-refresh-${Date.now()}`, user: db.signedIn };
}

export const mockAuth: AuthRepository = {
  async requestOtp(identifier) {
    await delay();
    const account = ACCOUNTS.find((a) => a.identifiers.some((i) => norm(i) === norm(identifier)));
    if (!account) throw new AppError('ACCOUNT_NOT_FOUND');
    if (!account.active) throw new AppError('ACCOUNT_DISABLED');
    db.otpAttempts = 0;
  },

  async verifyOtp(identifier, code) {
    await delay();
    if (db.otpAttempts >= MAX_OTP_ATTEMPTS) throw new AppError('OTP_LOCKED');
    if (code !== MOCK_OTP) {
      db.otpAttempts++;
      throw new AppError('OTP_INVALID', { attemptsLeft: MAX_OTP_ATTEMPTS - db.otpAttempts });
    }
    const account = ACCOUNTS.find((a) => a.identifiers.some((i) => norm(i) === norm(identifier)));
    if (!account) throw new AppError('ACCOUNT_NOT_FOUND');
    db.signedIn = account.profile;
    return { companies: COMPANIES.filter((c) => account.companies.includes(c.id)), session: sessionFor() };
  },

  async selectCompany() {
    await delay();
    return sessionFor();
  },

  async registerDevice(deviceId) {
    await delay();
    if (db.boundDevice && db.boundDevice !== deviceId) throw new AppError('DEVICE_BOUND');
    db.boundDevice = deviceId;
    db.deviceId = deviceId;
  },

  async logout() {
    await delay(80);
    db.signedIn = null;
  },
};

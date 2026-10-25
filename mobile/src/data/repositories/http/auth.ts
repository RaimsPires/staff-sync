import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { guarded, http, storeTokens } from '../../http/client';
import { toCompany, toProfile, type ApiCompany, type ApiProfile } from '../../http/mappers';
import type { AuthRepository, Session } from '../types';

type Tokens = { accessToken: string; refreshToken: string };

const toSession = (tokens: Tokens, user: ApiProfile | null | undefined): Session => ({
  accessToken: tokens.accessToken,
  refreshToken: tokens.refreshToken,
  // Several companies: the profile only exists once one is chosen.
  user: user ? toProfile(user) : (null as never),
});

export const httpAuth: AuthRepository = {
  async requestOtp(identifier, password) {
    const res = await guarded(() => http.post<{ passwordSetupRequired?: boolean }>('/auth/otp/request', { public: true, body: { identifier, password } }));
    return { passwordSetupRequired: !!res.passwordSetupRequired };
  },

  async verifyOtp(identifier, code) {
    const res = await guarded(() =>
      http.post<{ companies: ApiCompany[]; tokens: Tokens; user?: ApiProfile | null; needsPassword?: boolean }>('/auth/otp/verify', { public: true, body: { identifier, code } }),
    );
    // The session store persists tokens in `begin`, but the next call (company pick) needs them already.
    await storeTokens(res.tokens);
    return { companies: res.companies.map(toCompany), session: toSession(res.tokens, res.user), needsPassword: !!res.needsPassword };
  },

  async setInitialPassword(newPassword) {
    await guarded(() => http.post('/me/password/initial', { body: { newPassword } }));
  },

  async selectCompany(companyId) {
    const res = await guarded(() => http.post<{ tokens: Tokens; user: ApiProfile }>('/auth/select-company', { body: { companyId } }));
    await storeTokens(res.tokens);
    return toSession(res.tokens, res.user);
  },

  async registerDevice(deviceId) {
    await guarded(() =>
      http.post('/devices/register', {
        body: { deviceId, platform: Platform.OS === 'ios' ? 'ios' : 'android', model: Device.modelName ?? undefined },
      }),
    );
  },

  async logout() {
    await http.post('/auth/logout').catch(() => undefined);
  },
};

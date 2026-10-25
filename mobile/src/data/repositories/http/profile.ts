import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { http } from '../../http/client';
import { uploadFile } from '../../http/upload';
import { toProfile, type ApiProfile } from '../../http/mappers';
import type { ProfileRepository } from '../types';

type ApiDevice = { registered: boolean; thisDevice?: boolean; model?: string | null; registeredAt?: string | null; lastActiveAt?: string | null };

export const httpProfile: ProfileRepository = {
  async get() {
    return toProfile(await http.get<ApiProfile>('/me/profile'));
  },

  async getDevice() {
    const d = await http.get<ApiDevice>('/devices/me');
    return { model: d.model ?? '', registeredAt: d.registeredAt ?? '', lastActiveAt: d.lastActiveAt ?? '' };
  },

  async isDeviceRegistered() {
    const d = await http.get<ApiDevice>('/devices/me');
    return d.registered && d.thisDevice === true;
  },

  async getPhotoUrl() {
    return (await http.get<{ avatarUrl?: string | null }>('/me')).avatarUrl ?? null;
  },

  async setPhoto(uri) {
    const avatarKey = uri ? await uploadFile('avatar', uri, 'image/jpeg') : null;
    await http.patch('/me', { body: { avatarKey } });
  },

  async registerPushToken() {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    await http.put('/devices/me/push-token', { body: { pushToken: data } });
  },
};

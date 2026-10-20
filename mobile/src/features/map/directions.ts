import { Linking, Platform } from 'react-native';

import type { LatLng } from '@/domain';

export type DirectionsProvider = 'google' | 'apple' | 'waze';

export type DirectionsOption = { provider: DirectionsProvider; initial: string; color: string };

/** Third-party brand colours (Google, Apple, Waze) from the design; intentionally identical in light and dark mode. */
export const DIRECTIONS_OPTIONS: DirectionsOption[] = [
  { provider: 'google', initial: 'G', color: '#1A8F4C' },
  ...(Platform.OS === 'ios' ? [{ provider: 'apple' as const, initial: 'A', color: '#3A7BD5' }] : []),
  { provider: 'waze', initial: 'W', color: '#2AA7D8' },
];

/** All links are fixed HTTPS templates with numeric coordinates only. */
export const directionsUrl = (p: DirectionsProvider, to: LatLng, label: string): string => {
  const ll = `${to.lat},${to.lng}`;
  switch (p) {
    case 'google':
      return `https://www.google.com/maps/dir/?api=1&destination=${ll}`;
    case 'apple':
      return `https://maps.apple.com/?daddr=${ll}&q=${encodeURIComponent(label)}`;
    case 'waze':
      return `https://waze.com/ul?ll=${ll}&navigate=yes`;
  }
};

export const openDirectionsWith = (p: DirectionsProvider, to: LatLng, label: string) => void Linking.openURL(directionsUrl(p, to, label));

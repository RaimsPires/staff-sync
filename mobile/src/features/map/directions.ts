import { Alert, Linking, Platform } from 'react-native';

import type { LatLng } from '@/domain';

type Provider = 'google' | 'apple' | 'waze';

const url = (p: Provider, to: LatLng, label: string): string => {
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

/** Lets the user choose a navigation app; all links are fixed HTTPS templates with numeric coordinates only. */
export function openDirections(to: LatLng, label: string, t: (k: string) => string) {
  const options: { text: string; provider: Provider }[] = [
    ...(Platform.OS === 'ios' ? [{ text: t('map.appleMaps'), provider: 'apple' as const }] : []),
    { text: t('map.googleMaps'), provider: 'google' },
    { text: t('map.waze'), provider: 'waze' },
  ];
  Alert.alert(t('map.openWith'), undefined, [
    ...options.map((o) => ({ text: o.text, onPress: () => void Linking.openURL(url(o.provider, to, label)) })),
    { text: t('common.cancel'), style: 'cancel' as const },
  ]);
}

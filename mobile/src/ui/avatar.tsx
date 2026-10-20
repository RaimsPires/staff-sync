import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';

import { Text } from './text';

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase();
}

type Props = { name: string; size?: number; tone?: 'info' | 'navy' };

export function Avatar({ name, size = 44, tone = 'info' }: Props) {
  const { colors } = useTheme();
  const bg = tone === 'navy' ? colors.primaryPressed : colors.map;
  return (
    <View style={[styles.base, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]} accessibilityElementsHidden>
      <Text style={{ fontSize: Math.round(size * 0.36), fontWeight: '800', color: tone === 'navy' ? colors.onPrimary : colors.infoFg }}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({ base: { alignItems: 'center', justifyContent: 'center' } });

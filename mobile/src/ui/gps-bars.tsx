import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';

import { Text } from './text';

export type GpsLevel = 'good' | 'fair' | 'poor' | 'none';

const FILLED: Record<GpsLevel, number> = { good: 3, fair: 2, poor: 1, none: 0 };

type Props = { level: GpsLevel; label: string };

/** Three ascending signal bars (3×5, 3×8, 3×12) with an accuracy label. */
export function GpsBars({ level, label }: Props) {
  const { colors } = useTheme();
  const filled = FILLED[level];
  const tint = level === 'good' ? colors.success : level === 'fair' ? colors.warning : colors.danger;
  return (
    <View style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.line }]}>
      <View style={styles.bars}>
        {[5, 8, 12].map((h, i) => (
          <View key={h} style={{ width: 3, height: h, borderRadius: 1, backgroundColor: i < filled ? tint : colors.line }} />
        ))}
      </View>
      <Text variant="small">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 12 },
});

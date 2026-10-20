import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';

import { Text } from './text';

type Props = { label: string; selected: boolean; onPress: () => void };

export function RadioRow({ label, selected, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.row,
        { backgroundColor: selected ? colors.infoBg : colors.card, borderColor: selected ? colors.primary : colors.fieldBorder },
      ]}>
      <View style={[styles.ring, { borderColor: selected ? colors.primary : colors.fieldBorder }]}>
        {selected ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
      </View>
      <Text variant="bodyStrong" style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 48, borderRadius: radius.field, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  ring: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { flex: 1, fontWeight: '700' },
});

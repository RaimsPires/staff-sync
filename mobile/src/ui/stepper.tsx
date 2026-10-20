import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme/theme-provider';
import { spacing } from '@/core/theme/tokens';

import { Text } from './text';

type Props = { step: number; total: number; title?: string };

/** "Step N of M" caption, optional step title and a segmented progress bar. */
export function Stepper({ step, total, title }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <Text variant="label" tone="muted" style={styles.caption}>
        {t('common.stepOf', { step, total }).toUpperCase()}
      </Text>
      {title ? <Text variant="hero">{title}</Text> : null}
      <View style={styles.bar} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: total, now: step }}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.seg, { backgroundColor: i < step ? colors.primary : colors.line }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  caption: { letterSpacing: 0.8 },
  bar: { flexDirection: 'row', gap: 6 },
  seg: { flex: 1, height: 6, borderRadius: 3 },
});

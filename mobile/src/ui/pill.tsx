import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing, type ThemeColors } from '@/core/theme/tokens';

import { Text, type TextProps } from './text';

export type PillTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

type Style = { bg: keyof ThemeColors; fg: NonNullable<TextProps['tone']> };

const STYLES: Record<PillTone, Style> = {
  success: { bg: 'successBg', fg: 'successFg' },
  warning: { bg: 'warningBg', fg: 'warningFg' },
  danger: { bg: 'dangerBg', fg: 'dangerFg' },
  info: { bg: 'infoBg', fg: 'primary' },
  neutral: { bg: 'soft', fg: 'muted' },
};

export function Pill({ label, tone = 'neutral' }: { label: string; tone?: PillTone }) {
  const { colors } = useTheme();
  const { bg, fg } = STYLES[tone];

  return (
    <View style={[styles.pill, { backgroundColor: colors[bg] }]}>
      <Text variant="caption" tone={fg} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill },
  label: { fontWeight: '700' },
});

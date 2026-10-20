import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import type { ThemeColors } from '@/core/theme/tokens';

import type { PillTone } from './pill';
import { Text, type TextProps } from './text';

const MAP: Record<PillTone, { bg: keyof ThemeColors; fg: NonNullable<TextProps['tone']> }> = {
  success: { bg: 'successBg', fg: 'successFg' },
  warning: { bg: 'warningBg', fg: 'warningFg' },
  danger: { bg: 'dangerBg', fg: 'dangerFg' },
  info: { bg: 'infoBg', fg: 'infoFg' },
  neutral: { bg: 'soft', fg: 'muted' },
  orange: { bg: 'orangeBg', fg: 'orangeFg' },
  purple: { bg: 'purpleBg', fg: 'purpleFg' },
  gray: { bg: 'grayBg', fg: 'grayFg' },
};

/** Pill-shaped 13/700 status chip (radius 999, 4×10 padding) used on assignment cards. */
export function StatusChip({ label, tone = 'neutral' }: { label: string; tone?: PillTone }) {
  const { colors } = useTheme();
  const c = MAP[tone];
  return (
    <View style={[styles.chip, { backgroundColor: colors[c.bg] }]}>
      <Text variant="small" tone={c.fg}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({ chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 } });

import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import { radius, type ThemeColors } from '@/core/theme/tokens';

import { Text, type TextProps } from './text';
import type { PillTone } from './pill';

type Style = { bg: keyof ThemeColors; fg: NonNullable<TextProps['tone']> };

const STYLES: Record<PillTone, Style> = {
  success: { bg: 'successBg', fg: 'successFg' },
  warning: { bg: 'warningBg', fg: 'warningFg' },
  danger: { bg: 'dangerBg', fg: 'dangerFg' },
  info: { bg: 'infoBg', fg: 'infoFg' },
  neutral: { bg: 'soft', fg: 'muted' },
  orange: { bg: 'orangeBg', fg: 'orangeFg' },
  purple: { bg: 'purpleBg', fg: 'purpleFg' },
  gray: { bg: 'grayBg', fg: 'grayFg' },
};

/** Rectangular 12/800 uppercase chip (radius 8) used for assignment type and status. */
export function Tag({ label, tone = 'neutral' }: { label: string; tone?: PillTone }) {
  const { colors } = useTheme();
  const { bg, fg } = STYLES[tone];
  return (
    <View style={[styles.tag, { backgroundColor: colors[bg] }]}>
      <Text variant="label" tone={fg}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm },
});

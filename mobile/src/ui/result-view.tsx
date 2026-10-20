import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import { spacing, type ThemeColors } from '@/core/theme/tokens';

import { Icon, type IconName } from './icon';
import { Text } from './text';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'orange';

const MAP: Record<Tone, { bg: keyof ThemeColors; fg: keyof ThemeColors }> = {
  success: { bg: 'successBg', fg: 'success' },
  warning: { bg: 'warningBg', fg: 'warning' },
  danger: { bg: 'dangerBg', fg: 'flag' },
  info: { bg: 'infoBg', fg: 'primary' },
  orange: { bg: 'orangeBg', fg: 'orangeFg' },
};

type Props = {
  tone?: Tone;
  icon: IconName;
  /** Circle diameter; the design uses 84, 96 and 120. */
  size?: number;
  title: string;
  body?: string;
  /** Chip or banner rendered under the title. */
  chip?: ReactNode;
  children?: ReactNode;
};

/** Centered full-screen result: icon circle, 28px title, body and free content. */
export function ResultView({ tone = 'success', icon, size = 96, title, body, chip, children }: Props) {
  const { colors } = useTheme();
  const c = MAP[tone];
  return (
    <View style={styles.wrap}>
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors[c.bg] }]}>
        <Icon name={icon} size={Math.round(size * 0.5)} tone={c.fg} />
      </View>
      <Text variant="result" style={styles.center} accessibilityRole="header">
        {title}
      </Text>
      {chip}
      {body ? (
        <Text tone="muted" style={styles.center}>
          {body}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxxl },
  circle: { alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  center: { textAlign: 'center' },
});

import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';

import { Icon, type IconName } from './icon';
import { Text } from './text';

type Tone = 'info' | 'warning' | 'success' | 'danger' | 'orange';

const MAP = {
  info: { bg: 'infoBg', fg: 'infoFg', border: 'infoBorder' },
  warning: { bg: 'warningBg', fg: 'warningFg', border: 'warningBorder' },
  success: { bg: 'successBg', fg: 'successFg', border: 'successBorder' },
  danger: { bg: 'dangerBg', fg: 'dangerFg', border: 'dangerBorder' },
  orange: { bg: 'orangeBg', fg: 'orangeFg', border: 'orangeBg' },
} as const;

type Props = { tone?: Tone; icon?: IconName; title?: string; children?: ReactNode; text?: string };

export function Banner({ tone = 'info', icon, title, text, children }: Props) {
  const { colors } = useTheme();
  const c = MAP[tone];
  return (
    <View style={[styles.box, { backgroundColor: colors[c.bg], borderColor: colors[c.border] }]}>
      {icon ? <Icon name={icon} size={20} tone={c.fg} /> : null}
      <View style={styles.body}>
        {title ? (
          <Text variant="subheading" tone={c.fg} style={styles.title}>
            {title}
          </Text>
        ) : null}
        {text ? (
          <Text variant="caption" tone={c.fg}>
            {text}
          </Text>
        ) : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: 14, borderRadius: radius.button, borderWidth: 1 },
  body: { flex: 1, gap: 2 },
  title: { fontWeight: '800' },
});

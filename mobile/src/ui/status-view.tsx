import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/core/theme/theme-provider';
import { spacing, type ThemeColors } from '@/core/theme/tokens';

import { Button } from './button';
import { Icon, type IconName } from './icon';
import { Screen } from './screen';
import { Text } from './text';

type Tone = 'info' | 'danger' | 'warning';
const TONES: Record<Tone, { bg: keyof ThemeColors; fg: keyof ThemeColors }> = {
  info: { bg: 'infoBg', fg: 'primary' },
  danger: { bg: 'dangerBg', fg: 'dangerFg' },
  warning: { bg: 'warningBg', fg: 'warningFg' },
};

type Action = { label: string; onPress: () => void };

type Props = {
  icon: IconName;
  tone: Tone;
  title: string;
  body: string;
  primary: Action;
  secondary?: Action;
  /** Full-width amber strip at the very top (the "No internet connection" frame). */
  banner?: string;
};

/** Full-screen message with a round icon, used for not-invited / deactivated / offline. */
export function StatusView({ icon, tone, title, body, primary, secondary, banner }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const t = TONES[tone];
  return (
    <Screen
      gutter={28}
      hideOfflineBanner={!!banner}
      edges={banner ? { top: false } : undefined}
      contentStyle={[styles.content, banner ? styles.contentBanner : null]}
      header={
        banner ? (
          <View style={[styles.banner, { backgroundColor: colors.warning, paddingTop: insets.top + spacing.sm }]} accessibilityRole="alert">
            <Text variant="caption" tone="onPrimary" style={styles.bannerText}>
              ⚠ {banner}
            </Text>
          </View>
        ) : undefined
      }
      footer={
        <>
          <Button large label={primary.label} onPress={primary.onPress} />
          {secondary ? <Button variant="ghost" label={secondary.label} onPress={secondary.onPress} /> : null}
        </>
      }>
      <View style={[styles.circle, { backgroundColor: colors[t.bg] }]}>
        <Icon name={icon} size={44} tone={t.fg} />
      </View>
      <Text variant="title" style={styles.center}>{title}</Text>
      <Text tone="muted" style={[styles.center, styles.body]}>{body}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', paddingTop: 96, gap: spacing.lg },
  contentBanner: { paddingTop: 56 },
  banner: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  bannerText: { fontWeight: '600' },
  circle: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  body: { lineHeight: 23 },
});

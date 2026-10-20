import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatDistance } from '@/core/format';
import { useNow } from '@/core/use-now';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import type { Assignment, CheckInButtonState } from '@/domain';
import { Text } from '@/ui';

type Props = {
  state: CheckInButtonState;
  assignment: Assignment;
  locationGranted: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
};

const pad = (n: number) => String(n).padStart(2, '0');

/** The five states of the main action (Mobile App.md §3), rendered as the 76px two-line design button. */
export function CheckInButton({ state, assignment, locationGranted, onCheckIn, onCheckOut }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const now = useNow(1000);

  const base = { label: '', sub: '', note: undefined as string | undefined, bg: colors.soft, fg: colors.muted, shadow: undefined as string | undefined, onPress: undefined as (() => void) | undefined };
  let v = base;

  if (!locationGranted) {
    v = { ...base, label: t('home.locationOff'), sub: t('home.gpsSub') };
  } else if (state.kind === 'waiting_gps') {
    v = { ...base, label: t('home.waitingGps'), sub: t('home.gpsSub'), note: t('home.gpsNote') };
  } else if (state.kind === 'outside') {
    const radiusM = assignment.site.geofence.kind === 'circle' ? assignment.site.geofence.radiusM : undefined;
    v = {
      ...base,
      label: t('home.outsideSite'),
      sub: t('home.outsideSub', { distance: formatDistance(state.distanceM, t) }),
      note: radiusM ? t('home.outsideNote', { m: radiusM }) : undefined,
    };
  } else if (state.kind === 'ready') {
    v = {
      ...base,
      label: t('home.checkIn'),
      sub: t('home.checkInSub', { site: assignment.site.name, time: assignment.start }),
      bg: colors.primary,
      fg: colors.onPrimary,
      shadow: colors.primary,
      onPress: onCheckIn,
    };
  } else if (state.kind === 'checked_in') {
    const secs = Math.max(0, Math.floor((now.getTime() - state.since.getTime()) / 1000));
    v = {
      ...base,
      label: t('home.checkOut'),
      sub: t('home.onSiteFor', { duration: `${pad(Math.floor(secs / 60))}:${pad(secs % 60)}` }),
      bg: colors.danger,
      fg: colors.onPrimary,
      shadow: colors.danger,
      onPress: onCheckOut,
    };
  }

  return (
    <View style={styles.gap}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !v.onPress }}
        disabled={!v.onPress}
        onPress={v.onPress}
        style={[
          styles.button,
          { backgroundColor: v.bg },
          v.shadow ? { shadowColor: v.shadow, shadowOpacity: 0.33, shadowRadius: 10, shadowOffset: { width: 0, height: 8 }, elevation: 8 } : null,
        ]}>
        <Text variant="hero" style={{ color: v.fg }}>
          {v.label}
        </Text>
        <Text variant="caption" style={[styles.sub, { color: v.fg }]}>
          {v.sub}
        </Text>
      </Pressable>
      {v.note ? (
        <Text variant="caption" tone="muted" style={styles.note}>
          {v.note}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.sm },
  button: { minHeight: 76, borderRadius: radius.hero, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 10, paddingHorizontal: spacing.lg },
  sub: { fontWeight: '600' },
  note: { textAlign: 'center', paddingHorizontal: spacing.sm, lineHeight: 19 },
});

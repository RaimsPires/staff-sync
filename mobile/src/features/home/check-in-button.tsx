import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { formatDistance, formatDuration } from '@/core/format';
import { useNow } from '@/core/use-now';
import { spacing } from '@/core/theme/tokens';
import type { CheckInButtonState } from '@/domain';
import { Button, Card, Icon, Text } from '@/ui';

type Props = {
  state: CheckInButtonState;
  locationGranted: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
};

/** The five states of the main action (Mobile App.md §3). */
export function CheckInButton({ state, locationGranted, onCheckIn, onCheckOut }: Props) {
  const { t } = useTranslation();
  const now = useNow(30_000);

  if (!locationGranted) {
    return <Button large disabled icon="location-outline" label={t('home.locationOff')} onPress={() => undefined} />;
  }

  switch (state.kind) {
    case 'waiting_gps':
      return <Button large disabled loading={false} icon="navigate-outline" label={t('home.waitingGps')} onPress={() => undefined} />;
    case 'outside':
      return (
        <View style={styles.gap}>
          <Button large disabled icon="close-circle-outline" label={t('home.outsideSite')} onPress={() => undefined} />
          <Text variant="caption" tone="muted" style={styles.center}>
            {t('home.outsideWhy', { distance: formatDistance(state.distanceM, t) })}
          </Text>
        </View>
      );
    case 'ready':
      return <Button large icon="log-in-outline" label={t('home.checkIn')} onPress={onCheckIn} />;
    case 'checked_in': {
      const minutes = (now.getTime() - state.since.getTime()) / 60_000;
      return (
        <View style={styles.gap}>
          <Button large variant="danger" icon="log-out-outline" label={t('home.checkOut')} onPress={onCheckOut} />
          <Text variant="caption" tone="muted" style={styles.center}>
            {t('home.onSiteFor', { duration: formatDuration(minutes, t) })}
          </Text>
        </View>
      );
    }
    case 'done':
      return (
        <Card style={styles.done}>
          <Icon name="checkmark-circle" size={28} tone="success" />
          <View>
            <Text variant="subheading">{t('home.doneToday')}</Text>
            <Text tone="muted" variant="caption">
              {t('home.worked', { duration: formatDuration(state.workedMinutes, t) })}
            </Text>
          </View>
        </Card>
      );
  }
}

const styles = StyleSheet.create({
  gap: { gap: spacing.sm },
  center: { textAlign: 'center' },
  done: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});

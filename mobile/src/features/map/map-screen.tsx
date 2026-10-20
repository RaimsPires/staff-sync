import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatDistance, formatDuration } from '@/core/format';
import { useLivePosition, useLocationPermission } from '@/core/location/use-site-proximity';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { repos } from '@/data';
import { qk } from '@/data/query-keys';
import { distanceToGeofenceM, haversineM } from '@/domain';
import { Button, Card, Icon, Screen, SiteMap, Text } from '@/ui';

import { useAssignmentRecord } from '../home/queries';
import { openDirections } from './directions';

/** Average urban speed used for the rough travel estimate (no routing service in the mock build). */
const AVERAGE_SPEED_MPS = 8;

export function MapScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const { data: assignment } = useQuery({ queryKey: qk.assignment(assignmentId), queryFn: () => repos.schedule.getAssignment(assignmentId) });
  const { data: record } = useAssignmentRecord(assignmentId);
  const permission = useLocationPermission();
  const fix = useLivePosition(permission.state === 'granted');

  if (!assignment) return <Screen scroll={false}>{null}</Screen>;

  const { site } = assignment;
  const inside = fix ? distanceToGeofenceM(fix, site.geofence) === 0 : false;
  const meters = fix ? haversineM(fix, site.center) : undefined;
  const canCheckIn = inside && !record?.checkInAt;

  return (
    <Screen scroll={false} edges={{ bottom: false }} contentStyle={styles.content}>
      <View style={styles.head}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
          <Icon name="chevron-back" />
        </Pressable>
        <Text variant="heading" style={styles.flex}>{site.name}</Text>
      </View>

      <SiteMap site={site} user={fix} interactive style={styles.map} />

      {canCheckIn ? (
        <Card style={{ borderColor: colors.success }}>
          <Text variant="subheading">{t('map.arrivedTitle', { site: site.name })}</Text>
          <Text tone="muted">{t('map.arrivedBody')}</Text>
          <Button label={t('home.checkIn')} icon="log-in-outline" onPress={() => router.replace({ pathname: '/check-in', params: { assignmentId } })} />
        </Card>
      ) : null}

      <Card>
        <View style={styles.stats}>
          <View style={styles.flex}>
            <Text variant="caption" tone="muted">{t('map.distance')}</Text>
            <Text variant="heading">{meters === undefined ? '–' : formatDistance(meters, t)}</Text>
          </View>
          <View style={styles.flex}>
            <Text variant="caption" tone="muted">{t('map.eta')}</Text>
            <Text variant="heading">{meters === undefined ? '–' : formatDuration(Math.max(1, meters / AVERAGE_SPEED_MPS / 60), t)}</Text>
          </View>
        </View>
        <Button icon="navigate" label={t('map.directions')} onPress={() => openDirections(site.center, site.name, t as (k: string) => string)} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  map: { flex: 1, borderRadius: radius.lg },
  stats: { flexDirection: 'row', gap: spacing.lg },
});

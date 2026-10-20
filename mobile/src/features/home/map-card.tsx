import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatDistance } from '@/core/format';
import type { Fix } from '@/core/location/use-site-proximity';
import { spacing } from '@/core/theme/tokens';
import { distanceToGeofenceM, type Assignment } from '@/domain';
import { Icon, SiteMap, Text } from '@/ui';

type Props = { assignment: Assignment; fix: Fix | undefined };

export function MapCard({ assignment, fix }: Props) {
  const { t } = useTranslation();
  const { site } = assignment;
  const distance = fix ? Math.round(distanceToGeofenceM(fix, site.geofence)) : undefined;
  const level = !fix ? undefined : fix.accuracyM <= 15 ? 'Good' : fix.accuracyM <= site.minAccuracyM ? 'Fair' : 'Poor';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('map.title')}
      onPress={() => router.push({ pathname: '/map', params: { assignmentId: assignment.id } })}
      style={styles.card}>
      <SiteMap site={site} user={fix} style={styles.map} />
      <View style={styles.caption} pointerEvents="none">
        <Icon name="navigate" size={16} tone="primary" />
        <View style={styles.flex}>
          <Text variant="bodyStrong">
            {distance === undefined
              ? t('home.findingPosition')
              : distance === 0
                ? t('home.youAreOnSite')
                : t('home.distanceAway', { distance: formatDistance(distance, t) })}
          </Text>
          {level ? (
            <Text variant="caption" tone="muted">
              {t('home.accuracy', { level: t(`home.accuracy${level}`) })}
            </Text>
          ) : null}
        </View>
        <Icon name="expand-outline" size={18} tone="muted" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  map: { height: 160 },
  caption: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});

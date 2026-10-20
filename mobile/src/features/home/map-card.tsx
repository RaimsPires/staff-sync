import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { formatDistance } from '@/core/format';
import type { Fix } from '@/core/location/use-site-proximity';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { distanceToGeofenceM, type Assignment } from '@/domain';
import { GpsBars, SiteMap, Text, type GpsLevel } from '@/ui';

type Props = { assignment: Assignment; fix: Fix | undefined };

export function MapCard({ assignment, fix }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { site } = assignment;
  const distance = fix ? Math.round(distanceToGeofenceM(fix, site.geofence)) : undefined;
  const usable = !!fix && fix.accuracyM <= site.minAccuracyM;
  const level: GpsLevel = !fix ? 'none' : fix.accuracyM <= 15 ? 'good' : fix.accuracyM <= site.minAccuracyM ? 'fair' : 'poor';
  const radiusM = site.geofence.kind === 'circle' ? site.geofence.radiusM : undefined;

  const title = !usable
    ? fix
      ? t('home.waitingTitle')
      : t('home.waitingTitle')
    : distance === 0
      ? t('home.youAreOnSite')
      : t('home.awayTitle', { distance: formatDistance(distance ?? 0, t) });
  const sub = !usable
    ? t('home.zoneNeedsFix')
    : distance === 0
      ? t('home.zoneInside')
      : radiusM
        ? t('home.zoneRadius', { m: radiusM })
        : t('home.zoneNeedsFix');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('map.title')}
      onPress={() => router.push({ pathname: '/map', params: { assignmentId: assignment.id } })}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>
      <View style={styles.mapWrap}>
        <SiteMap site={site} user={fix} snapshot style={styles.map} />
        {!fix ? (
          <View style={[StyleSheet.absoluteFill, styles.searching, { backgroundColor: `${colors.card}B3` }]}>
            <ActivityIndicator color={colors.primary} />
            <Text variant="caption" style={styles.searchLabel}>
              {t('home.findingPosition')}
            </Text>
          </View>
        ) : null}
        <View style={styles.chip}>
          <GpsBars level={level} label={fix ? t('home.gpsAccuracy', { m: Math.round(fix.accuracyM) }) : t('home.gpsNone')} />
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.flex}>
          <Text variant="lead">{title}</Text>
          <Text variant="small" tone="muted" style={styles.sub}>
            {sub}
          </Text>
        </View>
        <Text variant="caption" tone="primary" style={styles.link}>
          {t('home.openMap')} ›
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden' },
  mapWrap: { height: 150 },
  map: { flex: 1, borderRadius: 0, borderWidth: 0 },
  searching: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  searchLabel: { fontWeight: '700' },
  chip: { position: 'absolute', right: 8, top: 8 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: spacing.md },
  flex: { flex: 1 },
  sub: { fontWeight: '400' },
  link: { fontWeight: '700' },
});

import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatDistance } from '@/core/format';
import { useLivePosition, useLocationPermission } from '@/core/location/use-site-proximity';
import { useTheme } from '@/core/theme/theme-provider';
import { cameraColors, radius, spacing } from '@/core/theme/tokens';
import { repos } from '@/data';
import { qk } from '@/data/query-keys';
import { distanceToGeofenceM, haversineM } from '@/domain';
import { Banner, Button, Icon, SiteMap, StatusChip, Text } from '@/ui';

import { useAssignmentRecord } from '../home/queries';
import { useDirectionsSheet } from './directions-sheet';

const WALK_M_PER_MIN = 80;
const SHADOW = { shadowColor: cameraColors.navy, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 } as const;

export function MapScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const { data: assignment } = useQuery({ queryKey: qk.assignment(assignmentId), queryFn: () => repos.schedule.getAssignment(assignmentId) });
  const { data: record } = useAssignmentRecord(assignmentId);
  const permission = useLocationPermission();
  const fix = useLivePosition(permission.ready);
  const directions = useDirectionsSheet();
  const [recenterKey, setRecenterKey] = useState(0);
  const [toastDismissed, setToastDismissed] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(320);

  if (!assignment) return <View style={[styles.root, { backgroundColor: colors.map }]} />;

  const { site } = assignment;
  const radiusM = site.geofence.kind === 'circle' ? site.geofence.radiusM : 100;
  const weak = !!fix && fix.accuracyM > site.minAccuracyM;
  const meters = fix ? Math.round(distanceToGeofenceM(fix, site.geofence)) : undefined;
  const inside = !!fix && !weak && meters === 0;
  const checkedIn = !!record?.checkInAt;
  const canCheckIn = inside && !checkedIn;
  const direct = fix ? Math.round(haversineM(fix, site.center)) : undefined;

  const btn = checkedIn
    ? { label: t('map.btnCheckedIn'), sub: t('map.btnCheckedInSub'), bg: colors.success, fg: cameraColors.bg }
    : canCheckIn
      ? { label: t('home.checkIn'), sub: t('map.btnOnSite'), bg: colors.primary, fg: colors.onPrimary }
      : weak
        ? { label: t('map.btnWaiting'), sub: t('map.btnWaitingSub', { m: Math.round(fix.accuracyM) }), bg: colors.line, fg: colors.muted }
        : { label: t('map.btnOutside'), sub: t('map.btnOutsideSub', { m: radiusM }), bg: colors.line, fg: colors.muted };

  const goCheckIn = () => router.replace({ pathname: '/check-in', params: { assignmentId } });

  return (
    <View style={[styles.root, { backgroundColor: colors.map }]}>
      <SiteMap site={site} user={fix} interactive recenterKey={recenterKey} style={styles.map} />

      <View style={[styles.top, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={() => router.back()}
            style={[styles.back, SHADOW, { backgroundColor: colors.card }]}>
            <Icon name="chevron-back" size={24} />
          </Pressable>
          <View style={[styles.titlePill, SHADOW, { backgroundColor: colors.card }]}>
            <Text variant="subheading" numberOfLines={1} style={styles.titleText}>
              {site.name}
            </Text>
          </View>
        </View>

        {weak ? (
          <View style={SHADOW}>
            <Banner tone="warning" icon="warning-outline" text={t('map.weakGps', { m: Math.round(fix.accuracyM) })} />
          </View>
        ) : null}

        {canCheckIn && !toastDismissed ? (
          <View style={[styles.toast, SHADOW]}>
            <Text tone="onPrimary" style={styles.toastText}>
              {t('map.arrivedToast', { site: site.name })}
            </Text>
            <Pressable accessibilityRole="button" onPress={goCheckIn} style={[styles.toastBtn, { backgroundColor: colors.success }]}>
              <Text style={styles.toastBtnLabel}>{t('home.checkIn')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('map.dismiss')}
              onPress={() => setToastDismissed(true)}
              style={styles.dismiss}>
              <Icon name="close" size={20} tone="onPrimary" />
            </Pressable>
          </View>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => setRecenterKey((k) => k + 1)}
        style={[styles.recenter, SHADOW, { backgroundColor: colors.card, bottom: sheetHeight + spacing.lg }]}>
        <Icon name="locate" size={18} tone="primary" />
        <Text tone="primary" style={styles.recenterLabel}>
          {t('map.recenter')}
        </Text>
      </Pressable>

      <View
        onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
        style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + spacing.lg, shadowColor: cameraColors.navy }]}>
        <View style={[styles.handle, { backgroundColor: colors.line }]} />
        <View style={styles.siteRow}>
          <View style={styles.flex}>
            <Text variant="hero" style={styles.siteName}>
              {site.name}
            </Text>
            <Text variant="caption" tone="muted">
              {site.address}
            </Text>
          </View>
          <StatusChip tone={inside ? 'success' : 'info'} label={inside ? t('map.insideZone') : t('map.outsideZone')} />
        </View>

        <View style={styles.tiles}>
          <View style={[styles.tile, { backgroundColor: colors.soft }]}>
            <Text variant="label" tone="muted" style={styles.tileLabel}>
              {inside ? t('map.position') : t('map.distanceWalk', { min: Math.max(1, Math.ceil((direct ?? 0) / WALK_M_PER_MIN)) })}
            </Text>
            <Text variant="section">{inside ? t('map.onSiteValue') : direct === undefined ? '–' : formatDistance(direct, t)}</Text>
          </View>
          <View style={[styles.tile, { backgroundColor: colors.soft }]}>
            <Text variant="label" tone="muted" style={styles.tileLabel}>
              {t('map.scheduled')}
            </Text>
            <Text variant="section">
              {assignment.start} – {assignment.end}
            </Text>
          </View>
        </View>

        <Button variant="outlinePrimary" icon="navigate" label={t('map.directions')} onPress={() => directions.open(site.center, site.name)} />

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canCheckIn }}
          disabled={!canCheckIn}
          onPress={goCheckIn}
          style={[styles.cta, { backgroundColor: btn.bg }]}>
          <Text variant="heading" style={{ color: btn.fg }}>
            {btn.label}
          </Text>
          <Text variant="small" style={[styles.ctaSub, { color: btn.fg }]}>
            {btn.sub}
          </Text>
        </Pressable>
      </View>

      {directions.sheet}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  map: { ...StyleSheet.absoluteFill, borderRadius: 0, borderWidth: 0 },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.lg, gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  titlePill: { flex: 1, height: 48, borderRadius: 24, justifyContent: 'center', paddingHorizontal: spacing.lg },
  titleText: { fontWeight: '800' },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.button, backgroundColor: cameraColors.navy, paddingVertical: spacing.md, paddingLeft: spacing.lg, paddingRight: spacing.md },
  toastText: { flex: 1, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  toastBtn: { minHeight: 44, paddingHorizontal: spacing.lg, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  toastBtnLabel: { color: cameraColors.onAccent, fontSize: 15, fontWeight: '800' },
  dismiss: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  recenter: { position: 'absolute', left: spacing.lg, minHeight: 48, paddingHorizontal: spacing.lg, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 6 },
  recenterLabel: { fontSize: 15, fontWeight: '800' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: 10,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    shadowOpacity: 0.2,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -8 },
    elevation: 12,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3 },
  siteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  siteName: { fontSize: 21 },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: { flex: 1, borderRadius: radius.field, paddingVertical: 10, paddingHorizontal: spacing.md },
  tileLabel: { fontWeight: '400', letterSpacing: 0, textTransform: 'none' },
  cta: { minHeight: 64, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', gap: 1 },
  ctaSub: { fontWeight: '600' },
});

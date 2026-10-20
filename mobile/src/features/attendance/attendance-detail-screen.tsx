import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { capitalize, formatDate, formatTime } from '@/core/format';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing, type ThemeColors } from '@/core/theme/tokens';
import { repos } from '@/data';
import { workedMinutes, type CorrectionRequest, type Flag } from '@/domain';
import { BackHeader, Button, Icon, Screen, SiteMap, StatusChip, Text, type TextProps } from '@/ui';

import { useAttendanceRecord, useCorrections } from './queries';
import { STATUS_TONE } from './status';

const pad = (n: number) => String(n).padStart(2, '0');
const hm = (minutes: number) => `${Math.floor(minutes / 60)}h ${pad(Math.round(minutes % 60))}`;

const KIND_KEY = { forgot_checkout: 'attendance.kindForgotCheckout', wrong_time: 'attendance.kindWrongTime', flagged_incorrectly: 'attendance.kindFlaggedIncorrectly' } as const;
const CORRECTION: Record<CorrectionRequest['status'], { bg: keyof ThemeColors; fg: NonNullable<TextProps['tone']>; label: string }> = {
  pending: { bg: 'warningBg', fg: 'warningFg', label: 'attendance.correctionPending' },
  accepted: { bg: 'successBg', fg: 'successFg', label: 'attendance.correctionAccepted' },
  declined: { bg: 'dangerBg', fg: 'dangerFg', label: 'attendance.correctionDeclined' },
};

function Tile({ label, value, tone = 'ink' }: { label: string; value: string; tone?: NonNullable<TextProps['tone']> }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: colors.card, borderColor: colors.line }]}>
      <Text variant="label" tone="muted" style={styles.tileLabel}>
        {label}
      </Text>
      <Text style={styles.tileValue} tone={tone}>
        {value}
      </Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.between}>
      <Text tone="muted" style={styles.rowText}>
        {label}
      </Text>
      <Text style={[styles.rowText, styles.rowValue]}>{value}</Text>
    </View>
  );
}

export function AttendanceDetailScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const lang = i18n.language;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: r } = useAttendanceRecord(id);
  const { data: corrections = [] } = useCorrections(id);
  const { data: site } = useQuery({
    queryKey: ['attendance', 'site', r?.date, r?.site.id],
    enabled: !!r,
    queryFn: async () => (await repos.schedule.getRange(r!.date, r!.date)).find((a) => a.site.id === r!.site.id)?.site ?? null,
  });
  if (!r) return <Screen>{null}</Screen>;

  const worked = r.checkInAt && r.checkOutAt ? workedMinutes(new Date(r.checkInAt), new Date(r.checkOutAt)) : undefined;
  const absentLike = r.status === 'absent' || r.status === 'on_leave' || r.status === 'holiday';
  const outside = r.flags.find((f) => f.reason === 'OUTSIDE_GEOFENCE');
  const method =
    r.method === 'proxy' ? t('attendance.methodProxy', { name: r.proxyBy ?? '' }) : r.method === 'qr' ? t('attendance.methodQr') : t('attendance.methodSelf');
  const position = outside
    ? t('attendance.positionOutside', { m: outside.distanceM ?? 0 })
    : r.method === 'proxy'
      ? t('attendance.positionManager')
      : r.method === 'qr'
        ? t('attendance.positionQr')
        : t('attendance.positionInside');

  const latest = [...corrections].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const pending = latest?.status === 'pending';
  const banner = latest ? CORRECTION[latest.status] : undefined;
  const response =
    latest?.status === 'accepted'
      ? [t('attendance.acceptedBy'), latest.decidedAt ? formatDate(latest.decidedAt, 'd MMM', lang) : null].filter(Boolean).join(' · ')
      : latest?.status === 'declined'
        ? [t('attendance.declinedBy'), latest.adminResponse].filter(Boolean).join(' · ')
        : t('attendance.awaitingReview');

  // The stored record has no GPS fix, so the snapshot places the user from the flagged distance (north of the site centre).
  const user = site && outside?.distanceM ? { lat: site.center.lat + outside.distanceM / 111_000, lng: site.center.lng } : undefined;

  const outcome = (f: Flag) => {
    void f;
    return r.flagOutcome === 'approved'
      ? { label: t('attendance.outcomeApproved'), bg: 'successBg' as const, fg: 'successFg' as const }
      : r.flagOutcome === 'rejected'
        ? { label: t('attendance.outcomeRejected'), bg: 'dangerBg' as const, fg: 'dangerFg' as const }
        : { label: t('attendance.outcomeReview'), bg: 'warningBg' as const, fg: 'warningFg' as const };
  };

  return (
    <Screen contentStyle={styles.content}>
      <BackHeader title={t('attendance.headerTitle')} variant="heading" />

      <View>
        <StatusChip tone={STATUS_TONE[r.status]} label={t(`status.${r.status}`)} />
        <Text variant="headline" style={styles.date}>
          {capitalize(formatDate(r.date, 'EEE d MMMM', lang))}
        </Text>
        <Text tone="muted" style={styles.site}>
          {r.site.name}
        </Text>
      </View>

      {latest && banner ? (
        <View style={[styles.banner, { backgroundColor: colors[banner.bg] }]}>
          <View style={styles.between}>
            <Text tone={banner.fg} style={styles.bannerTitle}>
              {t('attendance.correctionRequest')}
            </Text>
            <View style={[styles.bannerPill, { backgroundColor: colors.card }]}>
              <Text variant="small" tone={banner.fg} style={styles.bannerPillLabel}>
                {t(banner.label)}
              </Text>
            </View>
          </View>
          <Text variant="caption" tone={banner.fg}>
            {t(KIND_KEY[latest.kind])} · {t('attendance.proposedAt', { time: latest.proposedTime ?? '—' })}
          </Text>
          <Text variant="caption" tone={banner.fg} style={styles.bannerResponse}>
            {response}
          </Text>
        </View>
      ) : null}

      {!absentLike ? (
        <View style={styles.tiles}>
          <Tile label={t('attendance.checkInLabel')} value={r.checkInAt ? formatTime(r.checkInAt) : '—'} />
          <Tile
            label={t('attendance.checkOutLabel')}
            value={r.checkOutAt ? formatTime(r.checkOutAt) : t('attendance.missing')}
            tone={r.checkOutAt ? 'ink' : 'flag'}
          />
          <Tile label={t('attendance.hours')} value={worked === undefined ? '—' : hm(worked)} />
        </View>
      ) : null}

      {!absentLike ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>
          <Row label={t('attendance.scheduled')} value={`${r.scheduledStart} – ${r.scheduledEnd}`} />
          <Row label={t('attendance.method')} value={method} />
          <Row label={t('attendance.position')} value={position} />
        </View>
      ) : null}

      {!absentLike && site ? (
        <View style={styles.snapshot}>
          <SiteMap site={site} user={user} snapshot style={styles.snapshotMap} />
          <View style={[styles.snapshotPill, { backgroundColor: colors.card }]}>
            <Text variant="label" style={styles.snapshotLabel}>
              {t('attendance.snapshot', { time: r.checkInAt ? formatTime(r.checkInAt) : '—' })}
            </Text>
          </View>
        </View>
      ) : null}

      {r.flags.length > 0 ? (
        <View style={styles.flags}>
          <Text tone="muted" style={styles.flagsTitle}>
            {t('attendance.flagsTitle')}
          </Text>
          {r.flags.map((f) => {
            const o = outcome(f);
            return (
              <View key={f.reason} style={[styles.flag, { backgroundColor: colors.card, borderColor: colors.line }]}>
                <View style={styles.flagTop}>
                  <Icon name="flag" size={18} tone="flag" />
                  <Text style={styles.flagText}>{t(`check.flagReasons.${f.reason}`, { distance: f.distanceM ?? 0 })}</Text>
                  <View style={[styles.flagPill, { backgroundColor: colors[o.bg] }]}>
                    <Text variant="small" tone={o.fg} style={styles.bannerPillLabel}>
                      {o.label}
                    </Text>
                  </View>
                </View>
                {r.flagOutcome === undefined || r.flagOutcome === 'pending' ? (
                  <Text variant="caption" tone="muted" style={styles.flagSub}>
                    {t('attendance.flagWaiting')}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}

      {r.adminNote ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>
          <Text style={styles.noteTitle}>{t('attendance.adminNotes')}</Text>
          <Text tone="muted" style={styles.note}>
            {r.adminNote}
          </Text>
        </View>
      ) : null}

      <Button
        label={pending ? t('attendance.correctionPendingReview') : latest ? t('attendance.requestAnother') : t('attendance.requestCorrection')}
        variant={pending ? 'soft' : 'primary'}
        disabled={pending}
        onPress={() => router.push({ pathname: '/attendance/correction', params: { id: r.id } })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  date: { marginTop: 10 },
  site: { fontSize: 16, marginTop: 4 },
  banner: { borderRadius: radius.button, paddingVertical: spacing.md, paddingHorizontal: 14, gap: 4 },
  bannerTitle: { fontSize: 15, fontWeight: '800' },
  bannerPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  bannerPillLabel: { fontWeight: '800' },
  bannerResponse: { fontWeight: '700' },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: { flex: 1, borderWidth: 1, borderRadius: radius.button, padding: spacing.md },
  tileLabel: { fontWeight: '400', letterSpacing: 0, textTransform: 'none' },
  tileValue: { fontSize: 20, fontWeight: '800', lineHeight: 25 },
  card: { borderWidth: 1, borderRadius: radius.row, padding: 14, gap: 10 },
  rowText: { fontSize: 15 },
  rowValue: { fontWeight: '800', flexShrink: 1, textAlign: 'right' },
  snapshot: { height: 120, borderRadius: radius.row, overflow: 'hidden' },
  snapshotMap: { flex: 1, borderRadius: 0, borderWidth: 0 },
  snapshotPill: { position: 'absolute', left: 8, bottom: 8, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  snapshotLabel: { letterSpacing: 0, fontWeight: '700', textTransform: 'none' },
  flags: { gap: spacing.sm },
  flagsTitle: { fontSize: 15, fontWeight: '800' },
  flag: { borderWidth: 1, borderRadius: radius.button, paddingVertical: spacing.md, paddingHorizontal: 14, gap: 6 },
  flagTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  flagText: { flex: 1, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  flagPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  flagSub: { paddingLeft: 28 },
  noteTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  note: { fontSize: 15, lineHeight: 22 },
});

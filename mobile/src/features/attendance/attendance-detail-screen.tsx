import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatDuration, formatTime } from '@/core/format';
import { spacing } from '@/core/theme/tokens';
import { workedMinutes, type CorrectionStatus } from '@/domain';
import { Button, Card, Icon, Pill, Screen, Text, type PillTone } from '@/ui';

import { useAttendanceRecord, useCorrections } from './queries';
import { STATUS_TONE } from './status';

const CORRECTION_TONE: Record<CorrectionStatus, PillTone> = { pending: 'warning', accepted: 'success', declined: 'danger' };

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.between}>
      <Text tone="muted">{label}</Text>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}

export function AttendanceDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: r } = useAttendanceRecord(id);
  const { data: corrections = [] } = useCorrections(id);
  if (!r) return <Screen>{null}</Screen>;

  const worked = r.checkInAt && r.checkOutAt ? workedMinutes(new Date(r.checkInAt), new Date(r.checkOutAt)) : undefined;
  const method =
    r.method === 'proxy' ? t('attendance.methodProxy', { name: r.proxyBy ?? '' }) : r.method === 'qr' ? t('attendance.methodQr') : t('attendance.methodSelf');
  const outcome = r.flagOutcome === 'approved' ? 'flagApproved' : r.flagOutcome === 'rejected' ? 'flagRejected' : 'flagPending';

  return (
    <Screen
      footer={<Button variant="secondary" icon="create-outline" label={t('attendance.requestCorrection')} onPress={() => router.push({ pathname: '/attendance/correction', params: { id: r.id } })} />}>
      <View style={styles.head}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
          <Icon name="chevron-back" />
        </Pressable>
        <View style={styles.flex}>
          <Text variant="heading">{r.date}</Text>
          <Text tone="muted" variant="caption">{r.site.name}</Text>
        </View>
        <Pill tone={STATUS_TONE[r.status]} label={t(`status.${r.status}`)} />
      </View>

      <Card>
        <Row label={t('attendance.scheduled')} value={`${r.scheduledStart} – ${r.scheduledEnd}`} />
        <Row label={t('attendance.actual')} value={`${r.checkInAt ? formatTime(r.checkInAt) : '–'} – ${r.checkOutAt ? formatTime(r.checkOutAt) : '–'}`} />
        {worked !== undefined ? <Row label={t('attendance.hoursWorked')} value={formatDuration(worked, t)} /> : null}
        <Row label={t('attendance.method')} value={method} />
      </Card>

      {r.flags.length > 0 ? (
        <Card>
          <View style={styles.between}>
            <Text variant="subheading">{t('attendance.flagOutcome')}</Text>
            <Pill tone={r.flagOutcome === 'approved' ? 'success' : r.flagOutcome === 'rejected' ? 'danger' : 'warning'} label={t(`attendance.${outcome}`)} />
          </View>
          {r.flags.map((f) => (
            <Text key={f.reason} variant="caption">• {t(`check.flagReasons.${f.reason}`, { distance: f.distanceM ?? 0 })}</Text>
          ))}
          {r.employeeComment ? <Row label={t('attendance.yourComment')} value={r.employeeComment} /> : null}
        </Card>
      ) : null}

      {r.adminNote ? (
        <Card>
          <Text variant="label" tone="muted">{t('attendance.adminNote').toUpperCase()}</Text>
          <Text>{r.adminNote}</Text>
        </Card>
      ) : null}

      {corrections.length > 0 ? (
        <Card>
          <Text variant="subheading">{t('attendance.corrections')}</Text>
          {corrections.map((c) => (
            <View key={c.id} style={styles.between}>
              <Text style={styles.flex} numberOfLines={2}>{c.comment}</Text>
              <Pill tone={CORRECTION_TONE[c.status]} label={t(`attendance.correction${c.status[0].toUpperCase()}${c.status.slice(1)}`)} />
            </View>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
});

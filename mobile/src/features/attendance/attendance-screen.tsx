import { format } from 'date-fns';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { formatTime } from '@/core/format';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import type { AttendanceRecord, AttendanceStatus } from '@/domain';
import { Calendar, Card, EmptyState, Icon, Pill, Screen, Segmented, Text } from '@/ui';

import { useMonthAttendance } from './queries';
import { ALL_STATUSES, STATUS_BG, STATUS_TONE } from './status';

type ViewMode = 'calendar' | 'list';

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.summary}>
      <Text variant="heading">{value}</Text>
      <Text variant="caption" tone="muted">{label}</Text>
    </Card>
  );
}

function RecordRow({ record }: { record: AttendanceRecord }) {
  const { t } = useTranslation();
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/attendance/[id]', params: { id: record.id } })}>
      <Card style={styles.row}>
        <View style={styles.flex}>
          <Text variant="bodyStrong">{record.date}</Text>
          <Text variant="caption" tone="muted">{record.site.name}</Text>
          <Text variant="caption" tone="muted">
            {record.checkInAt ? formatTime(record.checkInAt) : '–'} → {record.checkOutAt ? formatTime(record.checkOutAt) : t('attendance.noCheckout')}
          </Text>
        </View>
        {record.flags.length > 0 ? <Icon name="flag" size={18} tone="warning" /> : null}
        <Pill tone={STATUS_TONE[record.status]} label={t(`status.${record.status}`)} />
      </Card>
    </Pressable>
  );
}

export function AttendanceScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const [month, setMonth] = useState(() => new Date());
  const [mode, setMode] = useState<ViewMode>('calendar');
  const [filter, setFilter] = useState<AttendanceStatus | null>(null);
  const { data } = useMonthAttendance(format(month, 'yyyy-MM'));

  const records = (data?.records ?? []).filter((r) => !filter || r.status === filter);
  const byDate = new Map((data?.records ?? []).map((r) => [r.date, r]));
  const s = data?.summary;

  return (
    <Screen>
      <Text variant="title">{t('attendance.title')}</Text>

      <View style={styles.summaryGrid}>
        <SummaryCard label={t('attendance.present')} value={String(s?.present ?? '–')} />
        <SummaryCard label={t('attendance.lates')} value={String(s?.late ?? '–')} />
        <SummaryCard label={t('attendance.absences')} value={String(s?.absent ?? '–')} />
        <SummaryCard label={t('attendance.hours')} value={String(s?.hoursWorked ?? '–')} />
        <SummaryCard label={t('attendance.leaveDays')} value={String(s?.leaveDays ?? '–')} />
        <SummaryCard label={t('attendance.overtime')} value={s ? `${s.overtimeHours}h` : '–'} />
      </View>

      <Segmented<ViewMode>
        options={[
          { value: 'calendar', label: t('attendance.calendar') },
          { value: 'list', label: t('attendance.list') },
        ]}
        value={mode}
        onChange={setMode}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} accessibilityLabel={t('attendance.filter')}>
        {[null, ...ALL_STATUSES].map((st) => {
          const active = filter === st;
          return (
            <Pressable
              key={st ?? 'all'}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setFilter(st)}
              style={[styles.chip, { backgroundColor: active ? colors.primary : colors.card, borderColor: colors.line }]}>
              <Text variant="caption" tone={active ? 'onPrimary' : 'ink'} style={styles.chipLabel}>
                {st ? t(`status.${st}`) : t('common.all')}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {mode === 'calendar' ? (
        <Calendar
          month={month}
          onMonthChange={setMonth}
          lang={i18n.language}
          marks={(iso) => {
            const r = byDate.get(iso);
            const hidden = r && filter && r.status !== filter;
            return r && !hidden ? { bg: STATUS_BG[r.status], label: t(`status.${r.status}`) } : {};
          }}
          onSelect={(iso) => {
            const r = byDate.get(iso);
            if (r) router.push({ pathname: '/attendance/[id]', params: { id: r.id } });
          }}
        />
      ) : records.length === 0 ? (
        <EmptyState icon="document-text-outline" title={t('attendance.empty')} body={t('attendance.emptyBody')} />
      ) : (
        records.map((r) => <RecordRow key={r.id} record={r} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summary: { width: '31.5%', padding: spacing.md, gap: 0 },
  filters: { gap: spacing.sm },
  chip: { minHeight: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center' },
  chipLabel: { fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});

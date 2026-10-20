import { addMonths, format, isAfter, isSameMonth, startOfMonth } from 'date-fns';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { capitalize, formatDate, formatTime } from '@/core/format';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing, type ThemeColors } from '@/core/theme/tokens';
import { toIsoDate, workedMinutes, type AttendanceRecord } from '@/domain';
import { Calendar, Icon, RoundButton, Screen, Segmented, StatusChip, Text, type DayMark, type TextProps } from '@/ui';

import { useMonthAttendance } from './queries';
import { GROUP_DOT, GROUPS, inGroup, STATUS_BG, STATUS_TONE, type StatusGroup } from './status';

type ViewMode = 'calendar' | 'list';

const pad = (n: number) => String(n).padStart(2, '0');
/** "7h 05" as in the design. */
const hm = (minutes: number) => `${Math.floor(minutes / 60)}h ${pad(Math.round(minutes % 60))}`;
const GROUP_LABEL = { present: 'attendance.filterPresent', late: 'attendance.filterLate', absent: 'attendance.filterAbsent', leave: 'attendance.filterLeave' } as const;

function Summary({ label, value, tone = 'ink' }: { label: string; value: string; tone?: NonNullable<TextProps['tone']> }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.line }]}>
      <Text style={styles.summaryValue} tone={tone}>
        {value}
      </Text>
      <Text variant="small" tone="muted" style={styles.summaryLabel}>
        {label}
      </Text>
    </View>
  );
}

function RecordRow({ record, lang }: { record: AttendanceRecord; lang: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const absent = record.status === 'absent';
  const leave = record.status === 'on_leave' || record.status === 'holiday';
  const times = absent
    ? t('attendance.noCheckIn')
    : leave
      ? t('attendance.notRequired')
      : `${record.checkInAt ? formatTime(record.checkInAt) : '–'} → ${record.checkOutAt ? formatTime(record.checkOutAt) : t('attendance.noCheckout')}`;
  const worked = record.checkInAt && record.checkOutAt ? hm(workedMinutes(new Date(record.checkInAt), new Date(record.checkOutAt))) : '';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/attendance/[id]', params: { id: record.id } })}
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.line }]}>
      <View style={[styles.dateTile, { backgroundColor: colors.soft }]}>
        <Text variant="label" tone="muted" style={styles.dow}>
          {capitalize(formatDate(record.date, 'EEE', lang))}
        </Text>
        <Text style={styles.dayNum}>{Number(record.date.slice(8, 10))}</Text>
      </View>
      <View style={styles.flex}>
        <Text variant="subheading" numberOfLines={1} style={styles.site}>
          {record.site.name}
        </Text>
        <Text variant="caption" tone="muted">
          {times}
        </Text>
      </View>
      <View style={styles.right}>
        <View style={styles.statusRow}>
          {record.flags.length > 0 ? <Icon name="flag" size={15} tone="flag" /> : null}
          <StatusChip tone={STATUS_TONE[record.status]} label={t(`status.${record.status}`)} />
        </View>
        <Text variant="caption" style={styles.hours}>
          {worked}
        </Text>
      </View>
    </Pressable>
  );
}

export function AttendanceScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const lang = i18n.language;
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [mode, setMode] = useState<ViewMode>('calendar');
  const [filter, setFilter] = useState<StatusGroup | null>(null);
  const { data } = useMonthAttendance(format(month, 'yyyy-MM'));

  const all = data?.records ?? [];
  const hasData = all.length > 0;
  const records = all.filter((r) => inGroup(r.status, filter));
  const byDate = new Map(all.map((r) => [r.date, r]));
  const s = data?.summary;
  const today = toIsoDate(new Date());
  const onCurrentMonth = isSameMonth(month, new Date());

  const marks = (iso: string): DayMark => {
    const r = byDate.get(iso);
    const base: DayMark = { ring: iso === today, faint: iso > today || [0, 6].includes(new Date(`${iso}T12:00:00`).getDay()) };
    if (!r) return base;
    const hidden = !inGroup(r.status, filter);
    return { ...base, bg: STATUS_BG[r.status], flag: r.flags.length > 0, dim: hidden, label: t(`status.${r.status}`), faint: false };
  };

  return (
    <Screen contentStyle={styles.content}>
      <Text variant="title">{t('attendance.myAttendance')}</Text>

      <View style={styles.monthNav}>
        <RoundButton icon="chevron-back" label={t('common.previousMonth')} onPress={() => setMonth(addMonths(month, -1))} />
        <Text variant="lead">{capitalize(formatDate(month, 'MMMM yyyy', lang))}</Text>
        <RoundButton
          icon="chevron-forward"
          label={t('common.nextMonth')}
          disabled={onCurrentMonth || isAfter(addMonths(month, 1), new Date())}
          onPress={() => setMonth(addMonths(month, 1))}
        />
      </View>

      {hasData ? (
        <View style={styles.summaryGrid}>
          <Summary label={t('attendance.present')} value={String(s ? s.present : '–')} tone="successFg" />
          <Summary label={t('attendance.lates')} value={String(s?.late ?? '–')} tone="warning" />
          <Summary label={t('attendance.absences')} value={String(s?.absent ?? '–')} tone="flag" />
          <Summary label={t('attendance.hours')} value={s ? hm(s.hoursWorked * 60) : '–'} />
          <Summary label={t('attendance.leaveDays')} value={String(s?.leaveDays ?? '–')} tone="primary" />
          <Summary label={t('attendance.overtime')} value={s ? hm(s.overtimeHours * 60) : '–'} />
        </View>
      ) : null}

      <Segmented<ViewMode>
        options={[
          { value: 'calendar', label: t('attendance.calendar') },
          { value: 'list', label: t('attendance.list') },
        ]}
        value={mode}
        onChange={setMode}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterOuter}
        contentContainerStyle={styles.filters}
        accessibilityLabel={t('attendance.filter')}>
        {[null, ...GROUPS].map((g) => {
          const active = filter === g;
          const dot: keyof ThemeColors = g ? GROUP_DOT[g] : 'ink';
          return (
            <Pressable
              key={g ?? 'all'}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setFilter(g)}
              style={[styles.chip, { backgroundColor: active ? colors.ink : colors.card, borderColor: active ? colors.ink : colors.fieldBorder }]}>
              <View style={[styles.chipDot, { backgroundColor: colors[dot] }]} />
              <Text variant="caption" style={[styles.chipLabel, { color: active ? colors.bg : colors.ink }]}>
                {g ? t(GROUP_LABEL[g]) : t('common.all')}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {!hasData || (mode === 'list' && records.length === 0) ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.fieldBorder }]}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.soft }]}>
            <Icon name="time-outline" size={26} tone="muted" />
          </View>
          <Text variant="section">{hasData ? t('attendance.emptyNoMatch') : t('attendance.emptyNoData')}</Text>
          <Text variant="caption" tone="muted" style={styles.center}>
            {hasData ? t('attendance.emptyNoMatchBody') : t('attendance.emptyNoDataBody')}
          </Text>
        </View>
      ) : mode === 'calendar' ? (
        <Calendar
          month={month}
          onMonthChange={setMonth}
          lang={lang}
          hideHeader
          card
          marks={marks}
          legend={[
            { label: t('attendance.filterPresent'), color: 'successBg' },
            { label: t('attendance.filterLate'), color: 'warningBg' },
            { label: t('attendance.filterAbsent'), color: 'dangerBg' },
            { label: t('attendance.filterLeave'), color: 'infoBg' },
            { label: t('attendance.flagged'), color: 'flag', glyph: '⚑' },
          ]}
          onSelect={(iso) => {
            const r = byDate.get(iso);
            if (r) router.push({ pathname: '/attendance/[id]', params: { id: r.id } });
          }}
        />
      ) : (
        <View style={styles.list}>
          {records.map((r) => (
            <RecordRow key={r.id} record={r} lang={lang} />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  content: { gap: 14 },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summary: { width: '31.5%', flexGrow: 1, borderWidth: 1, borderRadius: radius.button, paddingVertical: spacing.md, paddingHorizontal: 10, gap: 2 },
  summaryValue: { fontSize: 24, fontWeight: '800', lineHeight: 29 },
  summaryLabel: { fontWeight: '400', lineHeight: 16 },
  filterOuter: { marginHorizontal: -spacing.xl, flexGrow: 0 },
  filters: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  chip: { minHeight: 44, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipLabel: { fontWeight: '700' },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderRadius: radius.row, padding: spacing.md, minHeight: 44 },
  dateTile: { width: 48, borderRadius: radius.md, paddingVertical: 6, alignItems: 'center' },
  dow: { letterSpacing: 0, fontWeight: '700' },
  dayNum: { fontSize: 20, fontWeight: '800', lineHeight: 22 },
  site: { fontWeight: '800' },
  right: { alignItems: 'flex-end', gap: 5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hours: { fontWeight: '800' },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.lg, paddingVertical: 32, paddingHorizontal: spacing.xl, alignItems: 'center', gap: spacing.sm },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});

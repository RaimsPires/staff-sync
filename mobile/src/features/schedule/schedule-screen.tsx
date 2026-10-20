import { addDays, startOfWeek } from 'date-fns';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { capitalize, formatDate } from '@/core/format';
import { useTheme } from '@/core/theme/theme-provider';
import { MIN_TOUCH, radius, spacing } from '@/core/theme/tokens';
import { toIsoDate } from '@/domain';
import { Calendar, EmptyState, Icon, Pill, Screen, Segmented, Text, type DayMark } from '@/ui';

import { AssignmentRow } from './assignment-row';
import { useMonthSchedule } from './queries';

type View_ = 'week' | 'month';

export function ScheduleScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const [mode, setMode] = useState<View_>('week');
  const [selected, setSelected] = useState(() => toIsoDate(new Date()));
  const anchor = useMemo(() => new Date(`${selected}T12:00:00`), [selected]);
  const { assignments, holidays, leave } = useMonthSchedule(anchor);

  const isLeave = (iso: string) => leave.some((l) => iso >= l.start && iso <= l.end);
  const marks = (iso: string): DayMark => ({
    dot: assignments.some((a) => a.date === iso) ? 'primary' : undefined,
    bg: isLeave(iso) ? 'infoBg' : holidays.includes(iso) ? 'soft' : undefined,
  });

  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayItems = assignments.filter((a) => a.date === selected);

  return (
    <Screen>
      <Text variant="title">{t('tabs.schedule')}</Text>
      <Segmented<View_>
        options={[
          { value: 'week', label: t('schedule.week') },
          { value: 'month', label: t('schedule.month') },
        ]}
        value={mode}
        onChange={setMode}
      />

      {mode === 'week' ? (
        <View style={styles.week}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => setSelected(toIsoDate(addDays(anchor, -7)))} style={styles.nav}>
            <Icon name="chevron-back" />
          </Pressable>
          {week.map((d) => {
            const iso = toIsoDate(d);
            const active = iso === selected;
            const m = marks(iso);
            return (
              <Pressable
                key={iso}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSelected(iso)}
                style={[styles.day, { backgroundColor: active ? colors.primary : m.bg ? colors[m.bg] : colors.card, borderColor: colors.line }]}>
                <Text variant="label" tone={active ? 'onPrimary' : 'muted'}>{formatDate(d, 'EEEEE', i18n.language).toUpperCase()}</Text>
                <Text variant="bodyStrong" tone={active ? 'onPrimary' : 'ink'}>{d.getDate()}</Text>
                {m.dot ? <View style={[styles.dot, { backgroundColor: active ? colors.onPrimary : colors.primary }]} /> : null}
              </Pressable>
            );
          })}
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.continue')} onPress={() => setSelected(toIsoDate(addDays(anchor, 7)))} style={styles.nav}>
            <Icon name="chevron-forward" />
          </Pressable>
        </View>
      ) : (
        <Calendar
          month={anchor}
          onMonthChange={(m) => setSelected(toIsoDate(m))}
          lang={i18n.language}
          marks={marks}
          selected={selected}
          onSelect={setSelected}
        />
      )}

      <Text variant="subheading">{capitalize(formatDate(anchor, 'EEEE d MMMM', i18n.language))}</Text>
      <View style={styles.badges}>
        {isLeave(selected) ? <Pill tone="info" label={t('schedule.onLeave')} /> : null}
        {holidays.includes(selected) ? <Pill label={t('schedule.holiday')} /> : null}
      </View>

      {dayItems.length === 0 ? (
        <EmptyState icon="calendar-clear-outline" title={t('schedule.noAssignments')} body={t('schedule.noAssignmentsBody')} />
      ) : (
        dayItems.map((a) => <AssignmentRow key={a.id} assignment={a} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  week: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nav: { width: 28, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  day: { flex: 1, minHeight: 64, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  badges: { flexDirection: 'row', gap: spacing.sm },
});

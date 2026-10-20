import { addDays, addMonths, startOfWeek } from 'date-fns';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { capitalize, formatDate } from '@/core/format';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing, type ThemeColors } from '@/core/theme/tokens';
import { toIsoDate } from '@/domain';
import { useLeaveTypes } from '@/features/leave/queries';
import { useNextShift } from '@/features/home/queries';
import { BackHeader, Banner, Calendar, Icon, RoundButton, Screen, Segmented, Text, type DayMark } from '@/ui';

import { AssignmentRow } from './assignment-row';
import { useMonthSchedule } from './queries';

type View_ = 'week' | 'month';

export function ScheduleScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const lang = i18n.language;
  const [mode, setMode] = useState<View_>('week');
  const [selected, setSelected] = useState(() => toIsoDate(new Date()));
  const today = toIsoDate(new Date());
  const anchor = useMemo(() => new Date(`${selected}T12:00:00`), [selected]);
  const { assignments, holidays, leave } = useMonthSchedule(anchor);
  const leaveTypes = useLeaveTypes();

  const leaveOn = (iso: string) => leave.find((l) => iso >= l.start && iso <= l.end);
  const kindOf = (iso: string): 'leave' | 'holiday' | 'intervention' | 'shift' | 'none' => {
    if (leaveOn(iso)) return 'leave';
    if (holidays.includes(iso)) return 'holiday';
    const day = assignments.filter((a) => a.date === iso);
    if (day.some((a) => a.type === 'intervention')) return 'intervention';
    return day.length ? 'shift' : 'none';
  };
  const DOT: Record<string, keyof ThemeColors | undefined> = { leave: 'primary', holiday: 'purpleFg', intervention: 'warning', shift: 'ink', none: undefined };
  const marks = (iso: string): DayMark => ({ dot: DOT[kindOf(iso)], ring: iso === today && iso !== selected });

  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayItems = assignments.filter((a) => a.date === selected).sort((a, b) => a.start.localeCompare(b.start));
  const kind = kindOf(selected);
  const nextShift = useNextShift(kind === 'none');
  const changed = dayItems.find((a) => a.updatedByAdmin && a.previousStart);

  const rangeLabel =
    mode === 'week'
      ? `${formatDate(week[0], 'd', lang)} – ${formatDate(week[6], 'd MMMM', lang)}`
      : capitalize(formatDate(anchor, 'MMMM yyyy', lang));
  const step = (dir: 1 | -1) => setSelected(toIsoDate(mode === 'week' ? addDays(anchor, 7 * dir) : addMonths(anchor, dir)));
  const dayLabel = `${selected === today ? `${t('schedule.today')} · ` : ''}${capitalize(formatDate(anchor, 'EEE d MMMM', lang))}`;

  const leaveType = leaveOn(selected) ? leaveTypes.data?.find((l) => l.id === leaveOn(selected)?.typeId)?.name[lang === 'fr' ? 'fr' : 'en'] : undefined;

  return (
    <Screen contentStyle={styles.content}>
      <BackHeader
        title={t('tabs.schedule')}
        right={
          <View style={styles.toggle}>
            <Segmented<View_>
              options={[
                { value: 'week', label: t('schedule.week') },
                { value: 'month', label: t('schedule.month') },
              ]}
              value={mode}
              onChange={setMode}
            />
          </View>
        }
      />

      <View style={styles.range}>
        <RoundButton icon="chevron-back" label={t('schedule.previous')} onPress={() => step(-1)} />
        <Text variant="lead">{rangeLabel}</Text>
        <RoundButton icon="chevron-forward" label={t('schedule.next')} onPress={() => step(1)} />
      </View>

      {mode === 'week' ? (
        <View style={styles.strip}>
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
                style={[
                  styles.day,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: iso === today && !active ? colors.primary : colors.line,
                    borderWidth: iso === today && !active ? 2 : 1,
                  },
                ]}>
                <Text variant="label" tone={active ? 'onPrimary' : 'ink'} style={styles.dow}>
                  {capitalize(formatDate(d, 'EEE', lang))}
                </Text>
                <Text style={[styles.dayNum, { color: active ? colors.onPrimary : colors.ink }]}>{d.getDate()}</Text>
                <View style={[styles.dot, { backgroundColor: m.dot ? (active ? colors.onPrimary : colors[m.dot]) : 'transparent' }]} />
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Calendar
          month={anchor}
          onMonthChange={(m) => setSelected(toIsoDate(m))}
          lang={lang}
          hideHeader
          card
          marks={marks}
          selected={selected}
          onSelect={setSelected}
          legend={[
            { label: t('schedule.legendShift'), color: 'ink' },
            { label: t('schedule.legendIntervention'), color: 'warning' },
            { label: t('schedule.legendLeave'), color: 'primary' },
            { label: t('schedule.legendHoliday'), color: 'purpleFg' },
          ]}
        />
      )}

      <Text variant="subheading" tone="muted" style={styles.dayLabel}>
        {dayLabel}
      </Text>

      {changed ? (
        <Banner tone="warning" icon="create-outline" title={t('schedule.updatedBanner', { from: changed.previousStart, to: changed.start })} />
      ) : null}

      {dayItems.map((a) => (
        <AssignmentRow key={a.id} assignment={a} />
      ))}

      {kind === 'leave' || kind === 'holiday' ? (
        <View style={[styles.special, { backgroundColor: kind === 'leave' ? colors.infoBg : colors.purpleBg }]}>
          <Icon name={kind === 'leave' ? 'sunny-outline' : 'star-outline'} size={30} tone={kind === 'leave' ? 'infoFg' : 'purpleFg'} />
          <View style={styles.flex}>
            <Text variant="section" tone={kind === 'leave' ? 'infoFg' : 'purpleFg'}>
              {kind === 'leave' ? t('schedule.onLeave') : t('schedule.holiday')}
            </Text>
            <Text variant="caption" tone={kind === 'leave' ? 'infoFg' : 'purpleFg'}>
              {kind === 'leave' ? t('schedule.leaveSub', { type: leaveType ?? '' }) : t('schedule.holidaySub')}
            </Text>
          </View>
        </View>
      ) : null}

      {kind === 'none' ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.fieldBorder }]}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.soft }]}>
            <Icon name="moon-outline" size={26} tone="muted" />
          </View>
          <Text variant="section">{t('schedule.emptyTitle')}</Text>
          <Text variant="caption" tone="muted" style={styles.center}>
            {nextShift.data
              ? t('schedule.emptyBody', { day: formatDate(nextShift.data.date, 'EEEE', lang), time: nextShift.data.start })
              : t('schedule.emptyBodyNone')}
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14 },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  toggle: { width: 168 },
  range: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  strip: { flexDirection: 'row', gap: 6 },
  day: { flex: 1, minWidth: 0, minHeight: 72, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dow: { letterSpacing: 0, fontWeight: '700' },
  dayNum: { fontSize: 19, fontWeight: '800' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dayLabel: { fontSize: 15, fontWeight: '800' },
  special: { borderRadius: radius.lg, padding: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: 14 },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.lg, paddingVertical: 32, paddingHorizontal: spacing.xl, alignItems: 'center', gap: spacing.sm },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});

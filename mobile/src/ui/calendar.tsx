import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';
import { Pressable, StyleSheet, View } from 'react-native';

import { capitalize, formatDate } from '@/core/format';
import { useTheme } from '@/core/theme/theme-provider';
import { MIN_TOUCH, radius, spacing, type ThemeColors } from '@/core/theme/tokens';
import { toIsoDate, type IsoDate } from '@/domain';

import { Icon } from './icon';
import { Text } from './text';

export type DayMark = {
  /** Cell background (e.g. status colour). */
  bg?: keyof ThemeColors;
  /** Small dot under the number. */
  dot?: keyof ThemeColors;
  disabled?: boolean;
  /** Shown to screen readers. */
  label?: string;
};

type Props = {
  month: Date;
  onMonthChange: (month: Date) => void;
  lang: string;
  marks?: (iso: IsoDate) => DayMark;
  selected?: IsoDate;
  rangeStart?: IsoDate;
  rangeEnd?: IsoDate;
  onSelect?: (iso: IsoDate) => void;
};

export function Calendar({ month, onMonthChange, lang, marks, selected, rangeStart, rangeEnd, onSelect }: Props) {
  const { colors } = useTheme();
  const weekOpts = { weekStartsOn: 1 as const };
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month), weekOpts), end: endOfWeek(endOfMonth(month), weekOpts) });
  const weekdays = days.slice(0, 7).map((d) => formatDate(d, 'EEEEE', lang).toUpperCase());
  const inRange = (iso: string) => !!rangeStart && !!rangeEnd && iso >= rangeStart && iso <= rangeEnd;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => onMonthChange(addMonths(month, -1))} style={styles.nav}>
          <Icon name="chevron-back" />
        </Pressable>
        <Text variant="subheading">{capitalize(formatDate(month, 'MMMM yyyy', lang))}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => onMonthChange(addMonths(month, 1))} style={styles.nav}>
          <Icon name="chevron-forward" />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {weekdays.map((w, i) => (
          <View key={i} style={styles.cell}>
            <Text variant="caption" tone="muted" style={styles.weekday}>{w}</Text>
          </View>
        ))}
        {days.map((d) => {
          const iso = toIsoDate(d);
          const outside = d.getMonth() !== month.getMonth();
          const mark = marks?.(iso) ?? {};
          const isSelected = iso === selected || iso === rangeStart || iso === rangeEnd;
          const bg = isSelected ? colors.primary : inRange(iso) ? colors.infoBg : mark.bg ? colors[mark.bg] : 'transparent';
          return (
            <View key={iso} style={styles.cell}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${formatDate(d, 'd MMMM', lang)}${mark.label ? `, ${mark.label}` : ''}`}
                accessibilityState={{ selected: isSelected, disabled: mark.disabled }}
                disabled={mark.disabled || !onSelect}
                onPress={() => onSelect?.(iso)}
                style={[styles.day, { backgroundColor: bg }, mark.disabled && styles.disabled]}>
                <Text variant="bodyStrong" tone={isSelected ? 'onPrimary' : outside ? 'muted' : 'ink'} style={outside && styles.outside}>
                  {d.getDate()}
                </Text>
                {mark.dot ? <View style={[styles.dot, { backgroundColor: isSelected ? colors.onPrimary : colors[mark.dot] }]} /> : null}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nav: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2 },
  weekday: { fontWeight: '700' },
  day: { width: 40, height: MIN_TOUCH, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 1 },
  disabled: { opacity: 0.35 },
  outside: { opacity: 0.5 },
});

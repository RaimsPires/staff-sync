import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { capitalize, formatDate } from '@/core/format';
import { useTheme } from '@/core/theme/theme-provider';
import { cameraColors, MIN_TOUCH, radius, spacing, type ThemeColors } from '@/core/theme/tokens';
import { toIsoDate, type IsoDate } from '@/domain';

import { Icon } from './icon';
import { Text } from './text';

export type DayMark = {
  /** Cell background (e.g. status colour). */
  bg?: keyof ThemeColors;
  /** Small dot under the number. */
  dot?: keyof ThemeColors;
  disabled?: boolean;
  /** 2px primary outline, used for today. */
  ring?: boolean;
  /** Red flag glyph in the top-right corner of the cell. */
  flag?: boolean;
  /** Fade the cell (e.g. filtered out). */
  dim?: boolean;
  /** Muted day number (weekends / future). */
  faint?: boolean;
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
  /** Wrap in a bordered card (radius 18, padding 10) as in the design. */
  card?: boolean;
  /** Round bordered 44px chevrons and 17/800 month label. */
  roundNav?: boolean;
  /** Disable the "next month" chevron (e.g. already on the current month). */
  nextDisabled?: boolean;
  prevDisabled?: boolean;
  /** Navy range ends (leave request) instead of the primary blue. */
  navySelection?: boolean;
  /** Legend swatches rendered under the grid. */
  legend?: { label: string; color: keyof ThemeColors; glyph?: string }[];
  /** Hide the built-in month header when the screen draws its own. */
  hideHeader?: boolean;
};

export function Calendar({ month, onMonthChange, lang, marks, selected, rangeStart, rangeEnd, onSelect, card, roundNav, nextDisabled, prevDisabled, navySelection, legend, hideHeader }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const weekOpts = { weekStartsOn: 1 as const };
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month), weekOpts), end: endOfWeek(endOfMonth(month), weekOpts) });
  const weekdays = days.slice(0, 7).map((d) => formatDate(d, 'EEEEE', lang).toUpperCase());
  const inRange = (iso: string) => !!rangeStart && !!rangeEnd && iso >= rangeStart && iso <= rangeEnd;

  return (
    <View style={[styles.wrap, card && [styles.card, { backgroundColor: colors.card, borderColor: colors.line }]]}>
      {hideHeader ? null : (
        <View style={styles.head}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.previousMonth')}
            accessibilityState={{ disabled: !!prevDisabled }}
            disabled={prevDisabled}
            onPress={() => onMonthChange(addMonths(month, -1))}
            style={[styles.nav, roundNav && [styles.round, { borderColor: colors.line, backgroundColor: colors.card }], prevDisabled && styles.navOff]}>
            <Icon name="chevron-back" tone={prevDisabled ? 'faint' : 'ink'} />
          </Pressable>
          <Text variant={roundNav ? 'lead' : 'subheading'}>{capitalize(formatDate(month, 'MMMM yyyy', lang))}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.nextMonth')}
            accessibilityState={{ disabled: !!nextDisabled }}
            disabled={nextDisabled}
            onPress={() => onMonthChange(addMonths(month, 1))}
            style={[styles.nav, roundNav && [styles.round, { borderColor: colors.line, backgroundColor: colors.card }], nextDisabled && styles.navOff]}>
            <Icon name="chevron-forward" tone={nextDisabled ? 'faint' : 'ink'} />
          </Pressable>
        </View>
      )}

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
          const selectedBg = navySelection ? cameraColors.navy : colors.primary;
          const bg = isSelected ? selectedBg : inRange(iso) ? (navySelection ? colors.line : colors.infoBg) : mark.bg ? colors[mark.bg] : 'transparent';
          return (
            <View key={iso} style={styles.cell}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${formatDate(d, 'd MMMM', lang)}${mark.label ? `, ${mark.label}` : ''}`}
                accessibilityState={{ selected: isSelected, disabled: mark.disabled }}
                disabled={mark.disabled || !onSelect}
                onPress={() => onSelect?.(iso)}
                style={[styles.day, { backgroundColor: bg }, mark.ring && !isSelected && { borderWidth: 2, borderColor: colors.primary }, mark.disabled && styles.disabled, mark.dim && styles.dim]}>
                <Text variant="bodyStrong" tone={isSelected ? 'onPrimary' : mark.faint ? 'faint' : outside ? 'muted' : 'ink'} style={outside && styles.outside}>
                  {d.getDate()}
                </Text>
                {mark.flag ? <Text style={[styles.flag, { color: colors.flag }]}>⚑</Text> : null}
                {mark.dot ? <View style={[styles.dot, { backgroundColor: isSelected ? colors.onPrimary : colors[mark.dot] }]} /> : null}
              </Pressable>
            </View>
          );
        })}
      </View>
      {legend?.length ? (
        <View style={styles.legend}>
          {legend.map((l) => (
            <View key={l.label} style={styles.legendItem}>
              {l.glyph ? <Text style={{ color: colors[l.color], fontSize: 11 }}>{l.glyph}</Text> : <View style={[styles.swatch, { backgroundColor: colors[l.color] }]} />}
              <Text variant="small" tone="muted">
                {l.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nav: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  card: { borderWidth: 1, borderRadius: radius.row, padding: 10 },
  round: { borderRadius: MIN_TOUCH / 2, borderWidth: 1 },
  navOff: { opacity: 0.5 },
  flag: { position: 'absolute', top: 1, right: 4, fontSize: 10 },
  dim: { opacity: 0.3 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 12, height: 12, borderRadius: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2 },
  weekday: { fontWeight: '700' },
  day: { width: 40, height: MIN_TOUCH, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 1 },
  disabled: { opacity: 0.35 },
  outside: { opacity: 0.5 },
});

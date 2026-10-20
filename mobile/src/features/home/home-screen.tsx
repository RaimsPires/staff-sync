import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { capitalize, formatDate, formatTime } from '@/core/format';
import { useLivePosition, useLocationPermission } from '@/core/location/use-site-proximity';
import { useOnline } from '@/core/network/use-online';
import { useSession } from '@/core/session/session-store';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { selectPending, useOfflineQueue } from '@/data/offline-queue';
import { useLeaveTypes } from '@/features/leave/queries';
import { Icon, PagerDots, Screen, Text, type IconName } from '@/ui';

import { AssignmentCard } from './assignment-card';
import { CheckInButton } from './check-in-button';
import { MapCard } from './map-card';
import { useAssignmentRecord, useLeaveToday, useNextShift, useNotifications, useTodayAssignments, useWeekSummary } from './queries';
import { useCheckInState } from './use-check-in-state';

const QUICK: { icon: IconName; label: string; href: '/leave/new' | '/schedule' | '/leave' }[] = [
  { icon: 'airplane-outline', label: 'home.requestLeave', href: '/leave/new' },
  { icon: 'calendar-outline', label: 'home.mySchedule', href: '/schedule' },
  { icon: 'time-outline', label: 'home.myLeave', href: '/leave' },
];

const CARD_WIDTH = 300;
const pad = (n: number) => String(n).padStart(2, '0');
/** "9h 08" as in the design. */
const hm = (minutes: number) => `${Math.floor(minutes / 60)}h ${pad(Math.round(minutes % 60))}`;

export function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const user = useSession((s) => s.user);
  const permission = useLocationPermission();
  const online = useOnline();
  const pending = useOfflineQueue(selectPending);

  const { data: assignments = [], isLoading } = useTodayAssignments();
  const leaveToday = useLeaveToday();
  const leaveTypes = useLeaveTypes();
  const noShift = !isLoading && assignments.length === 0;
  const nextShift = useNextShift(noShift);
  const [index, setIndex] = useState(0);
  const current = assignments[Math.min(index, Math.max(assignments.length - 1, 0))];
  const { data: record } = useAssignmentRecord(current?.id);
  const fix = useLivePosition(permission.state === 'granted' && !!current);
  const buttonState = useCheckInState(current, fix);
  const week = useWeekSummary();
  const unread = (useNotifications().data ?? []).filter((n) => !n.read).length;

  const multiple = assignments.length > 1;
  const cardWidth = multiple ? CARD_WIDTH : width - spacing.xl * 2;
  const hour = new Date().getHours();
  const hello = hour < 12 ? t('home.goodMorning') : hour < 18 ? t('home.goodAfternoon') : t('home.goodEvening');
  const first = user?.name.split(' ')[0] ?? '';
  const dateLabel = useMemo(() => capitalize(formatDate(new Date(), 'EEEE, d MMMM', i18n.language)), [i18n.language]);
  const lang = i18n.language;
  const offline = !online || pending > 0;

  const flow = (route: '/check-in' | '/check-out') => {
    if (current) router.push({ pathname: route, params: { assignmentId: current.id } });
  };

  const leave = leaveToday.data;
  const onLeave = noShift && !!leave;
  const leaveName = leave ? leaveTypes.data?.find((l) => l.id === leave.typeId)?.name[lang === 'fr' ? 'fr' : 'en'] : undefined;
  const nextLabel = nextShift.data
    ? t('home.noShiftSub', { day: formatDate(nextShift.data.date, 'EEEE', lang), time: nextShift.data.start })
    : t('home.noShiftSubNone');

  const syncColors = offline
    ? { bg: colors.warningBg, fg: 'warningFg' as const, dot: colors.warning }
    : { bg: colors.successBg, fg: 'successFg' as const, dot: colors.success };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text variant="caption" tone="muted">
            {dateLabel}
          </Text>
          <Text variant="headline" numberOfLines={1}>
            {hello}, {first}
          </Text>
        </View>
        <View style={[styles.sync, { backgroundColor: syncColors.bg }]}>
          <View style={[styles.dot, { backgroundColor: syncColors.dot }]} />
          <Text variant="label" tone={syncColors.fg} style={styles.syncLabel}>
            {offline ? t('home.syncOffline', { count: pending }) : t('home.synced')}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('home.notifications')}
          onPress={() => router.push('/notifications')}
          style={[styles.bell, { backgroundColor: colors.card, borderColor: colors.line }]}>
          <Icon name="notifications-outline" />
          {unread > 0 ? (
            <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.bg }]}>
              <Text variant="label" tone="onPrimary">
                {unread}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {isLoading ? null : noShift ? (
        onLeave ? (
          <View style={[styles.stateCard, { backgroundColor: colors.successBg, borderColor: colors.successBorder }]}>
            <View style={[styles.stateIcon, { backgroundColor: colors.card }]}>
              <Icon name="sunny-outline" size={30} tone="success" />
            </View>
            <Text variant="hero" tone="successFg">
              {t('home.onLeaveToday')}
            </Text>
            <Text tone="successFg" style={styles.center}>
              {t('home.onLeaveSub', {
                type: leaveName ?? '',
                from: formatDate(leave.start, 'd MMM', lang),
                to: formatDate(leave.end, 'd MMM', lang),
              })}
            </Text>
          </View>
        ) : (
          <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.line }]}>
            <View style={[styles.stateIcon, { backgroundColor: colors.soft }]}>
              <Icon name="moon-outline" size={30} tone="muted" />
            </View>
            <Text variant="hero">{t('home.noShift')}</Text>
            <Text tone="muted" style={styles.center}>
              {nextLabel}
            </Text>
          </View>
        )
      ) : (
        <>
          <ScrollView
            horizontal
            snapToInterval={cardWidth + spacing.md}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
            style={styles.carouselOuter}
            onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / (cardWidth + spacing.md)))}>
            {assignments.map((a) => (
              <AssignmentCard key={a.id} assignment={a} record={a.id === current?.id ? record : undefined} width={cardWidth} />
            ))}
          </ScrollView>
          {multiple ? (
            <View style={styles.dots}>
              <PagerDots count={assignments.length} index={Math.min(index, assignments.length - 1)} />
            </View>
          ) : null}
          {current ? <MapCard assignment={current} fix={fix} /> : null}
          {current && buttonState && buttonState.kind !== 'done' ? (
            <CheckInButton
              state={buttonState}
              assignment={current}
              locationGranted={permission.state === 'granted'}
              onCheckIn={() => flow('/check-in')}
              onCheckOut={() => flow('/check-out')}
            />
          ) : null}
          {buttonState?.kind === 'done' && record ? (
            <View style={[styles.done, { backgroundColor: colors.card, borderColor: colors.line }]}>
              <View style={styles.doneHead}>
                <View style={[styles.doneCheck, { backgroundColor: colors.success }]}>
                  <Icon name="checkmark" size={24} tone="onPrimary" />
                </View>
                <View style={styles.flex}>
                  <Text variant="heading">{t('home.doneToday')}</Text>
                  <Text variant="caption" tone="muted">
                    {t('home.doneSub', { name: first })}
                  </Text>
                </View>
              </View>
              <View style={styles.doneGrid}>
                <Tile label={t('home.in')} value={record.checkInAt ? formatTime(record.checkInAt) : '–'} />
                <Tile label={t('home.out')} value={record.checkOutAt ? formatTime(record.checkOutAt) : '–'} />
                <Tile label={t('home.total')} value={hm(buttonState.workedMinutes)} />
              </View>
            </View>
          ) : null}
        </>
      )}

      <View style={styles.quick}>
        {QUICK.map((q) => (
          <Pressable
            key={q.href}
            accessibilityRole="button"
            onPress={() => router.push(q.href)}
            style={[styles.quickItem, { backgroundColor: colors.card, borderColor: colors.line }]}>
            <Icon name={q.icon} size={24} tone="primary" />
            <Text variant="small" style={styles.quickLabel}>
              {t(q.label)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.week, { backgroundColor: colors.card, borderColor: colors.line }]}>
        <Text style={styles.weekTitle}>{t('home.thisWeek')}</Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {week.data?.present ?? '–'}
              <Text style={styles.statOf} tone="muted">
                /{week.data?.scheduledDays ?? 5}
              </Text>
            </Text>
            <Text variant="small" tone="muted" style={styles.statLabel}>
              {t('home.daysPresent')}
            </Text>
          </View>
          <View style={[styles.stat, styles.statMid, { borderColor: colors.line }]}>
            <Text style={[styles.statValue, (week.data?.late ?? 0) > 0 && { color: colors.warning }]}>{week.data?.late ?? '–'}</Text>
            <Text variant="small" tone="muted" style={styles.statLabel}>
              {t('home.lates')}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{week.data ? hm(week.data.hoursWorked * 60) : '–'}</Text>
            <Text variant="small" tone="muted" style={styles.statLabel}>
              {t('home.hours')}
            </Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: colors.soft }]}>
      <Text variant="label" tone="muted" style={styles.tileLabel}>
        {label}
      </Text>
      <Text variant="heading" style={styles.tileValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sync: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: spacing.md, borderRadius: radius.pill },
  syncLabel: { fontWeight: '700', letterSpacing: 0 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  bell: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -2, right: -2, minWidth: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  carouselOuter: { marginHorizontal: -spacing.xl },
  carousel: { paddingHorizontal: spacing.xl, gap: spacing.md },
  dots: { marginTop: -6 },
  stateCard: { borderWidth: 1, borderRadius: radius.lg, paddingVertical: 28, paddingHorizontal: spacing.xl, alignItems: 'center', gap: spacing.sm },
  stateIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  done: { borderWidth: 1, borderRadius: radius.lg, padding: 18, gap: 14 },
  doneHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  doneCheck: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  doneGrid: { flexDirection: 'row', gap: spacing.sm },
  tile: { flex: 1, borderRadius: radius.field, padding: 10 },
  tileLabel: { fontWeight: '400', letterSpacing: 0, textTransform: 'none' },
  tileValue: { fontSize: 18 },
  quick: { flexDirection: 'row', gap: 10 },
  quickItem: { flex: 1, minHeight: 88, borderRadius: radius.row, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.sm, paddingHorizontal: 4 },
  quickLabel: { textAlign: 'center', lineHeight: 16 },
  week: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  weekTitle: { fontSize: 15, fontWeight: '800', marginBottom: spacing.md },
  stats: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statMid: { borderLeftWidth: 1, borderRightWidth: 1 },
  statValue: { fontSize: 26, fontWeight: '800', lineHeight: 32 },
  statOf: { fontSize: 15, fontWeight: '700' },
  statLabel: { fontWeight: '400' },
});

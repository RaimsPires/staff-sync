import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { capitalize, formatDate } from '@/core/format';
import { useLivePosition, useLocationPermission } from '@/core/location/use-site-proximity';
import { useSession } from '@/core/session/session-store';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { useOfflineQueue } from '@/data/offline-queue';
import { Card, EmptyState, Icon, Screen, Text, type IconName } from '@/ui';

import { AssignmentCard } from './assignment-card';
import { CheckInButton } from './check-in-button';
import { MapCard } from './map-card';
import { useAssignmentRecord, useNotifications, useTodayAssignments, useWeekSummary } from './queries';
import { useCheckInState } from './use-check-in-state';

const QUICK: { icon: IconName; label: string; href: '/leave/new' | '/schedule' | '/attendance' }[] = [
  { icon: 'airplane-outline', label: 'home.requestLeave', href: '/leave/new' },
  { icon: 'calendar-outline', label: 'home.mySchedule', href: '/schedule' },
  { icon: 'time-outline', label: 'home.myAttendance', href: '/attendance' },
];

export function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const user = useSession((s) => s.user);
  const permission = useLocationPermission();
  const pending = useOfflineQueue((s) => s.events.length);

  const { data: assignments = [], isLoading } = useTodayAssignments();
  const [index, setIndex] = useState(0);
  const current = assignments[Math.min(index, Math.max(assignments.length - 1, 0))];
  const { data: record } = useAssignmentRecord(current?.id);
  const fix = useLivePosition(permission.state === 'granted' && !!current);
  const buttonState = useCheckInState(current, fix);
  const week = useWeekSummary();
  const unread = (useNotifications().data ?? []).filter((n) => !n.read).length;

  const cardWidth = assignments.length > 1 ? width - spacing.xl * 2 - 24 : width - spacing.xl * 2;
  const hour = new Date().getHours();
  const hello = hour < 12 ? t('home.goodMorning') : hour < 18 ? t('home.goodAfternoon') : t('home.goodEvening');
  const first = user?.name.split(' ')[0] ?? '';
  const dateLabel = useMemo(() => capitalize(formatDate(new Date(), 'EEEE d MMMM', i18n.language)), [i18n.language]);

  const flow = (route: '/check-in' | '/check-out') => {
    if (current) router.push({ pathname: route, params: { assignmentId: current.id } });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text variant="caption" tone="muted">
            {dateLabel}
          </Text>
          <Text variant="title">
            {hello}, {first}
          </Text>
        </View>
        {pending > 0 ? (
          <View style={[styles.sync, { backgroundColor: colors.warningBg }]}>
            <Text variant="label" tone="warningFg">
              {t('home.syncPending', { count: pending })}
            </Text>
          </View>
        ) : null}
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

      {isLoading ? null : assignments.length === 0 ? (
        <Card>
          <EmptyState icon="moon-outline" title={t('home.noShift')} body={t('home.noShiftSub')} />
        </Card>
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
          {current ? <MapCard assignment={current} fix={fix} /> : null}
          {buttonState ? (
            <CheckInButton
              state={buttonState}
              locationGranted={permission.state === 'granted'}
              onCheckIn={() => flow('/check-in')}
              onCheckOut={() => flow('/check-out')}
            />
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
            <Icon name={q.icon} tone="primary" />
            <Text variant="caption" style={styles.quickLabel}>
              {t(q.label)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Card>
        <Text variant="subheading">{t('home.thisWeek')}</Text>
        <View style={styles.stats}>
          <Stat label={t('home.daysPresent')} value={String(week.data?.present ?? '–')} />
          <Stat label={t('home.lates')} value={String(week.data?.late ?? '–')} />
          <Stat label={t('home.hours')} value={week.data ? `${week.data.hoursWorked}` : '–'} />
        </View>
      </Card>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="title">{value}</Text>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sync: { paddingHorizontal: spacing.md, minHeight: 32, justifyContent: 'center', borderRadius: radius.pill },
  bell: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  carouselOuter: { marginHorizontal: -spacing.xl },
  carousel: { paddingHorizontal: spacing.xl, gap: spacing.md },
  quick: { flexDirection: 'row', gap: spacing.md },
  quickItem: { flex: 1, minHeight: 80, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.sm },
  quickLabel: { textAlign: 'center', fontWeight: '600' },
  stats: { flexDirection: 'row' },
  stat: { flex: 1 },
});

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { formatDate, formatTime } from '@/core/format';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { repos } from '@/data';
import { qk } from '@/data/query-keys';
import type { AppNotification, NotificationKind } from '@/domain';
import { Button, Card, EmptyState, Icon, Screen, Text, type IconName } from '@/ui';

import { useNotifications } from '../home/queries';

const ICONS: Record<NotificationKind, IconName> = {
  shift_reminder: 'alarm-outline',
  arrival_prompt: 'navigate-outline',
  checkout_reminder: 'log-out-outline',
  schedule_change: 'calendar-outline',
  flag_update: 'flag-outline',
  leave_decision: 'airplane-outline',
  correction_result: 'create-outline',
  announcement: 'megaphone-outline',
};

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

export function NotificationsScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const { data = [] } = useNotifications();
  const refresh = () => qc.invalidateQueries({ queryKey: qk.notifications });

  const markAll = useMutation({ mutationFn: () => repos.notifications.markAllRead(), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (id: string) => repos.notifications.remove(id), onSuccess: refresh });
  const read = useMutation({ mutationFn: (id: string) => repos.notifications.markRead(id), onSuccess: refresh });

  const open = (n: AppNotification) => {
    if (!n.read) read.mutate(n.id);
    if (n.href) router.push(n.href as Href);
  };

  const groups = [
    { title: t('notifications.today'), items: data.filter((n) => isToday(n.at)) },
    { title: t('notifications.earlier'), items: data.filter((n) => !isToday(n.at)) },
  ].filter((g) => g.items.length > 0);

  return (
    <Screen>
      <View style={styles.head}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
          <Icon name="chevron-back" />
        </Pressable>
        <Text variant="title" style={styles.flex}>
          {t('notifications.title')}
        </Text>
      </View>
      {data.some((n) => !n.read) ? <Button variant="secondary" label={t('notifications.markAllRead')} onPress={() => markAll.mutate()} /> : null}

      {data.length === 0 ? <EmptyState icon="notifications-off-outline" title={t('notifications.empty')} body={t('notifications.emptyBody')} /> : null}

      {groups.map((g) => (
        <View key={g.title} style={styles.group}>
          <Text variant="label" tone="muted">
            {g.title.toUpperCase()}
          </Text>
          {g.items.map((n) => (
            <ReanimatedSwipeable
              key={n.id}
              overshootRight={false}
              renderRightActions={() => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('notifications.delete')}
                  onPress={() => remove.mutate(n.id)}
                  style={[styles.delete, { backgroundColor: colors.danger }]}>
                  <Icon name="trash-outline" tone="onPrimary" />
                </Pressable>
              )}>
              <Pressable accessibilityRole="button" onPress={() => open(n)}>
                <Card style={[styles.item, !n.read && { borderColor: colors.primary }]}>
                  <View style={[styles.icon, { backgroundColor: colors.soft }]}>
                    <Icon name={ICONS[n.kind]} tone="primary" />
                  </View>
                  <View style={styles.flex}>
                    <Text variant="bodyStrong">{n.title}</Text>
                    <Text variant="caption" tone="muted">{n.body}</Text>
                    <Text variant="caption" tone="muted">
                      {isToday(n.at) ? formatTime(n.at) : formatDate(n.at, 'd MMM, HH:mm', i18n.language)}
                    </Text>
                  </View>
                  {!n.read ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
                </Card>
              </Pressable>
            </ReanimatedSwipeable>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  group: { gap: spacing.sm },
  item: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  delete: { width: 72, marginLeft: spacing.sm, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
});

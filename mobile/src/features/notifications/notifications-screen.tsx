import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isYesterday } from 'date-fns';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { capitalize, formatDate, formatTime } from '@/core/format';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing, type ThemeColors } from '@/core/theme/tokens';
import { repos } from '@/data';
import { qk } from '@/data/query-keys';
import type { AppNotification, NotificationKind } from '@/domain';
import { BackHeader, Icon, Screen, Text, type IconName, type TextProps } from '@/ui';

import { useNotifications } from '../home/queries';

type Look = { icon: IconName; bg: keyof ThemeColors; fg: NonNullable<TextProps['tone']> };

const LOOK: Record<NotificationKind, Look> = {
  shift_reminder: { icon: 'alarm-outline', bg: 'infoBg', fg: 'infoFg' },
  arrival_prompt: { icon: 'navigate-outline', bg: 'infoBg', fg: 'infoFg' },
  checkout_reminder: { icon: 'power-outline', bg: 'orangeBg', fg: 'orangeFg' },
  schedule_change: { icon: 'calendar-outline', bg: 'warningBg', fg: 'warningFg' },
  flag_update: { icon: 'flag-outline', bg: 'dangerBg', fg: 'dangerFg' },
  leave_decision: { icon: 'sunny-outline', bg: 'successBg', fg: 'successFg' },
  correction_result: { icon: 'refresh-outline', bg: 'purpleBg', fg: 'purpleFg' },
  announcement: { icon: 'megaphone-outline', bg: 'grayBg', fg: 'grayFg' },
};

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();
const DELETE_WIDTH = 88;

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

  const timeLabel = (iso: string) => {
    if (isToday(iso)) return formatTime(iso);
    if (isYesterday(new Date(iso))) return t('notifications.yesterday');
    const days = (Date.now() - new Date(iso).getTime()) / 86_400_000;
    return days < 7 ? capitalize(formatDate(iso, 'EEE', i18n.language)) : formatDate(iso, 'd MMM', i18n.language);
  };

  const hasUnread = data.some((n) => !n.read);
  const groups = [
    { title: t('notifications.today'), items: data.filter((n) => isToday(n.at)) },
    { title: t('notifications.earlier'), items: data.filter((n) => !isToday(n.at)) },
  ].filter((g) => g.items.length > 0);

  return (
    <Screen contentStyle={styles.content}>
      <BackHeader
        title={t('notifications.title')}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !hasUnread }}
            disabled={!hasUnread}
            onPress={() => markAll.mutate()}
            style={styles.markAll}>
            <Text variant="caption" tone={hasUnread ? 'primary' : 'faint'} style={styles.markAllLabel}>
              {t('notifications.markAllRead')}
            </Text>
          </Pressable>
        }
      />

      {data.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.soft }]}>
            <Icon name="notifications-outline" size={32} tone="muted" />
          </View>
          <Text variant="heading">{t('notifications.empty')}</Text>
          <Text variant="caption" tone="muted" style={styles.center}>
            {t('notifications.emptyBody')}
          </Text>
        </View>
      ) : null}

      {groups.map((g) => (
        <View key={g.title} style={styles.group}>
          <Text variant="small" tone="muted" style={styles.groupTitle}>
            {g.title.toUpperCase()}
          </Text>
          {g.items.map((n) => {
            const look = LOOK[n.kind];
            return (
              <ReanimatedSwipeable
                key={n.id}
                overshootRight={false}
                containerStyle={styles.swipe}
                renderRightActions={() => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('notifications.delete')}
                    onPress={() => remove.mutate(n.id)}
                    style={[styles.delete, { backgroundColor: colors.danger }]}>
                    <Text variant="caption" tone="onPrimary" style={styles.deleteLabel}>
                      {t('notifications.delete')}
                    </Text>
                  </Pressable>
                )}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => open(n)}
                  style={[styles.item, { backgroundColor: n.read ? colors.card : colors.unreadBg, borderColor: colors.line }]}>
                  <View style={[styles.icon, { backgroundColor: colors[look.bg] }]}>
                    <Icon name={look.icon} size={20} tone={look.fg} />
                  </View>
                  <View style={styles.body}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.title, { fontWeight: n.read ? '600' : '800' }]}>{n.title}</Text>
                      <Text variant="label" tone="muted" style={styles.time}>
                        {timeLabel(n.at)}
                      </Text>
                    </View>
                    <Text variant="caption" tone="muted" style={styles.text}>
                      {n.body}
                    </Text>
                    <Text variant="small" tone="primary" style={styles.cta}>
                      {t(`notifications.cta.${n.kind}`)} ›
                    </Text>
                  </View>
                  {!n.read ? <View style={[styles.dot, { backgroundColor: colors.primary }]} accessibilityLabel="Unread" /> : null}
                </Pressable>
              </ReanimatedSwipeable>
            );
          })}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.sm },
  center: { textAlign: 'center' },
  markAll: { minHeight: 44, paddingHorizontal: 6, justifyContent: 'center' },
  markAllLabel: { fontWeight: '800' },
  group: { gap: spacing.sm },
  groupTitle: { fontWeight: '800', letterSpacing: 0.8, paddingTop: 10, paddingHorizontal: 4 },
  swipe: { borderRadius: radius.row, overflow: 'hidden' },
  item: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', borderWidth: 1, borderRadius: radius.row, padding: spacing.md, minHeight: 44 },
  icon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  title: { flex: 1, fontSize: 15 },
  time: { letterSpacing: 0, fontWeight: '400' },
  text: { lineHeight: 19 },
  cta: { fontWeight: '700', marginTop: 2 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  delete: { width: DELETE_WIDTH, alignItems: 'center', justifyContent: 'center' },
  deleteLabel: { fontWeight: '800' },
  empty: { marginTop: 60, alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
});

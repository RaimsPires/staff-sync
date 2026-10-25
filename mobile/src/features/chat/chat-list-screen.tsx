import { isToday } from 'date-fns';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatDate, formatTime } from '@/core/format';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { loadConversations, useChat, type Conversation } from '@/data/chat';
import { Avatar, Icon, Screen, Text } from '@/ui';

/** The Messages tab: site groups and direct conversations, newest first. */
export function ChatListScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const conversations = useChat((s) => s.conversations);
  const online = useChat((s) => s.online);

  const when = (c: Conversation) => {
    if (!c.lastMessageAt) return '';
    const d = new Date(c.lastMessageAt);
    return isToday(d) ? formatTime(d) : formatDate(d, 'd MMM', i18n.language);
  };

  return (
    <Screen
      onRefresh={() => void loadConversations().catch(() => undefined)}
      contentStyle={styles.content}>
      <View style={styles.titleRow}>
        <View style={styles.flex}>
          <Text variant="title">{t('chat.title')}</Text>
          {!online ? <Text variant="caption" tone="muted">{t('chat.reconnecting')}</Text> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('chat.newChat')}
          onPress={() => router.push('/chat/new')}
          style={[styles.round, { backgroundColor: colors.primary }]}>
          <Icon name="create-outline" size={22} tone="onPrimary" />
        </Pressable>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="chatbubbles-outline" size={34} tone="muted" />
          <Text tone="muted" style={styles.emptyText}>{t('chat.empty')}</Text>
        </View>
      ) : null}

      {conversations.map((c) => (
        <Pressable
          key={c.id}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c.id } })}
          style={[styles.row, { backgroundColor: colors.card, borderColor: colors.line }]}>
          {c.kind === 'site' ? (
            <View style={[styles.siteIcon, { backgroundColor: colors.infoBg }]}>
              <Icon name="people" size={22} tone="infoFg" />
            </View>
          ) : (
            <Avatar name={c.title} size={44} />
          )}
          <View style={styles.flex}>
            <View style={styles.between}>
              <Text variant="subheading" numberOfLines={1} style={styles.flex}>{c.title}</Text>
              <Text variant="caption" tone="muted">{when(c)}</Text>
            </View>
            <View style={styles.between}>
              <Text variant="caption" tone="muted" numberOfLines={1} style={styles.flex}>
                {c.lastMessagePreview ?? (c.kind === 'site' ? t('chat.siteGroup', { count: c.members ?? 0 }) : '')}
              </Text>
              {c.unread > 0 ? (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text variant="label" tone="onPrimary">{c.unread > 99 ? '99+' : c.unread}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingBottom: spacing.sm },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxxl },
  emptyText: { textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: 12, borderWidth: 1, borderRadius: radius.row },
  siteIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
});

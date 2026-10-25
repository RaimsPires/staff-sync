import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/session/session-store';
import { useTheme } from '@/core/theme/theme-provider';
import { totalUnread, useChat } from '@/data/chat';
import { Icon, Text, type IconName } from '@/ui';

const ICONS: Record<string, [IconName, IconName]> = {
  index: ['home-outline', 'home'],
  attendance: ['time-outline', 'time'],
  profile: ['person-outline', 'person'],
  manager: ['grid-outline', 'grid'],
  roster: ['list-outline', 'list'],
  chat: ['chatbubbles-outline', 'chatbubbles'],
};

/**
 * Design tab bars: employees get Home / Attendance / Profile, site managers get
 * Manager / Roster / Attendance / Profile. Schedule and Leave are stack screens
 * reached from the Home quick actions.
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isManager = useSession((s) => s.user?.role === 'site_manager');
  const unread = useChat((s) => totalUnread(s.conversations));

  const screen = (name: keyof typeof ICONS, title: string, hidden: boolean) => (
    <Tabs.Screen
      name={name}
      options={{
        title,
        href: hidden ? null : undefined,
        tabBarBadge: name === 'chat' && unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
        tabBarIcon: ({ focused }) => <Icon name={ICONS[name][focused ? 1 : 0]} size={24} tone={focused ? 'primary' : 'muted'} />,
        tabBarLabel: ({ focused }) => (
          <Text style={{ fontSize: 11, fontWeight: focused ? '800' : '600', color: focused ? colors.primary : colors.muted }}>{title}</Text>
        ),
      }}
    />
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line, borderTopWidth: 1, paddingTop: 8 },
        tabBarItemStyle: { minHeight: 52 },
      }}>
      {/* The first declared route is the landing tab, so managers get theirs first. */}
      {isManager ? screen('manager', t('tabs.manager'), false) : screen('index', t('tabs.home'), false)}
      {isManager ? screen('roster', t('manager.roster'), false) : null}
      {isManager ? screen('index', t('tabs.home'), true) : screen('manager', t('tabs.manager'), true)}
      {isManager ? null : screen('roster', t('manager.roster'), true)}
      {screen('attendance', t('tabs.attendance'), false)}
      {screen('chat', t('tabs.chat'), false)}
      {screen('profile', t('tabs.profile'), false)}
    </Tabs>
  );
}

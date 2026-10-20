import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/session/session-store';
import { useTheme } from '@/core/theme/theme-provider';
import { Icon, type IconName } from '@/ui';

const ICONS: Record<string, [IconName, IconName]> = {
  index: ['home-outline', 'home'],
  schedule: ['calendar-outline', 'calendar'],
  attendance: ['time-outline', 'time'],
  leave: ['airplane-outline', 'airplane'],
  profile: ['person-outline', 'person'],
  manager: ['people-outline', 'people'],
};

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isManager = useSession((s) => s.user?.role === 'site_manager');

  const screen = (name: keyof typeof ICONS, title: string, hidden = false) => (
    <Tabs.Screen
      name={name}
      options={{
        title,
        href: hidden ? null : undefined,
        tabBarIcon: ({ focused }) => <Icon name={ICONS[name][focused ? 1 : 0]} tone={focused ? 'primary' : 'muted'} />,
      }}
    />
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
      }}>
      {screen('index', t('tabs.home'))}
      {screen('schedule', t('tabs.schedule'))}
      {screen('attendance', t('tabs.attendance'))}
      {screen('leave', t('tabs.leave'))}
      {screen('manager', t('tabs.manager'), !isManager)}
      {screen('profile', t('tabs.profile'))}
    </Tabs>
  );
}

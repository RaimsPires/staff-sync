import { useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Pressable, StyleSheet, Switch, View } from 'react-native';

import { formatDate } from '@/core/format';
import { useSession } from '@/core/session/session-store';
import { useSettings, type Language, type NotificationPrefs, type ThemePreference } from '@/core/settings/settings-store';
import { useTheme } from '@/core/theme/theme-provider';
import { spacing } from '@/core/theme/tokens';
import { repos } from '@/data';
import { useOfflineQueue } from '@/data/offline-queue';
import { qk } from '@/data/query-keys';
import { Button, Card, Icon, Screen, Segmented, Text } from '@/ui';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="label" tone="muted">{title.toUpperCase()}</Text>
      <Card>{children}</Card>
    </View>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.between}>
      <Text tone="muted">{label}</Text>
      <Text variant="bodyStrong" style={styles.value}>{value}</Text>
    </View>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.between}>
      <Text style={styles.flex}>{label}</Text>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label} trackColor={{ true: colors.primary, false: colors.line }} />
    </View>
  );
}

function Faq() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<number>();
  return (
    <View style={styles.faq}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} accessibilityRole="button" accessibilityState={{ expanded: open === n }} onPress={() => setOpen(open === n ? undefined : n)}>
          <View style={styles.between}>
            <Text variant="bodyStrong" style={styles.flex}>{t(`profile.faqItems.q${n}`)}</Text>
            <Icon name={open === n ? 'chevron-up' : 'chevron-down'} size={18} tone="muted" />
          </View>
          {open === n ? <Text tone="muted" variant="caption">{t(`profile.faqItems.a${n}`)}</Text> : null}
        </Pressable>
      ))}
    </View>
  );
}

export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const user = useSession((s) => s.user);
  const signOut = useSession((s) => s.signOut);
  const { language, theme, notifications, setLanguage, setTheme, setNotificationPrefs } = useSettings();
  const pending = useOfflineQueue((s) => s.events.length);
  const syncing = useOfflineQueue((s) => s.syncing);
  const sync = useOfflineQueue((s) => s.sync);
  const { data: device } = useQuery({ queryKey: qk.device, queryFn: () => repos.profile.getDevice() });
  const [syncMsg, setSyncMsg] = useState<string>();

  if (!user) return null;
  const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('');
  const siteNames = user.siteNames.join(', ');
  const setPrefs = (patch: Partial<NotificationPrefs>) => setNotificationPrefs(patch);

  const confirmLogout = () =>
    Alert.alert(t('profile.logoutConfirm'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: () => void signOut() },
    ]);

  return (
    <Screen>
      <Text variant="title">{t('profile.title')}</Text>

      <View style={styles.hero}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text variant="heading" tone="onPrimary">{initials}</Text>
        </View>
        <View style={styles.flex}>
          <Text variant="heading">{user.name}</Text>
          <Text tone="muted">{user.title}</Text>
        </View>
      </View>

      <Card>
        <Line label={t('profile.employeeId')} value={user.employeeId} />
        <Line label={t('profile.branch')} value={user.branch} />
        <Line label={t('profile.sites')} value={siteNames} />
        <Line label={t('profile.phone')} value={user.phone} />
        <Line label={t('profile.email')} value={user.email} />
        <Text variant="caption" tone="muted">{t('profile.readOnly')}</Text>
        <Button variant="secondary" icon="call-outline" label={`${t('profile.manager')}: ${user.managerName}`} onPress={() => void Linking.openURL(`tel:${user.managerPhone}`)} />
      </Card>

      <Section title={t('profile.language')}>
        <Segmented<Language>
          options={[{ value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }]}
          value={language ?? (i18n.language === 'fr' ? 'fr' : 'en')}
          onChange={setLanguage}
        />
        <Text variant="bodyStrong">{t('profile.theme')}</Text>
        <Segmented<ThemePreference>
          options={[
            { value: 'light', label: t('profile.themeLight') },
            { value: 'dark', label: t('profile.themeDark') },
            { value: 'system', label: t('profile.themeSystem') },
          ]}
          value={theme}
          onChange={setTheme}
        />
      </Section>

      <Section title={t('profile.notificationsSection')}>
        <Toggle label={t('profile.shiftReminders')} value={notifications.shiftReminders} onChange={(v) => setPrefs({ shiftReminders: v })} />
        {notifications.shiftReminders ? (
          <Segmented<'15' | '30' | '60'>
            options={(['15', '30', '60'] as const).map((m) => ({ value: m, label: t('profile.leadMinutes', { m }) }))}
            value={String(notifications.reminderLeadMinutes) as '15' | '30' | '60'}
            onChange={(v) => setPrefs({ reminderLeadMinutes: Number(v) as 15 | 30 | 60 })}
          />
        ) : null}
        <Toggle label={t('profile.arrivalPrompt')} value={notifications.arrivalPrompt} onChange={(v) => setPrefs({ arrivalPrompt: v })} />
        <Toggle label={t('profile.leaveUpdates')} value={notifications.leaveUpdates} onChange={(v) => setPrefs({ leaveUpdates: v })} />
      </Section>

      <Section title={t('profile.device')}>
        <Line label={device?.model ?? '…'} value={device ? t('profile.deviceSince', { date: formatDate(device.registeredAt, 'd MMM yyyy', i18n.language) }) : ''} />
      </Section>

      <Section title={t('profile.offlineData')}>
        <Text>{pending > 0 ? t('profile.pendingItems', { count: pending }) : t('profile.nothingPending')}</Text>
        {syncMsg ? <Text variant="caption" tone="muted">{syncMsg}</Text> : null}
        <Button
          variant="secondary"
          icon="sync"
          label={t('profile.syncNow')}
          loading={syncing}
          disabled={pending === 0}
          onPress={() => void sync().then((r) => setSyncMsg(t('profile.syncDone', { count: r.synced })))}
        />
      </Section>

      <Section title={t('profile.privacy')}>
        <Text variant="caption" tone="muted">{t('profile.privacyText')}</Text>
      </Section>

      <Section title={t('profile.help')}>
        <Faq />
      </Section>

      <Text variant="caption" tone="muted" style={styles.center}>
        {t('profile.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
      </Text>
      <Button variant="danger" icon="log-out-outline" label={t('profile.logout')} onPress={confirmLogout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { gap: spacing.sm },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  value: { flexShrink: 1, textAlign: 'right' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  faq: { gap: spacing.lg },
  center: { textAlign: 'center' },
});

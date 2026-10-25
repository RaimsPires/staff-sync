import { useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { formatDate, formatTime } from '@/core/format';
import { useSession } from '@/core/session/session-store';
import { useSettings, type Language, type ThemePreference } from '@/core/settings/settings-store';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing, type ThemeColors } from '@/core/theme/tokens';
import { repos } from '@/data';
import { useOfflineQueue } from '@/data/offline-queue';
import type { CheckEvent } from '@/data/repositories/types';
import { qk } from '@/data/query-keys';
import { BackHeader, BottomSheet, Button, Icon, RadioRow, Screen, Text, Toggle, useToast, type IconName } from '@/ui';

const SUPPORT_EMAIL = 'support@staffsync.co';
const LEADS = [15, 30, 60] as const;

function Card({ title, children, gap = 10 }: { title?: string; children: React.ReactNode; gap?: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line, gap }]}>
      {title ? (
        <Text variant="small" tone="muted" style={styles.cardTitle}>
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.between}>
      <Text tone="muted" style={styles.lineLabel}>
        {label}
      </Text>
      <Text style={styles.lineValue}>{value}</Text>
    </View>
  );
}

const LANGUAGE_NAMES: Record<Language, string> = { en: 'English', fr: 'Français' };

/** A settings line showing the current value; tapping it opens a bottom sheet to change it. */
function ValueRow({ label, value, onPress, plain }: { label: string; value: string; onPress: () => void; plain?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}, ${value}`} onPress={onPress} style={plain ? styles.valueRowPlain : styles.listRow}>
      <Text style={styles.listLabel}>{label}</Text>
      <Text variant="caption" tone="muted" style={styles.listValue}>
        {value}
      </Text>
      <Icon name="chevron-forward" size={18} tone="faint" />
    </Pressable>
  );
}

function Setting({ label, sub, value, onChange }: { label: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.setting}>
      <View style={styles.flex}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text variant="small" tone="muted" style={styles.settingSub}>
          {sub}
        </Text>
      </View>
      <Toggle value={value} onChange={onChange} label={label} />
    </View>
  );
}

function QueueItem({ event }: { event: CheckEvent }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { data: a } = useQuery({ queryKey: qk.assignment(event.assignmentId), queryFn: () => repos.schedule.getAssignment(event.assignmentId) });
  const kind = event.type === 'check_in' ? t('profile.queueCheckIn') : t('profile.queueCheckOut');
  return (
    <View style={[styles.queueItem, { backgroundColor: colors.bg }]}>
      <Text variant="caption">{[kind, a?.site.name, formatTime(event.position.capturedAt)].filter(Boolean).join(' · ')}</Text>
    </View>
  );
}

/** The API leaves dates out for a device that has not been active yet; an empty value must not reach date-fns. */
const dateOrDash = (value: string, pattern: string, lang: string) => (value && !Number.isNaN(new Date(value).getTime()) ? formatDate(value, pattern, lang) : '—');

export function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const toast = useToast();
  const signOut = useSession((s) => s.signOut);
  const { language, theme, notifications, setLanguage, setTheme, setNotificationPrefs } = useSettings();
  const events = useOfflineQueue((s) => s.events);
  const notes = useOfflineQueue((s) => s.notes);
  const syncing = useOfflineQueue((s) => s.syncing);
  const sync = useOfflineQueue((s) => s.sync);
  const { data: device } = useQuery({ queryKey: qk.device, queryFn: () => repos.profile.getDevice() });
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);
  const [sheet, setSheet] = useState<'language' | 'theme' | 'lead' | null>(null);
  const lang = i18n.language;
  const themeLabels: Record<ThemePreference, string> = { light: t('profile.themeLight'), dark: t('profile.themeDark'), system: t('profile.themeSystem') };
  const proxies = useOfflineQueue((s) => s.proxies);
  const pending = events.length + notes.length + proxies.length;

  const syncState: { icon: IconName; bg: keyof ThemeColors; fg: keyof ThemeColors; title: string; sub: string } = syncing
    ? { icon: 'sync', bg: 'infoBg', fg: 'infoFg', title: t('profile.syncingTitle'), sub: t('profile.syncingSub') }
    : pending > 0
      ? { icon: 'sync', bg: 'warningBg', fg: 'warningFg', title: t('profile.syncPendingTitle', { count: pending }), sub: t('profile.syncPendingSub') }
      : { icon: 'checkmark', bg: 'successBg', fg: 'successFg', title: t('profile.syncDoneTitle'), sub: t('profile.syncDoneSub') };

  const build = Platform.OS === 'ios' ? Constants.expoConfig?.ios?.buildNumber : String(Constants.expoConfig?.android?.versionCode ?? '');
  const aboutValue = t('profile.aboutValue', { version: Constants.expoConfig?.version ?? '1.0.0', build: build || '1' });

  const logout = async () => {
    setConfirmOut(false);
    toast.show(t('profile.loggedOutToast'));
    await signOut();
  };

  return (
    <Screen contentStyle={styles.content}>
      <BackHeader title={t('profile.settings')} variant="heading" />

      <View style={[styles.card, styles.list, { backgroundColor: colors.card, borderColor: colors.line }]}>
        <ValueRow label={t('profile.language')} value={LANGUAGE_NAMES[language ?? (lang === 'fr' ? 'fr' : 'en')]} onPress={() => setSheet('language')} />
        <View style={[styles.sep, { backgroundColor: colors.soft }]} />
        <ValueRow label={t('profile.theme')} value={themeLabels[theme]} onPress={() => setSheet('theme')} />
      </View>

      <Card title={t('profile.notificationsSection')} gap={6}>
        <Setting
          label={t('profile.shiftReminders')}
          sub={t('profile.shiftRemindersSub')}
          value={notifications.shiftReminders}
          onChange={(v) => setNotificationPrefs({ shiftReminders: v })}
        />
        {notifications.shiftReminders ? (
          <>
            <ValueRow label={t('profile.remindBefore')} value={t('profile.leadMinutes', { m: notifications.reminderLeadMinutes })} onPress={() => setSheet('lead')} plain />
          </>
        ) : null}
        <Setting
          label={t('profile.arrivalPrompt')}
          sub={t('profile.arrivalPromptSub')}
          value={notifications.arrivalPrompt}
          onChange={(v) => setNotificationPrefs({ arrivalPrompt: v })}
        />
        <Setting
          label={t('profile.leaveUpdates')}
          sub={t('profile.leaveUpdatesSub')}
          value={notifications.leaveUpdates}
          onChange={(v) => setNotificationPrefs({ leaveUpdates: v })}
        />
      </Card>

      <Card title={t('profile.offlineTitle')}>
        <View style={styles.syncRow}>
          <View style={[styles.syncIcon, { backgroundColor: colors[syncState.bg] }]}>
            <Icon name={syncState.icon} size={20} tone={syncState.fg} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.settingLabel}>{syncState.title}</Text>
            <Text variant="small" tone="muted" style={styles.settingSub}>
              {syncState.sub}
            </Text>
          </View>
        </View>
        {pending > 0 && !syncing ? (
          <View style={styles.queue}>
            {events.map((e) => (
              <QueueItem key={e.clientEventId} event={e} />
            ))}
            {proxies.map((p) => (
              <View key={p.id} style={[styles.queueItem, { backgroundColor: colors.bg }]}>
                <Text variant="caption">{`${p.input.type === 'check_in' ? t('profile.queueCheckIn') : t('profile.queueCheckOut')} · ${p.employeeName}`}</Text>
              </View>
            ))}
            {notes.map((n) => (
              <View key={n.id} style={[styles.queueItem, { backgroundColor: colors.bg }]}>
                <Text variant="caption">{t('profile.queueNote')}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <Button
          variant={pending > 0 || syncing ? 'primary' : 'outlinePrimary'}
          label={syncing ? t('profile.syncingTitle') : t('profile.syncNow')}
          disabled={syncing || pending === 0}
          onPress={() => void sync()}
        />
      </Card>

      <Card title={t('profile.device')} gap={8}>
        <Line label={t('profile.deviceLabel')} value={device?.model ?? '…'} />
        <Line label={t('profile.registered')} value={device ? dateOrDash(device.registeredAt, 'd MMM yyyy', lang) : '…'} />
        <Line label={t('profile.lastActive')} value={device ? dateOrDash(device.lastActiveAt, 'd MMM, HH:mm', lang) : '…'} />
      </Card>

      <View style={[styles.card, styles.list, { backgroundColor: colors.card, borderColor: colors.line }]}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: privacyOpen }} onPress={() => setPrivacyOpen((o) => !o)} style={styles.listRow}>
          <Text style={styles.listLabel}>{t('profile.privacyRow')}</Text>
          <Icon name={privacyOpen ? 'chevron-up' : 'chevron-down'} size={18} tone="muted" />
        </Pressable>
        {privacyOpen ? (
          <Text variant="caption" tone="muted" style={styles.privacy}>
            {t('profile.privacyText')}
          </Text>
        ) : null}
        <View style={[styles.sep, { backgroundColor: colors.soft }]} />
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: faqOpen }} onPress={() => setFaqOpen((o) => !o)} style={styles.listRow}>
          <Text style={styles.listLabel}>{t('profile.faq')}</Text>
          <Icon name={faqOpen ? 'chevron-up' : 'chevron-forward'} size={18} tone="faint" />
        </Pressable>
        {faqOpen ? (
          <View style={styles.faq}>
            {[1, 2, 3, 4, 5].map((n) => (
              <View key={n} style={styles.faqItem}>
                <Text variant="caption" style={styles.settingLabel}>
                  {t(`profile.faqItems.q${n}`)}
                </Text>
                <Text variant="caption" tone="muted">
                  {t(`profile.faqItems.a${n}`)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        <View style={[styles.sep, { backgroundColor: colors.soft }]} />
        <Pressable accessibilityRole="button" onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} style={styles.listRow}>
          <Text style={styles.listLabel}>{t('profile.contactAdminRow')}</Text>
          <Text variant="caption" tone="muted" style={styles.listValue}>
            {SUPPORT_EMAIL}
          </Text>
          <Icon name="chevron-forward" size={18} tone="faint" />
        </Pressable>
        <View style={[styles.sep, { backgroundColor: colors.soft }]} />
        <View style={styles.listRow}>
          <Text style={styles.listLabel}>{t('profile.about')}</Text>
          <Text variant="caption" tone="muted" style={styles.listValue}>
            {aboutValue}
          </Text>
        </View>
      </View>

      <Button variant="outlineDanger" label={t('profile.logout')} onPress={() => setConfirmOut(true)} />

      <BottomSheet visible={sheet === 'language'} onClose={() => setSheet(null)} title={t('profile.language')} closable>
        <View style={styles.options}>
          {(['en', 'fr'] as const).map((l) => (
            <RadioRow key={l} label={LANGUAGE_NAMES[l]} selected={(language ?? (lang === 'fr' ? 'fr' : 'en')) === l} onPress={() => { setLanguage(l); setSheet(null); }} />
          ))}
        </View>
      </BottomSheet>

      <BottomSheet visible={sheet === 'theme'} onClose={() => setSheet(null)} title={t('profile.theme')} closable>
        <View style={styles.options}>
          {(['light', 'dark', 'system'] as const).map((m) => (
            <RadioRow key={m} label={themeLabels[m]} selected={theme === m} onPress={() => { setTheme(m); setSheet(null); }} />
          ))}
        </View>
      </BottomSheet>

      <BottomSheet visible={sheet === 'lead'} onClose={() => setSheet(null)} title={t('profile.remindBefore')} closable>
        <View style={styles.options}>
          {LEADS.map((m) => (
            <RadioRow key={m} label={t('profile.leadMinutes', { m })} selected={notifications.reminderLeadMinutes === m} onPress={() => { setNotificationPrefs({ reminderLeadMinutes: m }); setSheet(null); }} />
          ))}
        </View>
      </BottomSheet>

      <BottomSheet visible={confirmOut} onClose={() => setConfirmOut(false)} title={t('profile.logoutConfirm')}>
        <Text tone="muted" style={styles.sheetBody}>
          {pending > 0 ? t('profile.logoutPending', { count: pending }) : t('profile.logoutBody')}
        </Text>
        <Button variant="destructive" label={t('profile.logout')} onPress={() => void logout()} />
        <Button variant="ghost" label={t('profile.stayLoggedIn')} onPress={() => setConfirmOut(false)} />
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 12 },
  card: { borderWidth: 1, borderRadius: radius.row, padding: 14 },
  cardTitle: { fontWeight: '800' },
  subTitle: { marginTop: 4 },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  lineLabel: { fontSize: 15 },
  lineValue: { fontSize: 15, fontWeight: '800', flexShrink: 1, textAlign: 'right' },
  setting: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  settingLabel: { fontSize: 15, fontWeight: '700' },
  settingSub: { fontWeight: '400', lineHeight: 17 },
  remind: { fontWeight: '700', marginTop: 2 },
  options: { gap: spacing.sm, marginTop: spacing.sm },
  valueRowPlain: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  syncIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  queue: { gap: 6 },
  queueItem: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  list: { paddingVertical: 4 },
  listRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  listLabel: { flex: 1, fontSize: 15, fontWeight: '700' },
  listValue: { fontWeight: '600' },
  sep: { height: 1 },
  privacy: { lineHeight: 20, paddingBottom: spacing.md },
  faq: { gap: spacing.md, paddingBottom: spacing.md },
  faqItem: { gap: 2 },
  sheetBody: { lineHeight: 21 },
});

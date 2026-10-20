import { useQuery } from '@tanstack/react-query';
import { addDays } from 'date-fns';
import { Camera } from 'expo-camera';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, View } from 'react-native';

import { capitalize, formatDate } from '@/core/format';
import { useLocationPermission } from '@/core/location/use-site-proximity';
import { getOrCreateDeviceId, useSession } from '@/core/session/session-store';
import { useTheme } from '@/core/theme/theme-provider';
import { cameraColors, radius, spacing, type ThemeColors } from '@/core/theme/tokens';
import { AppError, repos } from '@/data';
import { toIsoDate } from '@/domain';
import { Banner, Button, Icon, Screen, Text, type TextProps } from '@/ui';

const SUPPORT_EMAIL = 'support@staffsync.co';
const TOTAL = 4;

type LocState = 'ask' | 'denied' | 'precise';

function Hero({ height = 250, bg, children }: { height?: number; bg: string; children?: React.ReactNode }) {
  return <View style={[styles.hero, { height, backgroundColor: bg }]}>{children}</View>;
}

function Headline({ title, body }: { title: string; body: string }) {
  return (
    <>
      <Text style={styles.title}>{title}</Text>
      <Text tone="muted" style={styles.body}>
        {body}
      </Text>
    </>
  );
}

export function SetupScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const user = useSession((s) => s.user);
  const completeSetup = useSession((s) => s.completeSetup);
  const location = useLocationPermission();
  const [step, setStep] = useState(0);
  const [notifications, setNotifications] = useState<boolean | undefined>();
  const [camera, setCamera] = useState<boolean | undefined>();
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const lang = i18n.language;
  const site = user?.siteNames[0] ?? '';
  const deviceName = Device.deviceName ?? Device.modelName ?? '—';

  const next = () => setStep((s) => s + 1);
  const loc: LocState = location.state === 'denied' ? 'denied' : location.state === 'granted' && !location.precise ? 'precise' : 'ask';

  const firstShift = useQuery({
    queryKey: ['setup', 'first-shift'],
    enabled: step === 4,
    queryFn: async () => {
      const list = await repos.schedule.getRange(toIsoDate(new Date()), toIsoDate(addDays(new Date(), 14)));
      return [...list].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0] ?? null;
    },
  });

  const register = async () => {
    setBusy(true);
    try {
      await repos.auth.registerDevice(await getOrCreateDeviceId());
      setConflict(false);
      next();
    } catch (e) {
      if (e instanceof AppError && e.code === 'DEVICE_BOUND') setConflict(true);
    } finally {
      setBusy(false);
    }
  };

  const caption = step < TOTAL ? (
    <Text variant="caption" tone="muted" style={styles.caption}>
      {t('setup.stepOf', { n: step + 1, total: TOTAL })}
    </Text>
  ) : null;

  // 1 · Location
  if (step === 0) {
    const pin = loc === 'denied' ? colors.danger : loc === 'precise' ? colors.warning : colors.success;
    const copy =
      loc === 'denied'
        ? { title: t('setup.locOffTitle'), body: t('setup.locOffBody'), cta: t('setup.openSettings') }
        : loc === 'precise'
          ? { title: t('setup.preciseTitle'), body: t('setup.preciseBody'), cta: t('setup.openSettings') }
          : { title: t('setup.confirmOnSite'), body: t('setup.locationBody'), cta: location.state === 'granted' ? t('common.continue') : t('setup.allowLocation') };
    const press = async () => {
      if (loc !== 'ask') return void Linking.openSettings();
      if (location.state === 'granted') return next();
      const granted = await location.request();
      if (granted) next();
    };
    return (
      <Screen scroll={false} gutter={24} contentStyle={styles.content} footer={<Button large label={copy.cta} onPress={() => void press()} />}>
        {caption}
        <Hero bg={colors.map}>
          <View style={[styles.fence, { backgroundColor: `${colors.primary}33`, borderColor: colors.primary }]}>
            <View style={[styles.pin, { backgroundColor: pin, borderColor: colors.card, shadowColor: pin }]} />
          </View>
        </Hero>
        <Headline title={copy.title} body={copy.body} />
        {loc === 'denied' ? (
          <View style={[styles.guide, { backgroundColor: colors.card, borderColor: colors.line }]}>
            {(['guide1', 'guide2', 'guide3'] as const).map((k, i) => (
              <Text key={k} style={styles.guideLine}>
                {i + 1} · {t(`setup.${k}`)}
              </Text>
            ))}
          </View>
        ) : null}
        {loc === 'precise' ? (
          <View style={styles.bannerGap}>
            <Banner tone="warning" icon="locate-outline" text={t('setup.preciseBanner')} />
          </View>
        ) : null}
      </Screen>
    );
  }

  // 2 · Notifications
  if (step === 1) {
    return (
      <Screen
        scroll={false}
        gutter={24}
        contentStyle={styles.content}
        footer={
          <>
            <Button
              large
              label={t('setup.allow')}
              onPress={() =>
                void Notifications.requestPermissionsAsync().then((p) => {
                  setNotifications(p.granted);
                  next();
                })
              }
            />
            <Button
              variant="ghost"
              label={t('setup.notNow')}
              onPress={() => {
                setNotifications(false);
                next();
              }}
            />
          </>
        }>
        {caption}
        <Hero bg={colors.infoBg}>
          <View style={styles.notifs}>
            <View style={[styles.notif, { backgroundColor: colors.card }]}>
              <Text variant="label" tone="muted" style={styles.notifMeta}>
                StaffSync · 07:30
              </Text>
              <Text style={styles.notifText}>{t('setup.notifShift', { site })}</Text>
            </View>
            <View style={[styles.notif, styles.notifIndent, { backgroundColor: colors.card }]}>
              <Text variant="label" tone="muted" style={styles.notifMeta}>
                StaffSync
              </Text>
              <Text style={styles.notifText}>{t('setup.notifLeave')}</Text>
            </View>
          </View>
        </Hero>
        <Headline title={t('setup.stayTitle')} body={t('setup.stayBody')} />
      </Screen>
    );
  }

  // 3 · Camera
  if (step === 2) {
    return (
      <Screen
        scroll={false}
        gutter={24}
        contentStyle={styles.content}
        footer={
          <>
            <Button
              large
              label={t('setup.allow')}
              onPress={() =>
                void Camera.requestCameraPermissionsAsync().then((p) => {
                  setCamera(p.granted);
                  next();
                })
              }
            />
            <Button
              variant="ghost"
              label={t('setup.maybeLater')}
              onPress={() => {
                setCamera(false);
                next();
              }}
            />
          </>
        }>
        {caption}
        <Hero bg={cameraColors.navy}>
          <View style={styles.camRow}>
            <View style={styles.selfie}>
              <Text variant="label" style={styles.camLabel}>
                SELFIE
              </Text>
            </View>
            <View style={styles.qr}>
              <Text variant="label" style={styles.camLabel}>
                QR
              </Text>
            </View>
          </View>
        </Hero>
        <View style={[styles.tag, { backgroundColor: colors.infoBg }]}>
          <Text variant="small" tone="infoFg">
            {t('setup.camTag', { site })}
          </Text>
        </View>
        <Text style={[styles.title, styles.titleTight]}>{t('setup.camTitle')}</Text>
        <Text tone="muted" style={styles.body}>
          {t('setup.camBody')}
        </Text>
      </Screen>
    );
  }

  // 4 · Device registration
  if (step === 3) {
    return (
      <Screen
        scroll={false}
        gutter={24}
        contentStyle={styles.content}
        footer={
          conflict ? (
            <Button large variant="ink" label={t('setup.contactAdmin')} onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
          ) : (
            <Button large label={t('setup.confirmLink')} loading={busy} onPress={() => void register()} />
          )
        }>
        {caption}
        <Hero height={200} bg={conflict ? colors.dangerBg : colors.infoBg}>
          <View style={[styles.phone, { backgroundColor: colors.card, borderColor: cameraColors.navy }]}>
            <Icon name={conflict ? 'alert' : 'link'} size={30} tone={conflict ? 'flag' : 'primary'} />
          </View>
        </Hero>
        <Headline title={conflict ? t('setup.conflictTitle') : t('setup.linkTitle')} body={conflict ? t('setup.conflictBody') : t('setup.linkBody')} />
        <View style={styles.deviceBlock}>
          <Text variant="caption" style={styles.deviceLabel}>
            {t('setup.deviceName')}
          </Text>
          <View style={[styles.deviceField, { backgroundColor: colors.card, borderColor: conflict ? colors.fieldBorder : colors.primary, opacity: conflict ? 0.6 : 1 }]}>
            <Text style={styles.deviceText}>{deviceName}</Text>
          </View>
        </View>
      </Screen>
    );
  }

  // 5 · All set
  const shift = firstShift.data;
  const when = shift
    ? `${shift.date === toIsoDate(addDays(new Date(), 1)) ? `${t('setup.tomorrow')}, ` : ''}${capitalize(formatDate(shift.date, 'EEE d MMM', lang))} · ${shift.start}–${shift.end}`
    : '';
  const rows: { key: string; label: string; value: string; look: { bg: keyof ThemeColors; fg: NonNullable<TextProps['tone']> } }[] = [
    { key: 'loc', label: t('setup.summaryLocation'), value: t('setup.granted'), look: { bg: 'successBg', fg: 'successFg' } },
    notifications ? { key: 'notif', label: t('setup.summaryNotifications'), value: t('setup.granted'), look: { bg: 'successBg', fg: 'successFg' } } : { key: 'notif', label: t('setup.summaryNotifications'), value: t('setup.summarySkipped'), look: { bg: 'grayBg', fg: 'grayFg' } },
    camera ? { key: 'cam', label: t('setup.summaryCamera'), value: t('setup.granted'), look: { bg: 'successBg', fg: 'successFg' } } : { key: 'cam', label: t('setup.summaryCamera'), value: t('setup.summarySkipped'), look: { bg: 'grayBg', fg: 'grayFg' } },
    { key: 'dev', label: t('setup.summaryDevice'), value: t('setup.summaryLinked'), look: { bg: 'successBg', fg: 'successFg' } },
  ];

  return (
    <Screen scroll={false} gutter={24} contentStyle={styles.doneContent} footer={<Button large label={t('setup.goHome')} onPress={completeSetup} />}>
      <View style={[styles.doneCheck, { backgroundColor: colors.success }]}>
        <Icon name="checkmark" size={36} tone="onPrimary" />
      </View>
      <Text style={styles.doneTitle}>{t('setup.allSet')}</Text>
      <Text tone="muted" style={styles.doneSub}>
        {[user?.name, user?.branch].filter(Boolean).join(' · ')}
      </Text>
      <View style={styles.sums}>
        {rows.map((r) => (
          <View key={r.key} style={styles.sumRow}>
            <Text style={styles.sumLabel}>{r.label}</Text>
            <View style={[styles.sumPill, { backgroundColor: colors[r.look.bg] }]}>
              <Text variant="small" tone={r.look.fg}>
                {r.value}
              </Text>
            </View>
          </View>
        ))}
      </View>
      {shift ? (
        <View style={[styles.shiftCard, { backgroundColor: colors.card, borderColor: colors.line }]}>
          <Text variant="small" tone="muted">
            {t('setup.firstShift')}
          </Text>
          <Text style={styles.shiftWhen}>{when}</Text>
          <Text tone="muted" style={styles.shiftSite}>
            {shift.site.name} — {shift.site.address}
          </Text>
          <View style={[styles.sumPill, styles.shiftPill, { backgroundColor: colors.grayBg }]}>
            <Text variant="small" tone="grayFg">
              {t('setup.scheduledPill')}
            </Text>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xxxl + spacing.lg, gap: 0 },
  caption: { fontSize: 14, fontWeight: '700' },
  hero: { borderRadius: radius.sheet, marginTop: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  title: { fontSize: 28, fontWeight: '800', lineHeight: 32, marginTop: 28 },
  titleTight: { marginTop: 12 },
  body: { fontSize: 16, lineHeight: 23, marginTop: 10 },
  fence: { width: 160, height: 160, borderRadius: 80, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  pin: { width: 34, height: 34, borderRadius: 17, borderWidth: 5, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  guide: { marginTop: 16, borderWidth: 1, borderRadius: radius.button, padding: 14, gap: 4 },
  guideLine: { fontSize: 15, fontWeight: '600', lineHeight: 24 },
  bannerGap: { marginTop: 16 },
  notifs: { width: '100%', paddingHorizontal: 24, gap: 10 },
  notif: { borderRadius: radius.button, paddingVertical: 12, paddingHorizontal: 14, shadowColor: cameraColors.navy, shadowOpacity: 0.1, shadowRadius: 9, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  notifIndent: { marginLeft: 24 },
  notifMeta: { letterSpacing: 0, fontWeight: '400', textTransform: 'none' },
  notifText: { fontWeight: '700', fontSize: 15 },
  camRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  selfie: { width: 120, height: 150, borderRadius: 60, borderWidth: 4, borderStyle: 'dashed', borderColor: cameraColors.white, alignItems: 'center', justifyContent: 'center' },
  qr: { width: 100, height: 100, borderRadius: 14, borderWidth: 4, borderColor: cameraColors.accent, alignItems: 'center', justifyContent: 'center' },
  camLabel: { color: cameraColors.white, letterSpacing: 0, fontWeight: '700' },
  tag: { alignSelf: 'flex-start', marginTop: 20, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4 },
  phone: { width: 84, height: 140, borderRadius: 18, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  deviceBlock: { marginTop: 20 },
  deviceLabel: { fontWeight: '700', marginBottom: 8 },
  deviceField: { height: 60, borderRadius: radius.field, borderWidth: 2, justifyContent: 'center', paddingHorizontal: spacing.lg },
  deviceText: { fontSize: 18, fontWeight: '600' },
  doneContent: { paddingTop: spacing.xxxl + spacing.xxxl + spacing.lg, gap: 0 },
  doneCheck: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 30, fontWeight: '800', lineHeight: 35, marginTop: 20 },
  doneSub: { fontSize: 16, marginTop: 8 },
  sums: { gap: 8, marginTop: 24 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sumLabel: { fontSize: 15, fontWeight: '600' },
  sumPill: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  shiftCard: { marginTop: 24, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  shiftWhen: { fontSize: 20, fontWeight: '800', marginTop: 6 },
  shiftSite: { fontSize: 15, marginTop: 2 },
  shiftPill: { alignSelf: 'flex-start', marginTop: 10 },
});

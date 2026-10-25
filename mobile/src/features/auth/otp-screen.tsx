import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useSession } from '@/core/session/session-store';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { AppError, repos } from '@/data';
import { Button, Screen, Text } from '@/ui';

import { useAuthFlow } from './auth-flow-store';
import { CodeInput } from './otp-input';
import { otpSchema } from './schemas';

const RESEND_SECONDS = 60;
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function OtpScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { identifier, password, display, mode } = useAuthFlow();
  const setPending = useAuthFlow((s) => s.setPending);
  const clearFlow = useAuthFlow((s) => s.clear);
  const begin = useSession((s) => s.begin);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  // Nothing to verify without a prior login step (e.g. after a cold deep link).
  useEffect(() => {
    if (!identifier) router.replace('/');
  }, [identifier]);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const verify = async () => {
    if (!otpSchema.safeParse(code).success || busy || locked) return;
    setBusy(true);
    setError(undefined);
    try {
      const { session, companies, needsPassword } = await repos.auth.verifyOtp(identifier, code);
      if (needsPassword) {
        // Code accepted, but the account still needs its first password before the app opens.
        setPending({ session, companies });
        router.replace('/create-password');
      } else {
        clearFlow();
        await begin(session, companies);
      }
    } catch (e) {
      setCode('');
      if (e instanceof AppError && e.code === 'OTP_LOCKED') {
        setLocked(true);
        setError(t('auth.otpLocked'));
      } else if (e instanceof AppError && (e.code === 'OTP_INVALID' || e.code === 'OTP_EXPIRED')) {
        setError(t('auth.otpError'));
      } else {
        setError(t('common.genericError'));
      }
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(undefined);
    setCode('');
    try {
      await repos.auth.requestOtp(identifier, password || undefined);
      setSeconds(RESEND_SECONDS);
    } catch {
      setError(t('common.genericError'));
    }
  };

  return (
    <Screen
      gutter={24}
      footer={<Button large label={t('auth.verify')} onPress={() => void verify()} disabled={code.length !== 6 || locked} loading={busy} />}>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText} tone="primary">‹ {t('common.back')}</Text>
      </Pressable>

      <View style={styles.titles}>
        <Text variant="display">{t('auth.otpHeading')}</Text>
        <Text tone="muted">
          {t('auth.sentTo')} <Text variant="subheading">{display}</Text>
        </Text>
        <Pressable accessibilityRole="link" onPress={() => router.back()} style={styles.change}>
          <Text variant="subheading" tone="primary">{mode === 'email' ? t('auth.changeEmail') : t('auth.changeNumber')}</Text>
        </Pressable>
      </View>

      <CodeInput label={t('auth.otpHeading')} value={code} length={6} error={!!error} onChange={(v) => { setCode(v); setError(undefined); }} />

      {error ? (
        <View style={[styles.error, { backgroundColor: colors.dangerBg }]} accessibilityRole="alert">
          <Text variant="subheading" tone="dangerFg">{error}</Text>
        </View>
      ) : null}

      {seconds > 0 ? (
        <Text tone="muted" variant="caption" style={styles.resend}>
          {t('auth.resendCountdown')} <Text variant="subheading">{clock(seconds)}</Text>
        </Text>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => void resend()} disabled={locked} style={styles.change}>
          <Text variant="subheading" tone="primary">{t('auth.resendNow')}</Text>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  backText: { fontSize: 18, fontWeight: '700' },
  titles: { gap: spacing.sm, marginTop: spacing.sm },
  change: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  error: { padding: 14, borderRadius: radius.md },
  resend: { fontSize: 15 },
});

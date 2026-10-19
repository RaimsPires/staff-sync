import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useSession } from '@/core/session/session-store';
import { spacing } from '@/core/theme/tokens';
import { AppError, repos } from '@/data';
import { Button, Screen, Text } from '@/ui';

import { useAuthFlow } from './auth-flow-store';
import { errorKey } from './login-screen';
import { CodeInput } from './otp-input';
import { maskIdentifier, otpSchema } from './schemas';

const RESEND_SECONDS = 60;

export function OtpScreen() {
  const { t } = useTranslation();
  const identifier = useAuthFlow((s) => s.identifier);
  const clearFlow = useAuthFlow((s) => s.clear);
  const begin = useSession((s) => s.begin);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  // Nothing to verify without a prior login step (e.g. after a cold deep link).
  useEffect(() => {
    if (!identifier) router.replace('/login');
  }, [identifier]);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const verify = async (value: string) => {
    if (!otpSchema.safeParse(value).success || busy || locked) return;
    setBusy(true);
    setError(undefined);
    try {
      const { session, companies } = await repos.auth.verifyOtp(identifier, value);
      clearFlow();
      await begin(session, companies);
    } catch (e) {
      setCode('');
      if (e instanceof AppError && e.code === 'OTP_INVALID') {
        setError(t('auth.otpInvalid', { left: e.meta?.attemptsLeft ?? 0 }));
      } else if (e instanceof AppError && e.code === 'OTP_LOCKED') {
        setLocked(true);
        setError(t('auth.otpLocked'));
      } else if (e instanceof AppError && e.code === 'OTP_EXPIRED') {
        setError(t('auth.otpExpired'));
      } else {
        setError(t(errorKey(e)));
      }
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(undefined);
    setCode('');
    try {
      await repos.auth.requestOtp(identifier);
      setSeconds(RESEND_SECONDS);
    } catch (e) {
      setError(t(errorKey(e)));
    }
  };

  return (
    <Screen
      footer={
        <Button
          label={t('common.continue')}
          onPress={() => void verify(code)}
          disabled={code.length !== 6 || locked}
          loading={busy}
        />
      }>
      <View style={styles.header}>
        <Text variant="title">{t('auth.otpTitle')}</Text>
        <Text tone="muted">{t('auth.otpSubtitle', { target: maskIdentifier(identifier) })}</Text>
      </View>
      <CodeInput
        label={t('auth.otpTitle')}
        value={code}
        length={6}
        error={!!error}
        onChange={(v) => {
          setCode(v);
          if (v.length === 6) void verify(v);
        }}
      />
      {error ? (
        <Text tone="danger" accessibilityRole="alert" style={styles.center}>
          {error}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Button
          variant="ghost"
          label={seconds > 0 ? t('auth.resendIn', { s: seconds }) : t('common.resend')}
          onPress={() => void resend()}
          disabled={seconds > 0 || locked}
        />
        <Button variant="ghost" label={t('auth.changeIdentifier')} onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, paddingTop: spacing.xxl },
  center: { textAlign: 'center' },
  actions: { alignItems: 'center' },
});

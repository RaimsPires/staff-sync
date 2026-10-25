import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useSession } from '@/core/session/session-store';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { repos } from '@/data';
import { Button, Screen, Text } from '@/ui';

import { useAuthFlow } from './auth-flow-store';

const MIN_LENGTH = 10;

/** Shown once, right after the first code, to accounts that were created without a password. */
export function CreatePasswordScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const pending = useAuthFlow((s) => s.pending);
  const clearFlow = useAuthFlow((s) => s.clear);
  const begin = useSession((s) => s.begin);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  // Nothing to finish without a code step before it (e.g. after a cold start).
  useEffect(() => {
    if (!pending) router.replace('/');
  }, [pending]);

  const submit = async () => {
    if (!pending || busy) return;
    if (password.length < MIN_LENGTH) return setError(t('auth.passwordTooShort', { n: MIN_LENGTH }));
    if (password !== confirm) return setError(t('auth.passwordMismatch'));
    setBusy(true);
    setError(undefined);
    try {
      await repos.auth.setInitialPassword(password);
      const { session, companies } = pending;
      clearFlow();
      await begin(session, companies);
    } catch {
      setError(t('common.genericError'));
    } finally {
      setBusy(false);
    }
  };

  const field = (value: string, onChange: (v: string) => void, label: string, autoComplete: 'new-password') => (
    <TextInput
      value={value}
      onChangeText={(v) => {
        onChange(v);
        setError(undefined);
      }}
      placeholder={label}
      placeholderTextColor={colors.muted}
      secureTextEntry={!show}
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete={autoComplete}
      textContentType="newPassword"
      accessibilityLabel={label}
      style={[styles.input, { backgroundColor: colors.card, color: colors.ink, borderColor: error ? colors.danger : colors.fieldBorder }]}
    />
  );

  return (
    <Screen gutter={24} footer={<Button large label={t('auth.savePassword')} onPress={() => void submit()} loading={busy} disabled={!password || !confirm} />}>
      <View style={styles.titles}>
        <Text variant="display">{t('auth.createPasswordTitle')}</Text>
        <Text tone="muted">{t('auth.createPasswordBody', { n: MIN_LENGTH })}</Text>
      </View>
      <View style={styles.fields}>
        {field(password, setPassword, t('auth.newPassword'), 'new-password')}
        {field(confirm, setConfirm, t('auth.confirmPassword'), 'new-password')}
        <Pressable accessibilityRole="button" onPress={() => setShow((v) => !v)} style={styles.toggle}>
          <Text variant="subheading" tone="primary">{show ? t('auth.hidePassword') : t('auth.showPassword')}</Text>
        </Pressable>
        {error ? <Text variant="caption" tone="danger" accessibilityRole="alert">{error}</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titles: { gap: spacing.sm, marginTop: spacing.xxxl },
  fields: { gap: spacing.md, marginTop: spacing.lg },
  input: { height: 60, borderRadius: radius.field, borderWidth: 2, paddingHorizontal: spacing.lg, fontSize: 18, fontWeight: '600' },
  toggle: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
});

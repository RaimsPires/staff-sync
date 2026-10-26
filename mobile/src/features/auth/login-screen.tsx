import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useOnline } from '@/core/network/use-online';
import { useSettings } from '@/core/settings/settings-store';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { AppError, repos } from '@/data';
import { Button, Screen, Segmented, Text, Wordmark } from '@/ui';

import { useAuthFlow } from './auth-flow-store';
import { CountryPicker } from './country-picker';
import { defaultCountry, findCountry, formatAsYouType, maskPhone, parseLocalPhone, placeholderFor, type CountryCode } from './phone';
import { emailSchema, maskEmail } from './schemas';

type Mode = 'phone' | 'email';

export function errorKey(e: unknown): string {
  if (e instanceof AppError) {
    if (e.code === 'PASSWORD_REQUIRED') return 'auth.passwordRequired';
    if (e.code === 'INVALID_CREDENTIALS') return 'auth.wrongPassword';
    if (e.code === 'ACCOUNT_LOCKED') return 'auth.accountLocked';
    if (e.code === 'ACCOUNT_NOT_FOUND') return 'auth.notInvitedBody';
    if (e.code === 'ACCOUNT_DISABLED') return 'auth.deactivatedBody';
  }
  return 'common.genericError';
}

/** Shared by the login and "not invited" screens. */
export function useContactAdmin() {
  const { t } = useTranslation();
  return () => Alert.alert(t('auth.contactAdmin'), t('auth.contactAdminInfo'));
}

export function LoginScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const online = useOnline();
  const setLanguage = useSettings((s) => s.setLanguage);
  const setFlow = useAuthFlow((s) => s.set);
  const contactAdmin = useContactAdmin();

  const [mode, setMode] = useState<Mode>('phone');
  const [countryCode, setCountryCode] = useState<CountryCode>(defaultCountry);
  const [pickingCountry, setPickingCountry] = useState(false);
  const [local, setLocal] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string>();
  const [invalid, setInvalid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);

  const country = findCountry(countryCode, i18n.language);

  const submit = async () => {
    if (!online) return router.push('/offline');
    const phone = mode === 'phone' ? parseLocalPhone(local, countryCode) : undefined;
    const mail = mode === 'email' ? emailSchema.safeParse(email) : undefined;
    if (mode === 'phone' ? !phone : !mail?.success) return setInvalid(true);
    setInvalid(false);
    // New accounts have no password yet and create one after the first code; everyone else must type it.
    setPasswordError(undefined);

    const identifier = phone ? phone.e164 : (mail?.data as string);
    const display = phone ? maskPhone(country.dial, phone.national) : maskEmail(mail?.data as string);
    setBusy(true);
    try {
      const { passwordSetupRequired } = await repos.auth.requestOtp(identifier, password || undefined);
      setFlow({ identifier, password, display, mode, passwordSetupRequired });
      router.push('/otp');
    } catch (e) {
      if (e instanceof AppError && (e.code === 'PASSWORD_REQUIRED' || e.code === 'INVALID_CREDENTIALS' || e.code === 'ACCOUNT_LOCKED')) {
        setPasswordError(t(errorKey(e)));
      } else if (e instanceof AppError && e.code === 'ACCOUNT_NOT_FOUND') router.push('/not-invited');
      else if (e instanceof AppError && e.code === 'ACCOUNT_DISABLED') router.push({ pathname: '/deactivated', params: { company: e.meta?.company ?? '' } });
      else setInvalid(true);
    } finally {
      setBusy(false);
    }
  };

  const inputBorder = invalid ? colors.danger : focused ? colors.primary : colors.fieldBorder;

  return (
    <Screen
      gutter={24}
      footer={
        <>
          <Button large label={t('common.continue')} onPress={() => void submit()} loading={busy} />
          <Pressable accessibilityRole="link" onPress={contactAdmin} style={styles.trouble}>
            <Text variant="subheading" tone="primary">{t('auth.trouble')}</Text>
          </Pressable>
        </>
      }>
      <Wordmark />

      <View style={styles.titles}>
        <Text variant="display">{t('auth.welcomeBack')}</Text>
        <Text tone="muted">{t('auth.loginHint')}</Text>
      </View>

      <Segmented<Mode>
        large
        options={[
          { value: 'phone', label: t('auth.phoneTab') },
          { value: 'email', label: t('auth.emailTab') },
        ]}
        value={mode}
        onChange={(m) => {
          setMode(m);
          setInvalid(false);
        }}
      />

      <View style={styles.field}>
        <Text variant="caption" style={styles.label}>{mode === 'phone' ? t('auth.phoneLabel') : t('auth.emailLabel')}</Text>
        {mode === 'phone' ? (
          <View style={styles.phoneRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${country.name} ${country.dial}`}
              onPress={() => setPickingCountry(true)}
              style={[styles.dial, { backgroundColor: colors.card, borderColor: colors.fieldBorder }]}>
              <Text style={styles.flag}>{country.flag}</Text>
              <Text variant="subheading" style={styles.dialText}>{country.dial}</Text>
              <Text variant="label" tone="muted">▼</Text>
            </Pressable>
            <TextInput
              value={local}
              onChangeText={(v) => {
                setLocal(formatAsYouType(v, countryCode));
                setInvalid(false);
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={placeholderFor(countryCode) ?? t('auth.phonePlaceholder')}
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              maxLength={24}
              accessibilityLabel={t('auth.phoneLabel')}
              style={[styles.input, styles.phoneInput, { backgroundColor: colors.card, color: colors.ink, borderColor: inputBorder }]}
            />
          </View>
        ) : (
          <TextInput
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setInvalid(false);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={t('auth.emailPlaceholder')}
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            accessibilityLabel={t('auth.emailLabel')}
            style={[styles.input, { backgroundColor: colors.card, color: colors.ink, borderColor: inputBorder }]}
          />
        )}
        {invalid ? (
          <Text variant="caption" tone="danger" accessibilityRole="alert">{t('auth.identifierInvalid')}</Text>
        ) : (
          <Text variant="caption" tone="muted">{mode === 'phone' ? t('auth.smsHint') : t('auth.mailHint')}</Text>
        )}
      </View>
      <View style={styles.field}>
        <Text variant="caption" style={styles.label}>{t('auth.passwordLabel')}</Text>
        <View>
          <TextInput
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setPasswordError(undefined);
            }}
            placeholder={t('auth.passwordPlaceholder')}
            placeholderTextColor={colors.muted}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={() => void submit()}
            accessibilityLabel={t('auth.passwordLabel')}
            style={[styles.input, styles.passwordInput, { backgroundColor: colors.card, color: colors.ink, borderColor: passwordError ? colors.danger : colors.fieldBorder }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eye}>
            <Text variant="subheading" tone="primary">{showPassword ? t('auth.hide') : t('auth.show')}</Text>
          </Pressable>
        </View>
        {passwordError ? (
          <Text variant="caption" tone="danger" accessibilityRole="alert">{passwordError}</Text>
        ) : (
          <Text variant="caption" tone="muted">{t('auth.passwordHint')}</Text>
        )}
      </View>
      <CountryPicker
        visible={pickingCountry}
        selected={countryCode}
        lang={i18n.language}
        onSelect={(code) => {
          setCountryCode(code);
          setLocal((v) => formatAsYouType(v.replace(/\D/g, ''), code));
          setInvalid(false);
        }}
        onClose={() => setPickingCountry(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titles: { gap: spacing.sm, marginTop: spacing.xxxl + spacing.lg },
  field: { gap: spacing.sm, marginTop: spacing.sm },
  label: { fontWeight: '700' },
  phoneRow: { flexDirection: 'row', gap: 10 },
  dial: { height: 60, minWidth: 96, borderRadius: radius.field, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: spacing.md },
  dialText: { fontSize: 18, fontWeight: '700' },
  input: { height: 60, borderRadius: radius.field, borderWidth: 2, paddingHorizontal: spacing.lg, fontSize: 18, fontWeight: '600' },
  phoneInput: { flex: 1, minWidth: 0, fontSize: 20 },
  passwordInput: { paddingRight: 84 },
  eye: { position: 'absolute', right: 0, top: 0, bottom: 0, minWidth: 72, alignItems: 'center', justifyContent: 'center' },
  flag: { fontSize: 20 },
  trouble: { alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingVertical: spacing.sm },
});

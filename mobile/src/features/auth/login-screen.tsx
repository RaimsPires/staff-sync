import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { AppError, repos } from '@/data';
import { radius, spacing } from '@/core/theme/tokens';
import { Button, Screen, Text, TextField } from '@/ui';

import { useAuthFlow } from './auth-flow-store';
import { identifierSchema } from './schemas';

const formSchema = z.object({ identifier: identifierSchema });
type Form = z.infer<typeof formSchema>;

export function errorKey(e: unknown): string {
  if (e instanceof AppError) {
    if (e.code === 'ACCOUNT_NOT_FOUND') return 'auth.accountNotFound';
    if (e.code === 'ACCOUNT_DISABLED') return 'auth.accountDisabled';
  }
  return 'common.genericError';
}

export function LoginScreen() {
  const { t } = useTranslation();
  const setIdentifier = useAuthFlow((s) => s.set);
  const [serverError, setServerError] = useState<string>();
  const { control, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(formSchema),
    defaultValues: { identifier: '' },
  });

  const submit = handleSubmit(async ({ identifier }) => {
    setServerError(undefined);
    try {
      await repos.auth.requestOtp(identifier);
      setIdentifier(identifier);
      router.push('/otp');
    } catch (e) {
      // Same wording for unknown/disabled accounts is the server's job; show what it returns.
      setServerError(t(errorKey(e)));
    }
  });

  return (
    <Screen
      footer={<Button label={t('auth.sendCode')} onPress={submit} loading={formState.isSubmitting} />}>
      <View style={styles.header}>
        <Image source={require('@/../assets/images/logo.png')} style={styles.logo} accessibilityLabel="StaffSync" />
        <Text variant="title">{t('auth.loginTitle')}</Text>
        <Text tone="muted">{t('auth.loginSubtitle')}</Text>
      </View>
      <Controller
        control={control}
        name="identifier"
        render={({ field }) => (
          <TextField
            label={t('auth.identifierLabel')}
            placeholder={t('auth.identifierPlaceholder')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            error={formState.errors.identifier ? t('auth.identifierInvalid') : serverError}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, paddingTop: spacing.xxl },
  logo: { width: 72, height: 72, borderRadius: radius.lg, marginBottom: spacing.sm },
});

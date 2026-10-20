import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useContactAdmin } from '@/features/auth/login-screen';
import { StatusView } from '@/ui';

export default function NotInvitedRoute() {
  const { t } = useTranslation();
  const contactAdmin = useContactAdmin();
  return (
    <StatusView
      icon="help"
      tone="info"
      title={t('auth.notInvitedTitle')}
      body={t('auth.notInvitedBody')}
      primary={{ label: t('auth.tryAnother'), onPress: () => router.back() }}
      secondary={{ label: t('auth.contactAdmin'), onPress: contactAdmin }}
    />
  );
}

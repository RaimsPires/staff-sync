import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useContactAdmin } from '@/features/auth/login-screen';
import { StatusView } from '@/ui';

export default function DeactivatedRoute() {
  const { t } = useTranslation();
  const { company } = useLocalSearchParams<{ company?: string }>();
  const contactAdmin = useContactAdmin();
  return (
    <StatusView
      icon="ban"
      tone="danger"
      title={t('auth.deactivatedTitle')}
      body={t('auth.deactivatedBody', { company: company || t('auth.chooseCompany') })}
      primary={{ label: t('auth.contactAdmin'), onPress: contactAdmin }}
      secondary={{ label: t('auth.switchCompany'), onPress: () => router.back() }}
    />
  );
}

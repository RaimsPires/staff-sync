import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { StatusView } from '@/ui';

export default function OfflineRoute() {
  const { t } = useTranslation();
  return (
    <StatusView
      icon="cloud-offline"
      tone="warning"
      banner={t('auth.offlineBannerTop')}
      title={t('auth.offlineTitle')}
      body={t('auth.offlineBody')}
      primary={{ label: t('auth.tryAgain'), onPress: () => router.back() }}
    />
  );
}

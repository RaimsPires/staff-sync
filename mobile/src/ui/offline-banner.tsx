import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useOnline } from '@/core/network/use-online';
import { useTheme } from '@/core/theme/theme-provider';
import { spacing } from '@/core/theme/tokens';

import { Icon } from './icon';
import { Text } from './text';

export function OfflineBanner() {
  const online = useOnline();
  const { colors } = useTheme();
  const { t } = useTranslation();
  if (online) return null;

  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: colors.warning }]}>
      <Icon name="cloud-offline-outline" size={18} tone="onPrimary" />
      <Text variant="caption" tone="onPrimary" style={styles.text}>
        {t('common.offlineBanner')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  text: { flex: 1, fontWeight: '600' },
});

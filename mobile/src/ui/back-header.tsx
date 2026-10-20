import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme/theme-provider';
import { MIN_TOUCH, spacing } from '@/core/theme/tokens';

import { Icon } from './icon';
import { Text, type TextProps } from './text';

type Props = {
  title: string;
  eyebrow?: string;
  onBack?: () => void;
  /** Hide the back button for tab roots. */
  root?: boolean;
  right?: ReactNode;
  variant?: TextProps['variant'];
};

export function BackHeader({ title, eyebrow, onBack, root, right, variant = 'title' }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.row}>
      {root ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={onBack ?? (() => router.back())}
          style={[styles.back, { backgroundColor: colors.card, borderColor: colors.line }]}>
          <Icon name="chevron-back" size={22} />
        </Pressable>
      )}
      <View style={styles.title}>
        {eyebrow ? (
          <Text variant="label" tone="muted" style={styles.eyebrow}>
            {eyebrow.toUpperCase()}
          </Text>
        ) : null}
        <Text variant={variant} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  back: { width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: MIN_TOUCH / 2, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1 },
  eyebrow: { letterSpacing: 0.8 },
});

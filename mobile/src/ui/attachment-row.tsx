import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';

import { Icon } from './icon';
import { Text } from './text';

type Props = { name: string; size?: string; actionLabel?: string; onPress?: () => void };

export function AttachmentRow({ name, size, actionLabel, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.line }]}>
      <View style={[styles.tile, { backgroundColor: colors.dangerBg }]}>
        <Icon name="document-text-outline" size={18} tone="dangerFg" />
      </View>
      <View style={styles.flex}>
        <Text variant="bodyStrong" numberOfLines={1} style={styles.name}>
          {name}
        </Text>
        {size ? (
          <Text variant="small" tone="muted">
            {size}
          </Text>
        ) : null}
      </View>
      {actionLabel ? (
        <Text variant="caption" tone="primary" style={styles.action}>
          {actionLabel}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, borderRadius: radius.field, borderWidth: 1 },
  tile: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  name: { fontWeight: '700' },
  action: { fontWeight: '800' },
});

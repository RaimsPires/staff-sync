import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import { spacing } from '@/core/theme/tokens';

import { Icon, type IconName } from './icon';
import { Text } from './text';

type Props = { icon: IconName; title: string; body?: string };

export function EmptyState({ icon, title, body }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.badge, { backgroundColor: colors.soft }]}>
        <Icon name={icon} size={28} tone="muted" />
      </View>
      <Text variant="subheading">{title}</Text>
      {body ? (
        <Text tone="muted" style={styles.center}>
          {body}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxxl },
  badge: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});

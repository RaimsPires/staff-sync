import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import { MIN_TOUCH, radius, spacing } from '@/core/theme/tokens';

import { Text } from './text';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Taller tab-style variant used on the login screen. */
  large?: boolean;
};

export function Segmented<T extends string>({ options, value, onChange, large }: Props<T>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.infoBg }, large && styles.wrapLarge]} accessibilityRole="tablist">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={[styles.item, large && styles.itemLarge, selected && { backgroundColor: colors.card }]}>
            <Text variant={large ? 'body' : 'caption'} tone={selected ? 'primary' : 'muted'} style={styles.label}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: radius.pill, padding: 3, gap: 2 },
  item: { flex: 1, minHeight: MIN_TOUCH, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  wrapLarge: { borderRadius: 14, padding: 4 },
  itemLarge: { height: 48, borderRadius: 11 },
  label: { fontWeight: '800' },
});

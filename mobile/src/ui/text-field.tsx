import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import { MIN_TOUCH, radius, spacing } from '@/core/theme/tokens';

import { Text } from './text';

type Props = TextInputProps & { label: string; error?: string };

export function TextField({ label, error, style, ...rest }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text variant="caption" tone="muted" style={styles.label}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          { backgroundColor: colors.card, color: colors.ink, borderColor: error ? colors.danger : colors.fieldBorder },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" tone="danger" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { fontWeight: '600' },
  input: { minHeight: MIN_TOUCH + 8, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.lg, fontSize: 16 },
});

import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import { MIN_TOUCH, radius, spacing } from '@/core/theme/tokens';

import { Icon, type IconName } from './icon';
import { Text } from './text';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  large?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', icon, disabled, loading, large, style }: Props) {
  const { colors } = useTheme();
  const inactive = disabled || loading;

  const palette = {
    primary: { bg: colors.primary, pressed: colors.primaryPressed, border: colors.primary, fg: 'onPrimary' as const },
    danger: { bg: colors.danger, pressed: colors.dangerFg, border: colors.danger, fg: 'onPrimary' as const },
    secondary: { bg: colors.card, pressed: colors.soft, border: colors.line, fg: 'ink' as const },
    ghost: { bg: 'transparent', pressed: colors.soft, border: 'transparent', fg: 'primary' as const },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        large && styles.large,
        { backgroundColor: pressed ? palette.pressed : palette.bg, borderColor: palette.border },
        inactive && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={colors[palette.fg === 'onPrimary' ? 'onPrimary' : 'ink']} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={20} tone={palette.fg} /> : null}
          <Text variant="subheading" tone={palette.fg}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH + 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  large: { minHeight: 64 },
  disabled: { opacity: 0.5 },
});

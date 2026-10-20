import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import { cameraColors, MIN_TOUCH, radius, spacing } from '@/core/theme/tokens';

import { Icon, type IconName } from './icon';
import { Text } from './text';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'ink' | 'warning' | 'outlineDanger' | 'outlinePrimary' | 'soft' | 'destructive';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  large?: boolean;
  /** 68px hero button used by the check-in confirm sheet. */
  xl?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', icon, disabled, loading, large, xl, style }: Props) {
  const { colors } = useTheme();
  const inactive = disabled || loading;

  const palette = {
    primary: { bg: colors.primary, pressed: colors.primaryPressed, border: colors.primary, fg: 'onPrimary' as const },
    danger: { bg: colors.danger, pressed: colors.dangerFg, border: colors.danger, fg: 'onPrimary' as const },
    secondary: { bg: colors.card, pressed: colors.soft, border: colors.line, fg: 'ink' as const },
    ghost: { bg: 'transparent', pressed: colors.soft, border: 'transparent', fg: 'primary' as const },
    ink: { bg: cameraColors.navy, pressed: colors.primaryPressed, border: cameraColors.navy, fg: 'onPrimary' as const },
    warning: { bg: colors.warning, pressed: colors.warningFg, border: colors.warning, fg: 'onPrimary' as const },
    outlineDanger: { bg: colors.card, pressed: colors.dangerBg, border: colors.flag, fg: 'flag' as const },
    outlinePrimary: { bg: colors.card, pressed: colors.infoBg, border: colors.primary, fg: 'primary' as const },
    destructive: { bg: colors.flag, pressed: colors.dangerFg, border: colors.flag, fg: 'onPrimary' as const },
    soft: { bg: colors.soft, pressed: colors.infoBg, border: colors.soft, fg: 'muted' as const },
  }[variant];
  const solid = palette.fg === 'onPrimary';

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
        xl && styles.xl,
        variant === 'outlinePrimary' || variant === 'outlineDanger' ? styles.outlined : null,
        { backgroundColor: pressed ? palette.pressed : palette.bg, borderColor: palette.border },
        inactive && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={colors[solid ? 'onPrimary' : 'ink']} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={20} tone={palette.fg} /> : null}
          <Text variant="subheading" tone={palette.fg} style={(large || xl) && (xl ? styles.xlLabel : styles.largeLabel)}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH + 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  large: { minHeight: 64, borderRadius: 18 },
  xl: { minHeight: 68, borderRadius: radius.lg },
  outlined: { borderWidth: 1.5 },
  largeLabel: { fontSize: 20, fontWeight: '800' },
  xlLabel: { fontSize: 21, fontWeight: '800' },
  disabled: { opacity: 0.5 },
});

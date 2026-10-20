import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import { typography, type ThemeColors, type TypographyVariant } from '@/core/theme/tokens';

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  tone?: keyof Pick<ThemeColors, 'ink' | 'muted' | 'primary' | 'danger' | 'onPrimary' | 'successFg' | 'warningFg' | 'dangerFg' | 'infoFg' | 'success' | 'warning' | 'flag' | 'faint' | 'orangeFg' | 'purpleFg' | 'grayFg'>;
};

export function Text({ variant = 'body', tone = 'ink', style, ...rest }: TextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={1.4}
      style={[typography[variant], { color: colors[tone] }, style]}
      {...rest}
    />
  );
}

import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';

type Props = ViewProps & {
  /** Corner radius; the design uses 14, 16, 18 and 20 depending on the card. */
  corner?: number;
  pad?: number;
  tone?: 'card' | 'soft' | 'bg';
};

export function Card({ style, corner = radius.lg, pad = spacing.lg, tone = 'card', ...rest }: Props) {
  const { colors } = useTheme();
  return <View style={[styles.card, { backgroundColor: colors[tone], borderColor: colors.line, borderRadius: corner, padding: pad }, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.md },
});

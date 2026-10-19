import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { useTheme } from '@/core/theme/theme-provider';
import type { ThemeColors } from '@/core/theme/tokens';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = { name: IconName; size?: number; tone?: keyof ThemeColors };

export function Icon({ name, size = 22, tone = 'ink' }: Props) {
  const { colors } = useTheme();
  return <Ionicons name={name} size={size} color={colors[tone]} accessibilityElementsHidden />;
}

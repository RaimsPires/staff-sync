import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';

import { Icon, type IconName } from './icon';

type Props = { icon: IconName; label: string; onPress: () => void; disabled?: boolean };

/** 44px circular bordered button (month / week navigation, back). */
export function RoundButton({ icon, label, onPress, disabled }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.round, { backgroundColor: colors.card, borderColor: colors.line }]}>
      <Icon name={icon} size={20} tone={disabled ? 'faint' : 'ink'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({ round: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' } });

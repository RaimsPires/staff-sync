import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/core/theme/theme-provider';
import { cameraColors } from '@/core/theme/tokens';

type Props = { value: boolean; onChange: (value: boolean) => void; label: string };

/** 50×30 switch with a 24px knob, as drawn in the design. */
export function Toggle({ value, onChange, label }: Props) {
  const { colors } = useTheme();
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: withTiming(value ? 23 : 3, { duration: 150 }) }] }));
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      hitSlop={8}>
      <View style={[styles.track, { backgroundColor: value ? colors.primary : colors.fieldBorder }]}>
        <Animated.View style={[styles.knob, knob]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: 50, height: 30, borderRadius: 15, justifyContent: 'center' },
  knob: { position: 'absolute', top: 3, width: 24, height: 24, borderRadius: 12, backgroundColor: cameraColors.white },
});

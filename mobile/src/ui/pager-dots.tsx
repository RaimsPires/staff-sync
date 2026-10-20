import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';

type Props = { count: number; index: number; activeWidth?: number; size?: number };

export function PagerDots({ count, index, activeWidth = 18, size = 6 }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{ height: size, width: i === index ? activeWidth : size, borderRadius: size / 2, backgroundColor: i === index ? colors.primary : colors.line }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 } });

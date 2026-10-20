import { Text as RNText, StyleSheet } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import { cameraColors } from '@/core/theme/tokens';

/** "Staff" in ink, "Sync" in brand green, as in the design. */
export function Wordmark({ size = 22, onDark }: { size?: number; /** Force white "Staff" on the fixed-navy splash. */ onDark?: boolean }) {
  const { colors } = useTheme();
  return (
    <RNText accessibilityRole="header" accessibilityLabel="StaffSync" style={[styles.text, { fontSize: size, color: onDark ? cameraColors.white : colors.ink, letterSpacing: onDark ? -0.5 : 0 }]}>
      Staff<RNText style={{ color: colors.success }}>Sync</RNText>
    </RNText>
  );
}

const styles = StyleSheet.create({ text: { fontWeight: '800' } });

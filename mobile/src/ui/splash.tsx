import Constants from 'expo-constants';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { cameraColors } from '@/core/theme/tokens';

import { Text } from './text';
import { Wordmark } from './wordmark';

/** In-app splash on the fixed navy surface: logo tile, wordmark, progress bar and version. */
export function Splash() {
  const { t } = useTranslation();
  const progress = useSharedValue(0.1);
  useEffect(() => {
    progress.value = withTiming(0.62, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [progress]);
  const bar = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={styles.root} accessibilityLabel="StaffSync">
      {/* Same artwork as the native splash, so the hand-over from native to in-app is seamless. */}
      <Image source={require('@/../assets/images/splash-icon.png')} style={styles.tile} />
      <Wordmark size={34} onDark />
      <View style={styles.track}>
        <Animated.View style={[styles.fill, bar]} />
      </View>
      <Text variant="caption" style={styles.version}>
        {t('onboarding.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: cameraColors.navy, alignItems: 'center', justifyContent: 'center', gap: 20 },
  tile: { width: 120, height: 120 },
  track: { width: 140, height: 6, borderRadius: 3, backgroundColor: `${cameraColors.white}33`, overflow: 'hidden', marginTop: 24 },
  fill: { height: '100%', backgroundColor: cameraColors.accent, borderRadius: 3 },
  version: { position: 'absolute', bottom: 40, color: cameraColors.subOnNavy },
});

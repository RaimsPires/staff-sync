import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cameraColors, spacing } from '@/core/theme/tokens';

import { Text } from './text';

type ToastApi = { show: (message: string) => void };

const ToastContext = createContext<ToastApi>({ show: () => {} });

export const useToast = () => useContext(ToastContext);

const DURATION_MS = 2200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((next: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(next);
    timer.current = setTimeout(() => setMessage(null), DURATION_MS);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {message ? (
        <View pointerEvents="none" style={[styles.host, { bottom: insets.bottom + 88 }]}>
          <Animated.View entering={FadeInDown} exiting={FadeOutDown} style={styles.toast} accessibilityLiveRegion="polite">
            <Text variant="caption" tone="onPrimary" style={styles.text}>
              {message}
            </Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: spacing.xl, right: spacing.xl, alignItems: 'center' },
  // Fixed navy in both themes: the toast is an inverted surface.
  toast: { backgroundColor: cameraColors.navy, borderRadius: 14, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, maxWidth: '100%' },
  text: { fontWeight: '700', textAlign: 'center' },
});

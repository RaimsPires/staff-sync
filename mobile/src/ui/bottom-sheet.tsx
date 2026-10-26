import { useEffect, useState, type ReactNode } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/core/theme/theme-provider';
import { MIN_TOUCH, radius, spacing } from '@/core/theme/tokens';

import { Icon } from './icon';
import { Text } from './text';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  /** Show the 44px close button next to the title (design: forms); omit for confirm-style sheets. */
  closable?: boolean;
  children: ReactNode;
};

const OFFSCREEN = 600;

export function BottomSheet({ visible, onClose, title, subtitle, closable, children }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    } else {
      progress.value = withTiming(0, { duration: 180 }, (done) => {
        // Unmount only once the slide-out has finished.
        if (done) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const scrim = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - progress.value) * OFFSCREEN }] }));

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {/* Inside a modal the keyboard does not resize anything by itself, so the sheet has to move up to stay above it. */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }, scrim]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View
          style={[styles.sheet, { backgroundColor: colors.bg, paddingBottom: insets.bottom + spacing.xl }, sheet]}>
          <View style={[styles.handle, { backgroundColor: colors.line }]} />
          {title || closable ? (
            <View style={styles.header}>
              <View style={styles.flex}>
                {title ? <Text variant="heading">{title}</Text> : null}
                {subtitle ? (
                  <Text variant="caption" tone="muted">
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              {closable ? (
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  style={[styles.close, { backgroundColor: colors.card, borderColor: colors.line }]}>
                  <Icon name="close" size={20} />
                </Pressable>
              ) : null}
            </View>
          ) : null}
          <Pressable accessible={false} onPress={Keyboard.dismiss} style={styles.body}>
            {children}
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  flex: { flex: 1, gap: 2 },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: 10,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    maxHeight: '90%',
  },
  body: { gap: spacing.lg },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  close: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: MIN_TOUCH / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

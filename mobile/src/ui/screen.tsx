import type { ReactNode } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/core/theme/theme-provider';
import { cameraColors, spacing } from '@/core/theme/tokens';

import { OfflineBanner } from './offline-banner';

type Props = {
  children: ReactNode;
  /** Disable to render fixed (non-scrolling) content, e.g. full-screen maps. */
  scroll?: boolean;
  /** Skip the top inset when a native header is already shown. */
  edges?: { top?: boolean; bottom?: boolean };
  contentStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
  /** Horizontal padding; the auth screens use 24, the rest of the app 20. */
  gutter?: number;
  /** Pull-to-refresh handler; pass `refreshing` with it. */
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Fixed dark surface for camera / scanner screens (same in light and dark mode). */
  dark?: boolean;
  /** Render the footer on a card surface with a top border (sticky action bars). */
  footerCard?: boolean;
  /** Hide the generic offline banner when the screen draws its own. */
  hideOfflineBanner?: boolean;
  /** Full-width content above the scroll area, below the safe-area inset. */
  header?: ReactNode;
};

export function Screen({ children, scroll = true, edges, contentStyle, footer, gutter = spacing.xl, onRefresh, refreshing = false, dark, footerCard, hideOfflineBanner, header }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const top = edges?.top === false ? 0 : insets.top;
  const bottom = edges?.bottom === false ? 0 : insets.bottom;
  const body = [styles.content, { paddingHorizontal: gutter }, contentStyle];

  // Tapping empty space (not a button or field) puts the keyboard away. Taps on controls still reach the controls.
  return (
    // The whole screen, footer included, rises above the keyboard so a primary button is never hidden behind it.
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { backgroundColor: dark ? cameraColors.bg : colors.bg, paddingTop: top }]}>
      {hideOfflineBanner ? null : <OfflineBanner />}
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.grow}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}>
          <Pressable accessible={false} onPress={Keyboard.dismiss} style={body}>
            {children}
          </Pressable>
        </ScrollView>
      ) : (
        <Pressable accessible={false} onPress={Keyboard.dismiss} style={[styles.flex, body]}>
          {children}
        </Pressable>
      )}
      {footer ? (
        <View
          style={[
            styles.footer,
            { paddingHorizontal: gutter, paddingBottom: bottom + spacing.md },
            footerCard && { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.line },
          ]}>
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
  content: { padding: spacing.xl, gap: spacing.lg, flexGrow: 1 },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.sm },
});

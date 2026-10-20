import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
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

  return (
    <View style={[styles.root, { backgroundColor: dark ? cameraColors.bg : colors.bg, paddingTop: top }]}>
      {hideOfflineBanner ? null : <OfflineBanner />}
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, body]}>{children}</View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.lg, flexGrow: 1 },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.sm },
});

import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/core/theme/theme-provider';
import { spacing } from '@/core/theme/tokens';

import { OfflineBanner } from './offline-banner';

type Props = {
  children: ReactNode;
  /** Disable to render fixed (non-scrolling) content, e.g. full-screen maps. */
  scroll?: boolean;
  /** Skip the top inset when a native header is already shown. */
  edges?: { top?: boolean; bottom?: boolean };
  contentStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
};

export function Screen({ children, scroll = true, edges, contentStyle, footer }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const top = edges?.top === false ? 0 : insets.top;
  const bottom = edges?.bottom === false ? 0 : insets.bottom;
  const body = [styles.content, contentStyle];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: top }]}>
      <OfflineBanner />
      {scroll ? (
        <ScrollView
          contentContainerStyle={body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, body]}>{children}</View>
      )}
      {footer ? <View style={[styles.footer, { paddingBottom: bottom + spacing.md }]}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.lg, flexGrow: 1 },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.sm },
});

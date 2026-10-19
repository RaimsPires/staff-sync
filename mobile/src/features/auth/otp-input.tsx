import { useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { Text } from '@/ui';

type Props = {
  value: string;
  onChange: (value: string) => void;
  length: number;
  /** Mask digits (used for the proxy PIN). */
  secure?: boolean;
  error?: boolean;
  label: string;
  autoFocus?: boolean;
};

/** Single hidden input rendered as boxes: keeps paste / SMS autofill working. */
export function CodeInput({ value, onChange, length, secure, error, label, autoFocus = true }: Props) {
  const { colors } = useTheme();
  const ref = useRef<TextInputInstance>(null);

  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityLabel={label} style={styles.row}>
      {Array.from({ length }, (_, i) => {
        const filled = i < value.length;
        const active = i === value.length;
        return (
          <View
            key={i}
            style={[
              styles.box,
              {
                backgroundColor: colors.card,
                borderColor: error ? colors.danger : active ? colors.primary : colors.line,
              },
            ]}>
            <Text variant="heading">{filled ? (secure ? '•' : value[i]) : ''}</Text>
          </View>
        );
      })}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        autoFocus={autoFocus}
        secureTextEntry={secure}
        style={styles.hidden}
        caretHidden
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  box: { flex: 1, maxWidth: 52, height: 60, borderRadius: radius.md, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});

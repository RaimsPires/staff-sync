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

/**
 * One hidden input rendered as boxes, so paste and SMS autofill keep working.
 * Box colours follow the design: red on error, blue when filled, grey when empty.
 */
export function CodeInput({ value, onChange, length, secure, error, label, autoFocus = true }: Props) {
  const { colors } = useTheme();
  const ref = useRef<TextInputInstance>(null);

  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityLabel={label} style={styles.row}>
      {Array.from({ length }, (_, i) => {
        const filled = i < value.length;
        const border = error ? colors.danger : filled ? colors.primary : colors.fieldBorder;
        return (
          <View key={i} style={[styles.box, { backgroundColor: colors.card, borderColor: border }]}>
            <Text style={styles.digit}>{filled ? (secure ? '•' : value[i]) : ''}</Text>
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
  row: { flexDirection: 'row', gap: spacing.sm },
  box: { flex: 1, minWidth: 0, height: 64, borderRadius: radius.field, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  digit: { fontSize: 26, fontWeight: '800', lineHeight: 32 },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});

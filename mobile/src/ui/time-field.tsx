import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';

import { Icon } from './icon';
import { Text } from './text';

type Props = { label: string; value: string; onChange: (value: string) => void; error?: string };

const pad = (n: number) => String(n).padStart(2, '0');
export const isValidTime = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

function toDate(value: string): Date {
  const d = new Date();
  const [h, m] = isValidTime(value) ? value.split(':').map(Number) : [17, 0];
  d.setHours(h, m, 0, 0);
  return d;
}
const fromDate = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** 48px HH:mm field (radius 14, 17/700) that opens the native time picker (24-hour). */
export function TimeField({ label, value, onChange, error }: Props) {
  const { colors, isDark } = useTheme();
  const [iosOpen, setIosOpen] = useState(false);

  const onPicked = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'set' && date) onChange(fromDate(date));
  };

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value: toDate(value), mode: 'time', is24Hour: true, onChange: onPicked });
    } else {
      setIosOpen((o) => !o);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text variant="caption" tone="muted" style={styles.label}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || '--:--'}`}
        onPress={open}
        style={[styles.input, { backgroundColor: colors.card, borderColor: error ? colors.flag : iosOpen ? colors.primary : colors.line }]}>
        <Text style={styles.value}>{value || '--:--'}</Text>
        <Icon name="time-outline" size={20} tone="muted" />
      </Pressable>
      {Platform.OS === 'ios' && iosOpen ? (
        <DateTimePicker value={toDate(value)} mode="time" display="spinner" is24Hour themeVariant={isDark ? 'dark' : 'light'} onChange={onPicked} />
      ) : null}
      {error ? (
        <Text variant="small" tone="flag">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontWeight: '800' },
  input: { minHeight: 48, borderRadius: radius.field, borderWidth: 1, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  value: { fontSize: 17, fontWeight: '700' },
});

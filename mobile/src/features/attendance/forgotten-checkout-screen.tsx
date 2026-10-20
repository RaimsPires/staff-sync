import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, View } from 'react-native';

import { capitalize, formatDate, formatTime } from '@/core/format';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { repos } from '@/data';
import { Button, ResultView, Screen, Text } from '@/ui';

const SUPPORT_EMAIL = 'support@staffsync.co';

/** Reached from the "You didn't check out" reminder; explains the gap and points to the admin. */
export function ForgottenCheckoutScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { recordId } = useLocalSearchParams<{ recordId?: string }>();
  const { data: record } = useQuery({
    queryKey: ['attendance', 'forgotten', recordId ?? 'latest'],
    queryFn: async () => {
      if (recordId) return repos.attendance.getRecord(recordId);
      const { records } = await repos.attendance.getMonth(format(new Date(), 'yyyy-MM'));
      return [...records].filter((r) => r.status === 'missing_checkout').sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
    },
  });
  const lang = i18n.language;

  const rows: [string, string, boolean?][] = record
    ? [
        [t('check.checkedInAt'), record.checkInAt ? formatTime(record.checkInAt) : '–'],
        [t('check.scheduledEndLabel'), record.scheduledEnd],
        [t('check.checkOutLabel'), t('check.forgotMissing'), true],
      ]
    : [];

  return (
    <Screen
      scroll={false}
      footer={
        <>
          <Button large label={t('check.contactAdmin')} onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
          <Button variant="ghost" label={t('check.backHome')} onPress={() => router.dismissTo('/')} />
        </>
      }>
      <ResultView
        tone="warning"
        size={96}
        icon="time-outline"
        title={t('check.forgotTitle')}
        body={record ? t('check.forgotBody', { site: record.site.name, day: capitalize(formatDate(record.date, 'EEEE', lang)) }) : undefined}>
        {record ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>
            {rows.map(([k, v, missing], i) => (
              <View key={k} style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]}>
                <Text tone="muted">{k}</Text>
                <Text style={styles.value} tone={missing ? 'warning' : 'ink'}>
                  {v}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ResultView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14 },
  value: { fontWeight: '800' },
});

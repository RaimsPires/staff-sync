import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatDate } from '@/core/format';
import { spacing } from '@/core/theme/tokens';
import { toIsoDate, type LeaveRequest } from '@/domain';
import { Button, Card, EmptyState, Pill, Screen, Text } from '@/ui';

import { useLeaveBalances, useLeaveRequests, useLeaveTypes } from './queries';
import { LEAVE_TONE } from './status';

export function RequestRow({ request, typeName }: { request: LeaveRequest; typeName: string }) {
  const { t, i18n } = useTranslation();
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/leave/[id]', params: { id: request.id } })}>
      <Card style={styles.row}>
        <View style={styles.flex}>
          <Text variant="bodyStrong">{typeName}</Text>
          <Text variant="caption" tone="muted">
            {formatDate(request.start, 'd MMM', i18n.language)} – {formatDate(request.end, 'd MMM yyyy', i18n.language)} · {t('leave.days', { count: request.days })}
          </Text>
        </View>
        <Pill tone={LEAVE_TONE[request.status]} label={t(`leave.status.${request.status}`)} />
      </Card>
    </Pressable>
  );
}

export function LeaveScreen() {
  const { t, i18n } = useTranslation();
  const { data: types = [] } = useLeaveTypes();
  const { data: balances = [] } = useLeaveBalances();
  const { data: requests = [] } = useLeaveRequests();
  const name = (id: string) => types.find((x) => x.id === id)?.name[i18n.language === 'fr' ? 'fr' : 'en'] ?? id;
  const today = toIsoDate(new Date());
  const upcoming = requests.filter((r) => r.end >= today || r.status === 'pending' || r.status === 'changes_requested');
  const past = requests.filter((r) => !upcoming.includes(r));

  return (
    <Screen footer={<Button icon="add" label={t('leave.request')} onPress={() => router.push('/leave/new')} />}>
      <Text variant="title">{t('leave.title')}</Text>

      <View style={styles.balances}>
        {balances.map((b) => (
          <Card key={b.typeId} style={styles.balance}>
            <Text variant="caption" tone="muted">{name(b.typeId)}</Text>
            <Text variant="title">{b.remaining}</Text>
            <Text variant="caption" tone="muted">{t('leave.usedPending', { used: b.used, pending: b.pending })}</Text>
          </Card>
        ))}
      </View>

      <Text variant="subheading">{t('leave.myRequests')}</Text>
      {requests.length === 0 ? <EmptyState icon="airplane-outline" title={t('leave.none')} body={t('leave.noneBody')} /> : null}
      {upcoming.length > 0 ? (
        <View style={styles.group}>
          <Text variant="label" tone="muted">{t('leave.upcoming').toUpperCase()}</Text>
          {upcoming.map((r) => <RequestRow key={r.id} request={r} typeName={name(r.typeId)} />)}
        </View>
      ) : null}
      {past.length > 0 ? (
        <View style={styles.group}>
          <Text variant="label" tone="muted">{t('leave.past').toUpperCase()}</Text>
          {past.map((r) => <RequestRow key={r.id} request={r} typeName={name(r.typeId)} />)}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  balances: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  balance: { width: '48.5%', gap: 2 },
  group: { gap: spacing.sm },
});

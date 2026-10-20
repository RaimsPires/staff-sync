import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatDate } from '@/core/format';
import { spacing } from '@/core/theme/tokens';
import { repos } from '@/data';
import type { LeaveRequest } from '@/domain';
import { Button, Card, EmptyState, Icon, Pill, Screen, Text, TextField } from '@/ui';

import { useLeaveTypes } from '../leave/queries';
import { useLeaveInbox } from './queries';

function RequestCard({ request, typeName }: { request: LeaveRequest & { coverage: string[] }; typeName: string }) {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [comment, setComment] = useState('');
  const send = useMutation({
    mutationFn: (decision: 'approve' | 'reject') => repos.manager.recommend(request.id, decision, comment.trim()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manager'] }),
  });

  return (
    <Card>
      <Text variant="subheading">{request.employeeName}</Text>
      <Text tone="muted">
        {typeName} · {formatDate(request.start, 'd MMM', i18n.language)} – {formatDate(request.end, 'd MMM', i18n.language)} · {t('leave.days', { count: request.days })}
      </Text>
      <Text>{request.reason}</Text>
      {request.attachmentName ? (
        <View style={styles.row}>
          <Icon name="attach" size={18} tone="muted" />
          <Text variant="caption">{request.attachmentName}</Text>
        </View>
      ) : null}
      <View style={styles.coverage}>
        {request.coverage.length > 0 ? request.coverage.map((c) => <Text key={c} variant="caption" tone="warningFg">• {c}</Text>) : <Text variant="caption" tone="muted">{t('manager.coverageNone')}</Text>}
      </View>
      {request.recommendation ? (
        <Pill tone="info" label={t('manager.recommended')} />
      ) : (
        <>
          <TextField label={t('manager.comment')} value={comment} onChangeText={setComment} multiline maxLength={300} />
          <Button label={t('manager.recommendApprove')} loading={send.isPending} onPress={() => send.mutate('approve')} />
          <Button variant="danger" label={t('manager.recommendReject')} disabled={!comment.trim()} onPress={() => send.mutate('reject')} />
        </>
      )}
    </Card>
  );
}

export function ManagerLeaveRequestsScreen() {
  const { t, i18n } = useTranslation();
  const { siteId = '' } = useLocalSearchParams<{ siteId?: string }>();
  const { data = [] } = useLeaveInbox(siteId);
  const { data: types = [] } = useLeaveTypes();
  const name = (id: string) => types.find((x) => x.id === id)?.name[i18n.language === 'fr' ? 'fr' : 'en'] ?? id;

  return (
    <Screen>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
          <Icon name="chevron-back" />
        </Pressable>
        <Text variant="title" style={styles.flex}>{t('manager.recommendTitle')}</Text>
      </View>
      {data.length === 0 ? <EmptyState icon="airplane-outline" title={t('manager.noRequests')} /> : data.map((r) => <RequestCard key={r.id} request={r} typeName={name(r.typeId)} />)}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  coverage: { gap: 2 },
});

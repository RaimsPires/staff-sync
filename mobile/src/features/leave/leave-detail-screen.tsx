import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatDate } from '@/core/format';
import { spacing } from '@/core/theme/tokens';
import { repos } from '@/data';
import { allowedLeaveActions } from '@/domain';
import { Button, Card, Icon, Pill, Screen, Text, TextField } from '@/ui';

import { useLeaveRequest, useLeaveTypes } from './queries';
import { LEAVE_TONE } from './status';

export function LeaveDetailScreen() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: r } = useLeaveRequest(id);
  const { data: types = [] } = useLeaveTypes();
  const [reason, setReason] = useState('');
  const [asking, setAsking] = useState(false);

  const cancel = useMutation({
    mutationFn: () => repos.leave.cancel(id, reason.trim() || undefined),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['leave'] });
      setAsking(false);
    },
  });

  if (!r) return <Screen>{null}</Screen>;
  const actions = allowedLeaveActions(r.status);
  const typeName = types.find((x) => x.id === r.typeId)?.name[i18n.language === 'fr' ? 'fr' : 'en'] ?? r.typeId;
  const goEdit = () => router.push({ pathname: '/leave/new', params: { editId: r.id } });

  return (
    <Screen>
      <View style={styles.head}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
          <Icon name="chevron-back" />
        </Pressable>
        <Text variant="title" style={styles.flex}>{typeName}</Text>
        <Pill tone={LEAVE_TONE[r.status]} label={t(`leave.status.${r.status}`)} />
      </View>

      <Card>
        <Text variant="subheading">
          {formatDate(r.start, 'd MMM', i18n.language)} – {formatDate(r.end, 'd MMM yyyy', i18n.language)}
        </Text>
        <Text tone="muted">{t('leave.days', { count: r.days })}</Text>
        <Text>{r.reason}</Text>
        {r.attachmentName ? (
          <View style={styles.row}>
            <Icon name="attach" size={18} tone="muted" />
            <Text variant="caption">{r.attachmentName}</Text>
          </View>
        ) : null}
      </Card>

      <Card>
        <Text variant="subheading">{t('leave.timeline')}</Text>
        {r.timeline.map((e, i) => (
          <View key={i} style={styles.row}>
            <Icon name="ellipse" size={10} tone="primary" />
            <View style={styles.flex}>
              <Text variant="bodyStrong">{t(`leave.action.${e.action}`)} · {e.actor}</Text>
              <Text variant="caption" tone="muted">{formatDate(e.at, 'd MMM, HH:mm', i18n.language)}</Text>
              {e.comment ? <Text variant="caption">{e.comment}</Text> : null}
            </View>
          </View>
        ))}
      </Card>

      {asking ? (
        <Card>
          <TextField label={t('leave.cancelReason')} value={reason} onChangeText={setReason} multiline maxLength={300} />
          <Button variant="danger" label={t('common.confirm')} loading={cancel.isPending} onPress={() => cancel.mutate()} />
        </Card>
      ) : (
        <View style={styles.actions}>
          {actions.includes('edit') || actions.includes('resubmit') ? (
            <Button variant="secondary" icon="create-outline" label={actions.includes('resubmit') ? t('leave.resubmit') : t('leave.edit')} onPress={goEdit} />
          ) : null}
          {actions.includes('cancel') ? <Button variant="danger" label={t('leave.cancelRequest')} onPress={() => setAsking(true)} /> : null}
          {actions.includes('request_cancellation') ? <Button variant="danger" label={t('leave.requestCancellation')} onPress={() => setAsking(true)} /> : null}
          {actions.includes('new_request') ? <Button label={t('leave.newRequest')} onPress={() => router.push('/leave/new')} /> : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  actions: { gap: spacing.sm },
});

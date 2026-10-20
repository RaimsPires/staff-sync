import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { formatDuration, formatTime } from '@/core/format';
import { useTheme } from '@/core/theme/theme-provider';
import { spacing } from '@/core/theme/tokens';
import { repos } from '@/data';
import { qk } from '@/data/query-keys';
import { workedMinutes, type Flag } from '@/domain';
import { Button, Card, Icon, Pill, Screen, Text, TextField } from '@/ui';

import { QrStep, SelfieStep } from './camera-steps';
import { useCheckFlow, type FlowMode } from './use-check-flow';

function FlagList({ flags }: { flags: readonly Flag[] }) {
  const { t } = useTranslation();
  return (
    <View style={styles.gap}>
      {flags.map((f) => (
        <View key={f.reason} style={styles.row}>
          <Icon name="alert-circle" size={18} tone="warning" />
          <Text variant="caption" style={styles.flex}>
            {t(`check.flagReasons.${f.reason}`, { distance: f.distanceM ?? 0 })}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.between}>
      <Text tone="muted">{label}</Text>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}

export function CheckFlowScreen({ mode }: { mode: FlowMode }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const { data: assignment } = useQuery({
    queryKey: qk.assignment(assignmentId),
    queryFn: () => repos.schedule.getAssignment(assignmentId),
  });
  const flow = useCheckFlow(assignment, mode);
  const [comment, setComment] = useState('');
  const [commentSent, setCommentSent] = useState(false);
  const { step } = flow;
  const close = () => router.dismissTo('/');

  if (!assignment) return <Screen><ActivityIndicator color={colors.primary} /></Screen>;

  const title = mode === 'check_in' ? t('check.confirmInTitle') : t('check.confirmOutTitle');

  if (step.name === 'locating' || step.name === 'submitting') {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text tone="muted">{step.name === 'locating' ? t('check.locating') : t('check.submitting')}</Text>
        </View>
      </Screen>
    );
  }

  if (step.name === 'location_failed') {
    return (
      <Screen footer={<><Button label={t('common.retry')} onPress={() => void flow.retry()} /><Button variant="ghost" label={t('common.cancel')} onPress={close} /></>}>
        <Card>
          <Icon name="location-outline" size={28} tone="danger" />
          <Text>{t('check.locatingFailed')}</Text>
        </Card>
      </Screen>
    );
  }

  if (step.name === 'verify') {
    return (
      <Screen footer={<Button variant="ghost" label={t('common.cancel')} onPress={close} />}>
        {step.method === 'selfie' ? (
          <SelfieStep onDone={(uri) => flow.verified('selfie', uri)} />
        ) : (
          <QrStep onScanned={(payload) => flow.verified('qr', payload)} />
        )}
      </Screen>
    );
  }

  if (step.name === 'queued' || step.name === 'already_done' || step.name === 'error') {
    const icon = step.name === 'queued' ? 'cloud-upload' : step.name === 'error' ? 'close-circle' : 'information-circle';
    const text = step.name === 'queued' ? t('check.savedOffline') : step.name === 'error' ? t('common.genericError') : t('check.alreadyDone');
    return (
      <Screen footer={<Button label={t('check.backHome')} onPress={close} />}>
        <View style={styles.center}>
          <Icon name={icon} size={56} tone={step.name === 'error' ? 'danger' : 'primary'} />
          <Text variant="heading" style={styles.centerText}>{text}</Text>
        </View>
      </Screen>
    );
  }

  if (step.name === 'done') {
    const { record, flags } = step.result;
    const flagged = flags.length > 0;
    const at = mode === 'check_in' ? record.checkInAt : record.checkOutAt;
    const worked = record.checkInAt && record.checkOutAt ? workedMinutes(new Date(record.checkInAt), new Date(record.checkOutAt)) : 0;

    return (
      <Screen footer={<Button label={t('check.backHome')} onPress={close} />}>
        <View style={styles.center}>
          <Icon name={flagged ? 'alert-circle' : 'checkmark-circle'} size={64} tone={flagged ? 'warning' : 'success'} />
          <Text variant="title" style={styles.centerText}>
            {flagged ? t('check.flaggedTitle') : t(mode === 'check_in' ? 'check.successIn' : 'check.successOut', { time: at ? formatTime(at) : '' })}
          </Text>
          {!flagged && mode === 'check_in' ? (
            <Pill
              tone={(record.lateByMinutes ?? 0) > 0 ? 'warning' : 'success'}
              label={(record.lateByMinutes ?? 0) > 0 ? t('check.lateBy', { min: record.lateByMinutes }) : t('status.on_time')}
            />
          ) : null}
        </View>

        {flagged ? (
          <Card>
            <Text>{t('check.flaggedBody')}</Text>
            <FlagList flags={flags} />
            {commentSent ? (
              <Pill tone="success" label={t('check.commentSent')} />
            ) : (
              <>
                <TextField label={t('check.addComment')} placeholder={t('check.commentPlaceholder')} value={comment} onChangeText={setComment} multiline maxLength={500} />
                <Button
                  variant="secondary"
                  label={t('check.sendComment')}
                  disabled={!comment.trim()}
                  onPress={() => void repos.attendance.addComment(record.id, comment.trim()).then(() => setCommentSent(true))}
                />
              </>
            )}
          </Card>
        ) : null}

        {mode === 'check_out' ? (
          <Card>
            <Text variant="subheading">{t('check.summaryTitle')}</Text>
            {record.checkInAt ? <Row label={t('check.checkedInAt')} value={formatTime(record.checkInAt)} /> : null}
            {record.checkOutAt ? <Row label={t('check.checkedOutAt')} value={formatTime(record.checkOutAt)} /> : null}
            <Row label={t('check.totalHours')} value={formatDuration(worked, t)} />
            <Row label={t('check.status')} value={t(`status.${record.status}`)} />
          </Card>
        ) : null}
      </Screen>
    );
  }

  // confirm
  const unverified = flow.previewFlags.length > 0;
  return (
    <Screen
      footer={
        <>
          <Button label={t('common.confirm')} onPress={flow.confirm} />
          <Button variant="ghost" label={t('common.cancel')} onPress={close} />
        </>
      }>
      <Text variant="title">{title}</Text>
      <Card>
        <Row label={t('check.site')} value={assignment.site.name} />
        <Row label={t('check.time')} value={formatTime(new Date())} />
        <View style={styles.row}>
          <Icon name={unverified ? 'alert-circle' : 'checkmark-circle'} size={20} tone={unverified ? 'warning' : 'success'} />
          <Text variant="bodyStrong" tone={unverified ? 'warningFg' : 'successFg'} style={styles.flex}>
            {unverified ? t('check.locationUnverified') : t('check.locationVerified')}
          </Text>
        </View>
        {unverified ? <FlagList flags={flow.previewFlags} /> : null}
      </Card>

      {flow.earlyByMinutes > 0 ? (
        <Card>
          <View style={styles.row}>
            <Icon name="warning" size={20} tone="warning" />
            <Text variant="bodyStrong" tone="warningFg">{t('check.earlyWarn', { min: flow.earlyByMinutes })}</Text>
          </View>
          <TextField label={t('check.earlyNote')} value={flow.note} onChangeText={flow.setNote} multiline maxLength={300} />
        </Card>
      ) : null}

    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingVertical: spacing.xxxl },
  centerText: { textAlign: 'center' },
});

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatDate } from '@/core/format';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { repos, type LeaveDraft } from '@/data';
import { toIsoDate, type HalfDay, type IsoDate, type LeaveWarning } from '@/domain';
import { Button, Calendar, Card, Icon, Pill, Screen, Segmented, Text, TextField, type DayMark } from '@/ui';

import { useLeaveRequest, useLeaveTypes } from './queries';

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const WARNING_KEYS: Record<LeaveWarning, string> = {
  exceeds_balance: 'leave.warnExceeds',
  short_notice: 'leave.warnNotice',
  overlaps_intervention: 'leave.warnOverlap',
  attachment_required: 'leave.warnAttachment',
};

export function NewLeaveScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { data: existing } = useLeaveRequest(editId ?? '');
  const { data: types = [] } = useLeaveTypes();

  const [typeId, setTypeId] = useState<string>();
  const [month, setMonth] = useState(() => new Date());
  const [start, setStart] = useState<IsoDate>();
  const [end, setEnd] = useState<IsoDate>();
  const [startHalf, setStartHalf] = useState<HalfDay>();
  const [endHalf, setEndHalf] = useState<HalfDay>();
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState<string>();
  const [submitted, setSubmitted] = useState<{ reviewer: string }>();

  useEffect(() => {
    if (!existing || editId == null) return;
    setTypeId(existing.typeId);
    setStart(existing.start);
    setEnd(existing.end);
    setStartHalf(existing.startHalf);
    setEndHalf(existing.endHalf);
    setReason(existing.reason);
    setAttachment(existing.attachmentName);
  }, [existing, editId]);

  useEffect(() => {
    if (!typeId && types[0]) setTypeId(types[0].id);
  }, [types, typeId]);

  const type = types.find((x) => x.id === typeId);
  const today = toIsoDate(new Date());

  const draft: LeaveDraft | undefined =
    typeId && start && end
      ? { typeId, start, end, startHalf: type?.allowsHalfDay ? startHalf : undefined, endHalf: type?.allowsHalfDay ? endHalf : undefined, reason: reason.trim(), attachmentName: attachment }
      : undefined;

  const preview = useQuery({
    queryKey: ['leave', 'preview', draft],
    queryFn: () => repos.leave.preview(draft as LeaveDraft),
    enabled: !!draft,
  });

  const submit = useMutation({
    mutationFn: () => (editId ? repos.leave.update(editId, draft as LeaveDraft) : repos.leave.submit(draft as LeaveDraft)),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['leave'] });
      setSubmitted({ reviewer: preview.data?.reviewer ?? '' });
    },
  });

  const pickDate = (iso: IsoDate) => {
    if (!start || (start && end)) {
      setStart(iso);
      setEnd(undefined);
    } else if (iso < start) {
      setStart(iso);
    } else {
      setEnd(iso);
    }
  };

  const pickAttachment = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
    const file = res.assets?.[0];
    if (file && (file.size ?? 0) <= MAX_ATTACHMENT_BYTES) setAttachment(file.name);
  };

  const marks = (iso: IsoDate): DayMark => ({ disabled: iso < today });
  const warnings = preview.data?.warnings ?? [];
  const blocking = warnings.includes('attachment_required');
  const ready = !!draft && reason.trim().length >= 3 && !blocking && !preview.isLoading;

  if (submitted) {
    return (
      <Screen footer={<Button label={t('common.done')} onPress={() => router.dismissTo('/leave')} />}>
        <View style={styles.center}>
          <Icon name="checkmark-circle" size={64} tone="success" />
          <Text variant="title">{t('leave.submitted')}</Text>
          <Text tone="muted">{t('leave.submittedBody', { name: submitted.reviewer })}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen footer={<Button label={t('leave.review')} disabled={!ready} loading={submit.isPending} onPress={() => submit.mutate()} />}>
      <View style={styles.head}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
          <Icon name="chevron-back" />
        </Pressable>
        <Text variant="title" style={styles.flex}>{editId ? t('leave.editTitle') : t('leave.newTitle')}</Text>
      </View>

      <Text variant="subheading">{t('leave.type')}</Text>
      <View style={styles.types}>
        {types.map((x) => {
          const active = x.id === typeId;
          return (
            <Pressable
              key={x.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => setTypeId(x.id)}
              style={[styles.type, { backgroundColor: active ? colors.primary : colors.card, borderColor: colors.line }]}>
              <Text variant="caption" tone={active ? 'onPrimary' : 'ink'} style={styles.bold}>{x.name[i18n.language === 'fr' ? 'fr' : 'en']}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text variant="subheading">{t('leave.dates')}</Text>
      <Calendar month={month} onMonthChange={setMonth} lang={i18n.language} marks={marks} rangeStart={start} rangeEnd={end} onSelect={pickDate} />
      {!start ? <Text variant="caption" tone="muted">{t('leave.pickDates')}</Text> : null}

      {type?.allowsHalfDay && start ? (
        <Card>
          <Text variant="caption" tone="muted">{t('leave.halfStart')}</Text>
          <Segmented<'full' | HalfDay>
            options={[{ value: 'full', label: '1' }, { value: 'morning', label: t('leave.morning') }, { value: 'afternoon', label: t('leave.afternoon') }]}
            value={startHalf ?? 'full'}
            onChange={(v) => setStartHalf(v === 'full' ? undefined : v)}
          />
          {end && end !== start ? (
            <>
              <Text variant="caption" tone="muted">{t('leave.halfEnd')}</Text>
              <Segmented<'full' | HalfDay>
                options={[{ value: 'full', label: '1' }, { value: 'morning', label: t('leave.morning') }, { value: 'afternoon', label: t('leave.afternoon') }]}
                value={endHalf ?? 'full'}
                onChange={(v) => setEndHalf(v === 'full' ? undefined : v)}
              />
            </>
          ) : null}
        </Card>
      ) : null}

      {preview.data ? (
        <Card>
          <Text variant="subheading">{t('leave.counted', { days: preview.data.days, left: preview.data.remainingAfter })}</Text>
          {start && end ? <Text variant="caption" tone="muted">{formatDate(start, 'd MMM', i18n.language)} – {formatDate(end, 'd MMM yyyy', i18n.language)}</Text> : null}
          {warnings.map((w) => (
            <View key={w} style={styles.row}>
              <Icon name="warning" size={18} tone="warning" />
              <Text variant="caption" tone="warningFg" style={styles.flex}>{t(WARNING_KEYS[w])}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      <TextField label={t('leave.reason')} value={reason} onChangeText={setReason} multiline maxLength={500} style={styles.multiline} />

      {attachment ? <Pill tone="info" label={attachment} /> : null}
      <Button variant="secondary" icon="attach" label={t('leave.attach')} onPress={() => void pickAttachment()} />
      {type?.requiresAttachment && !attachment ? <Text variant="caption" tone="danger">{t('leave.attachRequired')}</Text> : null}
      {preview.data ? <Text variant="caption" tone="muted">{t('leave.reviewer', { name: preview.data.reviewer })}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  type: { minHeight: 44, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center' },
  bold: { fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  multiline: { minHeight: 100, textAlignVertical: 'top', paddingTop: spacing.md },
  center: { alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xxxl },
});

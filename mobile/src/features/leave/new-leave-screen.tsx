import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addMonths, isSameMonth, startOfMonth } from 'date-fns';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { capitalize, formatDate } from '@/core/format';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { repos, type LeaveDraft } from '@/data';
import { halfDayChoices, toIsoDate, type HalfDay, type IsoDate } from '@/domain';
import { BackHeader, Banner, Button, Calendar, Icon, ResultView, Screen, Segmented, StatusChip, Text, type DayMark, type IconName } from '@/ui';

import { useMonthSchedule } from '../schedule/queries';
import { useLeaveBalances, useLeaveRequest, useLeaveTypes } from './queries';
import { leaveTint } from './tint';

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
type Step = 'form' | 'review' | 'done';
type Half = 'full' | HalfDay;
type Attachment = { name: string; size: string; uri?: string; type?: string };

const sizeLabel = (bytes?: number) => (!bytes ? '' : bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export function NewLeaveScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const lang = i18n.language;
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { data: existing } = useLeaveRequest(editId ?? '');
  const { data: types = [] } = useLeaveTypes();
  const { data: balances = [] } = useLeaveBalances();

  const [step, setStep] = useState<Step>('form');
  const [typeId, setTypeId] = useState<string>();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [start, setStart] = useState<IsoDate>();
  const [end, setEnd] = useState<IsoDate>();
  const [startHalf, setStartHalf] = useState<HalfDay>();
  const [endHalf, setEndHalf] = useState<HalfDay>();
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState<Attachment>();

  const { holidays, leave } = useMonthSchedule(month);

  useEffect(() => {
    if (!existing || editId == null) return;
    setTypeId(existing.typeId);
    setStart(existing.start);
    setEnd(existing.end);
    setStartHalf(existing.startHalf);
    setEndHalf(existing.endHalf);
    setReason(existing.reason);
    if (existing.attachmentName) setAttachment({ name: existing.attachmentName, size: '' });
    setMonth(startOfMonth(new Date(`${existing.start}T12:00:00`)));
  }, [existing, editId]);

  useEffect(() => {
    if (!typeId && types[0]) setTypeId(types[0].id);
  }, [types, typeId]);

  const type = types.find((x) => x.id === typeId);
  const typeName = (id: string) => types.find((x) => x.id === id)?.name[lang === 'fr' ? 'fr' : 'en'] ?? id;
  const remainingOf = (id: string) => balances.find((b) => b.typeId === id)?.remaining ?? 0;
  const today = toIsoDate(new Date());
  const single = !end || end === start;

  const base = typeId && start ? { typeId, start, end: end ?? start, startHalf: type?.allowsHalfDay ? startHalf : undefined, endHalf: type?.allowsHalfDay && !single ? endHalf : undefined, attachmentName: attachment?.name, attachmentUri: attachment?.uri, attachmentType: attachment?.type } : undefined;
  const draft: LeaveDraft | undefined = base && { ...base, reason: reason.trim() };

  // The preview ignores the reason so typing does not refetch it.
  const preview = useQuery({
    queryKey: ['leave', 'preview', base],
    queryFn: () => repos.leave.preview({ ...(base as Omit<LeaveDraft, 'reason'>), reason: '' }),
    enabled: !!base,
  });

  const submit = useMutation({
    mutationFn: () => (editId ? repos.leave.update(editId, draft as LeaveDraft) : repos.leave.submit(draft as LeaveDraft)),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['leave'] });
      setStep('done');
    },
  });

  const pickDate = (iso: IsoDate) => {
    if (!start || end) {
      setStart(iso);
      setEnd(undefined);
      setStartHalf(undefined);
      setEndHalf(undefined);
    } else if (iso < start) {
      setStart(iso);
    } else {
      setEnd(iso);
      setStartHalf((h) => (h === 'morning' ? undefined : h));
    }
  };

  const take = (file: Attachment | undefined) => file && setAttachment(file);
  const fromCamera = async () => {
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    const a = res.canceled ? undefined : res.assets[0];
    if (a && (a.fileSize ?? 0) <= MAX_ATTACHMENT_BYTES) take({ name: a.fileName ?? 'photo.jpg', size: sizeLabel(a.fileSize), uri: a.uri, type: a.mimeType });
  };
  const fromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    const a = res.canceled ? undefined : res.assets[0];
    if (a && (a.fileSize ?? 0) <= MAX_ATTACHMENT_BYTES) take({ name: a.fileName ?? 'image.jpg', size: sizeLabel(a.fileSize), uri: a.uri, type: a.mimeType });
  };
  const fromFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
    const f = res.assets?.[0];
    if (f && (f.size ?? 0) <= MAX_ATTACHMENT_BYTES) take({ name: f.name, size: sizeLabel(f.size), uri: f.uri, type: f.mimeType });
  };

  const holidaySet = new Set(holidays);
  const marks = (iso: IsoDate): DayMark => {
    const own = leave.some((l) => iso >= l.start && iso <= l.end);
    const past = iso <= today;
    return {
      bg: own ? 'infoBg' : holidaySet.has(iso) ? 'purpleBg' : undefined,
      disabled: past || own,
      faint: past && !own,
      ring: iso === today,
    };
  };

  const data = preview.data;
  const days = data?.days ?? 0;
  const left = type ? remainingOf(type.id) : 0;
  const rem = data ? data.remainingAfter : left;
  const needFile = !!type?.requiresAttachment && !attachment;
  const blocked = !base || !data || days > left || needFile;
  const dayWord = (n: number) => t('leave.days', { count: n });
  const fmtDay = (iso: IsoDate) => capitalize(formatDate(iso, 'EEE d MMM', lang));
  const datesLabel = start ? (single ? fmtDay(start) : `${fmtDay(start)} – ${fmtDay(end as IsoDate)}`) : '—';

  type WarningItem = { key: string; tone: 'danger' | 'warning' | 'orange'; icon: IconName; title: string; text: string };
  const warnings = (data?.warnings ?? []).flatMap((w): WarningItem[] => {
    if (w === 'exceeds_balance')
      return [{ key: w, tone: 'danger' as const, icon: 'warning-outline' as const, title: t('leave.warnExceedsTitle'), text: t('leave.warnExceedsText', { days: dayWord(days), left: dayWord(left), type: typeName(typeId ?? '') }) }];
    if (w === 'short_notice')
      return [{ key: w, tone: 'warning' as const, icon: 'time-outline' as const, title: t('leave.warnNoticeTitle'), text: t('leave.warnNoticeText', { type: typeName(typeId ?? ''), n: type?.minNoticeDays ?? 0 }) }];
    if (w === 'overlaps_intervention')
      return [{ key: w, tone: 'orange' as const, icon: 'flag-outline' as const, title: t('leave.warnOverlapTitle'), text: t('leave.warnOverlapText') }];
    return [];
  });

  const warningList = warnings.length ? (
    <View style={styles.gap8}>
      {warnings.map((w) => (
        <Banner key={w.key} tone={w.tone} icon={w.icon} title={w.title} text={w.text} />
      ))}
    </View>
  ) : null;

  if (step === 'done') {
    return (
      <Screen scroll={false} footer={<Button large label={t('leave.backToLeave')} onPress={() => router.dismissTo('/leave')} />}>
        <ResultView tone="success" size={88} icon="checkmark" title={t('leave.doneTitle', { name: data?.reviewer ?? '' })} body={t('leave.doneBody')}>
          <View style={[styles.card, styles.full, { backgroundColor: colors.card, borderColor: colors.line }]}>
            <View style={styles.between}>
              <Text variant="subheading" style={styles.bold}>
                {typeName(typeId ?? '')}
              </Text>
              <StatusChip tone="warning" label={t('leave.status.pending')} />
            </View>
            <Text tone="muted">
              {datesLabel} · {dayWord(days)}
            </Text>
          </View>
        </ResultView>
      </Screen>
    );
  }

  const live = start
    ? { left: t('leave.liveRequested', { days: dayWord(days) }), right: rem < 0 ? t('leave.liveOver', { n: dayWord(Math.abs(rem)) }) : t('leave.liveRemaining', { n: dayWord(rem) }), bad: rem < 0 }
    : { left: t('leave.liveSelect'), right: t('leave.liveAvailable', { n: dayWord(left) }), bad: false };

  const footer = (
    <>
      <View style={styles.between}>
        <Text style={styles.bold}>{live.left}</Text>
        <Text style={[styles.bold, { color: live.bad ? colors.flag : start ? colors.successFg : colors.muted }]}>{live.right}</Text>
      </View>
      {step === 'form' ? (
        <Button label={t('leave.reviewCta')} disabled={blocked} onPress={() => setStep('review')} />
      ) : (
        <Button label={t('leave.submitCta')} loading={submit.isPending} onPress={() => submit.mutate()} />
      )}
    </>
  );

  const choices = halfDayChoices(single);
  const halfLabel = (v: Half, where: 'single' | 'first' | 'last') =>
    v === 'full' ? t('leave.fullDay') : v === 'morning' ? (where === 'single' ? t('leave.morning') : t('leave.morningOnly')) : where === 'single' ? t('leave.afternoon') : t('leave.afternoonOnly');
  const halfOptions = (opts: readonly Half[], where: 'single' | 'first' | 'last') => opts.map((value) => ({ value, label: halfLabel(value, where) }));

  return (
    <Screen footerCard footer={footer} contentStyle={styles.content}>
      <BackHeader
        title={step === 'form' ? (editId ? t('leave.editTitle') : t('leave.headerNew')) : t('leave.reviewTitle')}
        variant="heading"
        onBack={step === 'review' ? () => setStep('form') : undefined}
        right={
          <Text variant="small" tone="muted" style={styles.bold}>
            {t('common.stepOf', { step: step === 'form' ? 1 : 2, total: 2 })}
          </Text>
        }
      />

      {step === 'form' ? (
        <>
          <Text style={styles.label}>{t('leave.type')}</Text>
          <View style={styles.types}>
            {types.map((x) => {
              const active = x.id === typeId;
              const tint = leaveTint(x.id);
              return (
                <Pressable
                  key={x.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => setTypeId(x.id)}
                  style={[styles.type, { backgroundColor: active ? colors.infoBg : colors.card, borderColor: active ? colors.primary : colors.line, borderWidth: active ? 2 : 1 }]}>
                  <View style={styles.typeTop}>
                    <View style={[styles.dot, { backgroundColor: colors[tint.fg] }]} />
                    <Text style={styles.typeName} numberOfLines={1}>
                      {typeName(x.id)}
                    </Text>
                  </View>
                  <Text variant="small" tone="muted" style={styles.regular}>
                    {t('leave.remaining', { count: remainingOf(x.id) })}
                    {x.requiresAttachment ? t('leave.proofRequired') : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>{t('leave.dates')}</Text>
          <Calendar
            month={month}
            onMonthChange={setMonth}
            lang={lang}
            card
            navySelection
            prevDisabled={isSameMonth(month, new Date())}
            nextDisabled={!isSameMonth(month, new Date()) && month > addMonths(new Date(), 11)}
            marks={marks}
            rangeStart={start}
            rangeEnd={end}
            onSelect={pickDate}
            legend={[
              { label: t('leave.legendSelected'), color: 'ink' },
              { label: t('leave.legendLeave'), color: 'infoFg' },
              { label: t('leave.legendHoliday'), color: 'purpleFg' },
              { label: t('leave.legendUnavailable'), color: 'faint' },
            ]}
          />

          {start && type?.allowsHalfDay ? (
            <View style={styles.gap8}>
              <Text variant="caption" tone="muted" style={styles.label}>
                {single ? t('leave.dayLength') : t('leave.firstDay')}
              </Text>
              <Segmented<Half>
                options={halfOptions(choices.first, single ? 'single' : 'first')}
                value={startHalf ?? 'full'}
                onChange={(v) => setStartHalf(v === 'full' ? undefined : v)}
              />
              {!single ? (
                <>
                  <Text variant="caption" tone="muted" style={styles.label}>
                    {t('leave.lastDay')}
                  </Text>
                  <Segmented<Half>
                    options={halfOptions(choices.last, 'last')}
                    value={endHalf ?? 'full'}
                    onChange={(v) => setEndHalf(v === 'full' ? undefined : v)}
                  />
                </>
              ) : null}
            </View>
          ) : null}

          {warningList}

          <View style={styles.gap6}>
            <Text style={styles.label}>
              {t('leave.reason')} <Text style={styles.regularLabel}>{t('leave.reasonOptional')}</Text>
            </Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
              maxLength={500}
              placeholder={t('leave.reasonPlaceholder')}
              placeholderTextColor={colors.muted}
              accessibilityLabel={t('leave.reason')}
              style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.line, color: colors.ink }]}
            />
          </View>

          <View style={styles.gap8}>
            <Text style={styles.label}>
              {t('leave.attachmentLabel')}{' '}
              <Text style={[styles.attNote, { color: type?.requiresAttachment ? (needFile ? colors.flag : colors.successFg) : colors.muted }]}>
                {type?.requiresAttachment ? t('leave.attRequiredNote') : t('leave.attOptional')}
              </Text>
            </Text>
            <View style={styles.attRow}>
              {(
                [
                  ['camera-outline', t('leave.camera'), fromCamera],
                  ['image-outline', t('leave.gallery'), fromGallery],
                  ['document-outline', t('leave.fileBtn'), fromFile],
                ] as const
              ).map(([icon, label, onPress]) => (
                <Pressable key={label} accessibilityRole="button" onPress={() => void onPress()} style={[styles.attBtn, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                  <Icon name={icon} size={20} tone="primary" />
                  <Text variant="caption" tone="primary" style={styles.attLabel}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {attachment ? (
              <View style={[styles.file, { backgroundColor: colors.soft }]}>
                <Icon name="attach" size={18} />
                <Text variant="caption" style={styles.fileName} numberOfLines={1}>
                  {attachment.name}
                  {attachment.size ? ` · ${attachment.size}` : ''}
                </Text>
                <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={() => setAttachment(undefined)} style={styles.remove}>
                  <Icon name="close" size={18} tone="muted" />
                </Pressable>
              </View>
            ) : null}
          </View>
        </>
      ) : (
        <>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.row }]}>
            <View style={styles.typeTop}>
              <View style={[styles.dotBig, { backgroundColor: colors[leaveTint(typeId ?? '').fg] }]} />
              <Text variant="heading">{typeName(typeId ?? '')}</Text>
            </View>
            {(
              [
                [t('leave.rowDates'), datesLabel],
                [
                  t('leave.rowDuration'),
                  [
                    dayWord(days),
                    !single && startHalf === 'afternoon' ? t('leave.startsAfternoon') : '',
                    !single && endHalf === 'morning' ? t('leave.endsMorning') : '',
                    single && startHalf ? (startHalf === 'morning' ? t('leave.onlyMorning') : t('leave.onlyAfternoon')) : '',
                  ]
                    .filter(Boolean)
                    .join(' · '),
                ],
                [t('leave.rowBalanceAfter'), t('leave.balanceLeftSub', { n: dayWord(Math.max(rem, 0)) })],
                [t('leave.rowAttachments'), attachment ? attachment.name : needFile ? t('leave.rowMissing') : t('leave.rowNone')],
                [t('leave.rowApprover'), data?.reviewer ?? '—'],
              ] as [string, string][]
            ).map(([k, v]) => (
              <View key={k} style={styles.sumRow}>
                <Text tone="muted" style={styles.rowText}>
                  {k}
                </Text>
                <Text style={[styles.rowText, styles.rowValue]}>{v}</Text>
              </View>
            ))}
          </View>
          {warningList}
          <Text tone="muted" style={styles.goesTo}>
            {t('leave.goesTo', { name: data?.reviewer ?? '' })}
          </Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14 },
  full: { width: '100%' },
  gap6: { gap: 6 },
  gap8: { gap: spacing.sm },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  bold: { fontWeight: '800' },
  regular: { fontWeight: '400' },
  label: { fontSize: 15, fontWeight: '800' },
  regularLabel: { fontWeight: '600', fontSize: 15 },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  type: { width: '48.5%', flexGrow: 1, minHeight: 64, borderRadius: radius.button, paddingVertical: 10, paddingHorizontal: spacing.md, gap: 2 },
  typeTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeName: { fontSize: 15, fontWeight: '800', flexShrink: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotBig: { width: 12, height: 12, borderRadius: 6 },
  textarea: { minHeight: 84, borderRadius: radius.field, borderWidth: 1, paddingHorizontal: 14, paddingTop: spacing.md, fontSize: 15, textAlignVertical: 'top' },
  attNote: { fontWeight: '700', fontSize: 15 },
  attRow: { flexDirection: 'row', gap: spacing.sm },
  attBtn: { flex: 1, minHeight: 64, borderRadius: radius.field, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 2 },
  attLabel: { fontWeight: '800' },
  file: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.md, paddingLeft: spacing.md },
  fileName: { flex: 1, fontWeight: '700' },
  remove: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  card: { borderWidth: 1, borderRadius: radius.row, padding: spacing.lg, gap: 12 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg },
  rowText: { fontSize: 15 },
  rowValue: { fontWeight: '800', textAlign: 'right', flexShrink: 1 },
  goesTo: { fontSize: 14, lineHeight: 20 },
});


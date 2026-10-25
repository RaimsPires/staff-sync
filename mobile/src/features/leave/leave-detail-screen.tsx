import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';

import { formatDate } from '@/core/format';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing, type ThemeColors } from '@/core/theme/tokens';
import { repos } from '@/data';
import { allowedLeaveActions, type LeaveRequest, type LeaveTimelineEntry } from '@/domain';
import { BackHeader, BottomSheet, Button, Icon, Screen, Text, useToast, type TextProps } from '@/ui';

import { useLeaveRequest, useLeaveTypes } from './queries';
import { leaveTint } from './tint';

type StepKind = 'done' | 'current' | 'wait' | 'bad' | 'warn';
type Step = { kind: StepKind; title: string; who: string; date: string; comment?: string };

const BANNER: Record<LeaveRequest['status'], { bg: keyof ThemeColors; fg: NonNullable<TextProps['tone']> }> = {
  pending: { bg: 'warningBg', fg: 'warningFg' },
  changes_requested: { bg: 'orangeBg', fg: 'orangeFg' },
  approved: { bg: 'successBg', fg: 'successFg' },
  rejected: { bg: 'dangerBg', fg: 'dangerFg' },
  cancelled: { bg: 'grayBg', fg: 'grayFg' },
};

/** An approved request with a trailing "cancelled" entry is waiting for the admin to confirm. */
const isCancelPending = (r: LeaveRequest) => r.status === 'approved' && r.timeline.at(-1)?.action === 'cancelled';

export function LeaveDetailScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const lang = i18n.language;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: r } = useLeaveRequest(id);
  const { data: types = [] } = useLeaveTypes();
  const [sheet, setSheet] = useState<'cancel' | 'cancelAppr' | null>(null);
  const [reason, setReason] = useState('');

  const cancel = useMutation({
    mutationFn: () => repos.leave.cancel(id, reason.trim() || undefined),
    onSuccess: async () => {
      const appr = sheet === 'cancelAppr';
      await qc.invalidateQueries({ queryKey: ['leave'] });
      setSheet(null);
      setReason('');
      toast.show(appr ? t('leave.toastCancelSent') : t('leave.toastCancelled'));
    },
  });

  if (!r) return <Screen>{null}</Screen>;

  const pendingCancel = isCancelPending(r);
  const actions = allowedLeaveActions(r.status);
  const typeName = types.find((x) => x.id === r.typeId)?.name[lang === 'fr' ? 'fr' : 'en'] ?? r.typeId;
  const tint = leaveTint(r.typeId);
  const banner = BANNER[r.status];
  const lastComment = [...r.timeline].reverse().find((e) => e.comment)?.comment;
  const recommended = r.timeline.some((e) => e.action === 'recommended');
  const actorOf = (e: LeaveTimelineEntry) => (e.actor === r.employeeName ? t('leave.youActor') : e.actor);
  const at = (e: LeaveTimelineEntry) => formatDate(e.at, 'd MMM, HH:mm', lang);
  const submittedAt = r.timeline.find((e) => e.action === 'submitted')?.at;

  const headline = pendingCancel
    ? t('leave.bannerCancelPending')
    : { pending: t('leave.bannerPending'), changes_requested: t('leave.bannerChanges'), approved: t('leave.bannerApproved'), rejected: t('leave.bannerRejected'), cancelled: t('leave.bannerCancelled') }[r.status];
  const hint = pendingCancel
    ? t('leave.hintCancelPending')
    : r.status === 'pending'
      ? recommended
        ? t('leave.hintPending')
        : t('leave.hintPendingManager')
      : r.status === 'rejected' && lastComment
        ? `${t('leave.reasonNote', { text: lastComment })}. ${t('leave.hintRejected')}`
        : { pending: '', changes_requested: t('leave.hintChanges'), approved: t('leave.hintApproved'), rejected: t('leave.hintRejected'), cancelled: t('leave.hintCancelled') }[r.status];
  const statusLabel = pendingCancel ? t('leave.statusCancelPending') : t(`leave.status.${r.status}`);

  // Steps come from the real timeline; waiting steps are appended so the chain always reads Submitted → Manager → Admin.
  const stepFor = (e: (typeof r.timeline)[number]): Step | undefined => {
    switch (e.action) {
      case 'submitted':
        return { kind: 'done', title: t('leave.stepSubmitted'), who: actorOf(e), date: at(e), comment: e.comment };
      case 'recommended':
        return { kind: 'done', title: t('leave.stepRecommended'), who: e.actor, date: at(e), comment: e.comment };
      case 'approved':
        return { kind: 'done', title: t('leave.stepApproved'), who: e.actor, date: at(e), comment: e.comment };
      case 'rejected':
        return { kind: 'bad', title: t('leave.stepRejected'), who: e.actor, date: at(e), comment: e.comment };
      case 'changes_requested':
        return { kind: 'warn', title: t('leave.stepChanges'), who: e.actor, date: at(e), comment: e.comment };
      case 'cancelled':
        return {
          kind: r.status === 'cancelled' ? 'done' : 'current',
          title: r.status === 'cancelled' ? t('leave.stepCancelled') : t('leave.stepCancelReq'),
          who: actorOf(e),
          date: at(e),
          comment: e.comment,
        };
    }
  };
  const steps: Step[] = r.timeline.flatMap((e) => stepFor(e) ?? []);
  if (r.status === 'pending') {
    if (!recommended) {
      steps.push({ kind: 'current', title: t('leave.stepRecommended'), who: '', date: t('leave.awaiting') });
      steps.push({ kind: 'wait', title: t('leave.stepAdmin'), who: r.approver, date: '' });
    } else {
      steps.push({ kind: 'current', title: t('leave.stepAdmin'), who: r.approver, date: t('leave.awaiting') });
    }
  }

  const look = (k: StepKind) =>
    ({
      done: { bg: colors.success, tone: 'onPrimary' as const, bd: colors.success, icon: 'checkmark' as const },
      current: { bg: colors.warningBg, tone: 'warningFg' as const, bd: colors.warning, icon: 'ellipse' as const },
      wait: { bg: colors.card, tone: 'faint' as const, bd: colors.fieldBorder, icon: undefined },
      bad: { bg: colors.danger, tone: 'onPrimary' as const, bd: colors.danger, icon: 'close' as const },
      warn: { bg: colors.orangeBg, tone: 'orangeFg' as const, bd: colors.orangeFg, icon: 'alert' as const },
    })[k];

  const same = r.start === r.end;
  const goEdit = () => router.push({ pathname: '/leave/new', params: { editId: r.id } });
  const sheetCopy =
    sheet === 'cancelAppr'
      ? { title: t('leave.cancelApprTitle'), text: t('leave.cancelApprText'), cta: t('leave.cancelApprCta'), ask: true }
      : { title: t('leave.cancelTitle'), text: t('leave.cancelText'), cta: t('leave.cancelRequest'), ask: false };

  return (
    <Screen
      footerCard
      contentStyle={styles.content}
      footer={
        <View style={styles.actions}>
          {pendingCancel ? (
            <Button variant="soft" disabled label={t('leave.awaitingAdmin')} onPress={() => undefined} style={styles.action} />
          ) : (
            <>
              {actions.includes('cancel') ? <Button variant="outlineDanger" label={t('leave.cancelRequest')} onPress={() => setSheet('cancel')} style={styles.action} /> : null}
              {actions.includes('request_cancellation') ? (
                <Button variant="outlineDanger" label={t('leave.requestCancellation')} onPress={() => setSheet('cancelAppr')} style={styles.action} />
              ) : null}
              {actions.includes('edit') || actions.includes('resubmit') ? (
                <Button label={actions.includes('resubmit') ? t('leave.resubmit') : t('leave.edit')} onPress={goEdit} style={styles.action} />
              ) : null}
              {actions.includes('new_request') ? <Button label={t('leave.requestAgain')} onPress={() => router.push('/leave/new')} style={styles.action} /> : null}
            </>
          )}
        </View>
      }>
      <BackHeader title={t('leave.headerTitle')} variant="heading" />

      <View style={[styles.banner, { backgroundColor: colors[banner.bg] }]}>
        <View style={[styles.bannerPill, { backgroundColor: colors.card }]}>
          <Text variant="small" tone={banner.fg} style={styles.bannerPillText}>
            {statusLabel}
          </Text>
        </View>
        <Text variant="hero" tone={banner.fg}>
          {headline}
        </Text>
        {hint ? (
          <Text variant="caption" tone={banner.fg}>
            {hint}
          </Text>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>
        <View style={styles.typeRow}>
          <View style={[styles.dot, { backgroundColor: colors[tint.fg] }]} />
          <Text variant="heading" style={styles.typeName}>
            {typeName}
          </Text>
        </View>
        <Row label={t('leave.rowDates')} value={same ? formatDate(r.start, 'd MMM yyyy', lang) : `${formatDate(r.start, 'd', lang)} – ${formatDate(r.end, 'd MMM yyyy', lang)}`} />
        <Row label={t('leave.rowDuration')} value={t('leave.days', { count: r.days })} />
        {submittedAt ? <Row label={t('leave.rowSubmitted')} value={formatDate(submittedAt, 'd MMM yyyy', lang)} /> : null}
        {r.reason ? (
          <>
            <View style={[styles.sep, { backgroundColor: colors.soft }]} />
            <Text variant="small" tone="muted">
              {t('leave.rowReason')}
            </Text>
            <Text style={styles.reason}>{r.reason}</Text>
          </>
        ) : null}
        {r.attachmentName ? (
          <>
            <Text variant="small" tone="muted">
              {t('leave.rowAttachments')}
            </Text>
            <View style={[styles.file, { backgroundColor: colors.soft }]}>
              <Icon name="attach" size={18} />
              <Text variant="caption" style={styles.fileName} numberOfLines={1}>
                {r.attachmentName}
              </Text>
            </View>
          </>
        ) : null}
      </View>

      <Text style={styles.timelineTitle}>{t('leave.timelineTitle')}</Text>
      <View>
        {steps.map((s, i) => {
          const l = look(s.kind);
          const last = i === steps.length - 1;
          return (
            <View key={`${s.title}-${i}`} style={styles.step}>
              <View style={styles.rail}>
                <View style={[styles.node, { backgroundColor: l.bg, borderColor: l.bd }]}>
                  {l.icon ? <Icon name={l.icon} size={l.icon === 'ellipse' ? 10 : 14} tone={l.tone} /> : null}
                </View>
                {last ? null : <View style={[styles.line, { backgroundColor: s.kind === 'done' ? colors.success : colors.line }]} />}
              </View>
              <View style={styles.stepBody}>
                <View style={styles.stepHead}>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text variant="small" tone="muted" style={styles.stepDate}>
                    {s.date}
                  </Text>
                </View>
                {s.who ? (
                  <Text variant="caption" tone="muted">
                    {s.who}
                  </Text>
                ) : null}
                {s.comment ? (
                  <View style={[styles.quote, { backgroundColor: colors.card, borderColor: colors.line }]}>
                    <Text variant="caption">“{s.comment}”</Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      <BottomSheet visible={sheet !== null} onClose={() => setSheet(null)} title={sheetCopy.title} closable>
        <Text tone="muted" style={styles.sheetText}>
          {sheetCopy.text}
        </Text>
        {sheetCopy.ask ? (
          <View style={styles.reasonBlock}>
            <Text variant="caption" tone="muted" style={styles.reasonLabel}>
              {t('leave.cancelReasonLabel')}
            </Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              multiline
              maxLength={300}
              placeholder={t('leave.cancelReasonPh')}
              placeholderTextColor={colors.muted}
              accessibilityLabel={t('leave.cancelReasonLabel')}
              style={[styles.reasonInput, { backgroundColor: colors.card, borderColor: colors.line, color: colors.ink }]}
            />
          </View>
        ) : null}
        <Button variant="destructive" label={sheetCopy.cta} loading={cancel.isPending} onPress={() => cancel.mutate()} />
        <Button variant="ghost" label={t('leave.keepRequest')} onPress={() => setSheet(null)} />
      </BottomSheet>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.between}>
      <Text tone="muted" style={styles.rowText}>
        {label}
      </Text>
      <Text style={[styles.rowText, styles.rowValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14 },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  banner: { borderRadius: radius.lg, padding: spacing.lg, gap: 6 },
  bannerPill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill },
  bannerPillText: { fontWeight: '800' },
  card: { borderWidth: 1, borderRadius: radius.row, padding: 14, gap: 10 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  typeName: { fontSize: 18 },
  rowText: { fontSize: 15 },
  rowValue: { fontWeight: '800', textAlign: 'right', flexShrink: 1 },
  sep: { height: 1 },
  reason: { fontSize: 15, lineHeight: 21 },
  file: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.md, paddingHorizontal: spacing.md },
  fileName: { flex: 1, fontWeight: '700' },
  timelineTitle: { fontSize: 18, fontWeight: '800' },
  step: { flexDirection: 'row', gap: spacing.md },
  rail: { width: 28, alignItems: 'center' },
  node: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  line: { flex: 1, width: 2, minHeight: 12 },
  stepBody: { flex: 1, paddingBottom: spacing.lg, gap: 3 },
  stepHead: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  stepTitle: { flex: 1, fontSize: 15, fontWeight: '800' },
  stepDate: { fontWeight: '600' },
  quote: { borderWidth: 1, borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: 10, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
  sheetText: { lineHeight: 21 },
  reasonBlock: { gap: 6 },
  reasonLabel: { fontWeight: '800' },
  reasonInput: { minHeight: 84, borderRadius: radius.field, borderWidth: 1, padding: spacing.md, fontSize: 15, textAlignVertical: 'top' },
});

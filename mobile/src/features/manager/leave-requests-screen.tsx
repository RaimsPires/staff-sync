import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { capitalize, formatDate } from '@/core/format';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing, type ThemeColors } from '@/core/theme/tokens';
import { repos, type ManagerLeaveItem } from '@/data';
import type { IsoDate } from '@/domain';
import { Avatar, AttachmentRow, BackHeader, Banner, BottomSheet, Button, Icon, Screen, Text, useToast, type TextProps } from '@/ui';

import { useLeaveTypes } from '../leave/queries';
import { useEmployeeShifts, useLeaveInbox, useManagerSites } from './queries';

type Tab = 'needs' | 'history';
type Look = { bg: keyof ThemeColors; fg: NonNullable<TextProps['tone']> };

const isHistory = (r: ManagerLeaveItem) => !!r.recommendation || r.status !== 'pending';

function statusOf(r: ManagerLeaveItem, t: (k: string) => string): { label: string; look: Look } {
  if (r.status === 'approved') return { label: t('manager.statusApprovedAdmin'), look: { bg: 'successBg', fg: 'successFg' } };
  if (r.status === 'rejected') return { label: t('manager.statusRejectedAdmin'), look: { bg: 'dangerBg', fg: 'dangerFg' } };
  if (r.recommendation) return { label: r.recommendation === 'approve' ? t('manager.statusRecommended') : t('manager.statusNotRecommended'), look: { bg: 'infoBg', fg: 'infoFg' } };
  return { label: t('manager.statusNeeds'), look: { bg: 'warningBg', fg: 'warningFg' } };
}

export function ManagerLeaveRequestsScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const lang = i18n.language;
  const params = useLocalSearchParams<{ siteId?: string }>();
  const sites = useManagerSites();
  const siteId = params.siteId ?? sites.siteId;
  const site = sites.sites.find((x) => x.id === siteId);
  const { data = [] } = useLeaveInbox(siteId);
  const { data: types = [] } = useLeaveTypes();
  const [tab, setTab] = useState<Tab>('needs');
  const [selId, setSelId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const [tried, setTried] = useState(false);

  const typeName = (id: string) => types.find((x) => x.id === id)?.name[lang === 'fr' ? 'fr' : 'en'] ?? id;
  const needs = data.filter((r) => !isHistory(r));
  const history = data.filter(isHistory);
  const list = tab === 'needs' ? needs : history;
  const sel = data.find((r) => r.id === selId);
  const { data: shifts = [] } = useEmployeeShifts(sel?.employeeId, sel?.start, sel?.end);

  const send = useMutation({
    mutationFn: (decision: 'approve' | 'reject') => repos.manager.recommend(sel!.id, decision, comment.trim()),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['manager'] });
      setSheet(null);
      setComment('');
      toast.show(t('manager.sentToast'));
    },
  });

  const rangeLabel = (r: { start: IsoDate; end: IsoDate }) =>
    r.start === r.end ? formatDate(r.start, 'd MMM', lang) : `${formatDate(r.start, 'd', lang)} – ${formatDate(r.end, 'd MMM', lang)}`;
  const overlaps = (r: ManagerLeaveItem) => r.others.length;

  const openSheet = (kind: 'approve' | 'reject') => {
    setComment('');
    setTried(false);
    setSheet(kind);
  };
  const submitSheet = () => {
    if (!sheet) return;
    if (sheet === 'reject' && !comment.trim()) return setTried(true);
    send.mutate(sheet);
  };

  if (sel) {
    const st = statusOf(sel, t);
    const done = isHistory(sel);
    const rec = sel.recommendation;
    return (
      <Screen contentStyle={styles.content}>
        <BackHeader title={t('manager.requestTitle')} variant="hero" onBack={() => setSelId(null)} />

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>
          <View style={styles.profile}>
            <Avatar name={sel.employeeName ?? ''} size={52} />
            <View style={styles.flex}>
              <Text variant="heading">{sel.employeeName}</Text>
              <Text variant="caption" tone="muted">
                {sel.role}
              </Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors[st.look.bg] }]}>
              <Text variant="label" tone={st.look.fg} style={styles.chipText}>
                {st.label}
              </Text>
            </View>
          </View>
          {(
            [
              [t('manager.infoType'), typeName(sel.typeId)],
              [t('manager.infoDates'), rangeLabel(sel)],
              [t('manager.infoDuration'), t('leave.days', { count: sel.days })],
              [t('manager.infoSent'), formatDate(sel.sentAt, 'd MMM', lang)],
            ] as [string, string][]
          ).map(([k, v]) => (
            <View key={k} style={styles.between}>
              <Text tone="muted" style={styles.infoText}>
                {k}
              </Text>
              <Text style={[styles.infoText, styles.infoValue]}>{v}</Text>
            </View>
          ))}
          {sel.reason ? (
            <View style={[styles.reason, { backgroundColor: colors.bg }]}>
              <Text variant="caption">
                <Text variant="caption" tone="muted">
                  {t('manager.reasonPrefix')}
                </Text>
                {sel.reason}
              </Text>
            </View>
          ) : null}
        </View>

        {sel.attachmentName ? <AttachmentRow name={sel.attachmentName} size={t('manager.attachedBy')} actionLabel={t('manager.viewLabel')} /> : null}

        <Text style={styles.sectionTitle}>{t('manager.alsoOff')}</Text>
        <View style={[styles.list, { backgroundColor: colors.card, borderColor: sel.others.length ? colors.warningBorder : colors.line }]}>
          {sel.others.map((o, i) => (
            <View key={o.name} style={[styles.listRow, i < sel.others.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.soft }]}>
              <Text variant="caption" style={styles.bold}>
                {o.name}
              </Text>
              <Text variant="caption" tone="muted">
                {rangeLabel(o)} · {typeName(o.typeId)}
              </Text>
            </View>
          ))}
          {sel.others.length === 0 ? (
            <Text variant="caption" tone="successFg" style={[styles.listRow, styles.bold]}>
              {t('manager.noOneElse')}
            </Text>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>{t('manager.affectedShifts')}</Text>
        <View style={[styles.list, { backgroundColor: colors.card, borderColor: colors.line }]}>
          {shifts.map((sh, i, a) => (
            <View key={sh.date} style={[styles.listRow, i < a.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.soft }]}>
              <Text variant="caption" style={styles.bold}>
                {capitalize(formatDate(sh.date, 'EEE d MMM', lang))}
              </Text>
              <Text variant="caption" tone="muted">
                {sh.start} – {sh.end}
              </Text>
            </View>
          ))}
          {shifts.length === 0 ? (
            <Text variant="caption" tone="muted" style={styles.listRow}>
              {t('manager.noShiftsAffected')}
            </Text>
          ) : null}
        </View>

        {rec ? (
          <Banner tone={rec === 'approve' ? 'info' : 'danger'} title={`${rec === 'approve' ? t('manager.youApproved') : t('manager.youRejected')} · ${sel.status === 'approved' ? t('manager.statusApprovedAdmin') : sel.status === 'rejected' ? t('manager.statusRejectedAdmin') : t('manager.sentToAdmin')}`} text={sel.recommendationComment || t('manager.noCommentLabel')} />
        ) : null}

        {!done ? (
          <>
            <Text variant="small" tone="muted" style={styles.regular}>
              {t('manager.goesToAdmin')}
            </Text>
            <Button label={t('manager.recommendApprove')} onPress={() => openSheet('approve')} />
            <Button variant="outlineDanger" label={t('manager.recommendReject')} onPress={() => openSheet('reject')} />
          </>
        ) : null}

        <BottomSheet
          visible={sheet !== null}
          onClose={() => setSheet(null)}
          closable
          title={sheet === 'reject' ? t('manager.recommendReject') : t('manager.recommendApprove')}
          subtitle={`${sel.employeeName} · ${rangeLabel(sel)}`}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={300}
            placeholder={sheet === 'reject' ? t('manager.phReject') : t('manager.phApprove')}
            placeholderTextColor={colors.muted}
            accessibilityLabel={t('manager.comment')}
            style={[styles.commentInput, { backgroundColor: colors.card, borderColor: sheet === 'reject' && tried && !comment.trim() ? colors.flag : colors.fieldBorder, color: colors.ink }]}
          />
          {sheet === 'reject' && tried && !comment.trim() ? (
            <Text variant="small" tone="flag">
              {t('manager.commentRequiredMsg')}
            </Text>
          ) : null}
          <Button
            variant={sheet === 'reject' ? 'destructive' : 'primary'}
            label={sheet === 'reject' ? t('manager.sendRejection') : t('manager.sendApproval')}
            loading={send.isPending}
            onPress={submitSheet}
          />
        </BottomSheet>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.content}>
      <BackHeader eyebrow={site?.name} title={t('manager.leaveRequests')} />

      <View style={styles.tabs}>
        {(['needs', 'history'] as const).map((k) => {
          const active = tab === k;
          return (
            <Pressable
              key={k}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(k)}
              style={[styles.tab, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.fieldBorder }]}>
              <Text variant="caption" tone={active ? 'onPrimary' : 'ink'} style={styles.bold}>
                {k === 'needs' ? t('manager.tabNeeds', { count: needs.length }) : t('manager.tabHistory', { count: history.length })}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {list.map((r) => {
        const st = statusOf(r, t);
        return (
          <Pressable
            key={r.id}
            accessibilityRole="button"
            onPress={() => setSelId(r.id)}
            style={[styles.item, { backgroundColor: colors.card, borderColor: colors.line }]}>
            <Avatar name={r.employeeName ?? ''} />
            <View style={styles.itemBody}>
              <View style={styles.between}>
                <Text variant="subheading" style={styles.bold} numberOfLines={1}>
                  {r.employeeName}
                </Text>
                <View style={[styles.chip, { backgroundColor: colors[st.look.bg] }]}>
                  <Text variant="label" tone={st.look.fg} style={styles.chipText}>
                    {st.label}
                  </Text>
                </View>
              </View>
              <Text variant="caption" style={styles.bold}>
                {typeName(r.typeId)} · {t('leave.days', { count: r.days })}
              </Text>
              <Text variant="small" tone="muted" style={styles.regular}>
                {rangeLabel(r)}
              </Text>
              {!isHistory(r) && overlaps(r) > 0 ? (
                <Text variant="small" tone="warningFg">
                  ⚠ {t('manager.conflict', { count: overlaps(r) })}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}

      {list.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.fieldBorder }]}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.successBg }]}>
            <Icon name="checkmark" size={24} tone="successFg" />
          </View>
          <Text style={styles.emptyTitle}>{tab === 'needs' ? t('manager.noRequests') : t('manager.emptyHistory')}</Text>
          <Text variant="caption" tone="muted" style={styles.center}>
            {t('manager.emptyReviewBody')}
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 12 },
  center: { textAlign: 'center' },
  bold: { fontWeight: '800' },
  regular: { fontWeight: '400' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: { flex: 1, minHeight: 44, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  item: { borderWidth: 1, borderRadius: radius.row, padding: spacing.md, flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', minHeight: 44 },
  itemBody: { flex: 1, gap: 4 },
  chip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  chipText: { letterSpacing: 0, fontWeight: '800' },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: 12 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  infoText: { fontSize: 15 },
  infoValue: { fontWeight: '800', textAlign: 'right', flexShrink: 1 },
  reason: { borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  list: { borderWidth: 1, borderRadius: radius.button, paddingHorizontal: 14, paddingVertical: 6 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 10 },
  commentInput: { minHeight: 104, borderRadius: radius.field, borderWidth: 1, padding: spacing.md, fontSize: 16, textAlignVertical: 'top' },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.lg, paddingVertical: 28, paddingHorizontal: spacing.xl, alignItems: 'center', gap: 4 },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
});

import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { formatDate } from '@/core/format';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { toIsoDate, type LeaveBalance, type LeaveRequest } from '@/domain';
import { BackHeader, Icon, Screen, Segmented, StatusChip, Text } from '@/ui';

import { useLeaveBalances, useLeaveRequests, useLeaveTypes } from './queries';
import { LEAVE_TONE } from './status';
import { lastApproverComment, leaveTint } from './tint';

type Tab = 'up' | 'past';
const CARD_WIDTH = 156;

export function RequestRow({ request, typeName }: { request: LeaveRequest; typeName: string }) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const tint = leaveTint(request.typeId);
  const comment = lastApproverComment(request.timeline);
  const note =
    request.status === 'changes_requested' && comment
      ? t('leave.adminNote', { text: comment })
      : request.status === 'rejected' && comment
        ? t('leave.reasonNote', { text: comment })
        : undefined;
  const tone = LEAVE_TONE[request.status];
  const noteColors: Record<string, { bg: keyof typeof colors; fg: keyof typeof colors }> = {
    orange: { bg: 'orangeBg', fg: 'orangeFg' },
    danger: { bg: 'dangerBg', fg: 'dangerFg' },
  };
  const nc = noteColors[tone] ?? { bg: 'soft', fg: 'muted' };
  const same = request.start === request.end;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/leave/[id]', params: { id: request.id } })}
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.line }]}>
      <View style={styles.rowTop}>
        <View style={styles.typeRow}>
          <View style={[styles.dot, { backgroundColor: colors[tint.fg] }]} />
          <Text variant="subheading" style={styles.typeName}>
            {typeName}
          </Text>
        </View>
        <StatusChip tone={tone} label={t(`leave.status.${request.status}`)} />
      </View>
      <View style={styles.rowTop}>
        <Text tone="muted" style={styles.dates}>
          {same
            ? formatDate(request.start, 'd MMM yyyy', i18n.language)
            : `${formatDate(request.start, 'd', i18n.language)} – ${formatDate(request.end, 'd MMM yyyy', i18n.language)}`}
        </Text>
        <Text style={styles.days}>{t('leave.days', { count: request.days })}</Text>
      </View>
      {note ? (
        <View style={[styles.note, { backgroundColor: colors[nc.bg] }]}>
          <Text variant="caption" style={[styles.noteText, { color: colors[nc.fg] }]}>
            {note}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function BalanceCard({ balance, name }: { balance: LeaveBalance; name: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const tint = leaveTint(balance.typeId);
  const fg = colors[tint.fg];
  const total = Math.max(1, balance.remaining + balance.used + balance.pending);
  return (
    <View style={[styles.balance, { backgroundColor: colors[tint.bg] }]}>
      <Text style={[styles.balanceName, { color: fg }]}>{name}</Text>
      <Text style={[styles.balanceLeft, { color: fg }]}>{balance.remaining}</Text>
      <Text variant="small" style={[styles.balanceSub, { color: fg }]}>
        {t('leave.balanceOf', { total })}
      </Text>
      <View style={[styles.track, { backgroundColor: `${fg}33` }]}>
        <View style={{ width: `${(balance.used / total) * 100}%`, backgroundColor: fg }} />
        <View style={{ width: `${(balance.pending / total) * 100}%`, backgroundColor: fg, opacity: 0.45 }} />
      </View>
      <View style={styles.between}>
        <Text variant="small" style={{ color: fg }}>
          {t('leave.usedLabel', { n: balance.used })}
        </Text>
        <Text variant="small" style={{ color: fg }}>
          {t('leave.pendingLabel', { n: balance.pending })}
        </Text>
      </View>
    </View>
  );
}

export function LeaveScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { data: types = [] } = useLeaveTypes();
  const { data: balances = [] } = useLeaveBalances();
  const { data: requests = [] } = useLeaveRequests();
  const [tab, setTab] = useState<Tab>('up');
  const name = (id: string) => types.find((x) => x.id === id)?.name[i18n.language === 'fr' ? 'fr' : 'en'] ?? id;

  const today = toIsoDate(new Date());
  const isUpcoming = (r: LeaveRequest) => r.end >= today || r.status === 'pending' || r.status === 'changes_requested';
  const rows = requests.filter((r) => (tab === 'up' ? isUpcoming(r) : !isUpcoming(r)));

  return (
    <Screen contentStyle={styles.content}>
      <BackHeader title={t('leave.title')} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.balanceOuter} contentContainerStyle={styles.balances} snapToInterval={CARD_WIDTH + 10} decelerationRate="fast">
        {balances.map((b) => (
          <BalanceCard key={b.typeId} balance={b} name={name(b.typeId)} />
        ))}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/leave/new')}
        style={[styles.cta, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
        <Icon name="add" size={22} tone="onPrimary" />
        <Text tone="onPrimary" style={styles.ctaLabel}>
          {t('leave.request')}
        </Text>
      </Pressable>

      <Text style={styles.sectionTitle}>{t('leave.myRequests')}</Text>
      <Segmented<Tab>
        options={[
          { value: 'up', label: t('leave.tabUpcoming') },
          { value: 'past', label: t('leave.tabPast') },
        ]}
        value={tab}
        onChange={setTab}
      />

      {rows.map((r) => (
        <RequestRow key={r.id} request={r} typeName={name(r.typeId)} />
      ))}

      {rows.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.fieldBorder }]}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.soft }]}>
            <Icon name="sunny-outline" size={26} tone="muted" />
          </View>
          <Text variant="section">{tab === 'up' ? t('leave.emptyUpcoming') : t('leave.emptyPast')}</Text>
          <Text variant="caption" tone="muted" style={styles.center}>
            {tab === 'up' ? t('leave.emptyUpcomingBody') : t('leave.emptyPastBody')}
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14 },
  center: { textAlign: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  balanceOuter: { marginHorizontal: -spacing.xl, flexGrow: 0 },
  balances: { paddingHorizontal: spacing.xl, gap: 10 },
  balance: { width: CARD_WIDTH, borderRadius: radius.lg, padding: 14, gap: 4 },
  balanceName: { fontSize: 14, fontWeight: '800' },
  balanceLeft: { fontSize: 44, fontWeight: '800', lineHeight: 46 },
  balanceSub: { fontWeight: '600' },
  track: { height: 6, borderRadius: 3, flexDirection: 'row', overflow: 'hidden', marginTop: 6, marginBottom: 2 },
  cta: { minHeight: 60, borderRadius: radius.row, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  ctaLabel: { fontSize: 18, fontWeight: '800' },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  row: { borderWidth: 1, borderRadius: radius.row, padding: 14, gap: 8 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  typeName: { fontWeight: '800' },
  dates: { fontSize: 15 },
  days: { fontSize: 15, fontWeight: '800' },
  note: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  noteText: { fontWeight: '700', lineHeight: 18 },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.lg, paddingVertical: 32, paddingHorizontal: spacing.xl, alignItems: 'center', gap: spacing.sm },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});

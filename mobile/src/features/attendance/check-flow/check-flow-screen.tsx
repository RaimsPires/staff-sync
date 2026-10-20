import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatDate, formatDuration, formatTime } from '@/core/format';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { repos } from '@/data';
import { selectPending, useOfflineQueue } from '@/data/offline-queue';
import { qk } from '@/data/query-keys';
import { BREAK_MINUTES, daySummary, workedMinutes, type Assignment } from '@/domain';
import { Banner, Button, Icon, ResultView, Screen, SiteMap, Text, useToast } from '@/ui';

import { useAssignmentRecord } from '../../home/queries';
import { QrStep, SelfieStep } from './camera-steps';
import { useCheckFlow, type FlowMode } from './use-check-flow';

const SUPPORT_EMAIL = 'support@staffsync.co';

function Chip({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipLabel, { color: fg }]}>{label}</Text>
    </View>
  );
}

function SiteCard({ assignment, sub, map, fix }: { assignment: Assignment; sub: string; map?: boolean; fix?: { lat: number; lng: number } }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.siteCard, { backgroundColor: colors.card, borderColor: colors.line }]}>
      {map ? <SiteMap site={assignment.site} user={fix} snapshot style={styles.siteMap} /> : null}
      <View style={styles.siteBody}>
        <Text variant="lead">{assignment.site.name}</Text>
        <Text variant="caption" tone="muted">
          {sub}
        </Text>
      </View>
    </View>
  );
}

function ReasonCard({ text }: { text: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={[styles.reason, { backgroundColor: colors.card, borderColor: colors.line }]}>
      <Text variant="label" tone="muted">
        {t('check.reasonLabel').toUpperCase()}
      </Text>
      <Text variant="lead" tone="warning" style={styles.reasonText}>
        {text}
      </Text>
    </View>
  );
}

const signed = (minutes: number, t: Parameters<typeof formatDuration>[1]) => `${minutes < 0 ? '−' : '+'}${formatDuration(Math.abs(minutes), t)}`;

export function CheckFlowScreen({ mode }: { mode: FlowMode }) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const lang = i18n.language;
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const { data: assignment } = useQuery({
    queryKey: qk.assignment(assignmentId),
    queryFn: () => repos.schedule.getAssignment(assignmentId),
  });
  const { data: existing } = useAssignmentRecord(assignmentId);
  const queued = useOfflineQueue(selectPending);
  const flow = useCheckFlow(assignment, mode);
  const [comment, setComment] = useState('');
  const { step } = flow;
  const close = () => router.dismissTo('/');
  const isIn = mode === 'check_in';

  if (!assignment) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  const siteName = assignment.site.name;
  const accuracy = flow.fix ? Math.round(flow.fix.accuracyM) : 0;

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

  if (step.name === 'verify') {
    return (
      <Screen dark edges={{ bottom: true }} gutter={spacing.xl}>
        {step.method === 'selfie' ? (
          <SelfieStep onDone={(uri) => flow.verified('selfie', uri)} onCancel={close} />
        ) : (
          <QrStep site={siteName} onScanned={(payload) => flow.verified('qr', payload)} onCancel={close} />
        )}
      </Screen>
    );
  }

  // Full-screen blocking / result views share the same footer layout.
  const footer = (primary: { label: string; onPress: () => void; variant?: 'primary' | 'warning' }, secondary?: { label: string; onPress: () => void }) => (
    <>
      <Button large variant={primary.variant ?? 'primary'} label={primary.label} onPress={primary.onPress} />
      {secondary ? <Button variant="ghost" label={secondary.label} onPress={secondary.onPress} /> : null}
    </>
  );

  if (step.name === 'location_failed') {
    return (
      <Screen scroll={false} footer={footer({ label: t('check.openSettings'), onPress: () => void Linking.openSettings() }, { label: t('common.cancel'), onPress: close })}>
        <ResultView tone="danger" icon="locate-outline" title={t('check.gpsTitle')} body={t('check.gpsBody')} />
      </Screen>
    );
  }

  if (step.name === 'mock_location') {
    return (
      <Screen scroll={false} footer={footer({ label: t('common.retry'), onPress: () => void flow.retry() }, { label: t('common.cancel'), onPress: close })}>
        <ResultView tone="danger" icon="ban-outline" title={t('check.mockTitle')} body={t('check.mockBody')} />
      </Screen>
    );
  }

  if (step.name === 'device_unregistered') {
    return (
      <Screen
        scroll={false}
        footer={footer({ label: t('check.contactAdmin'), onPress: () => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`) }, { label: t('common.cancel'), onPress: close })}>
        <ResultView tone="danger" icon="phone-portrait-outline" title={t('check.deviceTitle')} body={t('check.deviceBody')} />
      </Screen>
    );
  }

  if (step.name === 'not_scheduled') {
    return (
      <Screen
        scroll={false}
        footer={footer({ label: t('check.checkInAnyway'), onPress: flow.acknowledge, variant: 'warning' }, { label: t('common.cancel'), onPress: close })}>
        <ResultView
          tone="warning"
          icon="time-outline"
          title={t('check.notSchedTitle')}
          body={flow.otherSite ? t('check.notSchedBody', { site: siteName, other: flow.otherSite }) : t('check.notSchedBodyNone', { site: siteName })}
        />
      </Screen>
    );
  }

  if (step.name === 'not_at_site') {
    const meters = flow.previewFlags.find((f) => f.reason === 'OUTSIDE_GEOFENCE')?.distanceM ?? 0;
    return (
      <Screen scroll={false} footer={footer({ label: t('check.checkOutAnyway'), onPress: flow.acknowledge, variant: 'warning' }, { label: t('common.cancel'), onPress: close })}>
        <ResultView tone="warning" size={120} icon="warning-outline" title={t('check.notAtSiteTitle')} body={t('check.notAtSiteBody', { m: meters, site: siteName })}>
          <ReasonCard text={t('check.outsideBy', { m: meters })} />
        </ResultView>
      </Screen>
    );
  }

  if (step.name === 'queued') {
    const at = flow.fix ? formatTime(flow.fix.capturedAt) : '';
    return (
      <Screen scroll={false} footer={footer({ label: t('common.done'), onPress: close })}>
        <ResultView tone="warning" size={120} icon="cloud-outline" title={t(isIn ? 'check.savedInTitle' : 'check.savedOutTitle')} body={t('check.savedBody', { time: at })}>
          <SiteCard assignment={assignment} sub={t(isIn ? 'check.checkedSubIn' : 'check.checkedSubOut', { time: at })} />
          <View style={styles.full}>
            <Banner tone="warning" text={t('check.waitingSync', { count: Math.max(1, queued) })} />
          </View>
        </ResultView>
      </Screen>
    );
  }

  if (step.name === 'already_done') {
    return (
      <Screen scroll={false} footer={footer({ label: t('check.backHome'), onPress: close })}>
        <ResultView tone="info" icon="information-circle-outline" title={t('check.alreadyDone')} />
      </Screen>
    );
  }

  if (step.name === 'error') {
    return (
      <Screen scroll={false} footer={footer({ label: t('check.backHome'), onPress: close })}>
        <ResultView tone="danger" icon="close" title={t('common.genericError')} />
      </Screen>
    );
  }

  if (step.name === 'done') {
    const { record, flags } = step.result;
    const at = isIn ? record.checkInAt : record.checkOutAt;
    const atLabel = at ? formatTime(at) : '';
    const outside = flags.find((f) => f.reason === 'OUTSIDE_GEOFENCE');

    if (flags.length > 0) {
      const send = async () => {
        if (comment.trim()) await repos.attendance.addComment(record.id, comment.trim());
        toast.show(t('check.commentSent'));
        close();
      };
      return (
        <Screen footer={footer({ label: t('check.sendComment'), onPress: () => void send() }, { label: t('common.skip'), onPress: close })}>
          <ResultView
            tone="warning"
            size={120}
            icon="warning-outline"
            title={t(isIn ? 'check.flaggedInTitle' : 'check.flaggedOutTitle')}
            body={t(isIn ? 'check.flaggedBodyIn' : 'check.flaggedBodyOut')}>
            <ReasonCard
              text={outside ? t('check.outsideBy', { m: outside.distanceM ?? 0 }) : t(`check.flagReasons.${flags[0].reason}`, { distance: flags[0].distanceM ?? 0 })}
            />
            <View style={styles.full}>
              <Text variant="caption" style={styles.promptLabel}>
                {t('check.commentPrompt')}
              </Text>
              <TextInput
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={500}
                placeholder={t('check.commentExample')}
                placeholderTextColor={colors.muted}
                accessibilityLabel={t('check.commentPrompt')}
                style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.fieldBorder, color: colors.ink }]}
              />
            </View>
          </ResultView>
        </Screen>
      );
    }

    if (isIn) {
      const late = record.lateByMinutes ?? 0;
      return (
        <Screen footer={footer({ label: t('common.done'), onPress: close })}>
          <ResultView
            tone={late > 0 ? 'warning' : 'success'}
            size={120}
            icon="checkmark"
            title={t('check.checkedInTitle')}
            chip={
              <Chip
                label={late > 0 ? t('check.lateChip', { time: atLabel, min: late }) : t('check.onTimeChip', { time: atLabel })}
                bg={late > 0 ? colors.warningBg : colors.successBg}
                fg={late > 0 ? colors.warningFg : colors.successFg}
              />
            }>
            <SiteCard assignment={assignment} map fix={flow.fix} sub={t('check.shiftSub', { start: assignment.start, end: assignment.end })} />
          </ResultView>
        </Screen>
      );
    }

    // Check-out summary
    const { total, scheduled, difference: diff } =
      record.checkInAt && record.checkOutAt
        ? daySummary(assignment, new Date(record.checkInAt), new Date(record.checkOutAt))
        : { total: 0, scheduled: 0, difference: 0 };
    const early = record.earlyByMinutes ?? 0;
    const overtime = record.overtimeMinutes ?? 0;
    const tone = early > 0 ? 'warning' : overtime > 0 ? 'info' : 'success';
    const palette = {
      warning: { bg: colors.warningBg, fg: colors.warningFg },
      info: { bg: colors.infoBg, fg: colors.infoFg },
      success: { bg: colors.successBg, fg: colors.successFg },
    }[tone];
    const label = early > 0 ? t('check.earlyChip', { dur: formatDuration(early, t) }) : overtime > 0 ? t('check.overtimeChip', { dur: formatDuration(overtime, t) }) : t('status.on_time');
    const rows: [string, string, boolean?][] = [
      [t('check.checkedInAt'), record.checkInAt ? formatTime(record.checkInAt) : '–'],
      [t('check.checkedOutAt'), record.checkOutAt ? formatTime(record.checkOutAt) : '–'],
      [t('check.breakLabel'), formatDuration(BREAK_MINUTES, t)],
      [t('check.totalHours'), formatDuration(total, t), true],
      [t('check.scheduledLabel'), formatDuration(scheduled, t)],
      ...(early > 0 || overtime > 0 ? ([[t('check.differenceLabel'), signed(diff, t)]] as [string, string][]) : []),
    ];
    return (
      <Screen footer={footer({ label: t('common.done'), onPress: close })}>
        <ResultView tone={tone} size={96} icon="checkmark" title={t('check.checkedOutTitle')} chip={<Chip label={label} bg={palette.bg} fg={palette.fg} />}>
          <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.line }]}>
            {rows.map(([k, v, big], i) => (
              <View key={k} style={[styles.summaryRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]}>
                <Text tone="muted">{k}</Text>
                <Text style={{ fontSize: big ? 20 : 17, fontWeight: '800' }}>{v}</Text>
              </View>
            ))}
          </View>
          <Text variant="caption" tone="muted">
            {t('check.siteDate', { site: siteName, date: formatDate(assignment.date, 'EEE d MMM', lang) })}
          </Text>
        </ResultView>
      </Screen>
    );
  }

  // confirm: bottom sheet over a dimmed map
  const unverified = flow.previewFlags.length > 0;
  const onSiteFor = existing?.checkInAt ? workedMinutes(new Date(existing.checkInAt), new Date()) : 0;
  const now = formatTime(new Date());

  return (
    <View style={[styles.root, { backgroundColor: colors.map }]}>
      <SiteMap site={assignment.site} user={flow.fix} snapshot style={styles.backdrop} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} />
      <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={[styles.handle, { backgroundColor: colors.line }]} />
        <Text variant="headline">{t(isIn ? 'check.confirmInTitle' : 'check.confirmOutTitle')}</Text>

        {isIn ? (
          <View style={[styles.infoBlock, { backgroundColor: colors.soft }]}>
            <Text variant="lead" style={styles.siteTitle}>
              {siteName}
            </Text>
            <Text variant="caption" tone="muted">
              {assignment.site.address}
            </Text>
            <Text variant="subheading" style={styles.shiftLine}>
              {'◷ '}
              {t('check.shiftLine', { time: now, start: assignment.start, end: assignment.end })}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.tiles}>
              <View style={[styles.tile, { backgroundColor: colors.soft }]}>
                <Text variant="label" tone="muted" style={styles.tileLabel}>
                  {t('check.onSiteForLabel')}
                </Text>
                <Text style={styles.tileValue}>{formatDuration(onSiteFor, t)}</Text>
              </View>
              <View style={[styles.tile, { backgroundColor: colors.soft }]}>
                <Text variant="label" tone="muted" style={styles.tileLabel}>
                  {t('check.scheduledEndLabel')}
                </Text>
                <Text style={styles.tileValue}>{assignment.end}</Text>
              </View>
            </View>
            <Text tone="muted" style={styles.siteNow}>
              {t('check.siteNow', { site: siteName, time: now })}
            </Text>
            {flow.earlyByMinutes > 0 ? <Banner tone="warning" icon="warning-outline" title={t('check.earlyWarn', { min: flow.earlyByMinutes })} /> : null}
          </>
        )}

        {unverified ? (
          <Banner tone="warning" icon="alert-circle" text={t('check.locationUnverified')} />
        ) : (
          <View style={[styles.verified, { backgroundColor: colors.successBg }]}>
            <View style={[styles.verifiedDot, { backgroundColor: colors.success }]}>
              <Icon name="checkmark" size={isIn ? 16 : 14} tone="onPrimary" />
            </View>
            <Text style={[styles.verifiedText, { color: colors.successFg }]}>{t('check.verifiedOnSite', { m: accuracy })}</Text>
          </View>
        )}

        {!isIn ? (
          <TextInput
            value={flow.note}
            onChangeText={flow.setNote}
            multiline
            maxLength={300}
            placeholder={flow.earlyByMinutes > 0 ? t('check.notePlaceholderEarly') : t('check.notePlaceholder')}
            placeholderTextColor={colors.muted}
            accessibilityLabel={t('check.earlyNote')}
            style={[styles.note, { backgroundColor: colors.card, borderColor: colors.fieldBorder, color: colors.ink }]}
          />
        ) : null}

        {isIn ? (
          <Button xl label={t('check.confirmInButton')} onPress={flow.confirm} />
        ) : (
          <Button large variant="ink" label={t('check.confirmOutButton')} onPress={flow.confirm} style={styles.checkoutButton} />
        )}
        <Button variant="ghost" label={t('common.cancel')} onPress={close} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, borderRadius: 0, borderWidth: 0 },
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingVertical: spacing.xxxl },
  full: { width: '100%', marginTop: spacing.md },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill },
  chipLabel: { fontSize: 17, fontWeight: '800' },
  siteCard: { width: '100%', borderWidth: 1, borderRadius: radius.row, overflow: 'hidden', marginTop: spacing.md },
  siteMap: { height: 110, borderRadius: 0, borderWidth: 0 },
  siteBody: { paddingVertical: spacing.md, paddingHorizontal: 14 },
  reason: { width: '100%', borderWidth: 1, borderRadius: radius.field, paddingVertical: spacing.md, paddingHorizontal: 14, marginTop: spacing.md },
  reasonText: { marginTop: 2 },
  promptLabel: { fontWeight: '700', marginBottom: 6 },
  textarea: { height: 84, borderRadius: radius.field, borderWidth: 2, padding: spacing.md, fontSize: 15, textAlignVertical: 'top' },
  summary: { width: '100%', borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  sheet: { borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingTop: 10, paddingHorizontal: spacing.xl, gap: 14 },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3 },
  infoBlock: { borderRadius: radius.button, padding: 14, gap: 6 },
  siteTitle: { fontSize: 18 },
  shiftLine: { fontWeight: '700' },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: { flex: 1, borderRadius: radius.field, paddingVertical: 10, paddingHorizontal: spacing.md },
  tileLabel: { fontWeight: '400', letterSpacing: 0, textTransform: 'none' },
  tileValue: { fontSize: 20, fontWeight: '800' },
  siteNow: { fontSize: 15 },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.field, paddingVertical: 12, paddingHorizontal: 14 },
  verifiedDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  verifiedText: { flex: 1, fontSize: 15, fontWeight: '700' },
  note: { height: 68, borderRadius: radius.field, borderWidth: 2, padding: spacing.md, fontSize: 15, textAlignVertical: 'top' },
  checkoutButton: { borderRadius: radius.lg },
});

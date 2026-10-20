import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { capitalize, formatDate } from '@/core/format';
import { useTheme } from '@/core/theme/theme-provider';
import { cameraColors, radius, spacing, type ThemeColors } from '@/core/theme/tokens';
import type { ManagerAlert } from '@/data';
import { BottomSheet, Icon, Screen, Text, type IconName } from '@/ui';

import { useManagerSites, useManagerSummary } from './queries';

type CounterLook = { bg: string; fg: string; border: string };

const ALERT_LOOK: Record<ManagerAlert['kind'], { icon: IconName; bg: keyof ThemeColors; fg: keyof ThemeColors }> = {
  late: { icon: 'time-outline', bg: 'warningBg', fg: 'warningFg' },
  flag: { icon: 'flag-outline', bg: 'dangerBg', fg: 'dangerFg' },
  missing_checkout: { icon: 'power-outline', bg: 'orangeBg', fg: 'orangeFg' },
  leave_request: { icon: 'sunny-outline', bg: 'infoBg', fg: 'infoFg' },
};

export function ManagerHomeScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { sites, siteId, setSiteId } = useManagerSites();
  const { data: s } = useManagerSummary(siteId);
  const [switching, setSwitching] = useState(false);
  const site = sites.find((x) => x.id === siteId);
  const multi = sites.length > 1;

  const look = (k: 'expected' | 'present' | 'notArrived' | 'left' | 'absent' | 'onLeave' | 'flagged'): CounterLook =>
    ({
      expected: { bg: cameraColors.navy, fg: cameraColors.text, border: cameraColors.navy },
      present: { bg: colors.successBg, fg: colors.successFg, border: colors.successBorder },
      notArrived: { bg: colors.warningBg, fg: colors.warningFg, border: colors.warningBorder },
      left: { bg: colors.grayBg, fg: colors.grayFg, border: colors.grayBorder },
      absent: { bg: colors.dangerBg, fg: colors.dangerFg, border: colors.dangerBorder },
      onLeave: { bg: colors.infoBg, fg: colors.infoFg, border: colors.infoBorder },
      flagged: { bg: colors.card, fg: colors.dangerFg, border: colors.danger },
    })[k];

  const counters = (['expected', 'present', 'notArrived', 'left', 'absent', 'onLeave', 'flagged'] as const).map((key) => ({ key, value: s?.[key] }));

  const alertCopy = (a: ManagerAlert) => {
    const name = a.name ?? '';
    switch (a.kind) {
      case 'late':
        return { title: t('manager.alertLate'), text: t('manager.alertLateText', { name, time: a.time ?? '' }), cta: t('manager.alertLateCta', { name: name.split(' ')[0] }) };
      case 'flag':
        return { title: t('manager.alertFlag'), text: t('manager.alertFlagText', { name }), cta: t('manager.alertFlagCta') };
      case 'missing_checkout':
        return { title: t('manager.alertOut'), text: t('manager.alertOutText', { name }), cta: t('manager.alertOutCta') };
      case 'leave_request':
        return { title: t('manager.alertLeave'), text: t('manager.alertLeaveText', { count: a.count ?? 0 }), cta: t('manager.alertLeaveCta') };
    }
  };

  const act = (a: ManagerAlert) => {
    if (a.kind === 'late' && a.phone) void Linking.openURL(`tel:${a.phone}`);
    else if (a.kind === 'flag') router.push({ pathname: '/roster', params: { siteId } });
    else if (a.kind === 'missing_checkout') router.push({ pathname: '/manager/proxy', params: { type: 'check_out', employeeId: a.employeeId, siteId } });
    else router.push({ pathname: '/manager/leave-requests', params: { siteId } });
  };

  const quick: { icon: IconName; label: string; primary?: boolean; badge?: number; go: () => void }[] = [
    { icon: 'add', label: t('manager.checkInEmployee'), primary: true, go: () => router.push({ pathname: '/manager/proxy', params: { type: 'check_in', siteId } }) },
    { icon: 'list', label: t('manager.viewRoster'), go: () => router.push({ pathname: '/roster', params: { siteId } }) },
    { icon: 'airplane-outline', label: t('manager.leaveRequests'), badge: s?.pendingLeave, go: () => router.push({ pathname: '/manager/leave-requests', params: { siteId } }) },
  ];

  const alerts = s?.alerts ?? [];

  return (
    <Screen contentStyle={styles.content}>
      <View>
        <Text variant="label" tone="muted" style={styles.eyebrow}>
          {t('manager.eyebrow').toUpperCase()}
        </Text>
        <Text variant="title">{t('manager.todayTitle', { date: capitalize(formatDate(new Date(), 'EEE d MMM', i18n.language)) })}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={!multi}
        onPress={() => setSwitching(true)}
        style={[styles.switcher, { backgroundColor: colors.card, borderColor: colors.line }]}>
        <View style={[styles.house, { backgroundColor: colors.infoBg }]}>
          <Icon name="home-outline" size={18} tone="infoFg" />
        </View>
        <View style={styles.flex}>
          <Text variant="subheading" style={styles.siteName}>
            {site?.name ?? '…'}
          </Text>
          <Text variant="small" tone="muted" style={styles.regular}>
            {site?.address}
          </Text>
        </View>
        {multi ? (
          <Text variant="small" tone="primary">
            {t('manager.switchLabel')} ⌄
          </Text>
        ) : null}
      </Pressable>

      <View style={styles.counters}>
        {counters.map((c) => {
          const l = look(c.key);
          return (
            <View key={c.key} style={[styles.counter, { backgroundColor: l.bg, borderColor: l.border }]}>
              <Text style={[styles.counterValue, { color: l.fg }]}>{c.value ?? '–'}</Text>
              <Text variant="small" style={{ color: l.fg }} numberOfLines={1}>
                {t(`manager.${c.key}`)}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.quick}>
        {quick.map((q) => (
          <Pressable
            key={q.label}
            accessibilityRole="button"
            onPress={q.go}
            style={[styles.tile, { backgroundColor: q.primary ? colors.primary : colors.card, borderColor: q.primary ? colors.primary : colors.line }]}>
            <Icon name={q.icon} size={22} tone={q.primary ? 'onPrimary' : 'primary'} />
            <Text variant="caption" tone={q.primary ? 'onPrimary' : 'ink'} style={styles.tileLabel}>
              {q.label}
            </Text>
            {q.badge ? (
              <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                <Text variant="label" tone="onPrimary" style={styles.badgeText}>
                  {q.badge}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>

      <View style={styles.between}>
        <Text style={styles.sectionTitle}>{t('manager.needsAttention')}</Text>
        <Text variant="small" tone="muted">
          {alerts.length ? t('manager.openCount', { count: alerts.length }) : t('manager.allClear')}
        </Text>
      </View>

      {alerts.map((a) => {
        const l = ALERT_LOOK[a.kind];
        const copy = alertCopy(a);
        return (
          <View key={a.id} style={[styles.alert, { backgroundColor: colors.card, borderColor: colors.line }]}>
            <View style={styles.alertTop}>
              <View style={[styles.alertIcon, { backgroundColor: colors[l.bg] }]}>
                <Icon name={l.icon} size={20} tone={l.fg} />
              </View>
              <View style={styles.flex}>
                <View style={styles.between}>
                  <Text style={styles.alertTitle}>{copy.title}</Text>
                  {a.time ? (
                    <Text variant="label" tone="muted" style={styles.alertTime}>
                      {a.time}
                    </Text>
                  ) : null}
                </View>
                <Text variant="caption" tone="muted" style={styles.alertText}>
                  {copy.text}
                </Text>
              </View>
            </View>
            <Pressable accessibilityRole="button" onPress={() => act(a)} style={[styles.cta, { borderColor: colors.primary, backgroundColor: colors.card }]}>
              <Text variant="caption" tone="primary" style={styles.ctaLabel}>
                {copy.cta}
              </Text>
            </Pressable>
          </View>
        );
      })}

      {s && alerts.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.fieldBorder }]}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.successBg }]}>
            <Icon name="checkmark" size={24} tone="successFg" />
          </View>
          <Text style={styles.sectionTitle}>{t('manager.nothingTitle')}</Text>
          <Text variant="caption" tone="muted" style={styles.center}>
            {t('manager.nothingBody', { site: site?.name ?? '' })}
          </Text>
        </View>
      ) : null}

      <BottomSheet visible={switching} onClose={() => setSwitching(false)} title={t('manager.yourSites')} closable>
        <View style={styles.sheetList}>
          {sites.map((x) => {
            const active = x.id === siteId;
            return (
              <Pressable
                key={x.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  setSiteId(x.id);
                  setSwitching(false);
                }}
                style={[styles.siteRow, { backgroundColor: active ? colors.infoBg : colors.card, borderColor: active ? colors.primary : colors.line, borderWidth: active ? 2 : 1 }]}>
                <View style={styles.flex}>
                  <Text variant="subheading" style={styles.siteName}>
                    {x.name}
                  </Text>
                  <Text variant="small" tone="muted" style={styles.regular}>
                    {t('manager.expectedToday', { count: x.expected })}
                  </Text>
                </View>
                {active ? <Icon name="checkmark" size={20} tone="primary" /> : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 14 },
  center: { textAlign: 'center' },
  regular: { fontWeight: '400' },
  eyebrow: { letterSpacing: 0.8, fontSize: 13 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  switcher: { minHeight: 56, borderRadius: radius.button, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: 14 },
  house: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  siteName: { fontWeight: '800' },
  counters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  counter: { width: '23%', flexGrow: 0, borderRadius: radius.button, borderWidth: 1, padding: 10, gap: 2 },
  counterValue: { fontSize: 24, fontWeight: '800', lineHeight: 27 },
  quick: { flexDirection: 'row', gap: spacing.sm },
  tile: { flex: 1, minHeight: 84, borderRadius: radius.button, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 6 },
  tileLabel: { fontWeight: '800', textAlign: 'center', lineHeight: 17 },
  badge: { position: 'absolute', top: 6, right: 8, minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { letterSpacing: 0 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  alert: { borderWidth: 1, borderRadius: radius.row, padding: spacing.md, gap: 10 },
  alertTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  alertIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontSize: 15, fontWeight: '800', flex: 1 },
  alertTime: { letterSpacing: 0, fontWeight: '400' },
  alertText: { lineHeight: 19 },
  cta: { minHeight: 44, borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  ctaLabel: { fontWeight: '800' },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.lg, paddingVertical: 28, paddingHorizontal: spacing.xl, alignItems: 'center', gap: 6 },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  sheetList: { gap: spacing.sm },
  siteRow: { minHeight: 64, borderRadius: radius.button, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: 14 },
});

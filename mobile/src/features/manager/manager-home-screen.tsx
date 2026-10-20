import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/core/theme/tokens';
import { Button, Card, Icon, Screen, Segmented, Text, type IconName } from '@/ui';

import { useManagerSites, useManagerSummary } from './queries';

const ALERT_ICON: Record<string, IconName> = {
  late: 'alarm-outline',
  flag: 'flag-outline',
  missing_checkout: 'log-out-outline',
  leave_request: 'airplane-outline',
};

export function ManagerHomeScreen() {
  const { t } = useTranslation();
  const { sites, siteId, setSiteId } = useManagerSites();
  const { data: s } = useManagerSummary(siteId);

  const counters: { key: string; value: number | undefined }[] = [
    { key: 'expected', value: s?.expected },
    { key: 'present', value: s?.present },
    { key: 'notArrived', value: s?.notArrived },
    { key: 'left', value: s?.left },
    { key: 'absent', value: s?.absent },
    { key: 'onLeave', value: s?.onLeave },
    { key: 'flagged', value: s?.flagged },
  ];

  return (
    <Screen>
      <Text variant="title">{t('manager.title')}</Text>
      {sites.length > 1 ? (
        <Segmented<string> options={sites.map((x) => ({ value: x.id, label: x.name }))} value={siteId} onChange={setSiteId} />
      ) : null}

      <View style={styles.grid}>
        {counters.map((c) => (
          <Card key={c.key} style={styles.counter}>
            <Text variant="heading">{c.value ?? '–'}</Text>
            <Text variant="caption" tone="muted">{t(`manager.${c.key}`)}</Text>
          </Card>
        ))}
      </View>

      <Text variant="subheading">{t('manager.alerts')}</Text>
      <Card>
        {s && s.alerts.length > 0 ? (
          s.alerts.map((a, i) => (
            <View key={i} style={styles.row}>
              <Icon name={ALERT_ICON[a.kind]} size={18} tone="warning" />
              <Text variant="caption" style={styles.flex}>{a.text}</Text>
            </View>
          ))
        ) : (
          <Text tone="muted">{t('manager.noAlerts')}</Text>
        )}
      </Card>

      <Text variant="subheading">{t('manager.quickActions')}</Text>
      <Button icon="log-in-outline" label={t('manager.checkInEmployee')} onPress={() => router.push({ pathname: '/manager/proxy', params: { type: 'check_in' } })} />
      <Button variant="secondary" icon="list-outline" label={t('manager.viewRoster')} onPress={() => router.push({ pathname: '/manager/roster', params: { siteId } })} />
      <Button variant="secondary" icon="airplane-outline" label={t('manager.leaveRequests')} onPress={() => router.push({ pathname: '/manager/leave-requests', params: { siteId } })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  counter: { width: '31.5%', padding: spacing.md, gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});

import { useQuery } from '@tanstack/react-query';
import { createEventInCalendarAsync } from 'expo-calendar/legacy';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { spacing } from '@/core/theme/tokens';
import { repos } from '@/data';
import { qk } from '@/data/query-keys';
import { atLocal } from '@/domain';
import { openDirections } from '@/features/map/directions';
import { Button, Card, Icon, Pill, Screen, SiteMap, Text } from '@/ui';

export function AssignmentDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: a } = useQuery({ queryKey: qk.assignment(id), queryFn: () => repos.schedule.getAssignment(id) });
  if (!a) return <Screen>{null}</Screen>;

  const addToCalendar = () =>
    void createEventInCalendarAsync({
      title: a.site.name,
      location: a.site.address,
      startDate: atLocal(a.date, a.start),
      endDate: atLocal(a.date, a.end),
      notes: a.instructions,
    });

  return (
    <Screen>
      <View style={styles.head}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
          <Icon name="chevron-back" />
        </Pressable>
        <Text variant="title" style={styles.flex}>{t('schedule.detail')}</Text>
      </View>

      <View style={styles.badges}>
        <Pill tone={a.type === 'intervention' ? 'warning' : 'info'} label={t(`home.${a.type}`)} />
        {a.updatedByAdmin ? <Pill tone="info" label={t('schedule.updatedByAdmin')} /> : null}
      </View>

      <Card>
        <Text variant="heading">{a.site.name}</Text>
        <Text tone="muted">{a.site.address}</Text>
        <View style={styles.row}>
          <Icon name="time-outline" size={18} />
          <Text variant="subheading">{a.date} · {a.start} – {a.end}</Text>
        </View>
      </Card>

      <SiteMap site={a.site} style={styles.map} />

      {a.instructions ? (
        <Card>
          <Text variant="label" tone="muted">{t('schedule.instructions').toUpperCase()}</Text>
          <Text>{a.instructions}</Text>
        </Card>
      ) : null}

      <Button icon="call-outline" variant="secondary" label={t('schedule.callManager')} onPress={() => void Linking.openURL(`tel:${a.site.managerPhone}`)} />
      <Button icon="navigate-outline" variant="secondary" label={t('schedule.directions')} onPress={() => openDirections(a.site.center, a.site.name, t as (k: string) => string)} />
      <Button icon="calendar-outline" variant="secondary" label={t('schedule.addToCalendar')} onPress={addToCalendar} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  badges: { flexDirection: 'row', gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  map: { height: 180 },
});

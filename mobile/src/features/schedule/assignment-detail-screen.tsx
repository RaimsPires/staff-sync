import { useQuery } from '@tanstack/react-query';
import { createEventInCalendarAsync } from 'expo-calendar/legacy';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { capitalize, formatDate } from '@/core/format';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { repos } from '@/data';
import { qk } from '@/data/query-keys';
import { atLocal } from '@/domain';
import { useDirectionsSheet } from '@/features/map/directions-sheet';
import { Avatar, BackHeader, Banner, Button, Icon, Screen, SiteMap, StatusChip, Tag, Text } from '@/ui';

import { assignmentStatus, STATUS_TONE } from './status';

const STATUS_KEY = { upcoming: 'home.statusUpcoming', in_progress: 'home.statusInProgress', completed: 'home.statusCompleted' } as const;

export function AssignmentDetailScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const directions = useDirectionsSheet();
  const { data: a } = useQuery({ queryKey: qk.assignment(id), queryFn: () => repos.schedule.getAssignment(id) });
  if (!a) return <Screen>{null}</Screen>;

  const status = assignmentStatus(a);
  const addToCalendar = () =>
    void createEventInCalendarAsync({
      title: a.site.name,
      location: a.site.address,
      startDate: atLocal(a.date, a.start),
      endDate: atLocal(a.date, a.end),
      notes: a.instructions,
    });

  return (
    <Screen contentStyle={styles.content}>
      <BackHeader title={t('schedule.detail')} variant="heading" />

      <View style={styles.badges}>
        <Tag tone={a.type === 'intervention' ? 'warning' : 'info'} label={t(`home.${a.type}`)} />
        <StatusChip tone={STATUS_TONE[status]} label={t(STATUS_KEY[status])} />
      </View>

      {a.updatedByAdmin && a.previousStart ? (
        <Banner tone="warning" icon="create-outline" title={t('schedule.updatedBanner', { from: a.previousStart, to: a.start })} />
      ) : null}

      <View style={styles.titleBlock}>
        <Text variant="headline">{a.site.name}</Text>
        <Text tone="muted" style={styles.address}>
          {a.site.address}
        </Text>
        <View style={styles.timeRow}>
          <Icon name="time-outline" size={18} />
          <Text variant="lead" style={styles.time}>
            {a.start} – {a.end} · {capitalize(formatDate(a.date, 'EEE d MMM', i18n.language))}
          </Text>
        </View>
      </View>

      <SiteMap site={a.site} snapshot style={styles.map} />

      {a.instructions || a.attachments?.length ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>
          <Text style={styles.cardTitle}>{t('schedule.instructions')}</Text>
          {a.instructions ? (
            <Text tone="muted" style={styles.instr}>
              {a.instructions}
            </Text>
          ) : null}
          {a.attachments?.length ? (
            <View style={styles.files}>
              {a.attachments.map((f) => (
                <View key={f.name} style={[styles.file, { backgroundColor: colors.soft }]}>
                  <Icon name="attach" size={18} />
                  <Text variant="caption" style={styles.fileName} numberOfLines={1}>
                    {f.name}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {f.size}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.manager, { backgroundColor: colors.card, borderColor: colors.line }]}>
        <Avatar name={a.site.managerName} tone="navy" />
        <View style={styles.flex}>
          <Text variant="subheading" style={styles.managerName}>
            {a.site.managerName}
          </Text>
          <Text variant="small" tone="muted" style={styles.regular}>
            {t('schedule.managerRole')}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('schedule.callManager')}
          onPress={() => void Linking.openURL(`tel:${a.site.managerPhone}`)}
          style={[styles.call, { backgroundColor: colors.primary }]}>
          <Text tone="onPrimary" style={styles.callLabel}>
            {t('common.call')}
          </Text>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Button
          variant="outlinePrimary"
          icon="navigate"
          label={t('schedule.directionsShort')}
          style={styles.action}
          onPress={() => directions.open(a.site.center, a.site.name)}
        />
        <Button variant="outlinePrimary" icon="calendar-outline" label={t('schedule.calendarShort')} style={styles.action} onPress={addToCalendar} />
      </View>
      {directions.sheet}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14 },
  flex: { flex: 1 },
  badges: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  titleBlock: { gap: 4 },
  address: { fontSize: 15 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  time: { fontWeight: '700' },
  map: { height: 130, borderRadius: radius.row },
  card: { borderWidth: 1, borderRadius: radius.row, padding: 14, gap: 6 },
  cardTitle: { fontSize: 14, fontWeight: '800' },
  instr: { fontSize: 15, lineHeight: 22 },
  files: { gap: spacing.sm, marginTop: spacing.sm },
  file: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.md, paddingHorizontal: spacing.md },
  fileName: { flex: 1, fontWeight: '700' },
  manager: { borderWidth: 1, borderRadius: radius.row, paddingVertical: spacing.md, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  managerName: { fontWeight: '800' },
  regular: { fontWeight: '400' },
  call: { minHeight: 44, paddingHorizontal: spacing.lg, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  callLabel: { fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1, paddingHorizontal: spacing.sm },
});

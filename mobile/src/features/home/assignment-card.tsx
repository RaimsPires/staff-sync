import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/core/theme/tokens';
import type { Assignment, AttendanceRecord } from '@/domain';
import { Card, Icon, Pill, Text } from '@/ui';

type Props = { assignment: Assignment; record: AttendanceRecord | null | undefined; width: number };

export function AssignmentCard({ assignment, record, width }: Props) {
  const { t } = useTranslation();
  const status = record?.checkOutAt
    ? { label: t('home.completed'), tone: 'success' as const }
    : record?.checkInAt
      ? { label: t('home.onSite'), tone: 'info' as const }
      : { label: t('home.notCheckedIn'), tone: 'neutral' as const };

  return (
    <Card style={{ width }} accessibilityLabel={assignment.site.name}>
      <View style={styles.head}>
        <Pill tone={assignment.type === 'intervention' ? 'warning' : 'info'} label={t(`home.${assignment.type}`)} />
        <Pill tone={status.tone} label={status.label} />
      </View>
      <Text variant="heading">{assignment.site.name}</Text>
      <View style={styles.row}>
        <Icon name="location-outline" size={16} tone="muted" />
        <Text variant="caption" tone="muted" style={styles.flex}>
          {assignment.site.address}
        </Text>
      </View>
      <View style={styles.row}>
        <Icon name="time-outline" size={18} />
        <Text variant="subheading">
          {assignment.start} – {assignment.end}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});

import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import { spacing, type ThemeColors } from '@/core/theme/tokens';
import type { Assignment, AttendanceRecord } from '@/domain';
import { Card, Icon, Tag, Text } from '@/ui';

type Props = { assignment: Assignment; record: AttendanceRecord | null | undefined; width: number | `${number}%` };

export function AssignmentCard({ assignment, record, width }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const status: { label: string; bg: keyof ThemeColors; fg: 'infoFg' | 'warningFg' | 'successFg' } = record?.checkOutAt
    ? { label: t('home.statusCompleted'), bg: 'successBg', fg: 'successFg' }
    : record?.checkInAt
      ? { label: t('home.statusInProgress'), bg: 'warningBg', fg: 'warningFg' }
      : { label: t('home.statusUpcoming'), bg: 'infoBg', fg: 'infoFg' };

  return (
    <Card style={{ width, gap: 10 }} accessibilityLabel={assignment.site.name}>
      <View style={styles.head}>
        <Tag tone={assignment.type === 'intervention' ? 'warning' : 'info'} label={t(`home.${assignment.type}`)} />
        <View style={[styles.status, { backgroundColor: colors[status.bg] }]}>
          <Text variant="small" tone={status.fg}>
            {status.label}
          </Text>
        </View>
      </View>
      <Text variant="heading" style={styles.site}>
        {assignment.site.name}
      </Text>
      <View style={styles.row}>
        <Icon name="location-outline" size={16} tone="muted" />
        <Text variant="caption" tone="muted" style={styles.flex}>
          {assignment.site.address}
        </Text>
      </View>
      <View style={styles.row}>
        <Icon name="time-outline" size={18} />
        <Text variant="subheading" style={styles.time}>
          {assignment.start} – {assignment.end}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  status: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  site: { lineHeight: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  time: { fontWeight: '700' },
});

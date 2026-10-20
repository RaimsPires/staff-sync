import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import type { Assignment } from '@/domain';
import { Icon, StatusChip, Tag, Text } from '@/ui';

import { assignmentStatus, STATUS_TONE } from './status';

const STATUS_KEY = { upcoming: 'home.statusUpcoming', in_progress: 'home.statusInProgress', completed: 'home.statusCompleted' } as const;

export function AssignmentRow({ assignment: a }: { assignment: Assignment }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const status = assignmentStatus(a);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/schedule/[id]', params: { id: a.id } })}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>
      <View style={styles.head}>
        <Tag tone={a.type === 'intervention' ? 'warning' : 'info'} label={t(`home.${a.type}`)} />
        <StatusChip tone={STATUS_TONE[status]} label={t(STATUS_KEY[status])} />
      </View>
      <Text variant="section">{a.site.name}</Text>
      <View style={styles.foot}>
        <Text variant="subheading" style={styles.time}>
          <Icon name="time-outline" size={16} /> {a.start} – {a.end}
        </Text>
        <Icon name="chevron-forward" size={20} tone="primary" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontWeight: '700' },
});

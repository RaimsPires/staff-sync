import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { spacing } from '@/core/theme/tokens';
import type { Assignment } from '@/domain';
import { Card, Icon, Pill, Text } from '@/ui';

export function AssignmentRow({ assignment: a }: { assignment: Assignment }) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/schedule/[id]', params: { id: a.id } })}>
      <Card style={styles.card}>
        <View style={styles.flex}>
          <View style={styles.badges}>
            {a.type === 'intervention' ? <Pill tone="warning" label={t('home.intervention')} /> : null}
            {a.updatedByAdmin ? <Pill tone="info" label={t('schedule.updatedByAdmin')} /> : null}
          </View>
          <Text variant="subheading">{a.site.name}</Text>
          <View style={styles.time}>
            <Icon name="time-outline" size={16} tone="muted" />
            <Text variant="caption" tone="muted">{a.start} – {a.end}</Text>
          </View>
        </View>
        <Icon name="chevron-forward" size={18} tone="muted" />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, gap: spacing.xs },
  badges: { flexDirection: 'row', gap: spacing.sm },
  time: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});

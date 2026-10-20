import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { repos, type RosterEntry } from '@/data';
import { qk } from '@/data/query-keys';
import { Button, Card, EmptyState, Icon, Pill, Screen, Text, TextField, type PillTone } from '@/ui';

import { useRoster } from './queries';

type Filter = RosterEntry['status'] | null;
const FILTERS: Filter[] = [null, 'not_arrived', 'on_time', 'late', 'flagged', 'on_leave', 'left'];

const tone = (s: RosterEntry['status']): PillTone =>
  s === 'on_time' ? 'success' : s === 'late' || s === 'flagged' ? 'warning' : s === 'on_leave' ? 'info' : s === 'absent' ? 'danger' : 'neutral';

function RosterRow({ entry, siteId }: { entry: RosterEntry; siteId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(entry.note ?? '');
  const [saved, setSaved] = useState(false);
  const save = useMutation({
    mutationFn: () => repos.manager.addNote(entry.employeeId, note.trim()),
    onSuccess: async () => {
      setSaved(true);
      await qc.invalidateQueries({ queryKey: qk.managerRoster(siteId) });
    },
  });
  const label = entry.status === 'not_arrived' ? t('manager.notArrivedStatus') : entry.status === 'left' ? t('manager.leftStatus') : t(`status.${entry.status}`);
  const go = (type: 'check_in' | 'check_out') => router.push({ pathname: '/manager/proxy', params: { type, employeeId: entry.employeeId } });

  return (
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((v) => !v)}>
      <Card>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Text variant="bodyStrong">{entry.name}</Text>
            <Text variant="caption" tone="muted">
              {entry.scheduled.start}–{entry.scheduled.end}
              {entry.checkInAt ? ` · ${entry.checkInAt}` : ''}
              {entry.checkOutAt ? ` → ${entry.checkOutAt}` : ''}
            </Text>
          </View>
          {!entry.hasSmartphone ? <Icon name="phone-portrait-outline" size={18} tone="muted" /> : null}
          <Pill tone={tone(entry.status)} label={label} />
        </View>
        {open ? (
          <View style={styles.actions}>
            <View style={styles.row}>
              <Button style={styles.flex} icon="log-in-outline" label={t('manager.checkInOnBehalf')} onPress={() => go('check_in')} disabled={!!entry.checkInAt || entry.status === 'on_leave'} />
              <Button style={styles.flex} variant="secondary" icon="log-out-outline" label={t('manager.checkOutOnBehalf')} onPress={() => go('check_out')} disabled={!entry.checkInAt || !!entry.checkOutAt} />
            </View>
            <Button variant="secondary" icon="call-outline" label={t('common.call')} onPress={() => void Linking.openURL(`tel:${entry.phone}`)} />
            <TextField label={t('manager.addNote')} placeholder={t('manager.savePlaceholder')} value={note} onChangeText={(v) => { setNote(v); setSaved(false); }} maxLength={300} />
            <Button variant="secondary" label={saved ? t('manager.noteSaved') : t('common.save')} disabled={!note.trim() || saved} loading={save.isPending} onPress={() => save.mutate()} />
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

export function RosterScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { siteId = '' } = useLocalSearchParams<{ siteId?: string }>();
  const { data = [] } = useRoster(siteId);
  const [filter, setFilter] = useState<Filter>(null);
  const [query, setQuery] = useState('');

  const rows = data.filter((e) => (!filter || e.status === filter) && e.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Screen
      footer={<Button icon="qr-code-outline" label={t('manager.scanBadge')} onPress={() => router.push({ pathname: '/manager/proxy', params: { type: 'check_in', scan: '1' } })} />}>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
          <Icon name="chevron-back" />
        </Pressable>
        <Text variant="title" style={styles.flex}>{t('manager.roster')}</Text>
      </View>
      <TextField label={t('common.search')} placeholder={t('manager.searchPlaceholder')} value={query} onChangeText={setQuery} autoCorrect={false} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <Pressable key={f ?? 'all'} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => setFilter(f)} style={[styles.chip, { backgroundColor: active ? colors.primary : colors.card, borderColor: colors.line }]}>
              <Text variant="caption" tone={active ? 'onPrimary' : 'ink'} style={styles.bold}>
                {f === null ? t('common.all') : f === 'not_arrived' ? t('manager.notArrivedStatus') : f === 'left' ? t('manager.leftStatus') : t(`status.${f}`)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {rows.length === 0 ? <EmptyState icon="people-outline" title={t('attendance.empty')} /> : rows.map((e) => <RosterRow key={e.employeeId} entry={e} siteId={siteId} />)}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  filters: { gap: spacing.sm },
  chip: { minHeight: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center' },
  actions: { gap: spacing.sm },
});

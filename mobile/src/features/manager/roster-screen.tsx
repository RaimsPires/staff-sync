import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { formatTime } from '@/core/format';
import { useOnline } from '@/core/network/use-online';
import { useTheme } from '@/core/theme/theme-provider';
import { cameraColors, radius, spacing, type ThemeColors } from '@/core/theme/tokens';
import { repos, type RosterEntry } from '@/data';
import { qk } from '@/data/query-keys';
import { selectPending, useOfflineQueue } from '@/data/offline-queue';
import { Avatar, BottomSheet, Button, Icon, Screen, Text, useToast, type IconName, type TextProps } from '@/ui';

import { useManagerSites, useRoster } from './queries';

type Group = 'notArrived' | 'present' | 'left' | 'absent' | 'onLeave';
const GROUPS: Group[] = ['notArrived', 'present', 'left', 'absent', 'onLeave'];
const GROUP_OF = (s: RosterEntry['status']): Group | undefined =>
  s === 'not_arrived' ? 'notArrived' : s === 'left' ? 'left' : s === 'absent' ? 'absent' : s === 'on_leave' ? 'onLeave' : s === 'holiday' ? undefined : 'present';
const LOOK: Record<Group, { bg: keyof ThemeColors; fg: NonNullable<TextProps['tone']> }> = {
  notArrived: { bg: 'warningBg', fg: 'warningFg' },
  present: { bg: 'successBg', fg: 'successFg' },
  left: { bg: 'grayBg', fg: 'grayFg' },
  absent: { bg: 'dangerBg', fg: 'dangerFg' },
  onLeave: { bg: 'infoBg', fg: 'infoFg' },
};
const METHOD: Record<NonNullable<RosterEntry['checkInMethod']>, { icon: IconName; key: string }> = {
  gps: { icon: 'locate', key: 'manager.methodGps' },
  qr: { icon: 'qr-code', key: 'manager.methodQr' },
  manager: { icon: 'create', key: 'manager.methodManager' },
};

function ActionTile({ icon, label, onPress, disabled, primary }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean; primary?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.action,
        { backgroundColor: primary ? colors.primary : colors.card, borderColor: primary ? colors.primary : colors.line, borderWidth: primary ? 0 : 1, opacity: disabled ? 0.4 : 1 },
      ]}>
      <Icon name={icon} size={20} tone={primary ? 'onPrimary' : 'ink'} />
      <Text variant="small" tone={primary ? 'onPrimary' : 'ink'} style={styles.actionLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

function RosterRow({ entry, open, onToggle, onNote, onRecord, siteId }: { entry: RosterEntry; open: boolean; onToggle: () => void; onNote: () => void; onRecord: () => void; siteId: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const group = GROUP_OF(entry.status);
  const look = group ? LOOK[group] : { bg: 'soft' as const, fg: 'muted' as const };
  const go = (type: 'check_in' | 'check_out') => router.push({ pathname: '/manager/proxy', params: { type, employeeId: entry.employeeId, siteId } });
  const canIn = entry.status === 'not_arrived' || entry.status === 'absent';
  const canOut = !!entry.checkInAt && !entry.checkOutAt;
  const method = entry.checkInMethod ? METHOD[entry.checkInMethod] : undefined;

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.line }]}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle} style={styles.rowTop}>
        <Avatar name={entry.name} size={48} />
        <View style={styles.rowBody}>
          <View style={styles.between}>
            <Text variant="subheading" numberOfLines={1} style={styles.name}>
              {entry.name}
            </Text>
            <View style={[styles.status, { backgroundColor: colors[look.bg] }]}>
              <Text variant="small" tone={look.fg} style={styles.statusText}>
                {group ? t(`manager.${group === 'notArrived' ? 'notArrivedStatus' : group === 'left' ? 'leftStatus' : group}`) : t(`status.${entry.status}`)}
              </Text>
            </View>
          </View>
          <Text variant="small" tone="muted" style={styles.regular}>
            {t('manager.rosterScheduled', { time: `${entry.scheduled.start} – ${entry.scheduled.end}` })}
            {entry.role ? ` · ${entry.role}` : ''}
          </Text>
          <View style={styles.times}>
            <Text variant="caption" style={styles.bold}>
              {t('manager.inLabel', { time: entry.checkInAt ?? '--:--' })}
            </Text>
            <Text variant="caption" style={styles.bold}>
              {t('manager.outLabel', { time: entry.checkOutAt ?? '--:--' })}
            </Text>
            <View style={styles.flex} />
            {!entry.hasSmartphone ? (
              <View style={[styles.badge, { backgroundColor: colors.warningBg }]} accessibilityLabel={t('manager.noSmartphone')}>
                <Icon name="phone-portrait-outline" size={16} tone="warningFg" />
              </View>
            ) : null}
            {method ? (
              <View style={[styles.badge, { backgroundColor: colors.infoBg }]} accessibilityLabel={t(method.key)}>
                <Icon name={method.icon} size={16} tone="infoFg" />
              </View>
            ) : null}
            {entry.queued ? (
              <Text variant="label" tone="warningFg" style={styles.queued}>
                {t('manager.queuedLabel')}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>
      {open ? (
        <View style={[styles.actions, { backgroundColor: colors.bg, borderTopColor: colors.line }]}>
          <ActionTile icon="add" label={t('manager.checkInForThem')} primary={canIn} disabled={!canIn} onPress={() => go('check_in')} />
          <ActionTile icon="power-outline" label={t('manager.checkOutForThem')} primary={canOut} disabled={!canOut} onPress={() => go('check_out')} />
          <ActionTile icon="call" label={t('common.call')} onPress={() => void Linking.openURL(`tel:${entry.phone}`)} />
          <ActionTile icon="create-outline" label={entry.note ? t('manager.editNote') : t('manager.addNote')} onPress={onNote} />
          <ActionTile icon="list" label={t('manager.todaysRecord')} onPress={onRecord} />
        </View>
      ) : null}
    </View>
  );
}

export function RosterScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const online = useOnline();
  const queuedNotes = useOfflineQueue((s) => s.notes);
  const enqueueNote = useOfflineQueue((s) => s.enqueueNote);
  const queuedProxies = useOfflineQueue((s) => s.proxies);
  const queuedCount = useOfflineQueue(selectPending);
  const params = useLocalSearchParams<{ siteId?: string }>();
  const sites = useManagerSites();
  const siteId = params.siteId ?? sites.siteId;
  const site = sites.sites.find((x) => x.id === siteId);
  const roster = useRoster(siteId, true);
  // Notes written offline show immediately and carry the "Queued" label until they sync.
  const data = (roster.data ?? []).map((e) => {
    const q = queuedNotes.find((n) => n.employeeId === e.employeeId);
    const proxy = queuedProxies.some((p) => p.input.employeeId === e.employeeId);
    return q ? { ...e, note: q.note, queued: true } : proxy ? { ...e, queued: true } : e;
  });
  const [group, setGroup] = useState<Group | null>(null);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ kind: 'note' | 'record'; id: string } | null>(null);
  const [note, setNote] = useState('');

  const saveNote = useMutation({
    mutationFn: () => repos.manager.addNote(sheet!.id, note.trim()),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.managerRoster(siteId) });
      setSheet(null);
      toast.show(t('manager.noteSaved'));
    },
  });

  const count = (g: Group | null) => (g ? data.filter((e) => GROUP_OF(e.status) === g).length : data.length);
  const rows = data.filter((e) => (!group || GROUP_OF(e.status) === group) && e.name.toLowerCase().includes(query.trim().toLowerCase()));
  const sel = sheet ? data.find((e) => e.employeeId === sheet.id) : undefined;
  const label = (g: Group | null) => (g === null ? t('common.all') : t(`manager.${g === 'notArrived' ? 'notArrivedStatus' : g === 'left' ? 'leftStatus' : g}`));

  const updated = roster.dataUpdatedAt ? formatTime(new Date(roster.dataUpdatedAt)) : '';
  const fresh = Date.now() - roster.dataUpdatedAt < 60_000;
  const when = fresh ? t('manager.justNow') : updated;
  const liveText = !online ? t('manager.liveSaved', { when }) : t('manager.liveNow', { when });
  const liveColor = online ? colors.successFg : colors.muted;

  const recordRows: [string, string][] = sel
    ? [
        [t('manager.recStatus'), group ? label(GROUP_OF(sel.status) ?? null) : sel.status],
        [t('manager.rosterScheduled', { time: '' }).trim(), `${sel.scheduled.start} – ${sel.scheduled.end}`],
        [t('manager.recCheckIn'), sel.checkInAt ?? '--:--'],
        [t('manager.recCheckOut'), sel.checkOutAt ?? '--:--'],
        [t('manager.recMethod'), sel.checkInMethod ? t(METHOD[sel.checkInMethod].key) : t('manager.noneLabel')],
        [t('manager.recPhone'), sel.hasSmartphone ? t('manager.smartphone') : t('manager.noSmartphone')],
        [t('manager.recNote'), sel.note || t('manager.noneLabel')],
      ]
    : [];

  return (
    <Screen hideOfflineBanner onRefresh={() => void roster.refetch()} refreshing={roster.isRefetching} contentStyle={styles.content}>
      {!online ? (
        <View style={[styles.offline, { backgroundColor: cameraColors.navy }]}>
          <Icon name="warning-outline" size={18} tone="onPrimary" />
          <Text variant="caption" tone="onPrimary" style={styles.offlineText}>
            {t('manager.offlineRoster', { queued: queuedCount ? t('manager.waitingToSync', { count: queuedCount }) : '' })}
          </Text>
        </View>
      ) : null}

      <View style={styles.header}>
        <View>
          <Text variant="label" tone="muted" style={styles.eyebrow}>
            {(site?.name ?? '').toUpperCase()}
          </Text>
          <Text variant="title">{t('manager.roster')}</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('manager.title')}
            onPress={() => router.push({ pathname: '/manager/proxy', params: { type: 'check_in', siteId } })}
            style={[styles.plus, { backgroundColor: colors.primary }]}>
            <Icon name="add" size={24} tone="onPrimary" />
          </Pressable>
          <View style={styles.live}>
            <View style={[styles.liveDot, { backgroundColor: liveColor }]} />
            <Text variant="small" style={{ color: liveColor }}>
              {liveText}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.fieldBorder }]}>
        <Icon name="search" size={18} tone="muted" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('manager.searchEmployee')}
          placeholderTextColor={colors.muted}
          accessibilityLabel={t('manager.searchEmployee')}
          autoCorrect={false}
          style={[styles.searchInput, { color: colors.ink }]}
        />
        {query ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={() => setQuery('')} style={[styles.clear, { backgroundColor: colors.grayBg }]}>
            <Icon name="close" size={16} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsOuter} contentContainerStyle={styles.chips}>
        {[null, ...GROUPS].map((g) => {
          const active = group === g;
          return (
            <Pressable
              key={g ?? 'all'}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setGroup(g)}
              style={[styles.chip, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.fieldBorder }]}>
              <Text variant="caption" tone={active ? 'onPrimary' : 'ink'} style={styles.chipLabel}>
                {label(g)}
              </Text>
              <Text variant="small" tone={active ? 'onPrimary' : 'ink'} style={styles.chipCount}>
                {count(g)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {rows.map((e) => (
        <RosterRow
          key={e.employeeId}
          entry={e}
          siteId={siteId}
          open={openId === e.employeeId}
          onToggle={() => setOpenId(openId === e.employeeId ? null : e.employeeId)}
          onNote={() => {
            setNote(e.note ?? '');
            setSheet({ kind: 'note', id: e.employeeId });
          }}
          onRecord={() => setSheet({ kind: 'record', id: e.employeeId })}
        />
      ))}

      {rows.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.fieldBorder }]}>
          <Text style={styles.emptyTitle}>{t('manager.noEmployees')}</Text>
          <Text variant="caption" tone="muted">
            {t('manager.tryAnother')}
          </Text>
        </View>
      ) : null}

      <BottomSheet
        visible={sheet !== null && !!sel}
        onClose={() => setSheet(null)}
        closable
        title={sheet?.kind === 'note' ? t('manager.noteFor', { name: sel?.name ?? '' }) : t('manager.todaysRecord')}
        subtitle={sheet?.kind === 'note' ? sel?.role : sel?.name}>
        {sheet?.kind === 'note' ? (
          <>
            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={300}
              placeholder={t('manager.notePh')}
              placeholderTextColor={colors.muted}
              accessibilityLabel={t('manager.addNote')}
              style={[styles.noteInput, { backgroundColor: colors.card, borderColor: colors.fieldBorder, color: colors.ink }]}
            />
            <Button
              label={t('manager.saveNote')}
              disabled={!note.trim()}
              loading={saveNote.isPending}
              onPress={() => {
                if (online) return saveNote.mutate();
                enqueueNote({ id: Crypto.randomUUID(), employeeId: sheet!.id, note: note.trim() });
                setSheet(null);
                toast.show(t('manager.noteSavedOffline'));
              }}
            />
          </>
        ) : (
          <>
            <View style={[styles.record, { backgroundColor: colors.card, borderColor: colors.line }]}>
              {recordRows.map(([k, v], i) => (
                <View key={k} style={[styles.recordRow, i < recordRows.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.soft }]}>
                  <Text variant="caption" tone="muted">
                    {k}
                  </Text>
                  <Text variant="caption" style={styles.recordValue}>
                    {v}
                  </Text>
                </View>
              ))}
            </View>
            <Button variant="outlinePrimary" label={t('common.done')} onPress={() => setSheet(null)} />
          </>
        )}
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 10 },
  regular: { fontWeight: '400' },
  bold: { fontWeight: '700' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  offline: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: spacing.lg },
  offlineText: { flex: 1, fontWeight: '700', lineHeight: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  eyebrow: { letterSpacing: 0.8, fontSize: 13 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  plus: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  live: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  search: { minHeight: 48, borderRadius: radius.field, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: 16, minHeight: 44 },
  clear: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  chipsOuter: { marginHorizontal: -spacing.xl, flexGrow: 0 },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.xl, paddingBottom: 2 },
  chip: { minHeight: 44, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipLabel: { fontWeight: '800' },
  chipCount: { opacity: 0.85, fontWeight: '700' },
  row: { borderWidth: 1, borderRadius: radius.row, overflow: 'hidden' },
  rowTop: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, alignItems: 'flex-start', minHeight: 44 },
  rowBody: { flex: 1, gap: 4 },
  name: { fontWeight: '800', flexShrink: 1 },
  status: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  statusText: { fontWeight: '800' },
  times: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: { width: 28, height: 28, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  queued: { letterSpacing: 0, fontWeight: '800' },
  actions: { borderTopWidth: 1, padding: 10, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  action: { width: '31.5%', flexGrow: 1, minHeight: 64, borderRadius: radius.field, alignItems: 'center', justifyContent: 'center', gap: 2, padding: 4 },
  actionLabel: { fontWeight: '800', textAlign: 'center', lineHeight: 15 },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.lg, paddingVertical: 28, paddingHorizontal: spacing.xl, alignItems: 'center', gap: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  noteInput: { minHeight: 96, borderRadius: radius.field, borderWidth: 1, padding: spacing.md, fontSize: 16, textAlignVertical: 'top' },
  record: { borderWidth: 1, borderRadius: radius.button },
  recordRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 12, paddingHorizontal: 14 },
  recordValue: { fontWeight: '800', textAlign: 'right', flexShrink: 1 },
});

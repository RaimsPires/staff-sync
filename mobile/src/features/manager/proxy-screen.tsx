import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { formatTime } from '@/core/format';
import { captureFix, type Fix } from '@/core/location/use-site-proximity';
import { useOnline } from '@/core/network/use-online';
import { useSession } from '@/core/session/session-store';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { AppError, repos, type RosterEntry } from '@/data';
import { useOfflineQueue } from '@/data/offline-queue';
import { qk } from '@/data/query-keys';
import { distanceToGeofenceM, isInsideGeofence } from '@/domain';
import { QrStep } from '@/features/attendance/check-flow/camera-steps';
import { Avatar, Button, Icon, ResultView, RoundButton, Screen, Stepper, Text, useToast } from '@/ui';

import { useManagerSites, useRoster } from './queries';

type Params = { type?: 'check_in' | 'check_out'; employeeId?: string; scan?: string; siteId?: string };
type Result = 'ok' | 'flagged' | 'unscheduled' | 'offline';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

export function ProxyScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const online = useOnline();
  const enqueueProxy = useOfflineQueue((s) => s.enqueueProxy);
  const manager = useSession((s) => s.user);
  const params = useLocalSearchParams<Params>();
  const type = params.type ?? 'check_in';
  const out = type === 'check_out';
  const { siteId: defaultSiteId } = useManagerSites();
  const siteId = params.siteId ?? defaultSiteId;

  const { data: roster = [] } = useRoster(siteId);
  const { data: today = [] } = useQuery({ queryKey: qk.assignmentsToday, queryFn: () => repos.schedule.getToday() });
  const site = (today.find((a) => a.site.id === siteId) ?? today[0])?.site;

  const [step, setStep] = useState(params.employeeId ? 1 : 0);
  const [employeeId, setEmployeeId] = useState<string | undefined>(params.employeeId);
  const [badgeToken, setBadgeToken] = useState<string>();
  const [scanning, setScanning] = useState(params.scan === '1');
  const [query, setQuery] = useState('');
  const [pin, setPin] = useState('');
  const [pinOk, setPinOk] = useState(false);
  const [pinError, setPinError] = useState<string>();
  const [locked, setLocked] = useState(false);
  const [photo, setPhoto] = useState<string>();
  // One key per attempt, so a retry after a dropped response cannot record the check twice.
  const eventId = useRef(Crypto.randomUUID());
  const [note, setNote] = useState('');
  const [fix, setFix] = useState<Fix>();
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ kind: Result; at: string; entry?: RosterEntry }>();

  const target = roster.find((r) => r.employeeId === employeeId);
  const verified = pinOk || !!photo;
  const distance = fix && site ? Math.round(distanceToGeofenceM(fix, site.geofence)) : undefined;
  const inside = !!fix && (!site || isInsideGeofence(fix, site.geofence));

  const locate = useCallback(async () => {
    setChecking(true);
    try {
      setFix(await captureFix());
    } catch {
      setFix(undefined);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (step === 2) void locate();
  }, [step, locate]);

  const reset = () => {
    setStep(0);
    setEmployeeId(undefined);
    setBadgeToken(undefined);
    setPin('');
    setPinOk(false);
    setPinError(undefined);
    setLocked(false);
    setPhoto(undefined);
    setNote('');
    setResult(undefined);
    setQuery('');
  };

  const pick = (id: string) => {
    setEmployeeId(id);
    setPin('');
    setPinOk(false);
    setPinError(undefined);
    setLocked(false);
    setPhoto(undefined);
    setStep(1);
  };

  const scanned = async (payload: string) => {
    setScanning(false);
    try {
      const entry = await repos.manager.findByBadge(payload, siteId);
      setBadgeToken(payload);
      pick(entry.employeeId);
    } catch {
      toast.show(t('manager.notFound'));
    }
  };

  const press = async (key: (typeof KEYS)[number]) => {
    if (locked || pinOk || key === '') return;
    if (key === 'del') return setPin((p) => p.slice(0, -1));
    if (pin.length >= 4) return;
    const next = pin + key;
    setPin(next);
    if (next.length < 4 || !employeeId) return;
    // The PIN can only be checked by the server, and is never stored, so offline use a photo instead.
    if (!online) {
      setPin('');
      return setPinError(t('manager.pinOffline'));
    }
    try {
      await repos.manager.verifyPin(employeeId, next);
      setPinOk(true);
      setPinError(undefined);
    } catch (e) {
      setPin('');
      if (e instanceof AppError && e.code === 'PIN_LOCKED') {
        setLocked(true);
        setPinError(t('manager.pinLockedPhoto'));
      } else if (e instanceof AppError && e.code === 'PIN_INVALID') {
        const left = e.meta?.attemptsLeft ?? 0;
        if (left <= 0) setLocked(true);
        setPinError(left <= 0 ? t('manager.pinLockedPhoto') : t('manager.pinWrong', { left }));
      } else setPinError(t('common.genericError'));
    }
  };

  const takePhoto = async () => {
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], cameraType: ImagePicker.CameraType.front, quality: 0.6 });
    if (!res.canceled) setPhoto(res.assets[0].uri);
  };

  const run = useMutation({
    mutationFn: async (acceptUnscheduled: boolean) => {
      const f = fix ?? (await captureFix());
      return repos.manager.proxyCheck({
        clientEventId: eventId.current,
        siteId,
        employeeId,
        badgeToken,
        pin: pinOk ? pin : undefined,
        photoUri: photo,
        note: note.trim() || undefined,
        type,
        acceptUnscheduled,
        managerPosition: { lat: f.lat, lng: f.lng, accuracyM: f.accuracyM, mocked: f.mocked, capturedAt: f.capturedAt.toISOString() },
      });
    },
    onSuccess: async ({ entry, flags }, acceptUnscheduled) => {
      await qc.invalidateQueries({ queryKey: ['manager'] });
      setResult({ kind: acceptUnscheduled || flags.length > 0 ? 'flagged' : 'ok', at: formatTime(new Date()), entry });
      setStep(4);
    },
    onError: (e) => {
      if (e instanceof AppError && e.code === 'UNSCHEDULED') {
        setResult({ kind: 'unscheduled', at: formatTime(new Date()) });
        return setStep(4);
      }
      toast.show(e instanceof AppError && e.code === 'VALIDATION' ? t('manager.outsideBoundary') : t('common.genericError'));
    },
  });

  const submit = async (anyway = false) => {
    if (online) return run.mutate(anyway);
    // Offline: only the photo-verified path can be queued (see QueuedProxy).
    if (!photo || !target) return toast.show(t('manager.pinOffline'));
    const f = fix ?? (await captureFix());
    enqueueProxy({
      id: Crypto.randomUUID(),
      employeeName: target.name,
      input: {
        siteId,
        employeeId,
        badgeToken,
        photoUri: photo,
        note: note.trim() || undefined,
        type,
        acceptUnscheduled: anyway,
        managerPosition: { lat: f.lat, lng: f.lng, accuracyM: f.accuracyM, mocked: f.mocked, capturedAt: f.capturedAt.toISOString() },
      },
    });
    setResult({ kind: 'offline', at: formatTime(f.capturedAt) });
    setStep(4);
  };

  // Scanner overlay
  if (scanning) {
    return (
      <Screen dark edges={{ bottom: true }}>
        <QrStep title={t('manager.scanBadgeTitle')} help={t('manager.scanBadgeHelp')} onScanned={(p) => void scanned(p)} onCancel={() => setScanning(false)} />
      </Screen>
    );
  }

  const name = target?.name ?? '';
  const first = name.split(' ')[0] ?? '';
  const managerName = manager?.name ?? '';
  const titles = [t('manager.stepSelect'), t('manager.stepVerify'), t('manager.stepLocation'), out ? t('manager.stepConfirmOut') : t('manager.stepConfirmIn')];

  // Result screens
  if (step === 4 && result) {
    const done = result.kind !== 'unscheduled';
    return (
      <Screen
        scroll={false}
        footer={
          done ? (
            <>
              <Button large label={out ? t('manager.anotherOut') : t('manager.anotherIn')} onPress={reset} />
              <Button variant="outlinePrimary" label={t('manager.backRoster')} onPress={() => router.back()} />
            </>
          ) : (
            <>
              <Button large variant="primary" label={out ? t('manager.anywayOut') : t('manager.anywayIn')} loading={run.isPending} onPress={() => void submit(true)} />
              <Button variant="outlinePrimary" label={t('common.cancel')} onPress={reset} />
            </>
          )
        }>
        {result.kind === 'offline' ? (
          <ResultView
            tone="warning"
            size={84}
            icon="cloud-outline"
            title={t('manager.savedOfflineTitle')}
            body={t(out ? 'manager.savedOfflineBodyOut' : 'manager.savedOfflineBodyIn', { name, time: result.at })}
          />
        ) : result.kind === 'ok' ? (
          <ResultView
            tone="success"
            size={84}
            icon="checkmark"
            title={t(out ? 'manager.resultOutTitle' : 'manager.resultInTitle', { time: result.at })}
            body={t(out ? 'manager.resultBodyOut' : 'manager.resultBodyIn', { employee: name, site: site?.name ?? '', name: managerName })}
          />
        ) : result.kind === 'flagged' ? (
          <ResultView
            tone="warning"
            size={84}
            icon="flag"
            title={t(out ? 'manager.flaggedSavedOut' : 'manager.flaggedSavedIn')}
            body={t('manager.flaggedSavedBody', { name })}
          />
        ) : (
          <ResultView tone="danger" size={84} icon="alert" title={t('manager.notSchedTitle')} body={t('manager.notSchedBody', { name, site: site?.name ?? '' })} />
        )}
      </Screen>
    );
  }

  const people = roster
    .filter((r) => (out ? !!r.checkInAt && !r.checkOutAt : !r.checkInAt && r.status !== 'on_leave'))
    .filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()));

  const back = () => (step === 0 ? router.back() : setStep(step - 1));

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.head}>
        <RoundButton icon="arrow-back" label={t('common.back')} onPress={back} />
        <View style={styles.flex}>
          <Stepper step={step + 1} total={4} title={titles[step]} />
        </View>
      </View>

      {step === 0 ? (
        <>
          <Button large icon="qr-code-outline" label={t('manager.scanBadge')} onPress={() => setScanning(true)} style={styles.scan} />
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
          </View>
          <Text variant="small" tone="muted" style={styles.listLabel}>
            {out ? t('manager.listCheckedIn') : t('manager.listNotCheckedIn')}
          </Text>
          {people.map((p) => (
            <Pressable
              key={p.employeeId}
              accessibilityRole="button"
              onPress={() => pick(p.employeeId)}
              style={[styles.person, { backgroundColor: colors.card, borderColor: colors.line }]}>
              <Avatar name={p.name} />
              <View style={styles.flex}>
                <Text variant="subheading" style={styles.personName}>
                  {p.name}
                </Text>
                <Text variant="small" tone="muted" style={styles.regular}>
                  {out ? t('manager.inSince', { time: p.checkInAt ?? '' }) : p.scheduled.start ? t('manager.scheduledAt', { time: p.scheduled.start }) : t('manager.notScheduledHere')}
                </Text>
              </View>
              <Icon name="chevron-forward" size={20} tone="primary" />
            </Pressable>
          ))}
          {people.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.fieldBorder }]}>
              <Text style={styles.emptyText}>{t('manager.noMatch')}</Text>
            </View>
          ) : null}
        </>
      ) : null}

      {step === 1 ? (
        <>
          <View style={[styles.empCard, { backgroundColor: colors.card, borderColor: colors.line }]}>
            <Avatar name={name} />
            <View style={styles.flex}>
              <Text variant="subheading" style={styles.personName}>
                {name}
              </Text>
              <Text variant="small" tone="muted" style={styles.regular}>
                {t('manager.handPhone', { name: first })}
              </Text>
            </View>
          </View>

          {pinOk ? (
            <View style={[styles.okBanner, { backgroundColor: colors.successBg }]}>
              <Text style={[styles.okText, { color: colors.successFg }]}>{t('manager.pinVerified')}</Text>
            </View>
          ) : (
            <>
              <View style={styles.pinBlock}>
                <Text style={styles.pinLabel}>{t('manager.employeePin')}</Text>
                <View style={styles.dots}>
                  {[0, 1, 2, 3].map((i) => (
                    <View key={i} style={[styles.dot, { borderColor: colors.primary, backgroundColor: i < pin.length ? colors.primary : colors.card }]} />
                  ))}
                </View>
                {pinError ? (
                  <Text accessibilityRole="alert" style={[styles.pinError, { color: colors.dangerFg }]}>
                    {pinError}
                  </Text>
                ) : null}
              </View>
              <View style={styles.keys}>
                {KEYS.map((k, i) =>
                  k === '' ? (
                    <View key={i} style={styles.key} />
                  ) : (
                    <Pressable
                      key={k}
                      accessibilityRole="button"
                      accessibilityLabel={k === 'del' ? t('notifications.delete') : k}
                      disabled={locked}
                      onPress={() => void press(k)}
                      style={[styles.key, styles.keyFace, { backgroundColor: colors.card, borderColor: colors.line, opacity: locked ? 0.4 : 1 }]}>
                      {k === 'del' ? <Icon name="backspace-outline" size={24} /> : <Text style={styles.keyText}>{k}</Text>}
                    </Pressable>
                  ),
                )}
              </View>
            </>
          )}

          <View style={styles.divider}>
            <View style={[styles.rule, { backgroundColor: colors.line }]} />
            <Text variant="small" tone="muted">
              {t('manager.andOr')}
            </Text>
            <View style={[styles.rule, { backgroundColor: colors.line }]} />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => void takePhoto()}
            style={[
              styles.photoBtn,
              photo
                ? { backgroundColor: colors.successBg, borderColor: colors.successFg, borderWidth: 2 }
                : { backgroundColor: colors.card, borderColor: colors.primary, borderWidth: 1.5 },
            ]}>
            <Icon name={photo ? 'checkmark' : 'camera-outline'} size={20} tone={photo ? 'successFg' : 'primary'} />
            <Text style={[styles.photoLabel, { color: photo ? colors.successFg : colors.primary }]}>{photo ? t('manager.photoTaken') : t('manager.takePhoto')}</Text>
          </Pressable>

          <Button large label={t('common.continue')} disabled={!verified} onPress={() => setStep(2)} />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <View
            style={[
              styles.locCard,
              { backgroundColor: colors.card, borderColor: checking ? colors.line : inside ? colors.successBorder : colors.dangerBorder },
            ]}>
            <View style={[styles.locIcon, { backgroundColor: checking ? colors.infoBg : inside ? colors.successBg : colors.dangerBg }]}>
              {checking ? <ActivityIndicator color={colors.primary} /> : <Icon name={inside ? 'checkmark' : 'locate'} size={30} tone={inside ? 'successFg' : 'dangerFg'} />}
            </View>
            <Text variant="heading">{checking ? t('manager.checkingLocation') : inside ? t('manager.insideZone') : t('manager.outsideZone')}</Text>
            <Text tone="muted" style={styles.center}>
              {checking
                ? t('manager.checkingLocationSub')
                : inside
                  ? t('manager.insideDetail', { site: site?.name ?? '', d: distance ?? 0, a: Math.round(fix?.accuracyM ?? 0) })
                  : t('manager.outsideDetail', { site: site?.name ?? '', d: distance ?? 0, what: out ? t('manager.whatCheckOut') : t('manager.whatCheckIn') })}
            </Text>
          </View>
          <Text variant="small" tone="muted" style={styles.regular}>
            {t('manager.phoneLocationNote')}
          </Text>
          {!checking && !inside ? <Button variant="outlinePrimary" label={t('manager.checkAgain')} onPress={() => void locate()} /> : null}
          <Button large label={t('common.continue')} disabled={!inside || checking} onPress={() => setStep(3)} />
        </>
      ) : null}

      {step === 3 ? (
        <>
          <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.line }]}>
            <View style={styles.sumHead}>
              <Avatar name={name} size={52} />
              <Text variant="heading">{name}</Text>
            </View>
            {(
              [
                [t('manager.sumSite'), site?.name ?? ''],
                [t('manager.sumTime'), formatTime(new Date())],
                [t('manager.sumVerified'), [pinOk ? t('manager.verifiedPin') : '', photo ? t('manager.verifiedPhoto') : ''].filter(Boolean).join(' + ')],
                [t('manager.sumLocation'), t('manager.insideSiteZone')],
              ] as [string, string][]
            ).map(([k, v]) => (
              <View key={k} style={styles.sumRow}>
                <Text tone="muted" style={styles.sumText}>
                  {k}
                </Text>
                <Text style={[styles.sumText, styles.sumValue]}>{v}</Text>
              </View>
            ))}
            <View style={[styles.proxyBy, { backgroundColor: colors.infoBg }]}>
              <Text variant="caption" tone="infoFg" style={styles.proxyByText}>
                {t(out ? 'manager.proxyByOut' : 'manager.proxyByIn', { name: managerName })}
              </Text>
            </View>
          </View>
          <View style={styles.noteBlock}>
            <Text variant="caption" style={styles.noteLabel}>
              {t('manager.noteOptional')}
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={300}
              placeholder={t('manager.notePlaceholder')}
              placeholderTextColor={colors.muted}
              accessibilityLabel={t('manager.noteOptional')}
              style={[styles.note, { backgroundColor: colors.card, borderColor: colors.fieldBorder, color: colors.ink }]}
            />
          </View>
          <Button large label={out ? t('manager.confirmOut') : t('manager.confirmIn')} loading={run.isPending} onPress={() => void submit(false)} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  regular: { fontWeight: '400' },
  content: { gap: 12 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  scan: { minHeight: 56, borderRadius: radius.button },
  search: { minHeight: 48, borderRadius: radius.field, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: 16, minHeight: 44 },
  listLabel: { fontWeight: '700' },
  person: { minHeight: 64, borderRadius: radius.button, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: 14 },
  personName: { fontWeight: '800' },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.lg, padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 15, fontWeight: '700' },
  empCard: { borderWidth: 1, borderRadius: radius.button, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 10, paddingHorizontal: 14 },
  okBanner: { borderRadius: radius.button, padding: 14, alignItems: 'center' },
  okText: { fontSize: 16, fontWeight: '800' },
  pinBlock: { alignItems: 'center', gap: spacing.sm },
  pinLabel: { fontSize: 15, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 14, minHeight: 28, alignItems: 'center' },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  pinError: { fontSize: 14, fontWeight: '800', textAlign: 'center', lineHeight: 19 },
  keys: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  key: { width: '31.5%', flexGrow: 1, minHeight: 56 },
  keyFace: { borderRadius: radius.button, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontSize: 24, fontWeight: '800' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rule: { flex: 1, height: 1 },
  photoBtn: { minHeight: 56, borderRadius: radius.button, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  photoLabel: { fontSize: 16, fontWeight: '800' },
  locCard: { borderWidth: 1, borderRadius: radius.lg, paddingVertical: 22, paddingHorizontal: 18, alignItems: 'center', gap: spacing.sm },
  locIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  summary: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: 12 },
  sumHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  sumText: { fontSize: 15 },
  sumValue: { fontWeight: '800', textAlign: 'right', flexShrink: 1 },
  proxyBy: { borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: spacing.md },
  proxyByText: { fontWeight: '800' },
  noteBlock: { gap: 6 },
  noteLabel: { fontWeight: '800' },
  note: { minHeight: 76, borderRadius: radius.field, borderWidth: 1, padding: spacing.md, fontSize: 16, textAlignVertical: 'top' },
});

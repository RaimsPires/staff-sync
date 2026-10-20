import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { captureFix } from '@/core/location/use-site-proximity';
import { useSession } from '@/core/session/session-store';
import { spacing } from '@/core/theme/tokens';
import { AppError, repos, type RosterEntry } from '@/data';
import { qk } from '@/data/query-keys';
import { isInsideGeofence } from '@/domain';
import { CodeInput } from '@/features/auth/otp-input';
import { pinSchema } from '@/features/auth/schemas';
import { QrStep } from '@/features/attendance/check-flow/camera-steps';
import { Button, Card, Icon, Pill, Screen, Text, TextField } from '@/ui';

import { useRoster } from './queries';

type Params = { type?: 'check_in' | 'check_out'; employeeId?: string; scan?: string; siteId?: string };

export function ProxyScreen() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const manager = useSession((s) => s.user);
  const params = useLocalSearchParams<Params>();
  const type = params.type ?? 'check_in';
  const siteId = params.siteId ?? 'site-a';

  const { data: roster = [] } = useRoster(siteId);
  const { data: today = [] } = useQuery({ queryKey: qk.assignmentsToday, queryFn: () => repos.schedule.getToday() });
  const site = today[0]?.site;

  const [employeeId, setEmployeeId] = useState<string | undefined>(params.employeeId);
  const [badgeToken, setBadgeToken] = useState<string>();
  const [scanning, setScanning] = useState(params.scan === '1');
  const [pin, setPin] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string>();
  const [done, setDone] = useState<RosterEntry>();

  const target = roster.find((r) => r.employeeId === employeeId);

  const run = useMutation({
    mutationFn: async () => {
      const fix = await captureFix();
      if (site && !isInsideGeofence(fix, site.geofence)) throw new AppError('VALIDATION');
      return repos.manager.proxyCheck({
        employeeId,
        badgeToken,
        pin,
        note: note.trim() || undefined,
        type,
        managerPosition: { lat: fix.lat, lng: fix.lng, accuracyM: fix.accuracyM, mocked: fix.mocked, capturedAt: fix.capturedAt.toISOString() },
      });
    },
    onSuccess: async ({ entry }) => {
      await qc.invalidateQueries({ queryKey: ['manager'] });
      setDone(entry);
    },
    onError: (e) => {
      setPin('');
      if (e instanceof AppError && e.code === 'PIN_INVALID') setError(t('manager.pinWrong', { left: e.meta?.attemptsLeft ?? 0 }));
      else if (e instanceof AppError && e.code === 'PIN_LOCKED') setError(t('manager.pinLocked'));
      else if (e instanceof AppError && e.code === 'VALIDATION') setError(t('manager.outsideBoundary'));
      else if (e instanceof AppError && e.code === 'NOT_FOUND') setError(t('manager.notFound'));
      else setError(t('common.genericError'));
    },
  });

  const scanned = async (payload: string) => {
    setScanning(false);
    try {
      const entry = await repos.manager.findByBadge(payload);
      setBadgeToken(payload);
      setEmployeeId(entry.employeeId);
    } catch {
      setError(t('manager.notFound'));
    }
  };

  const title = type === 'check_in' ? t('manager.proxyTitle') : t('manager.proxyOutTitle');

  if (done) {
    return (
      <Screen footer={<Button label={t('common.done')} onPress={() => router.back()} />}>
        <View style={styles.center}>
          <Icon name="checkmark-circle" size={64} tone="success" />
          <Text variant="title" style={styles.centerText}>{done.name}</Text>
          <Pill tone="success" label={t('manager.proxyDone', { name: manager?.name ?? '' })} />
        </View>
      </Screen>
    );
  }

  if (scanning) {
    return (
      <Screen footer={<Button variant="ghost" label={t('common.cancel')} onPress={() => setScanning(false)} />}>
        <QrStep onScanned={(p) => void scanned(p)} />
      </Screen>
    );
  }

  const ready = !!employeeId && pinSchema.safeParse(pin).success;

  return (
    <Screen footer={<Button label={t('manager.proxyConfirm')} disabled={!ready} loading={run.isPending} onPress={() => { setError(undefined); run.mutate(); }} />}>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
          <Icon name="chevron-back" />
        </Pressable>
        <Text variant="title" style={styles.flex}>{title}</Text>
      </View>

      {target ? (
        <Card style={styles.row}>
          <Icon name="person-circle-outline" size={28} tone="primary" />
          <Text variant="subheading" style={styles.flex}>{target.name}</Text>
        </Card>
      ) : (
        <Card>
          <Text variant="subheading">{t('manager.selectEmployee')}</Text>
          {roster.filter((r) => type === 'check_in' ? !r.checkInAt && r.status !== 'on_leave' : !!r.checkInAt && !r.checkOutAt).map((r) => (
            <Button key={r.employeeId} variant="secondary" label={r.name} onPress={() => setEmployeeId(r.employeeId)} />
          ))}
          <Button variant="ghost" icon="qr-code-outline" label={t('manager.scanBadge')} onPress={() => setScanning(true)} />
        </Card>
      )}

      <Text tone="muted">{t('manager.enterPin')}</Text>
      <CodeInput label={t('manager.enterPin')} value={pin} onChange={setPin} length={4} secure error={!!error} autoFocus={false} />
      {error ? <Text tone="danger" accessibilityRole="alert" style={styles.centerText}>{error}</Text> : null}

      <TextField label={t('manager.noteOptional')} placeholder={t('manager.notePlaceholder')} value={note} onChangeText={setNote} maxLength={300} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xxxl },
  centerText: { textAlign: 'center' },
});

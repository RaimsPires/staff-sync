import { useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useCallback, useEffect, useState } from 'react';

import { captureFix, type Fix } from '@/core/location/use-site-proximity';
import { useOnline } from '@/core/network/use-online';
import { AppError, repos, type CheckEvent, type CheckResult } from '@/data';
import { useOfflineQueue } from '@/data/offline-queue';
import { collectFlags, evaluateCheckOut, type Assignment, type Flag, type VerificationMethod } from '@/domain';

export type FlowMode = 'check_in' | 'check_out';

export type FlowStep =
  | { name: 'locating' }
  | { name: 'location_failed' }
  | { name: 'confirm' }
  | { name: 'verify'; method: VerificationMethod }
  | { name: 'submitting' }
  | { name: 'done'; result: CheckResult }
  | { name: 'queued' }
  | { name: 'already_done' }
  | { name: 'error' };

type Evidence = { selfieUri?: string; qrPayload?: string };

/** State machine behind the check-in / check-out screens. */
export function useCheckFlow(assignment: Assignment | undefined, mode: FlowMode) {
  const qc = useQueryClient();
  const online = useOnline();
  const enqueue = useOfflineQueue((s) => s.enqueue);

  const [step, setStep] = useState<FlowStep>({ name: 'locating' });
  const [fix, setFix] = useState<Fix>();
  const [note, setNote] = useState('');
  const [evidence, setEvidence] = useState<Evidence>({});

  const locate = useCallback(async () => {
    setStep({ name: 'locating' });
    try {
      setFix(await captureFix());
      setStep({ name: 'confirm' });
    } catch {
      setStep({ name: 'location_failed' });
    }
  }, []);

  useEffect(() => {
    void locate();
  }, [locate]);

  const previewFlags: Flag[] =
    assignment && fix
      ? collectFlags({ site: assignment.site, deviceRegistered: true, scheduled: true, position: fix })
      : [];

  const earlyByMinutes =
    mode === 'check_out' && assignment && fix
      ? evaluateCheckOut(assignment, new Date()).earlyByMinutes
      : 0;

  const submit = useCallback(
    async (ev: Evidence) => {
      if (!assignment || !fix) return;
      setStep({ name: 'submitting' });
      const event: CheckEvent = {
        clientEventId: Crypto.randomUUID(),
        type: mode,
        assignmentId: assignment.id,
        position: { lat: fix.lat, lng: fix.lng, accuracyM: fix.accuracyM, mocked: fix.mocked, capturedAt: fix.capturedAt.toISOString() },
        method: ev.qrPayload ? 'qr' : 'self',
        selfieUri: ev.selfieUri,
        qrPayload: ev.qrPayload,
        note: note.trim() || undefined,
      };

      if (!online) {
        enqueue(event);
        setStep({ name: 'queued' });
        return;
      }

      try {
        const result = mode === 'check_in' ? await repos.attendance.checkIn(event) : await repos.attendance.checkOut(event);
        await qc.invalidateQueries({ queryKey: ['attendance'] });
        await qc.invalidateQueries({ queryKey: ['assignments'] });
        setStep({ name: 'done', result });
      } catch (e) {
        setStep(e instanceof AppError && e.code === 'CONFLICT' ? { name: 'already_done' } : { name: 'error' });
      }
    },
    [assignment, fix, mode, note, online, enqueue, qc],
  );

  /** Moves from confirmation to the first required verification, or submits directly. */
  const confirm = useCallback(() => {
    const required = assignment?.site.requires ?? [];
    if (required.length > 0) setStep({ name: 'verify', method: required[0] });
    else void submit({});
  }, [assignment, submit]);

  const verified = useCallback(
    (method: VerificationMethod, value: string) => {
      const next: Evidence = { ...evidence, ...(method === 'selfie' ? { selfieUri: value } : { qrPayload: value }) };
      setEvidence(next);
      const required = assignment?.site.requires ?? [];
      const following = required[required.indexOf(method) + 1];
      if (following) setStep({ name: 'verify', method: following });
      else void submit(next);
    },
    [assignment, evidence, submit],
  );

  return { step, fix, note, setNote, previewFlags, earlyByMinutes, confirm, verified, retry: locate };
}

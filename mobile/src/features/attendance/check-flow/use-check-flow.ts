import { useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useCallback, useEffect, useState } from 'react';

import { captureFix, type Fix } from '@/core/location/use-site-proximity';
import { useOnline } from '@/core/network/use-online';
import { AppError, repos, type CheckEvent, type CheckResult } from '@/data';
import { useOfflineQueue } from '@/data/offline-queue';
import { collectFlags, evaluateCheckOut, isInsideGeofence, resolveGate, toIsoDate, type Assignment, type Flag, type VerificationMethod } from '@/domain';

export type FlowMode = 'check_in' | 'check_out';

export type FlowStep =
  | { name: 'locating' }
  | { name: 'location_failed' }
  | { name: 'mock_location' }
  | { name: 'device_unregistered' }
  | { name: 'not_scheduled' }
  | { name: 'not_at_site' }
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
  const [otherSite, setOtherSite] = useState<string>();
  // Gates the user has knowingly passed ("check in anyway" / "check out anyway").
  const [acceptUnscheduled, setAcceptUnscheduled] = useState(false);
  const [acceptOutside, setAcceptOutside] = useState(false);
  const scheduledHere = !!assignment && assignment.date === toIsoDate(new Date());

  /** Picks the first blocking screen for a fix; `confirm` when nothing blocks. */
  const gate = useCallback(
    (f: Fix, ctx: { registered: boolean; unscheduledOk: boolean; outsideOk: boolean }): FlowStep => {
      if (!assignment) return { name: 'confirm' };
      return {
        name: resolveGate({
          mocked: f.mocked,
          deviceRegistered: ctx.registered,
          scheduledHere,
          insideGeofence: isInsideGeofence(f, assignment.site.geofence),
          mode,
          unscheduledOk: ctx.unscheduledOk,
          outsideOk: ctx.outsideOk,
        }),
      };
    },
    [assignment, mode, scheduledHere],
  );

  const [registered, setRegistered] = useState(true);

  const locate = useCallback(async () => {
    setStep({ name: 'locating' });
    try {
      const [f, isRegistered, today] = await Promise.all([captureFix(), repos.profile.isDeviceRegistered(), repos.schedule.getToday()]);
      setFix(f);
      setRegistered(isRegistered);
      setOtherSite(today.find((a) => a.site.id !== assignment?.site.id)?.site.name);
      setStep(gate(f, { registered: isRegistered, unscheduledOk: acceptUnscheduled, outsideOk: acceptOutside }));
    } catch {
      setStep({ name: 'location_failed' });
    }
  }, [assignment?.site.id, gate, acceptUnscheduled, acceptOutside]);

  useEffect(() => {
    if (assignment && step.name === 'locating' && !fix) void locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment]);

  /** "Check in / out anyway": passes the current gate and re-evaluates the next one. */
  const acknowledge = useCallback(() => {
    if (!fix) return;
    const unscheduledOk = acceptUnscheduled || step.name === 'not_scheduled';
    const outsideOk = acceptOutside || step.name === 'not_at_site';
    setAcceptUnscheduled(unscheduledOk);
    setAcceptOutside(outsideOk);
    setStep(gate(fix, { registered, unscheduledOk, outsideOk }));
  }, [fix, step.name, acceptUnscheduled, acceptOutside, gate, registered]);

  const previewFlags: Flag[] =
    assignment && fix
      ? collectFlags({ site: assignment.site, deviceRegistered: registered, scheduled: scheduledHere || acceptUnscheduled, position: fix })
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
        acceptUnscheduled: acceptUnscheduled || undefined,
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
    [assignment, fix, mode, note, online, enqueue, qc, acceptUnscheduled],
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

  return { step, fix, note, setNote, previewFlags, earlyByMinutes, confirm, verified, retry: locate, acknowledge, otherSite };
}

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { useOnline } from '@/core/network/use-online';
import { repos } from '@/data';
import { USE_MOCK } from '@/data/http/client';
import { subscribeLive } from '@/data/http/realtime';
import { qk } from '@/data/query-keys';

export function useManagerSites() {
  const query = useQuery({ queryKey: qk.managerSites, queryFn: () => repos.manager.getSites() });
  const [selected, setSelected] = useState<string>();
  const sites = query.data ?? [];
  const siteId = selected ?? sites[0]?.id ?? '';
  return { sites, siteId, setSiteId: setSelected };
}

/**
 * Refresh the manager's data when the server pushes a check-in, check-out, flag or leave change.
 * Returns whether the socket is up, so callers can poll only while it is not.
 */
export function useManagerLive(enabled = true): boolean {
  const qc = useQueryClient();
  const online = useOnline();
  const [up, setUp] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!enabled || !online || USE_MOCK) return;
    const stop = subscribeLive({
      onMessage: () => {
        clearTimeout(debounce.current);
        debounce.current = setTimeout(() => void qc.invalidateQueries({ queryKey: ['manager'] }), 300);
      },
      onState: (state) => {
        setUp(state);
        if (state) void qc.invalidateQueries({ queryKey: ['manager'] }); // catch up on anything missed while disconnected
      },
    });
    return () => {
      clearTimeout(debounce.current);
      stop();
      setUp(false);
    };
  }, [enabled, online, qc]);

  return up;
}

export const useManagerSummary = (siteId: string) => {
  useManagerLive();
  return useQuery({ queryKey: qk.managerSummary(siteId), queryFn: () => repos.manager.getSummary(siteId), enabled: !!siteId });
};

/** Live roster: pushed by the server over the WebSocket, polled every 9 s only while that is down. */
export const useRoster = (siteId: string, live = false) => {
  const online = useOnline();
  const up = useManagerLive(live);
  return useQuery({
    queryKey: qk.managerRoster(siteId),
    queryFn: () => repos.manager.getRoster(siteId),
    enabled: !!siteId,
    refetchInterval: live && online && !up ? 9000 : false,
  });
};

export const useLeaveInbox = (siteId: string) =>
  useQuery({ queryKey: qk.managerLeave(siteId), queryFn: () => repos.manager.leaveInbox(siteId), enabled: !!siteId });

export const useEmployeeShifts = (employeeId: string | undefined, start: string | undefined, end: string | undefined) =>
  useQuery({
    queryKey: ['manager', 'shifts', employeeId, start, end],
    queryFn: () => repos.manager.employeeShifts(employeeId as string, start as string, end as string),
    enabled: !!employeeId && !!start && !!end,
  });

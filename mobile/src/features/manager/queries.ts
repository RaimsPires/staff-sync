import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { useOnline } from '@/core/network/use-online';
import { repos } from '@/data';
import { qk } from '@/data/query-keys';

export function useManagerSites() {
  const query = useQuery({ queryKey: qk.managerSites, queryFn: () => repos.manager.getSites() });
  const [selected, setSelected] = useState<string>();
  const sites = query.data ?? [];
  const siteId = selected ?? sites[0]?.id ?? '';
  return { sites, siteId, setSiteId: setSelected };
}

export const useManagerSummary = (siteId: string) =>
  useQuery({ queryKey: qk.managerSummary(siteId), queryFn: () => repos.manager.getSummary(siteId), enabled: !!siteId });

/** Refreshes every 9 s while online (the "Live" indicator on the roster). */
export const useRoster = (siteId: string, live = false) => {
  const online = useOnline();
  return useQuery({
    queryKey: qk.managerRoster(siteId),
    queryFn: () => repos.manager.getRoster(siteId),
    enabled: !!siteId,
    refetchInterval: live && online ? 9000 : false,
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

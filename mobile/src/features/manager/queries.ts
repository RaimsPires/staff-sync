import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

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

export const useRoster = (siteId: string) =>
  useQuery({ queryKey: qk.managerRoster(siteId), queryFn: () => repos.manager.getRoster(siteId), enabled: !!siteId });

export const useLeaveInbox = (siteId: string) =>
  useQuery({ queryKey: qk.managerLeave(siteId), queryFn: () => repos.manager.leaveInbox(siteId), enabled: !!siteId });

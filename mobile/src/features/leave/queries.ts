import { useQuery } from '@tanstack/react-query';

import { repos } from '@/data';
import { qk } from '@/data/query-keys';

export const useLeaveTypes = () => useQuery({ queryKey: qk.leaveTypes, queryFn: () => repos.leave.getTypes() });
export const useLeaveBalances = () =>
  useQuery({ queryKey: qk.leaveBalances, queryFn: () => repos.leave.getBalances(new Date().getFullYear()) });
export const useLeaveRequests = () => useQuery({ queryKey: qk.leaveList, queryFn: () => repos.leave.list() });
export const useLeaveRequest = (id: string) => useQuery({ queryKey: qk.leave(id), queryFn: () => repos.leave.get(id) });

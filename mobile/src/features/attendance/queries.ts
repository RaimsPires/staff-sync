import { useQuery } from '@tanstack/react-query';

import { repos } from '@/data';
import { qk } from '@/data/query-keys';

export const useMonthAttendance = (month: string) =>
  useQuery({ queryKey: qk.attendanceMonth(month), queryFn: () => repos.attendance.getMonth(month) });

export const useAttendanceRecord = (id: string) =>
  useQuery({ queryKey: qk.attendanceRecord(id), queryFn: () => repos.attendance.getRecord(id) });

export const useCorrections = (recordId: string) =>
  useQuery({ queryKey: ['attendance', 'corrections', recordId], queryFn: () => repos.attendance.listCorrections(recordId) });

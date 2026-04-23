import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface AutoSchedule {
  title: string;
  schedule: string[];
  daysOfWeek?: number[];
  excludeDates?: string[];
}

interface ListResponse { schedules: AutoSchedule[] }

export function usePostingSchedule() {
  return useQuery({
    queryKey: ['settings-posting-schedule'],
    queryFn: async () => {
      const res = await apiFetch<ListResponse>('/settings/posting-schedule');
      return res.schedules ?? [];
    },
    staleTime: 60 * 1000,
  });
}

export function useSavePostingSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AutoSchedule) =>
      apiFetch('/settings/posting-schedule', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings-posting-schedule'] }),
  });
}

export function useDeletePostingSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) =>
      apiFetch('/settings/posting-schedule', { method: 'DELETE', body: JSON.stringify({ title }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings-posting-schedule'] }),
  });
}

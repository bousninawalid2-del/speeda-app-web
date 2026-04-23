import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface DmAutoResponse {
  autoResponseActive: boolean;
  autoResponseMessage?: string;
  autoResponseWaitSeconds?: number;
}

export function useDmAutoResponse() {
  return useQuery({
    queryKey: ['settings-dm-auto-response'],
    queryFn: () => apiFetch<DmAutoResponse>('/settings/dm-auto-response'),
    staleTime: 60 * 1000,
  });
}

export function useSaveDmAutoResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DmAutoResponse) =>
      apiFetch<DmAutoResponse>('/settings/dm-auto-response', { method: 'PUT', body: JSON.stringify(input) }),
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: ['settings-dm-auto-response'] });
      const prev = qc.getQueryData<DmAutoResponse>(['settings-dm-auto-response']);
      qc.setQueryData(['settings-dm-auto-response'], next);
      return { prev };
    },
    onError: (_err, _next, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(['settings-dm-auto-response'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['settings-dm-auto-response'] }),
  });
}

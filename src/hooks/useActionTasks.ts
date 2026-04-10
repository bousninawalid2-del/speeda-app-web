import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { actionTasksApi, ActionTask, UpdateActionTaskInput } from '@/lib/api-client';

const FALLBACK_TASKS: ActionTask[] = [
  {
    id: '1',
    userId: '',
    strategyId: null,
    title: 'Create 3 Instagram posts this week',
    description: 'Focus on product showcase',
    platform: 'instagram',
    status: 'pending',
    priority: 'high',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    userId: '',
    strategyId: null,
    title: 'Reply to all Google reviews',
    description: null,
    platform: null,
    status: 'in_progress',
    priority: 'medium',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    userId: '',
    strategyId: null,
    title: 'Launch Ramadan campaign',
    description: 'Prepare visuals and copy',
    platform: 'facebook',
    status: 'pending',
    priority: 'high',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function useActionTasks() {
  return useQuery({
    queryKey: ['action-tasks'],
    queryFn: async () => {
      try {
        return await actionTasksApi.list();
      } catch {
        return FALLBACK_TASKS;
      }
    },
    staleTime: 60 * 1000,
  });
}

export function useUpdateActionTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateActionTaskInput }) =>
      actionTasksApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['action-tasks'] }),
  });
}

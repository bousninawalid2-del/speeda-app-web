import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface ActionTask {
  id:          string;
  userId:      string;
  strategyId?: string | null;
  title:       string;
  description?: string | null;
  platform?:   string | null;
  dueDate?:    string | null;
  status:      string;
  priority:    string;
  createdAt:   string;
  updatedAt:   string;
}

const FALLBACK_TASKS: ActionTask[] = [
  {
    id: 'fallback-1',
    userId: 'fallback',
    title: 'Post Shawarma Reel during peak hour',
    description: 'Your audience is most active at 8 PM tonight. Publishing now could reach 4,200+ people.',
    platform: 'instagram',
    dueDate: new Date().toISOString(),
    status: 'pending',
    priority: 'critical',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fallback-2',
    userId: 'fallback',
    title: 'Respond to negative review from Sara M.',
    description: 'A 1-star Google review was posted 2 hours ago. Quick response can recover the customer.',
    platform: 'google',
    dueDate: new Date().toISOString(),
    status: 'pending',
    priority: 'critical',
    createdAt: new Date(Date.now() - 3_600_000).toISOString(),
    updatedAt: new Date(Date.now() - 3_600_000).toISOString(),
  },
  {
    id: 'fallback-3',
    userId: 'fallback',
    title: 'Boost your Weekend Brunch post',
    description: 'This post has 3x your average engagement. Boosting it for SAR 150 could reach 50K people.',
    platform: 'facebook',
    dueDate: new Date(Date.now() + 86_400_000).toISOString(),
    status: 'pending',
    priority: 'high',
    createdAt: new Date(Date.now() - 7_200_000).toISOString(),
    updatedAt: new Date(Date.now() - 7_200_000).toISOString(),
  },
  {
    id: 'fallback-4',
    userId: 'fallback',
    title: 'Schedule 3 posts for the weekend',
    description: "I've generated 3 posts for Friday-Saturday. They're in your approval queue.",
    platform: null,
    dueDate: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    status: 'pending',
    priority: 'high',
    createdAt: new Date(Date.now() - 10_800_000).toISOString(),
    updatedAt: new Date(Date.now() - 10_800_000).toISOString(),
  },
  {
    id: 'fallback-5',
    userId: 'fallback',
    title: 'Increase Instagram ad budget by 20%',
    description: 'Your Instagram campaign has 2.8x ROAS. Increasing budget could generate more conversions.',
    platform: 'instagram',
    dueDate: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    status: 'pending',
    priority: 'medium',
    createdAt: new Date(Date.now() - 14_400_000).toISOString(),
    updatedAt: new Date(Date.now() - 14_400_000).toISOString(),
  },
];

export function useActionTasks() {
  return useQuery({
    queryKey: ['action-tasks'],
    queryFn:  async () => {
      try {
        const res = await apiFetch<{ tasks: ActionTask[] }>('/action-tasks');
        return res.tasks;
      } catch {
        return FALLBACK_TASKS;
      }
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateActionTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<ActionTask> & { id: string }) =>
      apiFetch<{ task: ActionTask }>(`/action-tasks/${id}`, {
        method: 'PATCH',
        body:   JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-tasks'] });
    },
  });
}

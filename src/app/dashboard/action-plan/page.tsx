'use client';

import { useRouter } from 'next/navigation';
import { ActionPlanScreen } from '@/screens/ActionPlanScreen';
import { resolveScreen } from '@/lib/navigation';
import { useActionTasks, useUpdateActionTask } from '@/hooks/useActionTasks';

export default function Page() {
  const router = useRouter();
  const { data: tasks, isLoading } = useActionTasks();
  const { mutate: updateTask } = useUpdateActionTask();

  const handleMarkDone = (id: string) => {
    updateTask({ id, data: { status: 'completed' } });
  };

  return (
    <ActionPlanScreen
      onBack={() => router.push('/dashboard')}
      onNavigate={(s) => router.push(resolveScreen(s))}
      tasks={tasks}
      isLoading={isLoading}
      onMarkDone={handleMarkDone}
    />
  );
}

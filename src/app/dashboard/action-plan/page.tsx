'use client';
import { useRouter } from 'next/navigation';
import { ActionPlanScreen } from '@/screens/ActionPlanScreen';
import { resolveScreen } from '@/lib/navigation';
import { useActionTasks } from '@/hooks/useActionTasks';

export default function Page() {
  const router = useRouter();
  // Prefetch action tasks so data is cached when needed; screen uses its own mock data until live props are added
  const { data: _tasks, isLoading: _loading } = useActionTasks();

  return <ActionPlanScreen onBack={() => router.push('/dashboard')} onNavigate={(s) => router.push(resolveScreen(s))} />;
}

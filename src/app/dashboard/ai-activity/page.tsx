'use client';
import { useRouter } from 'next/navigation';
import { AIActivityScreen } from '@/screens/AIActivityScreen';
import { useActionTasks } from '@/hooks/useActionTasks';

export default function Page() {
  const router = useRouter();
  // Prefetch action tasks so data is cached when needed; screen uses its own mock data until live props are added
  const { data: _tasks, isLoading: _loading } = useActionTasks();

  return <AIActivityScreen onBack={() => router.push('/dashboard')} />;
}

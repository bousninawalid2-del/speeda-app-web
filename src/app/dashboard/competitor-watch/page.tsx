'use client';
import { useRouter } from 'next/navigation';
import { CompetitorWatchScreen } from '@/screens/CompetitorWatchScreen';
import { resolveScreen } from '@/lib/navigation';
import { useCompetitors } from '@/hooks/useCompetitors';

export default function Page() {
  const router = useRouter();
  // Prefetch competitors so data is cached when needed; screen uses its own mock data until live props are added
  const { data: _competitors, isLoading: _loading } = useCompetitors();

  return <CompetitorWatchScreen onBack={() => router.push('/dashboard')} onNavigate={(s) => router.push(resolveScreen(s))} />;
}

'use client';

import { useRouter } from 'next/navigation';
import { MosScoreScreen } from '@/screens/MosScoreScreen';
import { resolveScreen } from '@/lib/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';

function getTierInfo(score: number): { tierLabel: string; tierColor: string } {
  if (score >= 80) return { tierLabel: 'Elite',      tierColor: 'hsl(var(--brand-teal))' };
  if (score >= 60) return { tierLabel: 'Strong',     tierColor: 'hsl(var(--green))' };
  if (score >= 40) return { tierLabel: 'Growing',    tierColor: 'hsl(var(--brand-blue))' };
  return             { tierLabel: 'Developing', tierColor: 'hsl(var(--orange))' };
}

export default function Page() {
  const router = useRouter();
  const { data: analytics, isLoading } = useAnalytics('7d');

  const liveData = analytics ? {
    score:       analytics.mosScore,
    ...getTierInfo(analytics.mosScore),
    questsDone:  0,
    questsTotal: 5,
    factors:     analytics.factors,
    history:     analytics.scoreHistory,
  } : undefined;

  return (
    <MosScoreScreen
      onBack={() => router.push('/dashboard')}
      onNavigate={(s) => router.push(resolveScreen(s))}
      liveData={liveData}
      isLoading={isLoading}
    />
  );
}

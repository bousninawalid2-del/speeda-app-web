'use client';

import { useRouter } from 'next/navigation';
import { MosScoreScreen } from '@/screens/MosScoreScreen';
import { resolveScreen } from '@/lib/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';

function computeMosScore(analytics: any): { score: number; tierLabel: string; tierColor: string } {
  const kpis = (analytics?.kpis ?? []) as Array<{ label: string; value: string }>;
  const engKpi = kpis.find((k: any) => k.label?.toLowerCase().includes('engagement'));
  const eng = engKpi ? parseFloat(engKpi.value) : 0;
  const score = Math.min(100, Math.max(0, Math.round(eng * 12)));

  let tierLabel = 'Developing', tierColor = 'hsl(var(--orange))';
  if (score >= 80)      { tierLabel = 'Elite';    tierColor = 'hsl(var(--brand-teal))'; }
  else if (score >= 60) { tierLabel = 'Strong';   tierColor = 'hsl(var(--green))'; }
  else if (score >= 40) { tierLabel = 'Growing';  tierColor = 'hsl(var(--brand-blue))'; }

  return { score, tierLabel, tierColor };
}

export default function Page() {
  const router = useRouter();
  const { data: analytics, isLoading } = useAnalytics('30d');

  const mosComputed = analytics ? computeMosScore(analytics) : undefined;
  const liveData = mosComputed ? { ...mosComputed, questsDone: 0, questsTotal: 5 } : undefined;

  return (
    <MosScoreScreen
      onBack={() => router.push('/dashboard')}
      onNavigate={(s) => router.push(resolveScreen(s))}
      liveData={liveData}
      isLoading={isLoading}
    />
  );
}

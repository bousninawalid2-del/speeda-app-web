'use client';

import { useRouter } from 'next/navigation';
import { MosScoreScreen } from '@/screens/MosScoreScreen';
import type { MosScoreData } from '@/screens/MosScoreScreen';
import { resolveScreen } from '@/lib/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';

const FACTOR_WEIGHTS = [25, 20, 20, 15, 20] as const;
const FACTOR_META = [
  { name: 'Posting Consistency', desc: 'How regularly you publish content across platforms' },
  { name: 'Engagement Rate', desc: 'Average engagement across your connected platforms' },
  { name: 'Response Time', desc: 'How quickly you respond to comments and messages' },
  { name: 'Platform Coverage', desc: 'How many platforms you are active on' },
  { name: 'Campaign Performance', desc: 'Performance of your active advertising campaigns' },
] as const;

function getTierInfo(score: number): { tierLabel: string; tierColor: string } {
  if (score >= 80) return { tierLabel: 'Elite',      tierColor: 'hsl(var(--brand-teal))' };
  if (score >= 60) return { tierLabel: 'Strong',     tierColor: 'hsl(var(--green))' };
  if (score >= 40) return { tierLabel: 'Growing',    tierColor: 'hsl(var(--brand-blue))' };
  return             { tierLabel: 'Developing', tierColor: 'hsl(var(--orange))' };
}

function buildWeightedFactors(score: number) {
  return FACTOR_WEIGHTS.map((weight, index) => {
    const points = Math.round((score * weight) / 100);
    const pct = Math.min(100, Math.round((points / weight) * 100));
    return {
      ...FACTOR_META[index],
      weight,
      pct,
      pts: `${points}/${weight}`,
    };
  });
}

export default function Page() {
  const router = useRouter();
  const { data: analytics, isLoading } = useAnalytics('30d');

  const liveData: MosScoreData = {
    score:       analytics?.mosScore ?? 0,
    ...getTierInfo(analytics?.mosScore ?? 0),
    questsDone:  0,
    questsTotal: 5,
    factors:     buildWeightedFactors(analytics?.mosScore ?? 0),
    history:     analytics?.scoreHistory ?? analytics?.chartData ?? [],
  };

  return (
    <MosScoreScreen
      onBack={() => router.push('/dashboard')}
      onNavigate={(s) => router.push(resolveScreen(s))}
      liveData={liveData}
      isLoading={isLoading}
    />
  );
}

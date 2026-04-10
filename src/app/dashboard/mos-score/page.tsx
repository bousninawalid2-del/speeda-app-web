'use client';

import { useRouter } from 'next/navigation';
import { MosScoreScreen, MosScoreData, MosScoreFactor } from '@/screens/MosScoreScreen';
import { resolveScreen } from '@/lib/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';

const FACTOR_DEFS: Array<{ name: string; weight: number; desc: string }> = [
  { name: 'Posting Consistency',  weight: 25, desc: 'How regularly you publish content across platforms' },
  { name: 'Engagement Rate',      weight: 20, desc: 'Average engagement across your connected platforms' },
  { name: 'Response Time',        weight: 20, desc: 'How quickly you respond to comments and messages' },
  { name: 'Platform Coverage',    weight: 15, desc: 'How many platforms you are active on' },
  { name: 'Campaign Performance', weight: 20, desc: 'Performance of your active advertising campaigns' },
];

/** Distribute the total MOS score proportionally across the 5 factors by weight. */
function deriveFactors(score: number): MosScoreFactor[] {
  return FACTOR_DEFS.map((f) => {
    const raw = score * f.weight / 100;
    // Round to 1 decimal place so e.g. 7.5/25 displays cleanly
    const pts = Math.round(raw * 10) / 10;
    // pct drives the bar fill: how much of this factor's max has been achieved
    const pct = Math.round((pts / f.weight) * 100);
    return {
      name:   f.name,
      weight: f.weight,
      pct,
      pts:    `${pts}/${f.weight}`,
      desc:   f.desc,
    };
  });
}

function getTier(score: number): { tierLabel: string; tierColor: string } {
  if (score >= 80) return { tierLabel: 'Elite',      tierColor: 'hsl(var(--brand-teal))' };
  if (score >= 60) return { tierLabel: 'Strong',     tierColor: 'hsl(var(--green))' };
  if (score >= 40) return { tierLabel: 'Growing',    tierColor: 'hsl(var(--brand-blue))' };
  return               { tierLabel: 'Developing', tierColor: 'hsl(var(--orange))' };
}

export default function Page() {
  const router = useRouter();
  const { data: analytics, isLoading } = useAnalytics('30d');

  let liveData: MosScoreData | undefined;
  if (analytics) {
    const score = analytics.mosScore ?? 0;
    const { tierLabel, tierColor } = getTier(score);
    liveData = {
      score,
      tierLabel,
      tierColor,
      questsDone:  0,
      questsTotal: 5,
      factors: deriveFactors(score),
    };
  }

  return (
    <MosScoreScreen
      onBack={() => router.push('/dashboard')}
      onNavigate={(s) => router.push(resolveScreen(s))}
      liveData={liveData}
      isLoading={isLoading}
    />
  );
}

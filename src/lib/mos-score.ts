export const MOS_FACTOR_CONFIG = [
  { name: 'Posting Consistency', weight: 25, desc: 'How regularly you publish content across platforms' },
  { name: 'Engagement Rate', weight: 20, desc: 'Average engagement across your connected platforms' },
  { name: 'Response Time', weight: 20, desc: 'How quickly you respond to comments and messages' },
  { name: 'Platform Coverage', weight: 15, desc: 'How many platforms you are active on' },
  { name: 'Campaign Performance', weight: 20, desc: 'Performance of your active advertising campaigns' },
] as const;
// Gentle trend slope used only when synthesizing fallback history client-side.
const WEEKLY_DECAY_POINTS = 2;

export interface MosFactor {
  name: string;
  weight: number;
  pct: number;
  pts: string;
  desc: string;
}

export function deriveMosFactors(score: number): MosFactor[] {
  const ratio = Math.min(100, Math.max(0, score)) / 100;
  return MOS_FACTOR_CONFIG.map((factor) => {
    const points = factor.weight * ratio;
    return {
      name: factor.name,
      weight: factor.weight,
      pct: Number(((points / factor.weight) * 100).toFixed(1)),
      pts: `${Number(points.toFixed(1))}/${factor.weight}`,
      desc: factor.desc,
    };
  });
}

export function deriveMosHistory(score: number): Array<{ week: string; score: number }> {
  const clamped = Math.min(100, Math.max(0, score));
  return [3, 2, 1, 0].map((offset) => ({
    week: `Week ${4 - offset}`,
    score: Math.max(0, clamped - offset * WEEKLY_DECAY_POINTS),
  }));
}

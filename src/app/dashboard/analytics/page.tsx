'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnalyticsScreen } from '@/screens/AnalyticsScreen';
import { useAnalytics, type AnalyticsPeriod } from '@/hooks/useAnalytics';
import { resolveScreen } from '@/lib/navigation';

export default function Page() {
  const router = useRouter();
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');

  const { data, isLoading } = useAnalytics(period);

  return (
    <AnalyticsScreen
      onNavigate={(s) => router.push(resolveScreen(s))}
      externalData={data ?? undefined}
      isLoading={isLoading}
      onPeriodChange={(p) => setPeriod(p as AnalyticsPeriod)}
    />
  );
}

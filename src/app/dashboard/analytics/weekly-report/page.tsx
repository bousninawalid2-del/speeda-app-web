'use client';

import { useRouter } from 'next/navigation';
import { WeeklyReportScreen } from '@/screens/WeeklyReportScreen';
import { resolveScreen } from '@/lib/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useProfile } from '@/hooks/useProfile';

export default function Page() {
  const router = useRouter();
  const { data: analytics, isLoading } = useAnalytics('7d');
  const { data: profile } = useProfile();

  const businessName = (profile as any)?.activity?.business_name ?? (profile as any)?.name ?? 'My Business';
  const kpis         = (analytics as any)?.kpis ?? [];

  const liveData = analytics ? { businessName, dateRange: 'Last 7 days', metrics: kpis } : undefined;

  return (
    <WeeklyReportScreen
      onBack={() => router.push('/dashboard/analytics')}
      onNavigate={(s) => router.push(resolveScreen(s))}
      liveData={liveData}
      isLoading={isLoading}
    />
  );
}

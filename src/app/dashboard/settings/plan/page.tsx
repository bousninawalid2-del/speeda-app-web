'use client';

import { useRouter } from 'next/navigation';
import { PlanComparisonScreen } from '@/screens/PlanComparisonScreen';
import { usePlans } from '@/hooks/usePlans';
import { useSubscription, useCreateSubscription } from '@/hooks/useSubscription';

export default function Page() {
  const router = useRouter();
  const { data: plans, isLoading: isLoadingPlans } = usePlans();
  const { data: subscription } = useSubscription();
  const { mutate: createSubscription } = useCreateSubscription();

  const currentPlanName = subscription?.subscription?.plan?.name;

  const handleUpgrade = (planId: string, billingType: 'monthly' | 'yearly') => {
    createSubscription({ planId, billingType });
  };

  return (
    <PlanComparisonScreen
      onBack={() => router.push('/dashboard/settings')}
      plans={plans?.map(p => ({
        ...p,
        features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features,
        locked: typeof p.locked === 'string' ? JSON.parse(p.locked) : p.locked,
      }))}
      isLoadingPlans={isLoadingPlans}
      currentPlanName={currentPlanName}
      onUpgrade={handleUpgrade}
    />
  );
}

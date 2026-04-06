'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { toast } from 'sonner';
import { SubscriptionScreen } from '@/screens/SubscriptionScreen';
import { usePlans } from '@/hooks/usePlans';
import { useSubscription, useCreateSubscription } from '@/hooks/useSubscription';

function SubscriptionContent() {
  const router  = useRouter();
  const params  = useSearchParams();
  const success = params.get('success') === '1';

  const { data: plans,     isLoading: plansLoading }  = usePlans();
  const { data: subData,   isLoading: subLoading }    = useSubscription();
  const { mutateAsync: checkout }                      = useCreateSubscription();

  useEffect(() => {
    if (success) {
      toast.success('Your subscription has been activated!');
      router.replace('/dashboard/subscription');
    }
  }, [success, router]);

  const handleCheckout = async (planId: string, billingType: 'monthly' | 'yearly') => {
    try {
      const { checkoutUrl } = await checkout({ planId, billingType });
      // Redirect to MamoPay hosted checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start checkout');
    }
  };

  return (
    <SubscriptionScreen
      onBack={() => router.back()}
      plans={plans}
      isLoading={plansLoading || subLoading}
      currentPlanName={subData?.subscription?.plan.name ?? null}
      onCheckout={handleCheckout}
    />
  );
}

export default function Page() {
  return <Suspense><SubscriptionContent /></Suspense>;
}

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SubscriptionScreen } from '@/screens/SubscriptionScreen';
import { usePlans } from '@/hooks/usePlans';
import { useSubscription, useCreateSubscription } from '@/hooks/useSubscription';

function SubscriptionContent() {
  const router  = useRouter();
  const params  = useSearchParams();
  const success = params.get('success') === '1';
  const cancelled = params.get('cancelled') === '1';
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  const { data: plans,     isLoading: plansLoading }  = usePlans();
  const { data: subData,   isLoading: subLoading }    = useSubscription();
  const { mutateAsync: checkout }                      = useCreateSubscription();

  useEffect(() => {
    if (success) {
      toast.success('Your subscription has been activated!');
      router.replace('/dashboard/subscription');
    }
    if (cancelled) {
      toast.error('Payment was cancelled.');
      router.replace('/dashboard/subscription');
    }
  }, [success, cancelled, router]);

  const handleCheckout = async (planId: string, billingType: 'monthly' | 'yearly') => {
    setProcessingPlanId(planId);
    try {
      const { checkoutUrl } = await checkout({ planId, billingType });
      // Redirect to MamoPay hosted checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start checkout';
      if (message.includes('Payment gateway not configured')) {
        toast.error('Payment gateway not configured. Contact support.');
      } else {
        toast.error(message);
      }
    } finally {
      setProcessingPlanId(null);
    }
  };

  return (
    <SubscriptionScreen
      onBack={() => router.back()}
      plans={plans}
      isLoading={plansLoading || subLoading}
      currentPlanName={subData?.subscription?.plan.name ?? null}
      processingPlanId={processingPlanId}
      onCheckout={handleCheckout}
    />
  );
}

export default function Page() {
  return <Suspense><SubscriptionContent /></Suspense>;
}

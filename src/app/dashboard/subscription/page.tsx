'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { toast } from 'sonner';
import { SubscriptionScreen } from '@/screens/SubscriptionScreen';
import { useSubscription } from '@/hooks/useSubscription';

function SubscriptionContent() {
  const router  = useRouter();
  const params  = useSearchParams();
  const success = params.get('success') === '1';
  const cancelled = params.get('cancelled') === '1';

  const { data: subData } = useSubscription();

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

  return (
    <SubscriptionScreen
      onBack={() => router.back()}
      currentPlanName={subData?.subscription?.plan.name ?? null}
    />
  );
}

export default function Page() {
  return <Suspense><SubscriptionContent /></Suspense>;
}

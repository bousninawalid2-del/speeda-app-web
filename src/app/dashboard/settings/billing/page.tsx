'use client';

import { useRouter } from 'next/navigation';
import { BillingHistoryScreen } from '@/screens/BillingHistoryScreen';
import { useBilling } from '@/hooks/useBilling';

export default function Page() {
  const router  = useRouter();
  const { data: payments, isLoading } = useBilling();

  return (
    <BillingHistoryScreen
      onBack={() => router.push('/dashboard/settings')}
      payments={payments}
      isLoading={isLoading}
    />
  );
}

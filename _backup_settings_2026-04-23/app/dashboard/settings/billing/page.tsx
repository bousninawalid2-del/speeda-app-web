'use client';

import { useRouter } from 'next/navigation';
import { BillingHistoryScreen } from '@/screens/BillingHistoryScreen';

export default function Page() {
  const router = useRouter();

  return (
    <BillingHistoryScreen
      onBack={() => router.push('/dashboard/settings')}
    />
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { ReferralScreen } from '@/screens/ReferralScreen';
import { useReferral } from '@/hooks/useReferral';

export default function Page() {
  const router = useRouter();
  const { data, isLoading } = useReferral();

  return (
    <ReferralScreen
      onBack={() => router.push('/dashboard/settings')}
      liveData={data}
      isLoading={isLoading}
    />
  );
}

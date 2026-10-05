'use client';

import { useRouter } from 'next/navigation';
import { ReferralScreen } from '@/screens/ReferralScreen';

export default function Page() {
  const router = useRouter();

  return <ReferralScreen onBack={() => router.push('/dashboard/settings')} />;
}

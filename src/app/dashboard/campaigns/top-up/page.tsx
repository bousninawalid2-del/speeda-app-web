'use client';

import { useRouter } from 'next/navigation';
import { TopUpScreen } from '@/screens/TopUpScreen';

export default function Page() {
  const router = useRouter();

  return (
    <TopUpScreen
      onBack={() => router.push('/dashboard/campaigns')}
    />
  );
}

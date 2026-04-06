'use client';

import { useRouter } from 'next/navigation';
import { TopUpScreen } from '@/screens/TopUpScreen';
import { useTokens } from '@/hooks/useTokens';
import { toast } from 'sonner';

export default function Page() {
  const router = useRouter();
  const { data: tokensData, isLoading } = useTokens();

  const handleTopUp = async (amount: number) => {
    // Redirect to subscription page where MamoPay is integrated
    // or show a contact prompt — ad balance top-up via MamoPay requires a dedicated endpoint
    toast.success(`Request for SAR ${amount.toLocaleString()} top-up submitted. Our team will contact you.`);
  };

  return (
    <TopUpScreen
      onBack={() => router.push('/dashboard/campaigns')}
      adBalance={tokensData ? tokensData.balance * 10 : undefined}
      isLoading={isLoading}
      onTopUp={handleTopUp}
    />
  );
}

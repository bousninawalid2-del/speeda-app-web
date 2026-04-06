'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { TokensScreen } from '@/screens/TokensScreen';
import { useTokens } from '@/hooks/useTokens';
import { usePurchaseTokenPackage } from '@/hooks/useSubscription';
import { toast } from 'sonner';

function TokensContent() {
  const router  = useRouter();
  const params  = useSearchParams();
  const scrollToPacks = params.get('scrollToPacks') === 'true';

  const { data, isLoading }    = useTokens();
  const { mutateAsync: buyPkg } = usePurchaseTokenPackage();

  const handlePurchase = async (packId: string) => {
    try {
      const { checkoutUrl } = await buyPkg(packId);
      window.location.href = checkoutUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Purchase failed');
    }
  };

  return (
    <TokensScreen
      onBack={() => router.push('/dashboard')}
      scrollToPacks={scrollToPacks}
      liveData={data}
      isLoading={isLoading}
      onPurchase={handlePurchase}
    />
  );
}

export default function Page() {
  return <Suspense><TokensContent /></Suspense>;
}

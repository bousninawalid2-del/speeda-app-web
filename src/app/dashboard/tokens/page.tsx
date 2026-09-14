'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { TokensScreen } from '@/screens/TokensScreen';
import { usePurchaseTokenPackage, useTokenPackages, useTokens } from '@/hooks/useTokens';
import { toast } from 'sonner';
import { useEffect } from 'react';

function TokensContent() {
  const router  = useRouter();
  const params  = useSearchParams();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const scrollToPacks = params.get('scrollToPacks') === 'true';
  const success = params.get('success') === '1';
  const cancel = params.get('cancel') === '1';

  const { data, isLoading }    = useTokens();
  const { data: packs } = useTokenPackages();
  const purchaseMutation = usePurchaseTokenPackage();

  useEffect(() => {
    if (!success) return;
    toast.success(t('tokens.addedToast'));
    qc.invalidateQueries({ queryKey: ['tokens'] });
    qc.invalidateQueries({ queryKey: ['token-packages'] });
    router.replace('/dashboard/tokens');
  }, [success, qc, router, t]);

  useEffect(() => {
    if (!cancel) return;
    toast.error(t('tokens.canceledToast'));
    router.replace('/dashboard/tokens');
  }, [cancel, router, t]);

  const handlePurchase = async (packId: string) => {
    try {
      const { checkoutUrl } = await purchaseMutation.mutateAsync(packId);
      window.location.href = checkoutUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('tokens.purchaseFailed'));
    }
  };

  return (
    <TokensScreen
      onBack={() => router.push('/dashboard')}
      scrollToPacks={scrollToPacks}
      liveData={data}
      tokenPackages={packs}
      isLoading={isLoading}
      isPurchasePending={purchaseMutation.isPending}
      onPurchase={handlePurchase}
    />
  );
}

export default function Page() {
  return <Suspense><TokensContent /></Suspense>;
}

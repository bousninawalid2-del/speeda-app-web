'use client';

import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { HomeScreen } from '@/screens/HomeScreen';
import { resolveScreen } from '@/lib/navigation';

function DashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pendingActionCardId = searchParams.get('actionCardId');

  const clearPendingAction = () => {
    if (!pendingActionCardId) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete('actionCardId');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <HomeScreen
      onNavigate={(s) => router.push(resolveScreen(s))}
      pendingActionCardId={pendingActionCardId ? Number(pendingActionCardId) : null}
      onClearPendingAction={clearPendingAction}
    />
  );
}

function DashboardFallback() {
  const { t } = useTranslation();
  return <div className="flex h-screen items-center justify-center">{t('common.loadingDashboard')}</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  );
}

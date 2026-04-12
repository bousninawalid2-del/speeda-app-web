'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { HomeScreen } from '@/screens/HomeScreen';
import { resolveScreen } from '@/lib/navigation';
import { isOnboardingForcedValue, stripOnboardingParams } from '@/lib/onboarding';

function DashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pendingActionCardId = searchParams.get('actionCardId');
  const isOnboardingRelaunchRequested = isOnboardingForcedValue(searchParams.get('onboarding'))
    || isOnboardingForcedValue(searchParams.get('showOnboarding'));

  useEffect(() => {
    if (!isOnboardingRelaunchRequested) return;
    const nextPath = stripOnboardingParams(pathname, new URLSearchParams(searchParams.toString()));
    router.replace(`/onboarding?next=${encodeURIComponent(nextPath)}`);
  }, [isOnboardingRelaunchRequested, pathname, router, searchParams]);

  const clearPendingAction = () => {
    if (!pendingActionCardId) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete('actionCardId');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  if (isOnboardingRelaunchRequested) {
    return <div className="flex h-screen items-center justify-center">Loading onboarding...</div>;
  }

  return (
    <HomeScreen
      onNavigate={(s) => router.push(resolveScreen(s))}
      pendingActionCardId={pendingActionCardId ? Number(pendingActionCardId) : null}
      onClearPendingAction={clearPendingAction}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

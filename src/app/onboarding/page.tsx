'use client';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { markOnboardingCompleted } from '@/lib/onboarding';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const ref = searchParams.get('ref');
  const nextPath = searchParams.get('next');

  const safeNextPath = nextPath && nextPath.startsWith('/') ? nextPath : null;
  const handleComplete = () => {
    markOnboardingCompleted();
    if (safeNextPath) {
      router.replace(safeNextPath);
      return;
    }
    if (isAuthenticated) {
      router.replace('/dashboard');
      return;
    }
    router.push(ref ? `/auth?ref=${ref}` : '/auth');
  };

  return (
    <div className="max-w-[430px] mx-auto relative min-h-screen bg-background overflow-x-hidden">
      <OnboardingScreen onComplete={handleComplete} />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}

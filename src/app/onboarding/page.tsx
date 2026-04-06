'use client';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OnboardingScreen } from '@/screens/OnboardingScreen';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');

  return (
    <div className="max-w-[430px] mx-auto relative min-h-screen bg-background overflow-x-hidden">
      <OnboardingScreen onComplete={() => router.push(ref ? `/auth?ref=${ref}` : '/auth')} />
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

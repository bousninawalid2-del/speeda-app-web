'use client';

import { useRouter } from 'next/navigation';
import { SplashScreen } from '@/screens/SplashScreen';

export default function Home() {
  const router = useRouter();

  return (
    <div className="max-w-[430px] mx-auto relative min-h-screen bg-background overflow-x-hidden">
      <SplashScreen onComplete={() => router.push('/onboarding')} />
    </div>
  );
}

'use client';
import { useRouter } from 'next/navigation';
import { EmailVerifiedScreen } from '@/screens/EmailVerifiedScreen';
export default function Page() {
  const router = useRouter();
  return <div className="max-w-[430px] mx-auto relative min-h-screen bg-background overflow-x-hidden"><EmailVerifiedScreen onContinue={() => router.push('/setup')} /></div>;
}

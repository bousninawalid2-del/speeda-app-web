'use client';
import { useRouter } from 'next/navigation';
import { WhatsNewScreen } from '@/screens/WhatsNewScreen';
export default function Page() {
  const router = useRouter();
  return <WhatsNewScreen onBack={() => router.push('/dashboard/settings')} />;
}

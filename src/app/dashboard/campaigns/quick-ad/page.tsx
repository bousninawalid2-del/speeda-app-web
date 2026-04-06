'use client';
import { useRouter } from 'next/navigation';
import { QuickAdScreen } from '@/screens/QuickAdScreen';
export default function Page() {
  const router = useRouter();
  return <QuickAdScreen onBack={() => router.push('/dashboard/campaigns')} />;
}

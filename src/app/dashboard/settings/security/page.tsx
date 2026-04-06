'use client';
import { useRouter } from 'next/navigation';
import { SecurityScreen } from '@/screens/SecurityScreen';
export default function Page() {
  const router = useRouter();
  return <SecurityScreen onBack={() => router.push('/dashboard/settings')} />;
}

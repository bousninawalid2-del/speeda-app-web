'use client';
import { useRouter } from 'next/navigation';
import { HelpCenterScreen } from '@/screens/HelpCenterScreen';
export default function Page() {
  const router = useRouter();
  return <HelpCenterScreen onBack={() => router.push('/dashboard/settings')} />;
}

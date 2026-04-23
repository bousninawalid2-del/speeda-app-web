'use client';
import { useRouter } from 'next/navigation';
import { MenuManagementScreen } from '@/screens/MenuManagementScreen';
export default function Page() {
  const router = useRouter();
  return <MenuManagementScreen onBack={() => router.push('/dashboard/settings')} />;
}

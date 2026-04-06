'use client';
import { useRouter } from 'next/navigation';
import { NotificationsScreen } from '@/screens/NotificationsScreen';
import { resolveScreen } from '@/lib/navigation';
export default function Page() {
  const router = useRouter();
  return <NotificationsScreen onBack={() => router.push('/dashboard')} onNavigate={(s) => router.push(resolveScreen(s))} />;
}

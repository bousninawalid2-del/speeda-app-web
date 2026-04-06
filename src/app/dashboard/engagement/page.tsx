'use client';
import { useRouter } from 'next/navigation';
import { EngagementScreen } from '@/screens/EngagementScreen';
import { resolveScreen } from '@/lib/navigation';
export default function Page() {
  const router = useRouter();
  return <EngagementScreen onBack={() => router.push('/dashboard')} onNavigate={(s) => router.push(resolveScreen(s))} />;
}

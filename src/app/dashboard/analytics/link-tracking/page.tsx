'use client';
import { useRouter } from 'next/navigation';
import { LinkTrackingScreen } from '@/screens/LinkTrackingScreen';
import { resolveScreen } from '@/lib/navigation';
export default function Page() {
  const router = useRouter();
  return <LinkTrackingScreen onBack={() => router.push('/dashboard/analytics')} onNavigate={(s) => router.push(resolveScreen(s))} />;
}

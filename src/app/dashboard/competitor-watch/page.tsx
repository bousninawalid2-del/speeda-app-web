'use client';
import { useRouter } from 'next/navigation';
import { CompetitorWatchScreen } from '@/screens/CompetitorWatchScreen';
import { resolveScreen } from '@/lib/navigation';
export default function Page() {
  const router = useRouter();
  return <CompetitorWatchScreen onBack={() => router.push('/dashboard')} onNavigate={(s) => router.push(resolveScreen(s))} />;
}

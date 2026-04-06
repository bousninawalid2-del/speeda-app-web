'use client';
import { useRouter } from 'next/navigation';
import { ActionPlanScreen } from '@/screens/ActionPlanScreen';
import { resolveScreen } from '@/lib/navigation';
export default function Page() {
  const router = useRouter();
  return <ActionPlanScreen onBack={() => router.push('/dashboard')} onNavigate={(s) => router.push(resolveScreen(s))} />;
}

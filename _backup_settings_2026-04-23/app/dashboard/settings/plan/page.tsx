'use client';
import { useRouter } from 'next/navigation';
import { PlanComparisonScreen } from '@/screens/PlanComparisonScreen';
export default function Page() {
  const router = useRouter();
  return <PlanComparisonScreen onBack={() => router.push('/dashboard/settings')} />;
}

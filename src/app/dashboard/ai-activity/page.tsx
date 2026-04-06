'use client';
import { useRouter } from 'next/navigation';
import { AIActivityScreen } from '@/screens/AIActivityScreen';
export default function Page() {
  const router = useRouter();
  return <AIActivityScreen onBack={() => router.push('/dashboard')} />;
}

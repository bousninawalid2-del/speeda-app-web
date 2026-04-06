'use client';
import { useRouter } from 'next/navigation';
import { AIBriefingPreviewScreen } from '@/screens/AIBriefingPreviewScreen';
export default function Page() {
  const router = useRouter();
  return <AIBriefingPreviewScreen onBack={() => router.push('/dashboard')} />;
}

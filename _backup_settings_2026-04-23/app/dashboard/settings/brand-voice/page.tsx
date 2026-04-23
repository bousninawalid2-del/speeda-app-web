'use client';
import { useRouter } from 'next/navigation';
import { EditBrandVoiceScreen } from '@/screens/EditBrandVoiceScreen';
export default function Page() {
  const router = useRouter();
  return <EditBrandVoiceScreen onBack={() => router.push('/dashboard/settings')} />;
}

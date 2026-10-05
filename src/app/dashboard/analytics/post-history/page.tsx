'use client';

import { useRouter } from 'next/navigation';
import { PostHistoryScreen } from '@/screens/PostHistoryScreen';
import { resolveScreen } from '@/lib/navigation';

export default function Page() {
  const router = useRouter();

  return (
    <PostHistoryScreen
      onBack={() => router.push('/dashboard/analytics')}
      onNavigate={(s) => router.push(resolveScreen(s))}
    />
  );
}

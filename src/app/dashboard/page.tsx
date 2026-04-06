'use client';

import { useRouter } from 'next/navigation';
import { HomeScreen } from '@/screens/HomeScreen';
import { resolveScreen } from '@/lib/navigation';

export default function Page() {
  const router = useRouter();

  return (
    <HomeScreen
      onNavigate={(s) => {
        if (s.startsWith('__doaction__')) {
          // Extract action card id and navigate
          const parts = s.split('__');
          router.push(resolveScreen(parts[3]));
        } else {
          router.push(resolveScreen(s));
        }
      }}
      pendingActionCardId={null}
      onClearPendingAction={() => {}}
    />
  );
}

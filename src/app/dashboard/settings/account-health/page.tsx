'use client';

import { useRouter } from 'next/navigation';
import { AccountHealthScreen } from '@/screens/AccountHealthScreen';
import { resolveScreen } from '@/lib/navigation';

export default function Page() {
  const router = useRouter();

  return (
    <AccountHealthScreen
      onBack={() => router.push('/dashboard/settings')}
      onNavigate={(s) => router.push(resolveScreen(s))}
    />
  );
}

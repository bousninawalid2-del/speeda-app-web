'use client';

import { useRouter } from 'next/navigation';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { resolveScreen } from '@/lib/navigation';

export default function Page() {
  const router = useRouter();

  return (
    <SettingsScreen
      onBack={() => router.push('/dashboard')}
      onNavigate={(s) => router.push(resolveScreen(s))}
    />
  );
}

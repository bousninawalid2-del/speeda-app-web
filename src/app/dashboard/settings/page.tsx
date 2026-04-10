'use client';

import { useRouter } from 'next/navigation';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { resolveScreen } from '@/lib/navigation';

export default function Page() {
  const router = useRouter();

  return (
    <div className="max-w-[430px] mx-auto relative min-h-screen bg-background overflow-x-hidden">
      <SettingsScreen
        onBack={() => router.push('/dashboard')}
        onNavigate={(s) => router.push(resolveScreen(s))}
      />
    </div>
  );
}

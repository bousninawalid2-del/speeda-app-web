'use client';

import { useRouter } from 'next/navigation';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { resolveScreen } from '@/lib/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Page() {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <div className="max-w-[430px] mx-auto relative min-h-screen bg-background overflow-x-hidden">
      <SettingsScreen
        onBack={() => router.push('/dashboard')}
        onNavigate={(s) => router.push(resolveScreen(s))}
        onLogout={async () => {
          await logout();
          router.push('/auth');
        }}
      />
    </div>
  );
}

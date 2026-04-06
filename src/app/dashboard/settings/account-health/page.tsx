'use client';

import { useRouter } from 'next/navigation';
import { AccountHealthScreen } from '@/screens/AccountHealthScreen';
import { resolveScreen } from '@/lib/navigation';
import { useSocialAccounts, useInvalidateSocialAccounts } from '@/hooks/useSocialAccounts';

export default function Page() {
  const router     = useRouter();
  const { data: accounts, isLoading, refetch } = useSocialAccounts();
  const invalidate = useInvalidateSocialAccounts();

  return (
    <AccountHealthScreen
      onBack={() => router.push('/dashboard/settings')}
      onNavigate={(s) => router.push(resolveScreen(s))}
      accounts={accounts}
      isLoading={isLoading}
      onRefresh={() => { refetch(); invalidate(); }}
    />
  );
}

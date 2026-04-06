'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SocialMediaScreen, SocialAccountData } from '@/screens/SocialMediaScreen';
import { apiFetch } from '@/lib/api-client';

interface SocialResponse {
  accounts: SocialAccountData[];
}

export default function Page() {
  const router = useRouter();

  const [isLoading,        setIsLoading]        = useState(true);
  const [externalAccounts, setExternalAccounts] = useState<SocialAccountData[] | undefined>(undefined);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<SocialResponse>('/social');
      setExternalAccounts(data.accounts);
    } catch {
      setExternalAccounts(undefined);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleConnect = async (): Promise<string | null> => {
    try {
      const data = await apiFetch<{ url: string }>('/social/connect', { method: 'POST' });
      return data.url;
    } catch {
      return null;
    }
  };

  const handleDisconnect = async (platform: string) => {
    try {
      await apiFetch('/social/disconnect', {
        method: 'POST',
        body: JSON.stringify({ platform }),
      });
      // Optimistic update
      setExternalAccounts(prev =>
        prev?.map(a => a.platform === platform ? { ...a, connected: false } : a)
      );
    } catch {
      // Re-fetch on failure to stay in sync
      fetchAccounts();
    }
  };

  return (
    <SocialMediaScreen
      onBack={() => router.push('/dashboard')}
      externalAccounts={externalAccounts}
      isLoading={isLoading}
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
    />
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BusinessSetupScreen, SetupInitialData } from '@/screens/BusinessSetupScreen';
import { setupApi, SetupPayload } from '@/lib/api-client';
import { socialService } from '@/services/social.service';
import { toast } from 'sonner';

export default function Page() {
  const router = useRouter();
  const [initialData, setInitialData] = useState<SetupInitialData | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setupApi.get()
      .then((data) => setInitialData(data as SetupInitialData))
      .catch(() => {/* no existing data — first-time setup */})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (data: SetupPayload) => {
    await setupApi.save(data);
    toast.success('Setup saved!');
    // Mark setup as done via cookie so middleware allows dashboard access
    document.cookie = 'speeda_setup_done=1; path=/; max-age=31536000; SameSite=Lax';
  };

  const handleSocialConnect = async () => {
    const result = await socialService.connect();
    return result.url ?? null;
  };

  const handleFetchSocialAccounts = async () => {
    const accounts = await socialService.getAccounts();
    return accounts.map(a => ({
      platform: a.platform,
      connected: a.connected,
      username: a.username,
    }));
  };

  if (loading) {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[430px] mx-auto relative min-h-screen bg-background overflow-x-hidden">
      <BusinessSetupScreen
        onComplete={() => router.push('/dashboard')}
        onSubmit={handleSubmit}
        onUploadImage={setupApi.uploadImage}
        onDeleteImage={(id) => setupApi.deleteImage(id).then(() => undefined)}
        initialData={initialData}
        onSocialConnect={handleSocialConnect}
        onFetchSocialAccounts={handleFetchSocialAccounts}
      />
    </div>
  );
}

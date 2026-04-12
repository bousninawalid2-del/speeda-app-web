'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EditBrandVoiceScreen, BrandVoiceInitialData } from '@/screens/EditBrandVoiceScreen';
import { setupApi } from '@/lib/api-client';
import { toast } from 'sonner';

export default function Page() {
  const router = useRouter();
  const [initialData, setInitialData] = useState<BrandVoiceInitialData | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setupApi.get()
      .then((data) => {
        const pref = (data as { preference?: BrandVoiceInitialData })?.preference;
        if (pref) setInitialData(pref);
      })
      .catch(() => {/* no existing preference data */})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (data: {
    tone_of_voice?: string;
    language_preference?: string;
    business_description?: string;
    hashtags?: string;
    other?: string;
  }) => {
    // Brand voice updates only preference fields — cast to satisfy SetupPayload
    // The API route handles partial updates when business_name is not provided
    await setupApi.save(data as import('@/lib/api-client').SetupPayload);
  };

  return (
    <EditBrandVoiceScreen
      onBack={() => router.push('/dashboard/settings')}
      initialData={initialData}
      isLoading={loading}
      onSave={handleSave}
    />
  );
}

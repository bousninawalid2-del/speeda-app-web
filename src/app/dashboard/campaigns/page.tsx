'use client';

import { useRouter } from 'next/navigation';
import { CampaignsScreen } from '@/screens/CampaignsScreen';
import { resolveScreen } from '@/lib/navigation';

export default function Page() {
  const router = useRouter();

  return <CampaignsScreen onNavigate={(s) => router.push(resolveScreen(s))} />;
}

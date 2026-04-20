'use client';

import { useRouter } from 'next/navigation';
import { SocialMediaScreen } from '@/screens/SocialMediaScreen';

export default function Page() {
  const router = useRouter();

  return (
    <SocialMediaScreen
      onBack={() => router.push('/dashboard')}
    />
  );
}

'use client';
import { useRouter } from 'next/navigation';
import { PostEditScreen } from '@/screens/PostEditScreen';
export default function Page() {
  const router = useRouter();
  return <PostEditScreen post={{ platform: 'instagram', type: 'Feed Post', caption: '', hashtags: [], status: 'draft' }} onBack={() => router.back()} onSave={() => {}} />;
}

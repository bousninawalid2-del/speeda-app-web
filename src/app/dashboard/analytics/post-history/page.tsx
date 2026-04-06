'use client';

import { useRouter } from 'next/navigation';
import { PostHistoryScreen } from '@/screens/PostHistoryScreen';
import { resolveScreen } from '@/lib/navigation';
import { usePosts, useUpdatePost } from '@/hooks/usePosts';

export default function Page() {
  const router = useRouter();
  const { data, isLoading } = usePosts();
  const { mutateAsync: updatePost } = useUpdatePost();

  const handleRetry = async (postId: string) => {
    await updatePost({ id: postId, status: 'Scheduled' });
  };

  return (
    <PostHistoryScreen
      onBack={() => router.push('/dashboard/analytics')}
      onNavigate={(s) => router.push(resolveScreen(s))}
      posts={data?.posts}
      isLoading={isLoading}
      onRetry={handleRetry}
    />
  );
}

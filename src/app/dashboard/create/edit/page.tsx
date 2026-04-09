'use client';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { PostEditScreen } from '@/screens/PostEditScreen';
import { usePosts, useUpdatePost } from '@/hooks/usePosts';

const FALLBACK_POST = {
  platform: 'instagram',
  type: 'Feed Post',
  caption: 'Weekend special is live. Come hungry.',
  hashtags: ['riyadh', 'food', 'weekend'],
  status: 'draft' as const,
};

function normalizeHashtags(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));
}

function toEditStatus(status: string): 'draft' | 'scheduled' | 'ai-generated' | 'published' {
  if (status === 'published') return 'published';
  if (status === 'scheduled') return 'scheduled';
  return 'draft';
}

function EditPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const postId = params.get('postId');
  const from = params.get('from');

  const { data } = usePosts();
  const { mutateAsync: updatePost } = useUpdatePost();

  const sourcePost = postId
    ? data?.posts.find((post) => post.id === postId)
    : null;

  const post = sourcePost
    ? {
        platform: sourcePost.platform.split(',')[0].trim(),
        type: 'Feed Post',
        caption: sourcePost.caption,
        hashtags: normalizeHashtags(sourcePost.hashtags),
        status: toEditStatus(sourcePost.status),
      }
    : FALLBACK_POST;

  const handleBack = () => {
    if (from === 'post-history') {
      router.push('/dashboard/analytics/post-history');
      return;
    }
    router.back();
  };

  const handleSave = async (nextPost: any) => {
    if (!postId) return;
    try {
      await updatePost({
        id: postId,
        caption: nextPost.caption,
        hashtags: nextPost.hashtags.map((tag: string) => tag.replace(/^#/, '')).join(','),
      });
      toast.success('Post updated!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update post');
    }
  };

  return <PostEditScreen post={post} onBack={handleBack} onSave={handleSave} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <EditPageContent />
    </Suspense>
  );
}

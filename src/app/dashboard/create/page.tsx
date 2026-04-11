'use client';

import { CreateScreen } from '@/screens/CreateScreen';
import { useCreatePost, useDeletePost, usePosts, type CreatePostInput } from '@/hooks/usePosts';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { getAccessToken } from '@/lib/api-client';

export default function Page() {
  const { data: postsData, isLoading: postsLoading } = usePosts();
  const { data: socialAccounts } = useSocialAccounts();
  const createPost = useCreatePost();
  const deletePost = useDeletePost();

  const handlePublish = (data: CreatePostInput) => createPost.mutateAsync(data);
  const handleDeletePost = async (postId: string) => {
    await deletePost.mutateAsync(postId);
  };

  const handleUploadMedia = async (file: File): Promise<{ id: string; url: string }> => {
    const token = getAccessToken();
    const form = new FormData();
    form.append('file', file);

    const response = await fetch('/api/media', {
      method: 'POST',
      credentials: 'same-origin',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `Failed to upload media (HTTP ${response.status})` }));
      throw new Error(error.error ?? 'Upload failed');
    }

    return response.json() as Promise<{ id: string; url: string }>;
  };

  return (
    <CreateScreen
      posts={postsData?.posts}
      postsLoading={postsLoading}
      onPublish={handlePublish}
      onUploadMedia={handleUploadMedia}
      connectedPlatforms={socialAccounts?.filter(account => account.connected)}
      onDeletePost={handleDeletePost}
      isPublishing={createPost.isPending}
    />
  );
}

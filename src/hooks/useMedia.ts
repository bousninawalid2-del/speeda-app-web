import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mediaService, type MediaTypeFilter } from '@/services/media.service';

export function useMedia(type?: MediaTypeFilter) {
  return useQuery({
    queryKey: ['media', type ?? 'all'],
    queryFn: () => mediaService.list(type),
    staleTime: 60 * 1000,
  });
}

export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mediaService.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

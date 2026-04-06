import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface ProfileData {
  id:           string;
  email:        string;
  name:         string | null;
  phone:        string | null;
  isVerified:   boolean;
  createdAt:    string;
  tokenBalance: number;
  tokenUsed:    number;
  activity: {
    business_name: string | null;
    industry:      string | null;
    country:       string | null;
    location:      string | null;
    business_size: string | null;
  } | null;
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn:  () => apiFetch<{ user: ProfileData }>('/auth/me').then(r => r.user),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; phone?: string }) =>
      apiFetch<{ user: Pick<ProfileData, 'id' | 'email' | 'name' | 'phone'> }>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (res) => {
      // Optimistic update inside cache
      qc.setQueryData(['profile'], (old: ProfileData | undefined) =>
        old ? { ...old, ...res.user } : old
      );
    },
  });
}

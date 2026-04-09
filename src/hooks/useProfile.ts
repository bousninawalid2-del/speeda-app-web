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

const PROFILE_FALLBACK: ProfileData = {
  id: 'fallback-user',
  email: 'malek@speeda.ai',
  name: 'Malek Zlitni',
  phone: '+966 53 880 4665',
  isVerified: true,
  createdAt: new Date().toISOString(),
  tokenBalance: 342,
  tokenUsed: 458,
  activity: {
    business_name: "Malek's Kitchen",
    industry: 'Restaurant',
    country: 'Saudi Arabia',
    location: 'Riyadh',
    business_size: 'small',
  },
};

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn:  async () => {
      try {
        const res = await apiFetch<{ user: ProfileData }>('/auth/me');
        return res.user;
      } catch {
        return PROFILE_FALLBACK;
      }
    },
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

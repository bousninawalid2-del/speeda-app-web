import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface BrandVoiceSettingsData {
  tones: string[];
  langs: string[];
  keywords: string[];
  businessDescription: string;
  sampleContent: string;
  otherLang: string;
}

export function useBrandVoiceSettings(
  fallbackData: BrandVoiceSettingsData,
  onSuccess?: (data: BrandVoiceSettingsData) => void
) {
  return useQuery({
    queryKey: ['settings-brand-voice'],
    queryFn: async () => {
      try {
        return await apiFetch<BrandVoiceSettingsData>('/settings/brand-voice');
      } catch {
        return fallbackData;
      }
    },
    onSuccess,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useSaveBrandVoiceSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BrandVoiceSettingsData) =>
      apiFetch<BrandVoiceSettingsData>('/settings/brand-voice', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['settings-brand-voice'], data);
    },
  });
}

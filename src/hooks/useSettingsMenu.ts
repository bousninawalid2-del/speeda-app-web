import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface SettingsMenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
}

interface SettingsMenuResponse {
  items: SettingsMenuItem[];
}

export function useSettingsMenu(
  fallbackItems: SettingsMenuItem[]
) {
  return useQuery({
    queryKey: ['settings-menu'],
    queryFn: async () => {
      try {
        const response = await apiFetch<SettingsMenuResponse>('/settings/menu');
        if (!Array.isArray(response.items)) throw new Error('Invalid menu payload');
        return response.items;
      } catch (error) {
        console.warn('[settings-menu] Falling back to demo items', error);
        return fallbackItems;
      }
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

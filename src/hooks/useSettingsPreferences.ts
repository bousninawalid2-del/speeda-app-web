import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface NotificationSettings {
  morningCards: boolean;
  pendingComments: boolean;
  eodSummary: boolean;
  perfReport: boolean;
  mosUpdate: boolean;
  competitorRanking: boolean;
  seasonalOpps: boolean;
  competitorActivity: boolean;
  campaignOpt: boolean;
  salesSuggestions: boolean;
}

export interface SettingsPreferences {
  automations: boolean[];
  notifications: NotificationSettings;
}

const SETTINGS_DEFAULTS: SettingsPreferences = {
  automations: [true, true, true, true, false],
  notifications: {
    morningCards: true,
    pendingComments: true,
    eodSummary: true,
    perfReport: true,
    mosUpdate: true,
    competitorRanking: false,
    seasonalOpps: true,
    competitorActivity: true,
    campaignOpt: true,
    salesSuggestions: true,
  },
};

const SETTINGS_NOTIFICATION_KEYS: Array<keyof NotificationSettings> = [
  'morningCards',
  'pendingComments',
  'eodSummary',
  'perfReport',
  'mosUpdate',
  'competitorRanking',
  'seasonalOpps',
  'competitorActivity',
  'campaignOpt',
  'salesSuggestions',
];

function normalizeSettings(data: unknown): SettingsPreferences {
  const source = data as Partial<SettingsPreferences> | undefined;
  const automations =
    Array.isArray(source?.automations) && source.automations.length === 5
      ? source.automations.map(Boolean)
      : SETTINGS_DEFAULTS.automations;

  const notifications = SETTINGS_NOTIFICATION_KEYS.reduce((acc, key) => {
    acc[key] = typeof source?.notifications?.[key] === 'boolean'
      ? source.notifications[key]
      : SETTINGS_DEFAULTS.notifications[key];
    return acc;
  }, {} as NotificationSettings);

  return { automations, notifications };
}

function logSettingsError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[settings] ${context}`, error);
  }
}

export function useSettingsPreferences() {
  return useQuery({
    queryKey: ['settings-preferences'],
    queryFn: async () => {
      try {
        const response = await apiFetch<{ settings: SettingsPreferences }>('/settings');
        return normalizeSettings(response?.settings);
      } catch (error) {
        logSettingsError('fetch failed, using defaults', error);
        return normalizeSettings(undefined);
      }
    },
    staleTime: 60 * 1000,
  });
}

export function useUpdateSettingsPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SettingsPreferences>) =>
      apiFetch<{ settings: SettingsPreferences }>('/settings', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (result) => {
      qc.setQueryData(['settings-preferences'], result.settings);
    },
    onError: (error) => logSettingsError('save failed', error),
  });
}

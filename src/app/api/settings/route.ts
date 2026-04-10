import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';

const SETTINGS_KEY = '__settings_v1__';

const defaultSettings = {
  automations: [true, true, true, true, false] as boolean[],
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

const notificationsSchema = z.object({
  morningCards: z.boolean(),
  pendingComments: z.boolean(),
  eodSummary: z.boolean(),
  perfReport: z.boolean(),
  mosUpdate: z.boolean(),
  competitorRanking: z.boolean(),
  seasonalOpps: z.boolean(),
  competitorActivity: z.boolean(),
  campaignOpt: z.boolean(),
  salesSuggestions: z.boolean(),
});

const patchSchema = z.object({
  automations: z.array(z.boolean()).length(5).optional(),
  notifications: notificationsSchema.optional(),
}).refine((data) => data.automations !== undefined || data.notifications !== undefined, {
  message: 'Nothing to update',
});

type SettingsPayload = {
  automations: boolean[];
  notifications: z.infer<typeof notificationsSchema>;
};

type StoredSettings = {
  settings: SettingsPayload;
  legacyCertifications: string | null;
};

function parseStoredSettings(raw: string | null): StoredSettings {
  if (!raw) {
    return {
      settings: { ...defaultSettings, notifications: { ...defaultSettings.notifications } },
      legacyCertifications: null,
    };
  }

  try {
    const parsedUnknown: unknown = JSON.parse(raw);
    if (!parsedUnknown || typeof parsedUnknown !== 'object') {
      return {
        settings: { ...defaultSettings, notifications: { ...defaultSettings.notifications } },
        legacyCertifications: raw,
      };
    }
    const parsed = parsedUnknown as Record<string, unknown>;
    const legacyCertifications = typeof parsed.legacyCertifications === 'string' ? parsed.legacyCertifications : null;
    const stored = parsed[SETTINGS_KEY];
    const storedSettings = stored && typeof stored === 'object' ? stored as Partial<SettingsPayload> : undefined;
    const parsedNotifications = notificationsSchema.safeParse(storedSettings?.notifications);
    return {
      settings: {
        automations: Array.isArray(storedSettings?.automations) && storedSettings.automations.length === 5
          ? storedSettings.automations
          : defaultSettings.automations,
        notifications: parsedNotifications.success ? parsedNotifications.data : defaultSettings.notifications,
      },
      legacyCertifications,
    };
  } catch {
    return {
      settings: { ...defaultSettings, notifications: { ...defaultSettings.notifications } },
      legacyCertifications: raw,
    };
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;
    const { user } = auth;

    const activity = await prisma.activity.findUnique({
      where: { userId: user.sub },
      select: { certifications: true },
    });

    const { settings } = parseStoredSettings(activity?.certifications ?? null);
    return Response.json({ settings });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[settings GET]', err);
    }
    return errorResponse('Internal server error', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;
    const { user } = auth;

    let body: unknown;
    try { body = await req.json(); } catch { return errorResponse('Request body must be valid JSON', 400); }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

    const existing = await prisma.activity.findUnique({
      where: { userId: user.sub },
      select: { certifications: true },
    });
    const current = parseStoredSettings(existing?.certifications ?? null);

    const next: SettingsPayload = {
      automations: parsed.data.automations ?? current.settings.automations,
      notifications: parsed.data.notifications ?? current.settings.notifications,
    };

    const payloadToStore = JSON.stringify({
      [SETTINGS_KEY]: next,
      // Keep any pre-existing free-form certifications text so this endpoint
      // does not overwrite unrelated Activity data.
      legacyCertifications: current.legacyCertifications,
    });

    await prisma.activity.upsert({
      where: { userId: user.sub },
      create: {
        userId: user.sub,
        certifications: payloadToStore,
      },
      update: {
        certifications: payloadToStore,
      },
    });

    return Response.json({ settings: next });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[settings PATCH]', err);
    }
    return errorResponse('Internal server error', 500);
  }
}

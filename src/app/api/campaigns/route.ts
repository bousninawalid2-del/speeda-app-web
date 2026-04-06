import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { getPostsAnalytics } from '@/lib/ayrshare';
import { rateLimit } from '@/lib/rate-limit';

// ─── Types ────────────────────────────────────────────────────────────────────

const STATUSES = ['Active', 'Scheduled', 'Completed', 'Paused', 'Draft'] as const;

const createSchema = z.object({
  name:           z.string().min(1, 'Name is required'),
  status:         z.enum(STATUSES).default('Scheduled'),
  platforms:      z.string().min(1, 'At least one platform is required'),
  budget:         z.number().int().positive(),
  startDate:      z.string().datetime(),
  endDate:        z.string().datetime(),
  isAI:           z.boolean().default(true),
  location:       z.string().optional(),
  ageRange:       z.string().optional(),
  interests:      z.string().optional(),
  ayrsharePostIds:z.string().optional(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function statusColor(status: string): string {
  if (status === 'Active')    return 'bg-green-accent';
  if (status === 'Scheduled') return 'bg-brand-blue';
  return 'bg-muted-foreground';
}

// ─── Enrich a campaign with Ayrshare analytics ───────────────────────────────

async function enrichCampaign(c: {
  id: string; name: string; status: string; platforms: string;
  budget: number; spent: number; reach: number; impressions: number; clicks: number; roi: number | null;
  startDate: Date; endDate: Date; isAI: boolean;
  location: string | null; ageRange: string | null; interests: string | null; ayrsharePostIds: string | null;
}) {
  let { impressions, reach, clicks } = c;

  // Try to enrich with Ayrshare post analytics
  if (c.ayrsharePostIds) {
    const postIds = c.ayrsharePostIds.split(',').map(s => s.trim()).filter(Boolean);
    const platforms = c.platforms.split(',').map(s => s.trim());
    const analytics = await getPostsAnalytics(postIds, platforms);
    if (analytics) {
      impressions = analytics.impressions || impressions;
      reach       = analytics.reach       || reach;
      clicks      = analytics.clicks      || clicks;
    }
  }

  const roiNum   = c.roi ?? (c.spent > 0 ? parseFloat((c.budget / c.spent).toFixed(1)) : 0);
  const cpc      = clicks > 0 ? (c.spent / clicks).toFixed(2) : '0.00';

  // Approximate daily data from totals (7 points, S-curve distribution)
  const weights = [0.08, 0.12, 0.16, 0.18, 0.17, 0.15, 0.14];
  const dailyImpr   = weights.map(w => Math.round(impressions * w));
  const dailyClicks = weights.map(w => Math.round(clicks * w));

  return {
    id:           c.id,
    name:         c.name,
    status:       c.status,
    color:        statusColor(c.status),
    platforms:    c.platforms,               // kept as string for client mapping
    budget:       c.budget.toLocaleString(),
    spent:        c.spent.toLocaleString(),
    reach:        formatK(reach),
    roi:          roiNum > 0 ? `${roiNum}x` : '—',
    date:         `${formatDate(c.startDate)} — ${formatDate(c.endDate)}`,
    budgetNum:    c.budget,
    spentNum:     c.spent,
    impressions:  formatK(impressions),
    clicks:       clicks.toLocaleString(),
    clicksNum:    clicks,
    cpc,
    roas:         roiNum > 0 ? `${roiNum}x` : '—',
    targeting:    c.isAI ? 'AI' : 'Manual',
    isAI:         c.isAI,
    location:     c.location  ?? undefined,
    ageRange:     c.ageRange  ?? undefined,
    interests:    c.interests ? c.interests.split(',').map(s => s.trim()) : undefined,
    dailyImpr,
    dailyClicks,
  };
}

// ─── GET /api/campaigns ───────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const all = await prisma.campaign.findMany({
    where: { userId: user.sub },
    orderBy: { createdAt: 'desc' },
  });

  // Enrich all campaigns (Ayrshare calls are parallelized)
  const enriched = await Promise.all(all.map(enrichCampaign));

  // Group by status
  const grouped: Record<string, typeof enriched> = { Active: [], Scheduled: [], Completed: [], Drafts: [] };
  for (const c of enriched) {
    const key = c.status === 'Paused' ? 'Active' : c.status === 'Draft' ? 'Drafts' : c.status;
    grouped[key]?.push(c);
  }

  // Aggregate stats (active campaigns only)
  const active = all.filter(c => c.status === 'Active' || c.status === 'Paused');
  const totalBudget = active.reduce((s, c) => s + c.budget, 0);
  const totalReach  = active.reduce((s, c) => s + c.reach, 0);
  const roiValues   = active.map(c => c.roi ?? 0).filter(r => r > 0);
  const avgRoi      = roiValues.length ? roiValues.reduce((s, r) => s + r, 0) / roiValues.length : 0;

  return Response.json({
    campaigns: grouped,
    stats: {
      totalBudget,
      totalReach,
      avgRoi: parseFloat(avgRoi.toFixed(1)),
      activeCount: active.length,
    },
  });
}

// ─── POST /api/campaigns ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  // 20 campaign creations per user per minute
  if (!rateLimit(`campaigns:${user.sub}`, { limit: 20, windowMs: 60_000 })) {
    return errorResponse('Too many requests. Please wait a moment.', 429);
  }

  let body: unknown;
  try { body = await req.json(); } catch { return errorResponse('Invalid JSON', 400); }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

  const { name, status, platforms, budget, startDate, endDate, isAI, location, ageRange, interests, ayrsharePostIds } = parsed.data;

  const campaign = await prisma.campaign.create({
    data: {
      userId: user.sub,
      name,
      status,
      platforms,
      budget,
      startDate: new Date(startDate),
      endDate:   new Date(endDate),
      isAI,
      location,
      ageRange,
      interests,
      ayrsharePostIds,
    },
  });

  return Response.json({ campaign }, { status: 201 });
}

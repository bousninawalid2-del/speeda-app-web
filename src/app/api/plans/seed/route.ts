import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/plans/seed
 * One-time admin endpoint to seed initial plans and token packages.
 * Protect with ADMIN_SECRET in production.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Upsert plans
  const planData = [
    {
      name: 'Starter',
      monthlyPrice: 549,
      yearlyPrice: 439,    // 549 * 0.8
      tokenCount: 200,
      platformLimit: 3,
      popular: false,
      watermark: true,
      sortOrder: 1,
      features: JSON.stringify([
        '200 tokens/month',
        '3 platforms',
        'AI Content Generation',
        'Calendar & Scheduling',
        'Post Editing',
        'Media Library (50 files)',
        'Basic Analytics (KPIs only)',
        'Engagement (read-only)',
        'MOS Score (read-only)',
        'WhatsApp 10 msg/day',
      ]),
      locked: JSON.stringify([
        'Variations A/B',
        'Translation',
        'Auto-Schedule',
        'DM Management',
        'Complete Analytics',
        'Link Tracking',
        'Hashtag Intelligence',
        'Image Resize',
        'Campaigns & Ads',
        'PDF Export',
        'Competitor Intelligence',
      ]),
    },
    {
      name: 'Pro',
      monthlyPrice: 1199,
      yearlyPrice: 959,
      tokenCount: 800,
      platformLimit: 10,
      popular: true,
      watermark: false,
      sortOrder: 2,
      features: JSON.stringify([
        '800 tokens/month',
        'All 10 platforms',
        'Everything in Starter',
        'Variations A/B',
        'Post Translation',
        'Auto-Schedule',
        'DM Management & AI Responses',
        'Complete Analytics',
        'Link Tracking',
        'Hashtag Intelligence',
        'Image Auto-Resize',
        'Campaigns & Ads',
        'PDF Export',
        'RSS Feed Auto-Posting',
        'Unlimited Media Library',
        'Complete MOS Score',
        'WhatsApp unlimited',
        'Watermark removed',
      ]),
      locked: JSON.stringify(['Competitor Intelligence']),
    },
    {
      name: 'Business',
      monthlyPrice: 2499,
      yearlyPrice: 1999,
      tokenCount: 3000,
      platformLimit: 10,
      popular: false,
      watermark: false,
      sortOrder: 3,
      features: JSON.stringify([
        '3,000 tokens/month',
        'All 10 platforms',
        'Everything in Pro',
        'Competitor Intelligence',
        'Weekly auto PDF reports',
        'Priority support',
        'Onboarding call',
        'Multi-location',
        'API access',
      ]),
      locked: JSON.stringify([]),
    },
  ];

  for (const data of planData) {
    await prisma.plan.upsert({
      where: { name: data.name },
      update: data,
      create: data,
    });
  }

  // Upsert token packages — IDs must match frontend packIds in TokensScreen
  const packageData = [
    { id: 'pack_200',  name: 'Starter Pack',  tokenCount: 200,  price: 199,  sortOrder: 1 },
    { id: 'pack_500',  name: 'Growth Pack',   tokenCount: 500,  price: 449,  sortOrder: 2 },
    { id: 'pack_1500', name: 'Pro Pack',      tokenCount: 1500, price: 1199, sortOrder: 3 },
    { id: 'pack_5000', name: 'Scale Pack',    tokenCount: 5000, price: 3499, sortOrder: 4 },
  ];

  for (const data of packageData) {
    await prisma.tokenPackage.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });
  }

  return NextResponse.json({ ok: true, plans: planData.length, packages: packageData.length });
}

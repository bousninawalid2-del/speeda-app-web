import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...\n');

  // ── Plans ───────────────────────────────────────────────────
  const plans = [
    {
      name: 'Starter',
      monthlyPrice: 549,
      yearlyPrice: 439,
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

  for (const data of plans) {
    await prisma.plan.upsert({
      where: { name: data.name },
      update: data,
      create: data,
    });
    console.log(`  ✓ Plan: ${data.name}`);
  }

  // ── Token Packages ──────────────────────────────────────────
  const packages = [
    { name: 'Starter Pack', tokenCount: 200, price: 199, sortOrder: 1 },
    { name: 'Growth Pack', tokenCount: 500, price: 449, sortOrder: 2 },
    { name: 'Pro Pack', tokenCount: 1500, price: 1199, sortOrder: 3 },
    { name: 'Scale Pack', tokenCount: 5000, price: 3499, sortOrder: 4 },
  ];

  for (const data of packages) {
    const existing = await prisma.tokenPackage.findFirst({ where: { name: data.name } });
    if (existing) {
      await prisma.tokenPackage.update({ where: { id: existing.id }, data });
    } else {
      await prisma.tokenPackage.create({ data });
    }
    console.log(`  ✓ Token Package: ${data.name}`);
  }

  // ── Test User ───────────────────────────────────────────────
  const testEmail = 'test@speeda.ai';
  const testPassword = await bcrypt.hash('Test1234!', 12);

  const user = await prisma.user.upsert({
    where: { email: testEmail },
    update: {},
    create: {
      email: testEmail,
      password: testPassword,
      name: 'Test User',
      phone: '+966500000000',
      isVerified: true,
      tokenBalance: 500,
    },
  });
  console.log(`  ✓ Test User: ${testEmail} (password: Test1234!)`);

  // ── Give test user a Pro subscription ───────────────────────
  const proPlan = await prisma.plan.findUnique({ where: { name: 'Pro' } });
  if (proPlan) {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    await prisma.userSubscription.upsert({
      where: { userId: user.id },
      update: {
        planId: proPlan.id,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      create: {
        userId: user.id,
        planId: proPlan.id,
        status: 'active',
        billingType: 'monthly',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });
    console.log(`  ✓ Subscription: Pro plan (active, 30 days)`);
  }

  // ── Test user business profile ──────────────────────────────
  await prisma.activity.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      business_name: 'Speeda Test Business',
      industry: 'Technology',
      country: 'Saudi Arabia',
      location: 'Riyadh',
      business_size: 'Small (1-10)',
      audience_target: 'Young professionals 25-35',
      unique_selling_point: 'AI-powered social media management',
    },
  });
  console.log(`  ✓ Business Profile: Speeda Test Business`);

  // ── Test user preferences ───────────────────────────────────
  await prisma.preference.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      tone_of_voice: 'Professional, Bold',
      language_preference: 'saudi, english',
      business_description: 'AI-powered social media companion for Saudi businesses',
      social_media_goals: 'More Followers, Brand Awareness',
      color_primary: '#0020d4',
      color_secondary: '#00c7f3',
    },
  });
  console.log(`  ✓ Preferences: tone, language, colors`);

  console.log('\n✅ Seed complete!\n');
  console.log('┌────────────────────────────────────┐');
  console.log('│  Test account credentials:         │');
  console.log('│  Email:    test@speeda.ai           │');
  console.log('│  Password: Test1234!               │');
  console.log('└────────────────────────────────────┘');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

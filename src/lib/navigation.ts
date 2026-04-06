/**
 * Maps legacy screen names (from the Vite/React Router version)
 * to Next.js App Router URL paths.
 */
export const screenToPath: Record<string, string> = {
  splash: '/',
  onboarding: '/onboarding',
  auth: '/auth',
  emailVerification: '/auth/verify',
  emailVerified: '/auth/verified',
  resetPassword: '/auth/reset-password',
  setup: '/setup',
  home: '/dashboard',
  chat: '/dashboard/chat',
  'chat-engagement': '/dashboard/chat?tab=engagement',
  'chat-engagement-reviews': '/dashboard/chat?tab=engagement&filter=Reviews',
  'chat-prefill-tokens': '/dashboard/chat?prefill=tokens',
  create: '/dashboard/create',
  campaigns: '/dashboard/campaigns',
  analytics: '/dashboard/analytics',
  social: '/dashboard/social',
  notifications: '/dashboard/notifications',
  engagement: '/dashboard/engagement',
  settings: '/dashboard/settings',
  quickad: '/dashboard/campaigns/quick-ad',
  subscription: '/dashboard/subscription',
  tokens: '/dashboard/tokens',
  'tokens-packs': '/dashboard/tokens?scrollToPacks=true',
  referral: '/dashboard/referral',
  aiActivity: '/dashboard/ai-activity',
  helpCenter: '/dashboard/help',
  contactSupport: '/dashboard/support',
  whatsNew: '/dashboard/whats-new',
  actionPlan: '/dashboard/action-plan',
  competitorWatch: '/dashboard/competitor-watch',
  profile: '/dashboard/settings/profile',
  security: '/dashboard/settings/security',
  planComparison: '/dashboard/settings/plan',
  billingHistory: '/dashboard/settings/billing',
  editBrandVoice: '/dashboard/settings/brand-voice',
  topUp: '/dashboard/campaigns/top-up',
  weeklyReport: '/dashboard/analytics/weekly-report',
  mosScore: '/dashboard/mos-score',
  aiBriefingPreview: '/dashboard/ai-briefing',
  menuManagement: '/dashboard/settings/menu',
  postHistory: '/dashboard/analytics/post-history',
  accountHealth: '/dashboard/settings/account-health',
  postEdit: '/dashboard/create/edit',
  linkTracking: '/dashboard/analytics/link-tracking',
};

/**
 * Resolves a screen name to a URL path.
 * Handles the legacy __doaction__ pattern used in the original app.
 */
export function resolveScreen(screen: string): string {
  if (screen.startsWith('__doaction__')) {
    const parts = screen.split('__');
    const nav = parts[3];
    return screenToPath[nav] ?? '/dashboard';
  }
  return screenToPath[screen] ?? '/dashboard';
}

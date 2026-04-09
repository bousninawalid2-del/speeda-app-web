import { useState } from 'react';
import { useFreeTier } from '../components/FreeTier';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { SplashScreen } from './SplashScreen';
import { OnboardingScreen } from './OnboardingScreen';
import { AuthScreen } from './AuthScreen';
import { EmailVerificationScreen } from './EmailVerificationScreen';
import { EmailVerifiedScreen } from './EmailVerifiedScreen';
import { ResetPasswordScreen } from './ResetPasswordScreen';
import { BusinessSetupScreen } from './BusinessSetupScreen';
import { HomeScreen } from './HomeScreen';
import { AIChatScreen } from './AIChatScreen';
import { CreateScreen } from './CreateScreen';
import { CampaignsScreen } from './CampaignsScreen';
import { AnalyticsScreen } from './AnalyticsScreen';
import { SocialMediaScreen } from './SocialMediaScreen';
import { NotificationsScreen } from './NotificationsScreen';
import { SettingsScreen } from './SettingsScreen';
import { QuickAdScreen } from './QuickAdScreen';
import { SubscriptionScreen } from './SubscriptionScreen';
import { TokensScreen } from './TokensScreen';
import { ReferralScreen } from './ReferralScreen';
import { AIActivityScreen } from './AIActivityScreen';
import { HelpCenterScreen } from './HelpCenterScreen';
import { ContactSupportScreen } from './ContactSupportScreen';
import { WhatsNewScreen } from './WhatsNewScreen';
import { ActionPlanScreen } from './ActionPlanScreen';
import { CompetitorWatchScreen } from './CompetitorWatchScreen';
import { ProfileScreen } from './ProfileScreen';
import { SecurityScreen } from './SecurityScreen';
import { PlanComparisonScreen } from './PlanComparisonScreen';
import { BillingHistoryScreen } from './BillingHistoryScreen';
import { EditBrandVoiceScreen } from './EditBrandVoiceScreen';
import { MosScoreScreen } from './MosScoreScreen';
import { TopUpScreen } from './TopUpScreen';
import { AIBriefingPreviewScreen } from './AIBriefingPreviewScreen';
import { WeeklyReportScreen } from './WeeklyReportScreen';
import { MenuManagementScreen } from './MenuManagementScreen';
import { PostHistoryScreen } from './PostHistoryScreen';
import { AccountHealthScreen } from './AccountHealthScreen';
import { PostEditScreen } from './PostEditScreen';
import { EngagementScreen } from './EngagementScreen';
import { LinkTrackingScreen } from './LinkTrackingScreen';
import { SessionExpiredOverlay } from '../components/SessionExpiredOverlay';
import { BottomNav } from '../components/BottomNav';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { DesktopTopBar } from '../components/DesktopTopBar';
import { useIsMobile } from '../hooks/use-mobile';

type Screen = 'splash' | 'onboarding' | 'auth' | 'emailVerification' | 'emailVerified' | 'resetPassword' | 'setup' | 'home' | 'chat' | 'chat-engagement' | 'chat-engagement-reviews' | 'chat-prefill-tokens' | 'create' | 'campaigns' | 'analytics' | 'social' | 'notifications' | 'settings' | 'quickad' | 'subscription' | 'tokens' | 'tokens-packs' | 'referral' | 'aiActivity' | 'helpCenter' | 'contactSupport' | 'whatsNew' | 'actionPlan' | 'competitorWatch' | 'profile' | 'security' | 'planComparison' | 'billingHistory' | 'editBrandVoice' | 'topUp' | 'weeklyReport' | 'mosScore' | 'aiBriefingPreview' | 'menuManagement' | 'postHistory' | 'accountHealth' | 'postEdit' | 'engagement' | 'linkTracking';

const mainTabs = ['home', 'chat', 'chat-engagement', 'chat-engagement-reviews', 'create', 'campaigns', 'analytics'];

const desktopTopBarScreens = ['home', 'create', 'campaigns', 'analytics', 'social', 'notifications', 'settings', 'tokens', 'referral', 'aiActivity', 'actionPlan', 'competitorWatch', 'profile', 'security', 'planComparison', 'billingHistory', 'editBrandVoice', 'topUp', 'weeklyReport', 'helpCenter', 'contactSupport', 'whatsNew', 'subscription', 'quickad', 'mosScore', 'aiBriefingPreview', 'menuManagement', 'postHistory', 'accountHealth', 'postEdit', 'engagement', 'linkTracking'];

const Index = () => {
  const { i18n } = useTranslation();
  const [screen, setScreen] = useState<Screen>('splash');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pendingActionCardId, setPendingActionCardId] = useState<number | null>(null);
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const [previousScreen, setPreviousScreen] = useState<Screen>('home');
  const isMobile = useIsMobile();
  const { upgrade } = useFreeTier();

  const isPreOnboarding = ['splash', 'onboarding', 'auth', 'emailVerification', 'emailVerified', 'resetPassword', 'setup'].includes(screen);
  const showNav = mainTabs.includes(screen);
  const activeNav = screen.startsWith('chat') ? 'chat' : screen;
  const showDesktopLayout = !isMobile && !isPreOnboarding;
  const showDesktopTopBar = showDesktopLayout && desktopTopBarScreens.includes(screen);
  const isRTL = i18n.language === 'ar';

  const handleNavigate = (s: string) => {
    if (s.startsWith('__doaction__')) {
      const parts = s.split('__');
      const cardId = parseInt(parts[2]);
      const nav = parts[3];
      setPendingActionCardId(cardId);
      setScreen(nav as Screen);
    } else {
      if (s === 'subscription') setPreviousScreen(screen);
      setScreen(s as Screen);
    }
  };

  const renderScreen = () => {
    switch (screen) {
      case 'splash': return <SplashScreen onComplete={() => setScreen('onboarding')} />;
      case 'onboarding': return <OnboardingScreen onComplete={() => setScreen('auth')} />;
      case 'auth': return <AuthScreen onComplete={(mode?: string) => { if (mode === 'signin') { setScreen('home'); } else { setScreen('emailVerification'); } }} onForgotPassword={() => setScreen('resetPassword')} />;
      case 'emailVerification': return <EmailVerificationScreen onVerified={() => setScreen('emailVerified')} onBack={() => setScreen('auth')} />;
      case 'emailVerified': return <EmailVerifiedScreen onContinue={() => setScreen('setup')} />;
      case 'resetPassword': return <ResetPasswordScreen onComplete={() => setScreen('auth')} />;
      case 'setup': return <BusinessSetupScreen onComplete={() => setScreen('home')} />;
      case 'home': return <HomeScreen onNavigate={handleNavigate} pendingActionCardId={pendingActionCardId} onClearPendingAction={() => setPendingActionCardId(null)} />;
      case 'chat': return <AIChatScreen initialTab="chat" onNavigate={(s) => setScreen(s as Screen)} />;
      case 'chat-prefill-tokens': return <AIChatScreen initialTab="chat" initialInputValue="I need help choosing a token pack. What do you recommend?" onNavigate={(s) => setScreen(s as Screen)} />;
      case 'chat-engagement': return <AIChatScreen initialTab="engagement" onNavigate={(s) => setScreen(s as Screen)} />;
      case 'chat-engagement-reviews': return <AIChatScreen initialTab="engagement" initialEngagementFilter="Reviews" onNavigate={(s) => setScreen(s as Screen)} />;
      case 'create': return <CreateScreen />;
      case 'campaigns': return <CampaignsScreen onNavigate={(s) => setScreen(s as Screen)} />;
      case 'analytics': return <AnalyticsScreen onNavigate={(s) => setScreen(s as Screen)} />;
      case 'social': return <SocialMediaScreen onBack={() => setScreen('home')} />;
      case 'notifications': return <NotificationsScreen onBack={() => setScreen('home')} onNavigate={(s) => setScreen(s as Screen)} />;
      case 'engagement': return <EngagementScreen onBack={() => setScreen('home')} onNavigate={(s) => setScreen(s as Screen)} />;
      case 'settings': return <SettingsScreen onBack={() => setScreen('home')} onNavigate={(s) => setScreen(s as Screen)} />;
      case 'quickad': return <QuickAdScreen onBack={() => setScreen('campaigns')} />;
      case 'subscription': return <SubscriptionScreen onBack={() => setScreen(previousScreen)} onUpgradeComplete={upgrade} />;
      case 'tokens': return <TokensScreen onBack={() => setScreen('home')} />;
      case 'tokens-packs': return <TokensScreen onBack={() => setScreen('home')} scrollToPacks />;
      case 'referral': return <ReferralScreen onBack={() => setScreen('settings')} />;
      case 'aiActivity': return <AIActivityScreen onBack={() => setScreen('home')} />;
      case 'helpCenter': return <HelpCenterScreen onBack={() => setScreen('settings')} />;
      case 'contactSupport': return <ContactSupportScreen onBack={() => setScreen('settings')} />;
      case 'whatsNew': return <WhatsNewScreen onBack={() => setScreen('settings')} />;
      case 'actionPlan': return <ActionPlanScreen onBack={() => setScreen('home')} onNavigate={(s) => setScreen(s as Screen)} />;
      case 'competitorWatch': return <CompetitorWatchScreen onBack={() => setScreen('home')} onNavigate={(s) => setScreen(s as Screen)} />;
      case 'profile': return <ProfileScreen onBack={() => setScreen('settings')} onNavigate={(s) => setScreen(s as Screen)} />;
      case 'security': return <SecurityScreen onBack={() => setScreen('settings')} />;
      case 'planComparison': return <PlanComparisonScreen onBack={() => setScreen('settings')} />;
      case 'billingHistory': return <BillingHistoryScreen onBack={() => setScreen('settings')} />;
      case 'editBrandVoice': return <EditBrandVoiceScreen onBack={() => setScreen('settings')} />;
      case 'topUp': return <TopUpScreen onBack={() => setScreen('campaigns')} />;
      case 'weeklyReport': return <WeeklyReportScreen onBack={() => setScreen('analytics')} onNavigate={(s) => setScreen(s as Screen)} />;
      case 'mosScore': return <MosScoreScreen onBack={() => setScreen('home')} onNavigate={(s) => setScreen(s as Screen)} />;
      case 'aiBriefingPreview': return <AIBriefingPreviewScreen onBack={() => setScreen('home')} />;
      case 'menuManagement': return <MenuManagementScreen onBack={() => setScreen('settings')} />;
      case 'postHistory': return <PostHistoryScreen onBack={() => setScreen('analytics')} onNavigate={(s) => setScreen(s as Screen)} />;
      case 'accountHealth': return <AccountHealthScreen onBack={() => setScreen('settings')} onNavigate={(s) => setScreen(s as Screen)} />;
      case 'postEdit': return <PostEditScreen post={{ platform: 'instagram', type: 'Feed Post', caption: '', hashtags: [], status: 'draft' }} onBack={() => setScreen(previousScreen)} onSave={() => {}} />;
      case 'linkTracking': return <LinkTrackingScreen onBack={() => setScreen('analytics')} onNavigate={(s) => setScreen(s as Screen)} />;
      default: return <HomeScreen onNavigate={(s) => setScreen(s as Screen)} />;
    }
  };

  if (isPreOnboarding) {
    return (
      <div className="max-w-[430px] mx-auto relative min-h-screen bg-background overflow-x-hidden">
        <AnimatePresence mode="wait">
          {renderScreen()}
        </AnimatePresence>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="max-w-[430px] mx-auto relative min-h-screen bg-background overflow-x-hidden">
        <AnimatePresence mode="wait">
          {renderScreen()}
        </AnimatePresence>
        {showNav && (
          <BottomNav active={activeNav} onNavigate={(s) => setScreen(s as Screen)} />
        )}
        {showSessionExpired && (
          <SessionExpiredOverlay onSignIn={() => { setShowSessionExpired(false); setScreen('auth'); }} onContactSupport={() => { setShowSessionExpired(false); setScreen('contactSupport'); }} />
        )}
      </div>
    );
  }

  const sidebarWidth = sidebarCollapsed ? 72 : 260;

  return (
    <div className="min-h-screen bg-background flex">
      <DesktopSidebar
        active={activeNav}
        onNavigate={(s) => setScreen(s as Screen)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-250"
        style={{ marginLeft: isRTL ? 0 : sidebarWidth, marginRight: isRTL ? sidebarWidth : 0 }}
      >
        {showDesktopTopBar && (
          <DesktopTopBar onNavigate={(s) => setScreen(s as Screen)} />
        )}
        <main className="flex-1 overflow-y-auto desktop-scrollbar">
          <div className="max-w-[1200px] mx-auto">
            <AnimatePresence mode="wait">
              {renderScreen()}
            </AnimatePresence>
          </div>
        </main>
      </div>
      {showSessionExpired && (
        <SessionExpiredOverlay onSignIn={() => { setShowSessionExpired(false); setScreen('auth'); }} onContactSupport={() => { setShowSessionExpired(false); setScreen('contactSupport'); }} />
      )}
    </div>
  );
};

export default Index;

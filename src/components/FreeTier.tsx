import { useState, createContext, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-client';

// ── Plan types ──
type PlanTier = 'free_trial' | 'starter' | 'pro' | 'business';

// ── Free Tier Context ──
interface FreeTierState {
  isFree:             boolean;
  currentPlan:        PlanTier;
  messagesUsed:       number;
  maxMessages:        number;
  tokensUsed:         number;
  tokensLimit:        number;
  trialDaysRemaining: number;
  trialExpired:       boolean;
  useMessage: () => boolean;
  upgrade:    () => void;
}

const FreeTierContext = createContext<FreeTierState>({
  isFree:             true,
  currentPlan:        'free_trial',
  messagesUsed:       0,
  maxMessages:        5,
  tokensUsed:         0,
  tokensLimit:        50,
  trialDaysRemaining: 0,
  trialExpired:       false,
  useMessage: () => true,
  upgrade:    () => {},
});

export const useFreeTier = () => useContext(FreeTierContext);

/** Map a subscription plan name (from DB) to a PlanTier string. */
function planNameToTier(name?: string | null): PlanTier {
  if (!name) return 'free_trial';
  const lower = name.toLowerCase();
  if (lower.includes('business')) return 'business';
  if (lower.includes('pro'))      return 'pro';
  if (lower.includes('starter'))  return 'starter';
  return 'free_trial';
}

export const FreeTierProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [messagesUsed, setMessagesUsed] = useState(0);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const [trialExpired, setTrialExpired]             = useState(false);
  const [currentPlan, setCurrentPlan]               = useState<PlanTier>('free_trial');
  const [tokensUsed, setTokensUsed]                 = useState(0);
  const [isFree, setIsFree]                         = useState(true);

  const maxMessages = 5;
  const tokensLimit = currentPlan === 'free_trial' ? 50 : currentPlan === 'starter' ? 200 : currentPlan === 'pro' ? 800 : 3000;

  // Fetch real subscription + trial data from the backend
  useEffect(() => {
    if (!isAuthenticated) return;

    const load = async () => {
      try {
        const data = await apiFetch<{
          subscription: { plan: { name: string } } | null;
          trial:        { active: boolean; daysLeft: number };
        }>('/subscriptions');

        const tier = planNameToTier(data.subscription?.plan?.name);
        setCurrentPlan(tier);
        setIsFree(tier === 'free_trial' || tier === 'starter');
        setTrialDaysRemaining(data.trial.daysLeft);
        setTrialExpired(!data.trial.active && !data.subscription);
      } catch {
        // If the request fails, leave defaults (free_trial, no days)
      }
    };

    load();
  }, [isAuthenticated]);

  // Track token usage from the tokens endpoint
  useEffect(() => {
    if (!isAuthenticated) return;
    apiFetch<{ used: number }>('/tokens')
      .then(d => setTokensUsed(d.used))
      .catch(() => {});
  }, [isAuthenticated]);

  const useMessage = () => {
    if (trialExpired && currentPlan === 'free_trial') {
      if (messagesUsed >= maxMessages) return false;
    }
    setMessagesUsed(prev => prev + 1);
    return true;
  };

  const upgrade = () => setIsFree(false);

  return (
    <FreeTierContext.Provider value={{ isFree, currentPlan, messagesUsed, maxMessages, tokensUsed, tokensLimit, trialDaysRemaining, trialExpired, useMessage, upgrade }}>
      {children}
    </FreeTierContext.Provider>
  );
};

// ── Trial Banner ──
export const TrialBanner = ({ onNavigate }: { onNavigate?: (screen: string) => void }) => {
  const { t } = useTranslation();
  const { currentPlan, trialDaysRemaining, trialExpired } = useFreeTier();
  if (currentPlan !== 'free_trial') return null;

  if (trialExpired) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 mx-5 mb-4">
        <p className="text-[14px] font-bold text-destructive">{t('trial.expired')}</p>
        <p className="text-[12px] text-muted-foreground mt-1">{t('trial.expiredDesc')}</p>
        <button
          onClick={() => onNavigate?.('planComparison')}
          className="mt-3 h-9 px-5 rounded-xl gradient-btn text-primary-foreground text-[12px] font-bold btn-press"
        >
          {t('trial.comparePlans')}
        </button>
      </div>
    );
  }

  if (trialDaysRemaining <= 3) {
    return (
      <div className="bg-orange/10 border border-orange/20 rounded-2xl p-3 mx-5 mb-4 flex items-center gap-3">
        <span className="text-lg">⏳</span>
        <div className="flex-1">
          <p className="text-[13px] font-bold text-foreground">
            {trialDaysRemaining === 1
              ? t('trial.daysLeft', { count: trialDaysRemaining })
              : t('trial.daysLeftPlural', { count: trialDaysRemaining })}
          </p>
          <p className="text-[11px] text-muted-foreground">{t('trial.upgradeKeep')}</p>
        </div>
        <button
          onClick={() => onNavigate?.('planComparison')}
          className="h-8 px-4 rounded-lg gradient-btn text-primary-foreground text-[11px] font-bold btn-press shrink-0"
        >
          {t('common.upgrade')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-purple-soft rounded-2xl p-3 mx-5 mb-4 flex items-center gap-3">
      <span className="text-lg">✦</span>
      <div className="flex-1">
        <p className="text-[12px] text-foreground">
          <span className="font-bold">{t('trial.freeTrial')}</span> — {t('trial.trialInfo', { days: trialDaysRemaining, tokens: 50 })}
        </p>
      </div>
    </div>
  );
};

// ── Feature Lock Overlay (new spec) ──
interface FeatureLockOverlayProps {
  children: React.ReactNode;
  requiredPlan: 'starter' | 'pro' | 'business';
  featureName: string;
  featureDescription?: string;
  onUpgrade?: () => void;
}

const planLabels: Record<string, string> = {
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
};

export const FeatureLockOverlay = ({ children, requiredPlan, featureName, featureDescription, onUpgrade }: FeatureLockOverlayProps) => {
  const { t } = useTranslation();
  const { currentPlan } = useFreeTier();
  const [dismissed, setDismissed] = useState(false);
  // Business plan unlocks everything
  if (currentPlan === 'business') return <>{children}</>;
  // Check if current plan meets required plan
  const planOrder: Record<string, number> = { free_trial: 0, starter: 1, pro: 2, business: 3 };
  if ((planOrder[currentPlan] || 0) >= (planOrder[requiredPlan] || 0)) return <>{children}</>;
  if (dismissed) return <>{children}</>;
  return (
    <div className="relative">
      <div className="blur-[6px] pointer-events-none select-none opacity-60">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/40 rounded-2xl backdrop-blur-[1px]">
        <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center mb-3 shadow-lg">
          <Lock size={20} className="text-primary-foreground" strokeWidth={2.5} />
        </div>
        <p className="text-[14px] font-bold text-foreground mb-1">{t('lock.availableOn', { plan: planLabels[requiredPlan] })}</p>
        {featureDescription && (
          <p className="text-[12px] text-muted-foreground text-center max-w-[260px] mb-3">{featureDescription}</p>
        )}
        <button onClick={() => setDismissed(true)} className="h-10 px-6 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press shadow-btn mb-2">
          {t('lock.upgradeTo', { plan: planLabels[requiredPlan] })}
        </button>
        <button className="text-[11px] text-brand-blue font-medium">
          {t('common.askSpeeda')}
        </button>
      </div>
    </div>
  );
};

// ── Upgrade Prompt Overlay ──
interface UpgradePromptProps {
  feature: string;
  benefit: string;
  open: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

export const UpgradePrompt = ({ feature, benefit, open, onClose, onUpgrade }: UpgradePromptProps) => {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-foreground/40 flex items-center justify-center px-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-card rounded-3xl p-8 w-full max-w-[380px] text-center relative"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground">
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock size={20} className="text-primary-foreground" />
            </div>

            <h3 className="text-[20px] font-bold text-foreground mb-2">{t('lock.unlock', { feature })}</h3>
            <p className="text-[14px] text-muted-foreground mb-6">
              {t('lock.upgradeToBenefit', { benefit })}
            </p>

            <button
              onClick={() => { onUpgrade?.(); onClose(); }}
              className="w-full h-[52px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press mb-2"
            >
              {t('common.upgradeNow')}
            </button>
            <p className="text-[12px] text-muted-foreground">{t('common.startingAt')}</p>
            <button className="text-[11px] text-brand-blue font-medium mt-2">
              {t('common.askSpeeda')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ── Blurred Lock Overlay ──
export const BlurredLock = ({ children, label, onUpgrade }: { children: React.ReactNode; label: string; onUpgrade?: () => void }) => {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return <>{children}</>;
  return (
    <div className="relative">
      <div className="blur-[3px] pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/30 rounded-2xl">
        <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center mb-2 shadow-lg">
          <Lock size={18} className="text-primary-foreground" />
        </div>
        <p className="text-[13px] font-semibold text-foreground mb-2">{label}</p>
        <button onClick={() => setDismissed(true)} className="h-9 px-5 rounded-xl gradient-btn text-primary-foreground text-[12px] font-bold btn-press">
          {t('lock.upgradeToUnlock')}
        </button>
      </div>
    </div>
  );
};

// ── AI Message Limit Banner ──
export const AIMessageLimitBanner = () => {
  const { t } = useTranslation();
  const { isFree, messagesUsed, maxMessages, trialExpired, currentPlan } = useFreeTier();
  if (!isFree) return null;

  if (trialExpired && currentPlan === 'free_trial') {
    const remaining = maxMessages - messagesUsed;
    return (
      <div className="text-center py-1.5 text-[11px] font-medium text-destructive">
        {remaining > 0
          ? t('lock.limitedMode', { remaining, max: maxMessages })
          : t('lock.dailyReached')
        }
      </div>
    );
  }

  const remaining = maxMessages - messagesUsed;
  const isLow = remaining <= 2;

  return (
    <div className={`text-center py-1.5 text-[11px] font-medium ${isLow ? 'text-orange' : 'text-muted-foreground'}`}>
      {remaining > 0
        ? t('lock.remaining', { remaining, max: maxMessages })
        : t('lock.usedFree')
      }
    </div>
  );
};

// ── AI Message Limit Reached Card ──
export const AIMessageLimitReached = ({ onUpgrade }: { onUpgrade?: () => void }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-card rounded-2xl border border-border-light p-5 mx-5 mt-3 text-center">
      <div className="w-10 h-10 rounded-full gradient-btn flex items-center justify-center mx-auto mb-3">
        <span className="text-[18px] text-primary-foreground">✦</span>
      </div>
      <h3 className="text-[16px] font-bold text-foreground mb-1">{t('lock.dailyLimitReached')}</h3>
      <p className="text-[13px] text-muted-foreground mb-4">{t('lock.dailyLimitDesc')}</p>
      <button onClick={onUpgrade} className="w-full h-[48px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[14px] btn-press mb-2">
        {t('common.upgrade')}
      </button>
      <p className="text-[12px] text-muted-foreground">{t('lock.continueTomorrow')}</p>
    </div>
  );
};

// ── Free Plan Badge ──
export const FreePlanBadge = () => {
  const { t } = useTranslation();
  const { isFree, currentPlan, trialDaysRemaining } = useFreeTier();
  if (!isFree) return null;
  if (currentPlan === 'free_trial') {
    return (
      <span className="text-[10px] font-semibold text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded-md">
        {t('lock.trialBadge', { days: trialDaysRemaining })}
      </span>
    );
  }
  return (
    <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{t('lock.freePlan')}</span>
  );
};

// ── Content Studio Locked Banner ──
export const ContentLockedBanner = () => {
  const { t } = useTranslation();
  return (
    <div className="bg-purple-soft rounded-2xl p-3 mb-4">
      <p className="text-[13px] text-brand-blue font-medium text-center">{t('lock.generationLocked')}</p>
    </div>
  );
};

// ── Watermark helper ──
export const getWatermarkText = (plan: PlanTier): string | null => {
  if (plan === 'free_trial' || plan === 'starter') {
    return '\n\nPowered by Speeda AI ✦ speeda.ai';
  }
  return null;
};

export const WatermarkBadge = () => {
  const { t } = useTranslation();
  const { currentPlan } = useFreeTier();
  if (currentPlan !== 'free_trial' && currentPlan !== 'starter') return null;
  return (
    <div className="bg-muted rounded-xl p-2.5 mt-2">
      <p className="text-[10px] text-muted-foreground text-center">
        {t('lock.watermark')}{' '}
        <span className="text-brand-blue font-semibold">{t('lock.watermarkRemove')}</span>
      </p>
    </div>
  );
};
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, User, Shield, CreditCard, Coins, Globe2, Languages, HelpCircle, MessageCircle, Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTokens } from '../hooks/useTokens';
import { useSubscription } from '../hooks/useSubscription';

interface SettingsScreenProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mt-6">
    <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
    <div className="bg-card rounded-2xl border border-border-light overflow-hidden">{children}</div>
  </div>
);

const Row = ({ label, value, icon: Icon, onClick }: { label: string; value?: string; icon?: any; onClick?: () => void }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-border-light last:border-0 text-start hover:bg-muted/30 transition-colors">
    {Icon && <Icon size={16} className="text-muted-foreground flex-shrink-0" />}
    <span className="text-[14px] font-medium text-foreground flex-1">{label}</span>
    {value && <span className="text-[13px] text-muted-foreground">{value}</span>}
    <ChevronRight size={14} className="text-muted-foreground rtl:rotate-180 flex-shrink-0" />
  </button>
);

export const SettingsScreen = ({ onBack, onNavigate }: SettingsScreenProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { data: tokensData } = useTokens();
  const { data: subData } = useSubscription();

  const tokenBalance = tokensData?.balance ?? 0;
  const tokenTotal = tokensData?.total ?? 500;
  const tokenPercent = tokenTotal > 0 ? Math.round((tokenBalance / tokenTotal) * 100) : 0;
  const planName = subData?.subscription?.plan?.name ?? (subData?.trial?.active ? 'Free Trial' : 'Free');
  const displayName = user?.name ?? user?.email ?? '';

  const switchLang = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
          <h1 className="text-[20px] font-bold text-foreground">{t('settings.title')}</h1>
        </div>

        {/* Account */}
        <Section title={t('settings.account')}>
          <Row label={t('settings.profile')} value={displayName} icon={User} onClick={() => onNavigate?.('profile')} />
          <Row label={t('settings.security')} icon={Shield} onClick={() => onNavigate?.('security')} />
          <div className="px-4 py-3.5 border-b border-border-light">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard size={16} className="text-muted-foreground" />
              <span className="text-[14px] font-medium text-foreground">{t('settings.subscription')}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-primary-foreground gradient-btn px-2 py-0.5 rounded-md">{planName}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => onNavigate?.('subscription')} className="flex-1 h-9 rounded-xl gradient-btn text-primary-foreground text-[12px] font-bold btn-press">{t('settings.upgradePlan')}</button>
            </div>
            <div className="flex gap-3 mt-2">
              <button onClick={() => onNavigate?.('planComparison')} className="text-brand-blue text-[12px] font-semibold">{t('settings.viewPlanComparison')}</button>
              <button onClick={() => onNavigate?.('billingHistory')} className="text-brand-blue text-[12px] font-semibold">{t('settings.billingHistory')}</button>
            </div>
          </div>
          <Row label={t('settings.referralProgram')} icon={Gift} onClick={() => onNavigate?.('referral')} />
        </Section>

        {/* Tokens */}
        <Section title={t('settings.tokensSection')}>
          <button onClick={() => onNavigate?.('tokens')} className="w-full px-4 py-3.5 text-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-foreground">{t('settings.tokensRemaining', { count: tokenBalance })}</p>
                <div className="h-1.5 rounded-full bg-muted mt-2 w-40 overflow-hidden">
                  <div className="h-full gradient-btn rounded-full" style={{ width: `${tokenPercent}%` }} />
                </div>
              </div>
              <span className="text-brand-blue text-[13px] font-semibold">{t('settings.manageTokens')}</span>
            </div>
          </button>
        </Section>

        {/* Social Platforms */}
        <Section title={t('settings.connectedPlatforms')}>
          <button onClick={() => onNavigate?.('social')} className="w-full px-4 py-3.5 text-left flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium text-foreground">Manage Social Accounts</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">Connect or disconnect platforms via Ayrshare</p>
            </div>
            <ChevronRight size={14} className="text-muted-foreground rtl:rotate-180" />
          </button>
        </Section>

        {/* Language */}
        <Section title={t('settings.languageSection')}>
          {[
            { code: 'en', flag: '🇬🇧', label: 'English' },
            { code: 'ar', flag: '🇸🇦', label: 'العربية' },
            { code: 'fr', flag: '🇫🇷', label: 'Français' },
          ].map((l) => (
            <button key={l.code} onClick={() => switchLang(l.code)} className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-border-light last:border-0 ${i18n.language === l.code ? 'bg-purple-soft' : ''}`}>
              <span className="text-[18px]">{l.flag}</span>
              <span className="text-[14px] font-medium text-foreground flex-1">{l.label}</span>
              {i18n.language === l.code && <span className="text-[12px] font-bold text-brand-blue">✓</span>}
            </button>
          ))}
        </Section>

        {/* Support */}
        <Section title={t('settings.support')}>
          <Row label={t('settings.helpCenter')} icon={HelpCircle} onClick={() => onNavigate?.('helpCenter')} />
          <Row label={t('settings.contactSupport')} icon={MessageCircle} onClick={() => onNavigate?.('contactSupport')} />
        </Section>

        {/* About */}
        <Section title={t('settings.about')}>
          <div className="px-4 py-3.5 border-b border-border-light">
            <div className="flex justify-between">
              <span className="text-[14px] text-foreground">{t('settings.version')}</span>
              <span className="text-[14px] text-muted-foreground">4.5</span>
            </div>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[11px] text-muted-foreground">{t('settings.madeWith')}</p>
            <p className="text-[13px] text-brand-blue font-medium mt-1">speeda.ai</p>
          </div>
        </Section>
      </div>
    </motion.div>
  );
};

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import _speedaLogo from '@/assets/speeda-logo-horizontal.png';
import _speedaIcon from '@/assets/speeda-logo-icon-collapsed.png';
// Extract URL string from Next.js StaticImageData (Vite compat)
const speedaLogo = (typeof _speedaLogo === 'string' ? _speedaLogo : (_speedaLogo as { src: string }).src);
const speedaIcon = (typeof _speedaIcon === 'string' ? _speedaIcon : (_speedaIcon as { src: string }).src);

interface DesktopSidebarProps {
  active: string;
  onNavigate: (screen: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

// Reuse same SVG icons from BottomNav but adapted for sidebar
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'hsl(233,100%,42%)' : 'none'} stroke={active ? 'hsl(233,100%,42%)' : '#9ca3af'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z" fillOpacity={active ? 0.15 : 0} />
    <line x1="12" y1="21" x2="12" y2="15" />
  </svg>
);

const CreateIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? 'hsl(233,100%,42%)' : '#9ca3af'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 3.5l4 4L7.5 20.5l-4.5 1 1-4.5L16.5 3.5z" fill={active ? 'hsl(233,100%,42%)' : 'none'} fillOpacity={active ? 0.15 : 0} />
    <line x1="14" y1="6" x2="18" y2="10" />
    <path d="M20.5 2l.5 1.5L22.5 4l-1.5.5L20.5 6l-.5-1.5L18.5 4l1.5-.5z" fill={active ? 'hsl(233,100%,42%)' : '#9ca3af'} stroke="none" />
  </svg>
);

const AISparkleIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? 'hsl(233,100%,42%)' : '#9ca3af'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" fill={active ? 'hsl(233,100%,42%)' : 'none'} fillOpacity={active ? 0.2 : 0} />
    <path d="M18 14l.75 2.25L21 17l-2.25.75L18 20l-.75-2.25L15 17l2.25-.75L18 14z" fill={active ? 'hsl(233,100%,42%)' : '#9ca3af'} fillOpacity={active ? 0.3 : 0.15} stroke={active ? 'hsl(233,100%,42%)' : '#9ca3af'} strokeWidth="1" />
  </svg>
);

const AdsIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'hsl(233,100%,42%)' : 'none'} stroke={active ? 'hsl(233,100%,42%)' : '#9ca3af'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13" fillOpacity={0} />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" fillOpacity={active ? 0.15 : 0} />
  </svg>
);

const StatsIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? 'hsl(233,100%,42%)' : '#9ca3af'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="14" width="4" height="7" rx="1" fill={active ? 'hsl(233,100%,42%)' : 'none'} fillOpacity={active ? 0.15 : 0} />
    <rect x="10" y="9" width="4" height="12" rx="1" fill={active ? 'hsl(233,100%,42%)' : 'none'} fillOpacity={active ? 0.15 : 0} />
    <rect x="16" y="4" width="4" height="17" rx="1" fill={active ? 'hsl(233,100%,42%)' : 'none'} fillOpacity={active ? 0.15 : 0} />
    <path d="M18 3l2.5 0M20.5 3l0 2.5" strokeWidth="1.5" />
  </svg>
);

const navItems = [
  { id: 'home', labelKey: 'nav.home', Icon: HomeIcon },
  { id: 'create', labelKey: 'nav.create', Icon: CreateIcon },
  { id: 'chat', labelKey: 'nav.ai', Icon: AISparkleIcon, isAI: true },
  { id: 'campaigns', labelKey: 'nav.ads', Icon: AdsIcon },
  { id: 'analytics', labelKey: 'nav.stats', Icon: StatsIcon },
];

export const DesktopSidebar = ({ active, onNavigate, collapsed, onToggleCollapse }: DesktopSidebarProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { data: subData } = useSubscription();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const isTrialActive = subData?.trial?.active ?? true;
  const hasSubscription = !!subData?.subscription;
  const showSubscriptionNav = !isTrialActive && !hasSubscription;
  const planLabel = subData?.subscription?.plan?.name ?? (subData?.trial?.active ? 'Free Trial' : 'Free');
  const userInitial = (user?.name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase();
  const displayName = user?.name ?? user?.email ?? '';
  const isRTL = i18n.language === 'ar';
  const tooltipSideClass = isRTL
    ? 'right-[calc(100%+8px)]'
    : 'left-[calc(100%+8px)]';

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className={`fixed top-0 h-screen bg-card z-50 flex flex-col ${isRTL ? 'right-0' : 'left-0'}`}
      style={{
        borderRight: isRTL ? undefined : '1px solid hsl(264 30% 92%)',
        borderLeft: isRTL ? '1px solid hsl(264 30% 92%)' : undefined,
        boxShadow: isRTL ? '-4px 0 24px rgba(0,0,0,0.03)' : '4px 0 24px rgba(0,0,0,0.03)',
      }}
    >
      {/* Logo area */}
      <button onClick={() => onNavigate('home')} className="pt-6 pb-4 flex items-center justify-center">
        {collapsed ? (
          <img src={speedaIcon} alt="Speeda AI" className="w-8 h-8" />
        ) : (
          <img src={speedaLogo} alt="Speeda AI" className="h-8 object-contain" />
        )}
      </button>

      {/* Divider */}
      <div className="mx-4 h-px bg-border-light" />

      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapse}
        className="mx-4 mt-3 mb-1 flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors duration-150 self-end"
      >
        {collapsed
          ? (isRTL ? <ChevronLeft size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />)
          : (isRTL ? <ChevronRight size={16} className="text-muted-foreground" /> : <ChevronLeft size={16} className="text-muted-foreground" />)}
      </button>

      {/* Nav items */}
      <nav className="flex-1 px-3 mt-2 space-y-1">
        {navItems.map(item => {
          const isActive = active === item.id || (item.id === 'chat' && active.startsWith('chat'));
          return (
            <div key={item.id} className="relative">
              <button
                onClick={() => onNavigate(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`w-full flex items-center gap-3 h-12 rounded-xl transition-all duration-150 ${
                  collapsed ? 'justify-center px-0' : 'px-4'
                } ${
                  isActive
                    ? 'bg-[hsl(233,85%,96%)] text-primary'
                    : 'text-muted-foreground hover:bg-[hsl(233,50%,97%)]'
                }`}
                style={item.isAI && isActive ? (isRTL
                  ? { borderRight: '3px solid', borderImage: 'linear-gradient(to bottom, hsl(233,100%,42%), hsl(193,100%,48%)) 1' }
                  : { borderLeft: '3px solid', borderImage: 'linear-gradient(to bottom, hsl(233,100%,42%), hsl(193,100%,48%)) 1' }) : undefined}
              >
                <item.Icon active={isActive} />
                {!collapsed && (
                  <span className={`text-[14px] font-medium ${isActive ? 'text-primary font-semibold' : ''}`}>
                    {t(item.labelKey)}
                  </span>
                )}
              </button>
              {/* Tooltip for collapsed mode */}
              {collapsed && hoveredItem === item.id && (
                <div className={`absolute ${tooltipSideClass} top-1/2 -translate-y-1/2 bg-foreground text-primary-foreground text-[12px] font-medium px-3 py-1.5 rounded-lg whitespace-nowrap z-[100] pointer-events-none`}>
                  {t(item.labelKey)}
                </div>
              )}
            </div>
          );
        })}

        {/* AI Quick Access Card */}
        <div className="pt-4">
          <button
            onClick={() => onNavigate('chat')}
            className={`w-full rounded-2xl flex items-center gap-2 transition-all duration-150 hover:brightness-105 ${
              collapsed ? 'p-3 justify-center' : 'p-4'
            }`}
            style={{ background: 'linear-gradient(135deg, hsl(233,100%,42%) 0%, hsl(193,100%,48%) 100%)' }}
          >
            <span className="text-primary-foreground text-[20px]">✦</span>
            {!collapsed && (
              <span className="text-[13px] font-semibold text-primary-foreground">{t('chat.title')}</span>
            )}
          </button>
        </div>
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-1">
        {/* Subscription — shown only after free trial ends and no active subscription */}
        {showSubscriptionNav && (
          <div className="relative">
            <button
              onClick={() => onNavigate('subscription')}
              onMouseEnter={() => setHoveredItem('subscription')}
              onMouseLeave={() => setHoveredItem(null)}
              className={`w-full flex items-center gap-3 h-12 rounded-xl transition-all duration-150 ${
                collapsed ? 'justify-center px-0' : 'px-4'
              }`}
              style={{
                background: 'linear-gradient(135deg, hsl(233,100%,42%) 0%, hsl(193,100%,48%) 100%)',
                color: '#fff',
              }}
            >
              <CreditCard size={20} strokeWidth={1.5} />
              {!collapsed && <span className="text-[14px] font-semibold">{t('nav.subscription')}</span>}
            </button>
            {collapsed && hoveredItem === 'subscription' && (
              <div className={`absolute ${tooltipSideClass} top-1/2 -translate-y-1/2 bg-foreground text-primary-foreground text-[12px] font-medium px-3 py-1.5 rounded-lg whitespace-nowrap z-[100] pointer-events-none`}>
                {t('nav.subscription')}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        <div className="relative">
          <button
            onClick={() => onNavigate('settings')}
            onMouseEnter={() => setHoveredItem('settings')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`w-full flex items-center gap-3 h-12 rounded-xl transition-all duration-150 ${
              collapsed ? 'justify-center px-0' : 'px-4'
            } text-muted-foreground hover:bg-[hsl(233,50%,97%)]`}
          >
            <Settings size={20} strokeWidth={1.5} />
            {!collapsed && <span className="text-[14px] font-medium">{t('settings.title')}</span>}
          </button>
          {collapsed && hoveredItem === 'settings' && (
            <div className={`absolute ${tooltipSideClass} top-1/2 -translate-y-1/2 bg-foreground text-primary-foreground text-[12px] font-medium px-3 py-1.5 rounded-lg whitespace-nowrap z-[100] pointer-events-none`}>
              {t('settings.title')}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-1 h-px bg-border-light" />

        {/* User profile */}
        <button onClick={() => onNavigate('profile')} className={`w-full flex items-center gap-3 rounded-xl p-3 hover:bg-[hsl(233,50%,97%)] transition-colors ${collapsed ? 'justify-center' : ''}`}>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-primary-foreground text-[13px] font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, hsl(233,100%,42%) 0%, hsl(193,100%,48%) 100%)' }}
          >
            {userInitial}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-foreground truncate">{displayName}</p>
              <span
                className="inline-block text-[10px] font-bold text-primary-foreground px-2 py-0.5 rounded-md mt-0.5"
                style={{ background: 'linear-gradient(135deg, hsl(233,100%,42%) 0%, hsl(193,100%,48%) 100%)' }}
              >
                {planLabel}
              </span>
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
};

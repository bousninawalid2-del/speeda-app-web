import { motion } from 'framer-motion';
import speedaIconWhite from '@/assets/speeda-icon-white.png';
import { useTranslation } from 'react-i18next';

interface BottomNavProps {
  active: string;
  onNavigate: (screen: string) => void;
}

// Custom SVG Nav Icons — thin, elegant, 1.5px stroke
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
    {/* Sparkle at pen tip */}
    <path d="M20.5 2l.5 1.5L22.5 4l-1.5.5L20.5 6l-.5-1.5L18.5 4l1.5-.5z" fill={active ? 'hsl(233,100%,42%)' : '#9ca3af'} stroke="none" />
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
    {/* Trend arrow */}
    <path d="M18 3l2.5 0M20.5 3l0 2.5" strokeWidth="1.5" />
  </svg>
);

// Neural sparkle constellation icon for AI center button
const AIIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {/* Neural nodes */}
    <circle cx="12" cy="8" r="1.5" fill="#fff" stroke="none" />
    <circle cx="7" cy="14" r="1.5" fill="#fff" stroke="none" />
    <circle cx="17" cy="14" r="1.5" fill="#fff" stroke="none" />
    <circle cx="12" cy="19" r="1.2" fill="#fff" stroke="none" />
    {/* Connection lines */}
    <line x1="12" y1="9.5" x2="7" y2="12.5" opacity="0.7" />
    <line x1="12" y1="9.5" x2="17" y2="12.5" opacity="0.7" />
    <line x1="7" y1="15.5" x2="12" y2="17.8" opacity="0.7" />
    <line x1="17" y1="15.5" x2="12" y2="17.8" opacity="0.7" />
    {/* Center sparkle */}
    <path d="M12 11.5l.4 1.1 1.1.4-1.1.4-.4 1.1-.4-1.1-1.1-.4 1.1-.4z" fill="#fff" stroke="none" />
  </svg>
);

const navItems = [
  { id: 'home', labelKey: 'nav.home', Icon: HomeIcon },
  { id: 'create', labelKey: 'nav.create', Icon: CreateIcon },
  { id: 'chat', labelKey: 'nav.ai', Icon: null },
  { id: 'campaigns', labelKey: 'nav.ads', Icon: AdsIcon },
  { id: 'analytics', labelKey: 'nav.stats', Icon: StatsIcon },
];

export const BottomNav = ({ active, onNavigate }: BottomNavProps) => {
  const { t } = useTranslation();
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border-light shadow-nav">
      <div className="flex items-end justify-around h-[72px] px-2 max-w-[430px] mx-auto pb-safe">
        {navItems.map(item => {
          if (item.id === 'chat') {
            return (
              <button
                key="chat"
                onClick={() => onNavigate('chat')}
                className="relative -mt-6 flex flex-col items-center"
              >
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  animate={{
                    boxShadow: [
                      '0 6px 24px rgba(0,32,212,0.35)',
                      '0 8px 32px rgba(0,32,212,0.5)',
                      '0 6px 24px rgba(0,32,212,0.35)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-[56px] h-[56px] rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #0020d4 0%, #00c7f3 100%)',
                  }}
                >
                  <span className="text-white text-[24px] leading-none">✦</span>
                </motion.div>
                <span className="text-[10px] font-bold text-muted-foreground mt-1">{t('nav.ai')}</span>
              </button>
            );
          }
          const IconComponent = item.Icon!;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center justify-center gap-1 pt-2 pb-1 px-3 min-w-[56px] transition-colors duration-200"
            >
              <IconComponent active={isActive} />
              <span className={`text-[10px] font-semibold transition-colors duration-200 ${isActive ? 'text-brand-blue' : 'text-muted-foreground'}`}>
                {t(item.labelKey)}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="w-1 h-1 rounded-full bg-brand-blue"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

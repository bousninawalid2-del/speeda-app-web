import { useState } from 'react';
import { Bell, Globe2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTokens } from '@/hooks/useTokens';

interface DesktopTopBarProps {
  onNavigate: (screen: string) => void;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export const DesktopTopBar = ({ onNavigate }: DesktopTopBarProps) => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const { data: tokensData } = useTokens();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const tokenCount = tokensData?.balance ?? 0;
  const displayName = user?.name?.split(' ')[0] ?? 'there';

  const switchLang = (lang: string) => {
    i18n.changeLanguage(lang);
    setLangMenuOpen(false);
  };

  return (
    <div className="h-[72px] bg-card border-b border-border-light flex items-center justify-between px-8 flex-shrink-0">
      <div>
        <span className="text-[20px] font-bold text-foreground">
          {getGreeting()}, <span className="text-foreground">{displayName}</span>
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-green-accent animate-pulse-dot" />
        <span className="text-[13px] text-green-accent font-medium">Marketing Operating System · Active</span>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={() => onNavigate('tokens')} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl bg-card border text-[13px] font-bold hover:shadow-sm transition-shadow ${tokenCount < 50 ? 'border-red-accent/30 text-red-accent' : 'border-border-light text-primary'}`}>
          <span>✦</span> {tokenCount}
        </button>

        <button onClick={() => onNavigate('notifications')} className="w-10 h-10 rounded-xl bg-card border border-border-light flex items-center justify-center relative hover:shadow-sm transition-shadow">
          <Bell size={16} className="text-muted-foreground" />
        </button>

        <div className="relative">
          <button onClick={() => setLangMenuOpen(!langMenuOpen)} className="w-10 h-10 rounded-xl bg-card border border-border-light flex items-center justify-center hover:shadow-sm transition-shadow">
            <Globe2 size={16} className="text-muted-foreground" />
          </button>
          {langMenuOpen && (
            <div className="absolute top-12 right-0 bg-card rounded-2xl border border-border-light shadow-xl z-50 overflow-hidden w-44">
              {[
                { code: 'en', flag: '🇬🇧', label: 'English' },
                { code: 'ar', flag: '🇸🇦', label: 'العربية' },
                { code: 'fr', flag: '🇫🇷', label: 'Français' },
              ].map(l => (
                <button key={l.code} onClick={() => switchLang(l.code)} className={`w-full flex items-center gap-2 px-4 py-3 text-start text-[14px] font-medium transition-colors ${i18n.language === l.code ? 'bg-purple-soft text-primary' : 'text-foreground hover:bg-muted'}`}>
                  <span>{l.flag}</span>
                  <span className="flex-1">{l.label}</span>
                  {i18n.language === l.code && <span className="text-primary font-bold">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

import speedaLogo from '@/assets/speeda-logo-horizontal.png';
import speedaIcon from '@/assets/speeda-logo-icon-collapsed.png';

const speedaLogoSrc = typeof speedaLogo === 'string' ? speedaLogo : (speedaLogo as { src: string }).src;
const speedaIconSrc = typeof speedaIcon === 'string' ? speedaIcon : (speedaIcon as { src: string }).src;

interface DesktopSidebarProps {
  active: string;
  onNavigate: (screen: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'hsl(233,100%,42%)' : 'none'} stroke={active ? 'hsl(233,100%,42%)' : '#9ca3af'} strokeWidth="1.5">
    <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1v-9.5z" fillOpacity={active ? 0.15 : 0} />
    <line x1="12" y1="21" x2="12" y2="15" />
  </svg>
);

const CreateIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? 'hsl(233,100%,42%)' : '#9ca3af'} strokeWidth="1.5" strokeLinecap="round">
    <path d="M16.5 3.514 4L17.5 20.51-4.5 1 1-4.5L16.5 3.5z" fill={active ? 'hsl(233,100%,42%)' : 'none'} fillOpacity={active ? 0.15 : 0} />
    <line x1="14" y1="6" x2="18" y2="10" />
  </svg>
);

const AISparkleIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? 'hsl(233,100%,42%)' : '#9ca3af'} strokeWidth="1.5" strokeLinecap="round">
    <path d="M12 21.5 4.5 18 81-4.5 1.5l12 14.1-1.5 5.518 Rid-5.1.512 2v1.111" fillOpacity={active ? 0.2 : 0} />
  </svg>
);

const AdsIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? 'hsl(233,100%,42%)' : '#9ca3af'} strokeWidth="1.5">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

const AnalyticsIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? 'hsl(233,100%,42%)' : '#9ca3af'} strokeWidth="1.5">
    <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" />
  </svg>
);

export default function DesktopSidebar({
  active,
  onNavigate,
  collapsed,
  onToggleCollapse,
}: DesktopSidebarProps) {
  const { user } = useAuth();
  const { isTrial, tierName } = useSubscription();

  const navItems = [
    { id: 'main', label: 'الرئيسية', icon: HomeIcon },
    { id: 'create', label: 'إنشاء', icon: CreateIcon },
    { id: 'ai-agents', label: 'الذكاء الاصطناعي', icon: AISparkleIcon },
    { id: 'ads', label: 'الإعلانات', icon: AdsIcon },
    { id: 'analytics', label: 'الإحصائيات', icon: AnalyticsIcon },
  ];

  return (
    <aside
      dir="rtl"
      className={`fixed top-0 right-0 h-screen bg-card border-l border-border transition-all duration-300 z-40 flex flex-col justify-between p-4 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header & Logo */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <img src={speedaLogoSrc} alt="Speeda AI" className="h-8 object-contain" />
          )}
          {collapsed && (
            <img src={speedaIconSrc} alt="Speeda AI" className="h-8 w-8 object-contain mx-auto" />
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            {collapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon active={isActive} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Settings & Profile */}
      <div className="space-y-3 pt-4 border-t border-border">
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            active === 'settings'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Settings className="w-5 h-5" />
          {!collapsed && <span>الإعدادات</span>}
        </button>

        {/* User Badge */}
        {!collapsed && (
          <div className="flex items-center justify-between p-2.5 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-foreground truncate max-w-[100px]">
                  {user?.email || 'المستخدم'}
                </p>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {isTrial ? 'تجربة مجانية' : tierName}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
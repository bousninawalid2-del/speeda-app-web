'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { BottomNav } from '@/components/BottomNav';
import { DesktopSidebar } from '@/components/DesktopSidebar';
import { DesktopTopBar } from '@/components/DesktopTopBar';
import { SessionExpiredOverlay } from '@/components/SessionExpiredOverlay';
import { useIsMobile } from '@/hooks/use-mobile';
import { resolveScreen } from '@/lib/navigation';

const mainTabPaths = ['/dashboard', '/dashboard/chat', '/dashboard/create', '/dashboard/campaigns', '/dashboard/analytics'];

function getActiveNav(pathname: string): string {
  if (pathname.startsWith('/dashboard/chat')) return 'chat';
  if (pathname === '/dashboard') return 'home';
  const segment = pathname.split('/dashboard/')[1]?.split('/')[0];
  return segment ?? 'home';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { i18n } = useTranslation();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSessionExpired, setShowSessionExpired] = useState(false);

  const activeNav = getActiveNav(pathname);
  const showNav = mainTabPaths.includes(pathname);
  const isRTL = i18n.language === 'ar';
  const sidebarWidth = sidebarCollapsed ? 72 : 260;

  const handleNavigate = (screen: string) => {
    router.push(resolveScreen(screen));
  };

  if (isMobile) {
    return (
      <div className="max-w-[430px] mx-auto relative min-h-screen bg-background overflow-x-hidden">
        {children}
        {showNav && (
          <BottomNav active={activeNav} onNavigate={handleNavigate} />
        )}
        {showSessionExpired && (
          <SessionExpiredOverlay
            onSignIn={() => { setShowSessionExpired(false); router.push('/auth'); }}
            onContactSupport={() => { setShowSessionExpired(false); router.push('/dashboard/support'); }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DesktopSidebar
        active={activeNav}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-250"
        style={{ marginLeft: isRTL ? 0 : sidebarWidth, marginRight: isRTL ? sidebarWidth : 0 }}
      >
        <DesktopTopBar onNavigate={handleNavigate} />
        <main className="flex-1 overflow-y-auto desktop-scrollbar">
          <div className="max-w-[1200px] mx-auto">
            {children}
          </div>
        </main>
      </div>
      {showSessionExpired && (
        <SessionExpiredOverlay
          onSignIn={() => { setShowSessionExpired(false); router.push('/auth'); }}
          onContactSupport={() => { setShowSessionExpired(false); router.push('/dashboard/support'); }}
        />
      )}
    </div>
  );
}

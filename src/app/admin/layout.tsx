'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, CreditCard, Package, Users, LogOut } from 'lucide-react';
import { getStoredUser } from '@/lib/api-client';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/plans', label: 'Plans', icon: CreditCard },
  { href: '/admin/token-packages', label: 'Token Packs', icon: Package },
  { href: '/admin/users', label: 'Users', icon: Users },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Client-side role check — API routes also enforce this
    const user = getStoredUser();
    if (!user || user.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }
    setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-e border-border min-h-screen p-4 flex flex-col">
        <div className="mb-8">
          <h2 className="text-[18px] font-extrabold text-foreground">{'\u2726'} Speeda Admin</h2>
          <p className="text-[11px] text-muted-foreground mt-1">Backoffice Management</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-blue/10 text-brand-blue font-bold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mt-auto"
        >
          <LogOut size={18} />
          Back to App
        </Link>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

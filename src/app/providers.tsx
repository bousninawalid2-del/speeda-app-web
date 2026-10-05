'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FreeTierProvider } from '@/components/FreeTier';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import i18n, { applyDir } from '@/i18n';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  // React resets <html> attributes to the server-rendered ones during
  // hydration, wiping the dir/lang/font set at i18n init. Re-apply once
  // hydrated (language changes are handled by the i18n listener).
  useEffect(() => { applyDir(i18n.language); }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <FreeTierProvider>
            <Toaster />
            <Sonner />
            {children}
          </FreeTierProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FreeTierProvider } from '@/components/FreeTier';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import '@/i18n';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

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

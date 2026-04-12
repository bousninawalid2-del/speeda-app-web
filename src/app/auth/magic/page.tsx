'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { addOnboardingParam, isOnboardingForcedValue, shouldShowOnboarding } from '@/lib/onboarding';

function MagicLinkContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { loginWithTokens } = useAuth();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'error'>(token ? 'loading' : 'error');
  const forceOnboarding = isOnboardingForcedValue(params.get('onboarding'))
    || isOnboardingForcedValue(params.get('showOnboarding'));

  useEffect(() => {
    if (!token) return;

    fetch('/api/auth/quick-login', {
      method:      'PUT',
      credentials: 'same-origin',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.accessToken) {
          loginWithTokens(data);
          router.replace(addOnboardingParam('/setup', shouldShowOnboarding(forceOnboarding)));
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [forceOnboarding, loginWithTokens, router, token]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <p className="text-xl font-semibold text-destructive mb-2">Link expired or invalid</p>
          <p className="text-muted-foreground mb-6">This magic link has already been used or has expired.</p>
          <button
            onClick={() => router.replace('/auth')}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <p className="text-xl font-semibold text-destructive mb-2">Link expired or invalid</p>
          <p className="text-muted-foreground mb-6">This magic link has already been used or has expired.</p>
          <button
            onClick={() => router.replace('/auth')}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-lg font-semibold">Signing you in…</p>
      </div>
    </div>
  );
}

export default function MagicLinkPage() {
  return (
    <Suspense>
      <MagicLinkContent />
    </Suspense>
  );
}

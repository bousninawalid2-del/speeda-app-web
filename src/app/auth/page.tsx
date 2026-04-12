'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthScreen } from '@/screens/AuthScreen';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { addOnboardingParam, isOnboardingForcedValue, shouldShowOnboarding } from '@/lib/onboarding';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, sendMagicLink } = useAuth();

  const referralCode = searchParams.get('ref') ?? undefined;
  const forceOnboarding = isOnboardingForcedValue(searchParams.get('onboarding'))
    || isOnboardingForcedValue(searchParams.get('showOnboarding'));

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      // Check if the user has already completed setup (Activity created)
      const mustShowOnboarding = shouldShowOnboarding(forceOnboarding);
      try {
        const res = await fetch('/api/setup', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data?.activity) {
            // Setup already done — set the cookie and go to dashboard
            document.cookie = 'speeda_setup_done=1; path=/; max-age=31536000; SameSite=Lax';
            router.replace(addOnboardingParam('/dashboard', mustShowOnboarding));
            return;
          }
        }
      } catch {
        // Ignore check failure — fall through to /setup
      }
      router.replace(addOnboardingParam('/setup', mustShowOnboarding));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
      throw err;
    }
  };

  const handleRegister = async (data: { name: string; email: string; password: string; phone?: string }) => {
    try {
      const { userId } = await register({ ...data, referralCode });
      router.push(
        `/auth/verify?userId=${userId}&email=${encodeURIComponent(data.email)}${shouldShowOnboarding(forceOnboarding) ? '&onboarding=1' : ''}`
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    }
  };

  const handleQuickLogin = async (email: string) => {
    try {
      await sendMagicLink(email);
      toast.success('Magic link sent! Check your email.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not send magic link');
      throw err;
    }
  };

  return (
    <div className="max-w-[430px] mx-auto relative min-h-screen bg-background overflow-x-hidden">
      <AuthScreen
        onComplete={(mode) => {
          if (mode === 'signin') router.push('/setup');
          else router.push('/auth/verify');
        }}
        onForgotPassword={() => router.push('/auth/reset-password')}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onQuickLogin={handleQuickLogin}
      />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <AuthContent />
    </Suspense>
  );
}

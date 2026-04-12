'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthScreen } from '@/screens/AuthScreen';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, sendMagicLink } = useAuth();

  const referralCode = searchParams.get('ref') ?? undefined;

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      router.replace('/setup');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
      throw err;
    }
  };

  const handleRegister = async (data: { name: string; email: string; password: string; phone?: string }) => {
    try {
      const { userId } = await register({ ...data, referralCode });
      router.push(`/auth/verify?userId=${userId}&email=${encodeURIComponent(data.email)}`);
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

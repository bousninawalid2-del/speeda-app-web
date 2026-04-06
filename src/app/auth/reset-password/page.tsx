'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ResetPasswordScreen } from '@/screens/ResetPasswordScreen';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

function ResetContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { forgotPassword, resetPassword } = useAuth();

  const token = params.get('token'); // present when coming from reset email link

  const handleForgot = async (email: string) => {
    try {
      await forgotPassword(email);
      toast.success('Reset link sent! Check your email.');
    } catch (err: unknown) {
      throw err;
    }
  };

  const handleReset = async (newPassword: string) => {
    if (!token) throw new Error('Missing reset token');
    await resetPassword(token, newPassword);
  };

  return (
    <div className="max-w-[430px] mx-auto relative min-h-screen bg-background overflow-x-hidden">
      <ResetPasswordScreen
        onComplete={() => router.push('/auth')}
        token={token ?? undefined}
        onForgot={handleForgot}
        onReset={handleReset}
      />
    </div>
  );
}

export default function Page() {
  return <Suspense><ResetContent /></Suspense>;
}

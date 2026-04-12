'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EmailVerificationScreen } from '@/screens/EmailVerificationScreen';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { addOnboardingParam, isOnboardingForcedValue, shouldShowOnboarding } from '@/lib/onboarding';

function VerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { verifyEmail, resendVerification } = useAuth();

  const userId = params.get('userId') ?? '';
  const email = params.get('email') ?? '';
  const forceOnboarding = isOnboardingForcedValue(params.get('onboarding'))
    || isOnboardingForcedValue(params.get('showOnboarding'));
  const verifyDestination = addOnboardingParam('/dashboard', shouldShowOnboarding(forceOnboarding));

  const handleVerify = async (code: string) => {
    try {
      await verifyEmail(userId, code);
      router.replace(verifyDestination);
    } catch (err: unknown) {
      throw err; // let screen show error
    }
  };

  const handleResend = async () => {
    try {
      await resendVerification(userId);
      toast.success('Verification code resent!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not resend code');
    }
  };

  return (
    <div className="max-w-[430px] mx-auto relative min-h-screen bg-background overflow-x-hidden">
      <EmailVerificationScreen
        email={email}
        onVerified={() => router.replace(verifyDestination)}
        onBack={() => router.back()}
        onVerifyCode={handleVerify}
        onResend={handleResend}
      />
    </div>
  );
}

export default function Page() {
  return <Suspense><VerifyContent /></Suspense>;
}

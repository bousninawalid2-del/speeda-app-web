import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface EmailVerificationScreenProps {
  email?: string;
  onVerified: () => void;
  onBack: () => void;
  /** Called with 6-digit OTP when user submits the code */
  onVerifyCode?: (code: string) => Promise<void>;
  /** Called when user requests a new code */
  onResend?: () => Promise<void>;
}

export const EmailVerificationScreen = ({
  email = 'your email',
  onVerified,
  onBack,
  onVerifyCode,
  onResend,
}: EmailVerificationScreenProps) => {
  const { t } = useTranslation();
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [envelopeOpened, setEnvelopeOpened] = useState(false);
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendDisabled) {
      setResendDisabled(false);
    }
  }, [countdown, resendDisabled]);

  const handleResend = async () => {
    if (onResend) {
      await onResend();
    } else {
      toast.success(t('emailVerification.emailResent'), { duration: 2000 });
    }
    setResendDisabled(true);
    setCountdown(60);
  };

  const handleVerify = async () => {
    if (code.length !== 6) { setCodeError('Please enter the 6-digit code'); return; }
    setCodeError('');
    setIsVerifying(true);
    try {
      if (onVerifyCode) {
        await onVerifyCode(code);
      }
      setEnvelopeOpened(true);
      setTimeout(() => onVerified(), 800);
    } catch (err: unknown) {
      setCodeError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOpenEmail = () => window.open('mailto:', '_blank');

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-background px-6 flex flex-col items-center justify-center">
      <div className="max-w-[380px] w-full text-center">
        {/* Envelope icon */}
        <motion.div
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-6"
          style={{ background: 'linear-gradient(135deg, hsl(254 75% 65%), hsl(193 100% 48%))' }}
          animate={envelopeOpened ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence mode="wait">
            {envelopeOpened ? (
              <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Check size={28} className="text-primary-foreground" />
              </motion.div>
            ) : (
              <motion.div key="mail" exit={{ scale: 0, opacity: 0 }}>
                <Mail size={28} className="text-primary-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <h1 className="text-[24px] font-extrabold text-foreground">{t('emailVerification.checkInbox')}</h1>
        <p className="text-[14px] text-muted-foreground mt-2">{t('emailVerification.sentTo')}</p>
        <p className="text-[16px] font-bold text-brand-blue mt-1">{email}</p>

        {/* OTP input */}
        <div className="mt-8">
          <input
            className="w-full h-[64px] rounded-2xl bg-card border border-border text-center text-[28px] font-bold tracking-[12px] text-foreground focus:border-primary focus:outline-none transition-colors"
            placeholder="──────"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
          />
          {codeError && <p className="text-[13px] text-destructive mt-2">{codeError}</p>}
        </div>

        <div className="mt-4 space-y-3">
          <button
            onClick={handleVerify}
            disabled={isVerifying || code.length !== 6}
            className="w-full h-[52px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press disabled:opacity-60"
          >
            {isVerifying ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying…
              </span>
            ) : 'Verify Email'}
          </button>
          <button onClick={handleOpenEmail} className="w-full h-[44px] rounded-2xl bg-card border border-border text-foreground text-[14px] font-medium btn-press">
            {t('emailVerification.openEmailApp')}
          </button>
          <button
            onClick={handleResend}
            disabled={resendDisabled}
            className={`w-full h-[44px] rounded-2xl border border-border text-[14px] font-medium btn-press ${resendDisabled ? 'text-muted-foreground opacity-60' : 'text-foreground'}`}
          >
            {resendDisabled ? `Resend in ${countdown}s` : t('emailVerification.resendEmail')}
          </button>
        </div>

        <button onClick={onBack} className="text-[13px] text-muted-foreground mt-4 inline-block">
          {t('emailVerification.wrongEmail')} <span className="text-brand-blue font-medium">{t('emailVerification.goBack')}</span>
        </button>
      </div>
    </motion.div>
  );
};

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface EmailVerificationScreenProps {
  email?: string;
  onVerified: () => void;
  onBack: () => void;
}

export const EmailVerificationScreen = ({ email = 'malek@speeda.ai', onVerified, onBack }: EmailVerificationScreenProps) => {
  const { t } = useTranslation();
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [envelopeOpened, setEnvelopeOpened] = useState(false);

  // Prototype: auto-verify after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setEnvelopeOpened(true);
      setTimeout(() => onVerified(), 1200);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onVerified]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    } else if (resendDisabled) {
      setResendDisabled(false);
    }
  }, [countdown, resendDisabled]);

  const handleResend = () => {
    toast.success(t('emailVerification.emailResent'), { duration: 2000 });
    setResendDisabled(true);
    setCountdown(60);
  };

  const handleOpenEmail = () => {
    window.open('mailto:', '_blank');
  };

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

        <p className="text-[14px] text-muted-foreground mt-8 mx-auto max-w-[320px] leading-[1.6]">
          {t('emailVerification.instruction')}
        </p>

        <div className="mt-6 space-y-3">
          <button onClick={handleOpenEmail} className="w-full h-[52px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press">
            {t('emailVerification.openEmailApp')}
          </button>
          <button
            onClick={handleResend}
            disabled={resendDisabled}
            className={`w-full h-[44px] rounded-2xl border border-border text-[14px] font-medium btn-press ${resendDisabled ? 'text-muted-foreground opacity-60' : 'text-foreground'}`}
          >
            {resendDisabled ? t('emailVerification.resendIn', { count: countdown }) : t('emailVerification.resendEmail')}
          </button>
        </div>

        <button onClick={onBack} className="text-[13px] text-muted-foreground mt-4 inline-block">
          {t('emailVerification.wrongEmail')} <span className="text-brand-blue font-medium">{t('emailVerification.goBack')}</span>
        </button>
      </div>
    </motion.div>
  );
};

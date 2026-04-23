import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Check, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ResetPasswordScreenProps {
  onComplete: () => void;
  /** If present, we're in "set new password" mode (came from email link) */
  token?: string;
  /** Called with email to request a reset link (forgot mode) */
  onForgot?: (email: string) => Promise<void>;
  /** Called with new password (reset mode, requires token) */
  onReset?: (newPassword: string) => Promise<void>;
}

const getStrength = (pw: string, t: (key: string) => string): { label: string; color: string; width: string } => {
  if (pw.length < 6) return { label: t('resetPassword.weak'), color: 'hsl(4, 100%, 64%)', width: '33%' };
  if (pw.length < 10 || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return { label: t('resetPassword.medium'), color: 'hsl(28, 100%, 63%)', width: '66%' };
  return { label: t('resetPassword.strong'), color: 'hsl(157, 100%, 42%)', width: '100%' };
};

export const ResetPasswordScreen = ({ onComplete, token, onForgot, onReset }: ResetPasswordScreenProps) => {
  const { t } = useTranslation();
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const strength = getStrength(newPw, t);
  const inputClass = "w-full h-[52px] rounded-2xl bg-card border border-border ps-12 pe-12 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors";

  const handleReset = async () => {
    setFormError('');
    if (newPw.length < 8) { setFormError('Password must be at least 8 characters'); return; }
    if (newPw !== confirmPw) { setFormError('Passwords do not match'); return; }
    setIsSubmitting(true);
    try {
      if (onReset) await onReset(newPw);
      setSuccess(true);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgot = async () => {
    if (!forgotEmail) { setFormError('Please enter your email'); return; }
    setFormError('');
    setIsSubmitting(true);
    try {
      if (onForgot) await onForgot(forgotEmail);
      setSuccess(true);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to send reset link');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-background px-6 flex flex-col items-center justify-center">
        <div className="max-w-[380px] w-full text-center">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-6"
            style={{ background: 'linear-gradient(135deg, hsl(157 100% 42%), hsl(157 80% 50%))' }}
          >
            <Check size={32} className="text-primary-foreground" strokeWidth={3} />
          </motion.div>
          <h1 className="text-[24px] font-extrabold text-foreground">{t('resetPassword.passwordUpdated')}</h1>
          <p className="text-[14px] text-muted-foreground mt-2">{t('resetPassword.passwordUpdatedDesc')}</p>
          <button onClick={onComplete} className="w-full h-[52px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press mt-8">
            {t('resetPassword.goToSignIn')}
          </button>
        </div>
      </motion.div>
    );
  }

  if (!token) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-background px-6 flex flex-col items-center justify-center">
        <div className="max-w-[380px] w-full text-center">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-6"
            style={{ background: 'linear-gradient(135deg, hsl(254 75% 65%), hsl(193 100% 48%))' }}>
            <Mail size={28} className="text-primary-foreground" />
          </div>

          <h1 className="text-[24px] font-extrabold text-foreground">{t('resetPassword.forgotPassword')}</h1>
          <p className="text-[14px] text-muted-foreground mt-2">{t('resetPassword.forgotDesc')}</p>

          <div className="mt-8 text-start">
            <div className="relative">
              <Mail size={18} className="absolute start-4 top-[17px] text-muted-foreground" />
              <input
                className={inputClass}
                placeholder={t('resetPassword.emailAddress')}
                type="email"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
              />
            </div>
          </div>

          {formError && <p className="text-[13px] text-destructive mt-3 text-center">{formError}</p>}

          <button
            onClick={handleForgot}
            disabled={isSubmitting}
            className="w-full h-[52px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press mt-6 disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('auth.loading') ?? 'Loading…'}
              </span>
            ) : t('resetPassword.sendResetLink')}
          </button>

          <button onClick={onComplete} className="text-[13px] text-muted-foreground mt-4 inline-block">
            {t('resetPassword.backToSignIn')}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-background px-6 flex flex-col items-center justify-center">
      <div className="max-w-[380px] w-full text-center">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-6"
          style={{ background: 'linear-gradient(135deg, hsl(254 75% 65%), hsl(193 100% 48%))' }}>
          <Lock size={28} className="text-primary-foreground" />
        </div>

        <h1 className="text-[24px] font-extrabold text-foreground">{t('resetPassword.createNewPassword')}</h1>
        <p className="text-[14px] text-muted-foreground mt-2">{t('resetPassword.enterNewPassword')}</p>

        <div className="mt-8 space-y-3 text-start">
          <div className="relative">
            <Lock size={18} className="absolute start-4 top-[17px] text-muted-foreground" />
            <input className={inputClass} placeholder={t('resetPassword.newPassword')} type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} />
            <button onClick={() => setShowNew(!showNew)} className="absolute end-4 top-[16px] text-muted-foreground">
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {newPw.length > 0 && (
            <div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: strength.width }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: strength.color }}
                />
              </div>
              <p className="text-[11px] font-medium mt-1" style={{ color: strength.color }}>{strength.label}</p>
            </div>
          )}
          <div className="relative">
            <Lock size={18} className="absolute start-4 top-[17px] text-muted-foreground" />
            <input className={inputClass} placeholder={t('resetPassword.confirmPassword')} type={showConfirm ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
            <button onClick={() => setShowConfirm(!showConfirm)} className="absolute end-4 top-[16px] text-muted-foreground">
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {formError && <p className="text-[13px] text-destructive mt-3 text-center">{formError}</p>}

        <button
          onClick={handleReset}
          disabled={isSubmitting}
          className="w-full h-[52px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press mt-6 disabled:opacity-60"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('auth.loading') ?? 'Loading…'}
            </span>
          ) : t('resetPassword.resetPassword')}
        </button>
      </div>
    </motion.div>
  );
};

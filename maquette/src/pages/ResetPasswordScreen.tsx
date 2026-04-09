import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ResetPasswordScreenProps {
  onComplete: () => void;
}

const getStrength = (pw: string, t: (key: string) => string): { label: string; color: string; width: string } => {
  if (pw.length < 6) return { label: t('resetPassword.weak'), color: 'hsl(4, 100%, 64%)', width: '33%' };
  if (pw.length < 10 || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return { label: t('resetPassword.medium'), color: 'hsl(28, 100%, 63%)', width: '66%' };
  return { label: t('resetPassword.strong'), color: 'hsl(157, 100%, 42%)', width: '100%' };
};

export const ResetPasswordScreen = ({ onComplete }: ResetPasswordScreenProps) => {
  const { t } = useTranslation();
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = getStrength(newPw, t);
  const inputClass = "w-full h-[52px] rounded-2xl bg-card border border-border pl-12 pr-12 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors";

  const handleReset = () => {
    if (newPw.length < 6) return;
    if (newPw !== confirmPw) return;
    setSuccess(true);
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

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-background px-6 flex flex-col items-center justify-center">
      <div className="max-w-[380px] w-full text-center">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-6"
          style={{ background: 'linear-gradient(135deg, hsl(254 75% 65%), hsl(193 100% 48%))' }}>
          <Lock size={28} className="text-primary-foreground" />
        </div>

        <h1 className="text-[24px] font-extrabold text-foreground">{t('resetPassword.createNewPassword')}</h1>
        <p className="text-[14px] text-muted-foreground mt-2">{t('resetPassword.enterNewPassword')}</p>

        <div className="mt-8 space-y-3 text-left">
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-[17px] text-muted-foreground" />
            <input className={inputClass} placeholder={t('resetPassword.newPassword')} type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} />
            <button onClick={() => setShowNew(!showNew)} className="absolute right-4 top-[16px] text-muted-foreground">
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {/* Strength indicator */}
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
            <Lock size={18} className="absolute left-4 top-[17px] text-muted-foreground" />
            <input className={inputClass} placeholder={t('resetPassword.confirmPassword')} type={showConfirm ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
            <button onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-[16px] text-muted-foreground">
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button onClick={handleReset} className="w-full h-[52px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press mt-6">
          {t('resetPassword.resetPassword')}
        </button>
      </div>
    </motion.div>
  );
};

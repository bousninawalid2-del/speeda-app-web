import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Eye, EyeOff, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

interface SecurityScreenProps {
  onBack: () => void;
}

const getStrength = (pw: string): { label: string; color: string; width: string; key: string } => {
  if (pw.length < 6) return { label: 'Weak', color: 'hsl(4, 100%, 64%)', width: '33%', key: 'weak' };
  if (pw.length < 10 || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return { label: 'Medium', color: 'hsl(28, 100%, 63%)', width: '66%', key: 'medium' };
  return { label: 'Strong', color: 'hsl(157, 100%, 42%)', width: '100%', key: 'strong' };
};

export const SecurityScreen = ({ onBack }: SecurityScreenProps) => {
  const { t } = useTranslation();
  const [twoFA, setTwoFA] = useState(false);
  const [biometric, setBiometric] = useState(true);
  const [show2FAOptions, setShow2FAOptions] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = getStrength(newPw);

  const inputClass = "w-full h-[52px] rounded-2xl bg-card border border-border pl-12 pr-12 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none";

  const { changePassword } = useAuth();
  const [isChangingPw, setIsChangingPw] = useState(false);

  const handleUpdatePassword = async () => {
    if (!currentPw) { toast.error(t('security.passwordIncorrect')); return; }
    if (newPw.length < 6) { toast.error(t('security.passwordTooShort')); return; }
    if (newPw !== confirmPw) { toast.error(t('security.passwordMismatch')); return; }
    setIsChangingPw(true);
    try {
      await changePassword(currentPw, newPw);
      toast.success(t('security.passwordUpdated'));
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsChangingPw(false);
    }
  };

  const handle2FAToggle = () => {
    if (!twoFA) {
      setShow2FAOptions(true);
    } else {
      setTwoFA(false);
      toast.success(t('security.twoFaDisabled'));
    }
  };

  const select2FAMethod = (method: string) => {
    setTwoFA(true);
    setShow2FAOptions(false);
    toast.success(t('security.twoFaEnabled', { method }));
  };

  const Toggle = ({ on, onChange, label, sub }: { on: boolean; onChange: () => void; label: string; sub: string }) => (
    <div className="flex items-center justify-between py-4 border-b border-border-light last:border-0">
      <div className="flex-1 me-3">
        <p className="text-[14px] text-foreground font-medium">{label}</p>
        <p className="text-[12px] text-muted-foreground mt-0.5">{sub}</p>
      </div>
      <button onClick={onChange} className={`w-11 h-6 rounded-full p-0.5 transition-colors ${on ? 'bg-green-accent' : 'bg-border'}`}>
        <div className={`w-5 h-5 rounded-full bg-card shadow transition-transform ${on ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
      </button>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-8">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
          <h1 className="text-[20px] font-bold text-foreground">{t('security.title')}</h1>
        </div>

        {/* Change Password */}
        <div className="bg-card rounded-2xl border border-border-light p-5 mb-5">
          <h3 className="text-[16px] font-bold text-foreground mb-4">{t('settings.changePassword')}</h3>
          <div className="space-y-3">
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-[17px] text-muted-foreground" />
              <input className={inputClass} type={showCurrent ? 'text' : 'password'} placeholder={t('security.currentPassword')} value={currentPw} onChange={e => setCurrentPw(e.target.value)} />
              <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-[16px] text-muted-foreground">
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-[17px] text-muted-foreground" />
              <input className={inputClass} type={showNew ? 'text' : 'password'} placeholder={t('security.newPassword')} value={newPw} onChange={e => setNewPw(e.target.value)} />
              <button onClick={() => setShowNew(!showNew)} className="absolute right-4 top-[16px] text-muted-foreground">
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {newPw.length > 0 && (
              <div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: strength.width }} className="h-full rounded-full" style={{ backgroundColor: strength.color }} />
                </div>
                <p className="text-[11px] font-medium mt-1" style={{ color: strength.color }}>{t(`resetPassword.${strength.key}`)}</p>
              </div>
            )}
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-[17px] text-muted-foreground" />
              <input className={inputClass} type={showConfirm ? 'text' : 'password'} placeholder={t('security.confirmNewPassword')} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
              <button onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-[16px] text-muted-foreground">
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button onClick={handleUpdatePassword} className="w-full h-[48px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[14px] shadow-btn btn-press mt-4">
            {t('security.updatePassword')}
          </button>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-card rounded-2xl border border-border-light overflow-hidden mb-5">
          <div className="px-5">
            <Toggle on={twoFA} onChange={handle2FAToggle} label={t('settings.twoFactor')} sub={t('security.twoFaDesc')} />
            <AnimatePresence>
              {show2FAOptions && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pb-4">
                  <p className="text-[13px] font-semibold text-foreground mb-3">{t('security.chooseMethod')}</p>
                  <div className="space-y-2">
                    <button onClick={() => select2FAMethod('SMS')} className="w-full h-[48px] rounded-2xl border border-border text-foreground text-[14px] font-medium btn-press flex items-center justify-center gap-2">
                      {t('security.smsMethod')}
                    </button>
                    <button onClick={() => select2FAMethod('Authenticator App')} className="w-full h-[48px] rounded-2xl border border-border text-foreground text-[14px] font-medium btn-press flex items-center justify-center gap-2">
                      {t('security.authenticatorMethod')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <Toggle on={biometric} onChange={() => {
              setBiometric(!biometric);
              toast.success(biometric ? t('security.biometricDisabled') : t('security.biometricEnabled'));
            }} label={t('settings.faceId')} sub={t('security.biometricDesc')} />
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-card rounded-2xl border border-border-light p-5">
          <h3 className="text-[16px] font-bold text-foreground mb-3">{t('security.activeSessions')}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-accent" />
              <div>
                <p className="text-[14px] font-medium text-foreground">{t('security.thisDevice')}</p>
                <p className="text-[12px] text-green-accent font-medium">{t('security.activeNow')}</p>
              </div>
            </div>
          </div>
          <button onClick={() => setShowSignOutConfirm(true)} className="text-red-accent text-[13px] font-semibold mt-3">
            {t('security.signOutAll')}
          </button>
        </div>
      </div>

      {/* Sign Out Confirmation */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-card rounded-3xl max-w-[340px] w-full p-6 text-center shadow-xl">
              <h3 className="text-[18px] font-bold text-foreground">{t('common.areYouSure')}</h3>
              <p className="text-[14px] text-muted-foreground mt-2">{t('security.signOutConfirm')}</p>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowSignOutConfirm(false)} className="flex-1 h-[44px] rounded-2xl border border-border text-foreground text-[14px] font-medium btn-press">{t('common.cancel')}</button>
                <button onClick={() => { setShowSignOutConfirm(false); toast.success(t('security.allDevicesSignedOut')); }} className="flex-1 h-[44px] rounded-2xl bg-red-accent text-primary-foreground text-[14px] font-bold btn-press">{t('security.signOutAllBtn')}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
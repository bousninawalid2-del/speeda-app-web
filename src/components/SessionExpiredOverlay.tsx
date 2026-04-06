import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SessionExpiredOverlayProps {
  onSignIn: () => void;
  onContactSupport?: () => void;
}

export const SessionExpiredOverlay = ({ onSignIn, onContactSupport }: SessionExpiredOverlayProps) => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-foreground/40 z-[100] flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className="bg-card rounded-3xl max-w-[380px] w-full p-8 text-center shadow-xl"
      >
        <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 bg-orange-soft">
          <Lock size={22} className="text-orange-accent" />
        </div>

        <h2 className="text-[20px] font-bold text-foreground">{t('sessionExpired.title')}</h2>
        <p className="text-[14px] text-muted-foreground mt-2 leading-[1.6]">
          {t('sessionExpired.description')}
        </p>

        <button onClick={onSignIn} className="w-full h-[48px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[14px] shadow-btn btn-press mt-6">
          {t('sessionExpired.signInAgain')}
        </button>

        <button onClick={onContactSupport} className="text-[12px] text-muted-foreground mt-3 inline-block">
          {t('sessionExpired.needHelp')} <span className="text-brand-blue">{t('sessionExpired.contactSupport')}</span>
        </button>
      </motion.div>
    </motion.div>
  );
};

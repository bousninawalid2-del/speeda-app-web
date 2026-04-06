import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EmailVerifiedScreenProps {
  onContinue: () => void;
}

export const EmailVerifiedScreen = ({ onContinue }: EmailVerifiedScreenProps) => {
  const { t } = useTranslation();
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-background px-6 flex flex-col items-center justify-center">
      <div className="max-w-[380px] w-full text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-6"
          style={{ background: 'linear-gradient(135deg, hsl(157 100% 42%), hsl(157 80% 50%))' }}
        >
          <Check size={32} className="text-primary-foreground" strokeWidth={3} />
        </motion.div>

        <h1 className="text-[24px] font-extrabold" style={{ color: 'hsl(157, 100%, 42%)' }}>{t('emailVerified.title')}</h1>
        <p className="text-[14px] text-muted-foreground mt-2">{t('emailVerified.subtitle')}</p>

        <button onClick={onContinue} className="w-full h-[52px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press mt-8">
          {t('emailVerified.continueToSetup')}
        </button>
      </div>
    </motion.div>
  );
};

import { motion } from 'framer-motion';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WhatsNewScreenProps {
  onBack: () => void;
}

export const WhatsNewScreen = ({ onBack }: WhatsNewScreenProps) => {
  const { t } = useTranslation();
  const versions = [
    { version: t('whatsNew.v43'), desc: t('whatsNew.v43desc'), current: true },
    { version: t('whatsNew.v42'), desc: t('whatsNew.v42desc'), current: false },
    { version: t('whatsNew.v41'), desc: t('whatsNew.v41desc'), current: false },
  ];

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground" /></button>
          <h1 className="text-[20px] font-bold text-foreground">{t('whatsNew.title')}</h1>
        </div>
        <div className="space-y-3">
          {versions.map((v, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`bg-card rounded-2xl border p-4 ${v.current ? 'border-brand-blue shadow-card' : 'border-border-light'}`}>
              <div className="flex items-center gap-2 mb-2">
                {v.current && <Sparkles size={14} className="text-brand-blue" />}
                <span className="text-[15px] font-bold text-foreground">{v.version}</span>
              </div>
              <p className="text-[13px] text-muted-foreground leading-[1.5]">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

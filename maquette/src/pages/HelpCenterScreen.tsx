import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HelpCenterScreenProps {
  onBack: () => void;
}

export const HelpCenterScreen = ({ onBack }: HelpCenterScreenProps) => {
  const { t } = useTranslation();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const faqs = Array.from({ length: 8 }, (_, i) => ({
    q: t(`helpCenter.q${i + 1}`),
    a: t(`helpCenter.a${i + 1}`),
  }));

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground" /></button>
          <h1 className="text-[20px] font-bold text-foreground">{t('helpCenter.title')}</h1>
        </div>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border-light overflow-hidden">
              <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="w-full flex items-center justify-between px-4 py-3.5 text-left">
                <span className="text-[14px] font-medium text-foreground flex-1 me-2">{faq.q}</span>
                {openIdx === i ? <ChevronUp size={16} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" />}
              </button>
              <AnimatePresence>
                {openIdx === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4">
                      <p className="text-[13px] text-muted-foreground leading-[1.6]">{faq.a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

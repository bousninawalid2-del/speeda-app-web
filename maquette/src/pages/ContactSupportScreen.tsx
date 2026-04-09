import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Mail, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ContactSupportScreenProps {
  onBack: () => void;
}

export const ContactSupportScreen = ({ onBack }: ContactSupportScreenProps) => {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground" /></button>
          <h1 className="text-[20px] font-bold text-foreground">{t('contactSupport.title')}</h1>
        </div>

        <div className="bg-card rounded-2xl border border-border-light p-4 mb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-soft flex items-center justify-center"><Mail size={18} className="text-purple" /></div>
          <span className="text-[14px] text-foreground font-medium">{t('contactSupport.emailLabel')}</span>
        </div>

        {sent ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-soft flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-accent" />
            </div>
            <p className="text-[16px] font-bold text-foreground">{t('contactSupport.messageSent')}</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {[
              { label: t('contactSupport.name'), placeholder: 'Malek Zlitni' },
              { label: t('contactSupport.email'), placeholder: 'malek@speeda.ai' },
              { label: t('contactSupport.subject'), placeholder: '' },
            ].map((f, i) => (
              <div key={i}>
                <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">{f.label}</label>
                <input defaultValue={f.placeholder} className="w-full h-12 rounded-xl bg-card border border-border px-4 text-[14px] text-foreground focus:border-brand-blue outline-none transition-colors" />
              </div>
            ))}
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">{t('contactSupport.message')}</label>
              <textarea rows={4} className="w-full rounded-xl bg-card border border-border px-4 py-3 text-[14px] text-foreground focus:border-brand-blue outline-none transition-colors resize-none" />
            </div>
            <button onClick={() => setSent(true)} className="w-full h-14 rounded-2xl gradient-btn text-primary-foreground text-[15px] font-bold shadow-btn btn-press mt-2">
              {t('contactSupport.sendMessage')}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

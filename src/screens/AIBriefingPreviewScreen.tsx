import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '../hooks/use-mobile';

interface AIBriefingPreviewScreenProps {
  onBack: () => void;
}

const benefitSlugs = ['performance', 'actionPlan', 'postingTimes', 'recommendations'] as const;
const benefitIcons: Record<typeof benefitSlugs[number], { icon: string; bg: string }> = {
  performance:     { icon: '📊', bg: 'hsl(var(--brand-blue) / 0.1)' },
  actionPlan:      { icon: '📋', bg: 'hsl(var(--brand-teal) / 0.1)' },
  postingTimes:    { icon: '⏰', bg: 'hsl(var(--purple) / 0.1)' },
  recommendations: { icon: '🎯', bg: 'hsl(var(--green) / 0.1)' },
};

export const AIBriefingPreviewScreen = ({ onBack }: AIBriefingPreviewScreenProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-background min-h-full pb-8">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border-light">
        <div className="flex items-center gap-3 px-4 py-3 max-w-[1200px] mx-auto">
          <button onClick={onBack} className="w-8 h-8 rounded-lg bg-card border border-border-light flex items-center justify-center">
            <ArrowLeft size={16} className="text-foreground rtl:rotate-180" />
          </button>
          <h1 className="text-[20px] font-bold text-foreground">{t('aiBriefingPreview.title')}</h1>
        </div>
      </div>

      <div className="px-4 pt-6 max-w-[1200px] mx-auto space-y-6">
        <div className="relative gradient-hero rounded-3xl p-6 md:p-8 overflow-hidden shadow-hero">
          <div className="absolute w-32 h-32 rounded-full bg-primary-foreground/5 -top-8 -end-8" />
          <div className="absolute w-20 h-20 rounded-full bg-primary-foreground/[0.03] bottom-2 -start-4" />
          <div className="relative z-10">
            <span className="text-[11px] uppercase font-bold tracking-[1px] text-primary-foreground/70">{t('home.aiBriefingLabel')}</span>
            <p
              className="text-[16px] md:text-[18px] font-semibold text-primary-foreground leading-[1.5] mt-3"
              style={{ filter: 'blur(4px)', opacity: 0.7 }}
            >
              {t('aiBriefingPreview.previewBlurb')}
            </p>
          </div>
          <div className="absolute top-4 end-4 z-20 bg-primary-foreground text-foreground text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-lg">
            {t('aiBriefingPreview.previewBadge')}
          </div>
        </div>

        <h2 className="text-[16px] font-bold text-foreground">{t('aiBriefingPreview.willInclude')}</h2>

        <div className={`gap-3 ${isMobile ? 'flex flex-col' : 'grid grid-cols-2'}`}>
          {benefitSlugs.map((slug, i) => {
            const meta = benefitIcons[slug];
            return (
              <motion.div
                key={slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="bg-card rounded-[14px] border border-border-light p-[14px] flex gap-3 items-start"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[18px]" style={{ backgroundColor: meta.bg }}>
                  {meta.icon}
                </div>
                <div>
                  <p className="text-[14px] font-bold text-foreground">{t(`aiBriefingPreview.benefits.${slug}.title`)}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{t(`aiBriefingPreview.benefits.${slug}.desc`)}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, hsl(var(--brand-blue) / 0.08), hsl(var(--brand-teal) / 0.08))' }}>
          <p className="text-[14px] text-muted-foreground text-center leading-[1.6]">
            {t('aiBriefingPreview.bottom')}
          </p>
        </div>

        <button
          onClick={onBack}
          className="w-full py-3.5 rounded-2xl text-primary-foreground text-[15px] font-bold"
          style={{ background: 'linear-gradient(135deg, hsl(var(--brand-blue)), hsl(var(--brand-teal)))' }}
        >
          {t('aiBriefingPreview.cta')}
        </button>
      </div>
    </motion.div>
  );
};

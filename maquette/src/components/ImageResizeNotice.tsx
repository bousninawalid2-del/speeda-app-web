import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const platformSpecs = [
  { name: 'Instagram', ratio: '1:1', size: '1080x1080' },
  { name: 'TikTok', ratio: '9:16', size: '1080x1920' },
  { name: 'Facebook', ratio: '16:9', size: '1200x630' },
  { name: 'LinkedIn', ratio: '1.91:1', size: '1200x627' },
  { name: 'X', ratio: '16:9', size: '1200x675' },
  { name: 'Pinterest', ratio: '2:3', size: '1000x1500' },
];

interface ImageResizeNoticeProps {
  selectedPlatforms: string[];
  hasImage: boolean;
}

export const ImageResizeNotice = ({ selectedPlatforms, hasImage }: ImageResizeNoticeProps) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  if (!hasImage || selectedPlatforms.length < 2) return null;

  const relevantSpecs = platformSpecs.filter(s =>
    selectedPlatforms.some(p => p.toLowerCase() === s.name.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50 dark:bg-brand-blue/10 rounded-xl p-3 mt-2 border border-brand-blue/20">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 w-full text-start">
        <span className="text-[12px]">ℹ️</span>
        <p className="text-[12px] text-foreground flex-1">
          {t('resize.notice', 'Image will be automatically optimized for each platform')}
        </p>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 space-y-2">
              {relevantSpecs.map((spec, i) => (
                <div key={i} className="flex items-center justify-between text-[12px]">
                  <span className="text-foreground font-medium">{spec.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{spec.ratio} ({spec.size})</span>
                    <button className="text-brand-blue font-medium text-[11px]">
                      {t('resize.editCrop', 'Edit crop')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

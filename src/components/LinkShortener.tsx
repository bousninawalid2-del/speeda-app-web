import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface LinkShortenerProps {
  caption: string;
}

export const LinkShortener = ({ caption }: LinkShortenerProps) => {
  const { t } = useTranslation();
  const [shortenEnabled, setShortenEnabled] = useState(true);

  const urlMatch = caption.match(/(https?:\/\/[^\s]+)/);
  if (!urlMatch) return null;

  const originalUrl = urlMatch[1];
  const shortCode = Math.random().toString(36).substring(2, 6);
  const shortUrl = `spda.ai/${shortCode}`;

  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50 dark:bg-brand-blue/10 rounded-xl p-3 mt-2 border border-brand-blue/20">
      <div className="flex items-center gap-2">
        <span className="text-[13px]">🔗</span>
        <p className="text-[12px] text-foreground flex-1 truncate">
          {t('links.detected', 'Link detected')}: <span className="text-brand-blue font-medium">{originalUrl}</span>
        </p>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted-foreground">{t('links.shorten', 'Shorten link')}</span>
          <button onClick={() => setShortenEnabled(!shortenEnabled)}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors ${shortenEnabled ? 'bg-green-accent' : 'bg-border'}`}>
            <div className={`w-4 h-4 rounded-full bg-card shadow transition-transform ${shortenEnabled ? 'translate-x-4 rtl:-translate-x-4' : ''}`} />
          </button>
        </div>
        {shortenEnabled && (
          <span className="text-[12px] text-brand-blue font-semibold">→ {shortUrl}</span>
        )}
      </div>
    </motion.div>
  );
};

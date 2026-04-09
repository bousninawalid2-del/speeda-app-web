import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Palette, Type, Image } from 'lucide-react';

const brandColors = ['#2563EB', '#14B8A6', '#F97316', '#EF4444', '#8B5CF6'];
const brandFonts = ['Cairo (Primary)', 'Inter (Secondary)'];

export const BrandKitSection = () => {
  const { t } = useTranslation();
  const [editingColors, setEditingColors] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      {/* Brand Colors */}
      <div className="bg-card rounded-2xl p-4 border border-border-light">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-brand-blue" />
            <span className="text-[14px] font-bold text-foreground">{t('brandKit.colors', 'Brand Colors')}</span>
          </div>
          <button onClick={() => setEditingColors(!editingColors)} className="text-[12px] text-brand-blue font-semibold">
            {editingColors ? t('common.done', 'Done') : t('common.edit', 'Edit')}
          </button>
        </div>
        <div className="flex gap-3">
          {brandColors.map((color, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl border-2 border-border shadow-sm" style={{ backgroundColor: color }} />
              <span className="text-[9px] text-muted-foreground font-mono">{color}</span>
            </div>
          ))}
          {editingColors && (
            <button className="w-10 h-10 rounded-xl border-2 border-dashed border-brand-blue/30 flex items-center justify-center text-brand-blue text-[18px] font-bold">
              +
            </button>
          )}
        </div>
      </div>

      {/* Brand Fonts */}
      <div className="bg-card rounded-2xl p-4 border border-border-light">
        <div className="flex items-center gap-2 mb-3">
          <Type size={16} className="text-brand-blue" />
          <span className="text-[14px] font-bold text-foreground">{t('brandKit.fonts', 'Brand Fonts')}</span>
        </div>
        <div className="space-y-2">
          {brandFonts.map((font, i) => (
            <div key={i} className="flex items-center justify-between bg-muted rounded-xl px-3 py-2.5">
              <span className="text-[13px] font-medium text-foreground">{font}</span>
              <span className="text-[11px] text-muted-foreground">Aa</span>
            </div>
          ))}
        </div>
      </div>

      {/* Brand Logo */}
      <div className="bg-card rounded-2xl p-4 border border-border-light">
        <div className="flex items-center gap-2 mb-3">
          <Image size={16} className="text-brand-blue" />
          <span className="text-[14px] font-bold text-foreground">{t('brandKit.logos', 'Logos')}</span>
        </div>
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-xl gradient-hero flex items-center justify-center text-2xl border border-border-light">🎨</div>
          <div className="w-16 h-16 rounded-xl bg-foreground flex items-center justify-center text-2xl border border-border-light">🎨</div>
          <button className="w-16 h-16 rounded-xl border-2 border-dashed border-brand-blue/30 flex items-center justify-center text-brand-blue text-[14px] font-bold">
            + Add
          </button>
        </div>
      </div>
    </motion.div>
  );
};

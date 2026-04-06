import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface PostVariationsProps {
  onSelectVariation: (caption: string, hashtags: string) => void;
}

const toneOptions = [
  { key: 'professional', label: '💼 Professional', color: 'bg-brand-blue' },
  { key: 'casual', label: '😊 Casual', color: 'bg-brand-teal' },
  { key: 'bold', label: '⚡ Bold', color: 'bg-purple' },
  { key: 'fun', label: '🎉 Fun', color: 'bg-orange-accent' },
  { key: 'urgent', label: '🔥 Urgent', color: 'bg-red-accent' },
];

const variations = [
  {
    badge: 'A', color: 'bg-brand-blue', tone: 'professional', toneLabel: '💼 Professional',
    caption: 'Discover our signature Chicken Shawarma — marinated for 24 hours, grilled to perfection, and wrapped with fresh vegetables and our secret garlic sauce. Order now! 🔥',
    hashtags: '#GourmetShawarma #RiyadhEats #PremiumDining #ChickenShawarma #FoodExcellence',
    engagement: '2.4K est. reach',
  },
  {
    badge: 'B', color: 'bg-brand-teal', tone: 'casual', toneLabel: '😊 Casual',
    caption: 'yo we just dropped the BEST shawarma in town 🔥🔥 24hr marinated chicken + secret garlic sauce + fresh veggies = pure happiness. come get yours before we sell out! 😤',
    hashtags: '#Shawarma #FoodTikTok #RiyadhFood #Yummy #MustTry',
    engagement: '3.1K est. reach',
  },
  {
    badge: 'C', color: 'bg-purple', tone: 'bold', toneLabel: '⚡ Bold',
    caption: '⚡ WARNING: This Shawarma will ruin all other Shawarmas for you. 24-hour marinated. Secret sauce. Fresh from the grill. You\'ve been warned. 🍗🔥',
    hashtags: '#BestShawarmaInRiyadh #FoodChallenge #SpicyFood #StreetFood #SaudiFoodie',
    engagement: '2.8K est. reach',
  },
];

export const PostVariations = ({ onSelectVariation }: PostVariationsProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [activeTone, setActiveTone] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-card rounded-2xl p-5 border border-border-light overflow-hidden">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-4/5" />
              <div className="h-3 bg-muted rounded w-3/5" />
            </div>
          </div>
        ))}
        <p className="text-center text-[13px] text-muted-foreground">✦ {t('variations.creating', 'Creating variations...')}</p>
      </motion.div>
    );
  }

  const filtered = activeTone
    ? variations.filter(v => v.tone === activeTone)
    : variations;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
      <h3 className="text-[16px] font-bold text-foreground mb-3">{t('variations.title', 'Post Variations')}</h3>

      {/* Tone filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
        <button
          onClick={() => setActiveTone(null)}
          className={`rounded-3xl px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap transition-all ${
            !activeTone ? 'gradient-btn text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
          }`}>
          All Tones
        </button>
        {toneOptions.map(tone => (
          <button key={tone.key} onClick={() => setActiveTone(activeTone === tone.key ? null : tone.key)}
            className={`rounded-3xl px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap transition-all ${
              activeTone === tone.key ? 'gradient-btn text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}>
            {tone.label}
          </button>
        ))}
      </div>

      {/* Horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible">
        {filtered.map((v, i) => (
          <motion.div
            key={v.badge}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, scale: selected === i ? 1.02 : selected !== null && selected !== i ? 0.97 : 1 }}
            transition={{ delay: i * 0.1 }}
            className={`min-w-[85%] md:min-w-0 snap-center bg-card rounded-2xl p-4 border transition-all ${
              selected === i ? 'border-brand-blue shadow-md' : selected !== null ? 'border-border-light opacity-60' : 'border-border-light'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider text-primary-foreground ${v.color} px-2 py-0.5 rounded-md`}>
                {t('variations.variation', 'Variation')} {v.badge}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                {v.toneLabel}
              </span>
            </div>
            <p className="text-[14px] text-foreground leading-[1.6] line-clamp-6">{v.caption}</p>
            <p className="text-[12px] text-brand-blue mt-2">{v.hashtags}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-muted-foreground">{v.engagement}</span>
            </div>
            <button
              onClick={() => { setSelected(i); onSelectVariation(v.caption, v.hashtags); }}
              className={`w-full h-10 rounded-xl mt-3 text-[13px] font-bold btn-press ${
                selected === i ? 'gradient-btn text-primary-foreground' : 'border border-border text-foreground'
              }`}
            >
              {selected === i ? `✓ ${t('variations.selected', 'Selected')}` : t('variations.selectThis', 'Select This Version')}
            </button>
          </motion.div>
        ))}
      </div>

      <button className="w-full text-center text-[13px] text-brand-blue font-medium mt-2">
        {t('variations.regenerateAll', 'Or regenerate all variations')}
      </button>
    </motion.div>
  );
};

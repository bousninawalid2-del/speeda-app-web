import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const suggestedHashtags = ['#RiyadhRestaurants', '#HalalFood', '#SaudiCuisine', '#FoodPhotography', '#ArabicFood'];
const bannedHashtags = ['#FollowForFollow'];

interface HashtagToolbarProps {
  hashtags: string[];
  onUpdate: (tags: string[]) => void;
}

export const HashtagToolbar = ({ hashtags, onUpdate }: HashtagToolbarProps) => {
  const { t } = useTranslation();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [checking, setChecking] = useState(false);
  const [bannedResults, setBannedResults] = useState<string[]>([]);

  const handleSuggestMore = () => {
    setShowSuggestions(true);
  };

  const handleCheckBanned = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      const found = hashtags.filter(h => bannedHashtags.includes(h));
      setBannedResults(found);
      if (found.length === 0) {
        toast.success(t('hashtags.noBanned', '✓ No banned hashtags found'));
      } else {
        toast.error(`${found.length} ${t('hashtags.bannedFound', 'banned hashtag(s) found')}`);
      }
    }, 800);
  };

  const addHashtag = (tag: string) => {
    if (!hashtags.includes(tag)) {
      onUpdate([...hashtags, tag]);
    }
  };

  const removeHashtag = (tag: string) => {
    onUpdate(hashtags.filter(h => h !== tag));
  };

  return (
    <div className="mt-3 space-y-2">
      {/* Current hashtags as chips */}
      <div className="flex flex-wrap gap-1.5">
        {hashtags.map((tag, i) => (
          <span key={i} className={`inline-flex items-center gap-1 text-[12px] font-medium px-2.5 py-1 rounded-lg ${
            bannedResults.includes(tag) ? 'bg-red-soft text-red-accent border border-red-accent/30' : 'bg-purple-soft text-brand-blue'
          }`}>
            {tag}
            {bannedResults.includes(tag) && <span className="text-[10px]">⚠️</span>}
            <button onClick={() => removeHashtag(tag)} className="ml-0.5 text-[10px] opacity-60 hover:opacity-100">✕</button>
          </span>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 text-[12px]">
        <button onClick={handleSuggestMore} className="text-brand-blue font-semibold hover:underline">
          ✦ {t('hashtags.suggestMore', 'Suggest More')}
        </button>
        <button onClick={handleCheckBanned} className="text-brand-blue font-semibold hover:underline">
          {checking ? '...' : `🚫 ${t('hashtags.checkBanned', 'Check Banned')}`}
        </button>
        <span className="text-muted-foreground ml-auto">{hashtags.length}/30</span>
      </div>

      {/* Suggestions */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {suggestedHashtags.filter(s => !hashtags.includes(s)).map((tag, i) => (
                <button key={i} onClick={() => addHashtag(tag)}
                  className="text-[12px] font-medium px-2.5 py-1 rounded-lg bg-muted text-foreground hover:bg-brand-blue hover:text-primary-foreground transition-colors">
                  + {tag}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

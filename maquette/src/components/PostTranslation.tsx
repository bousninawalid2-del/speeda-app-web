import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

const languages = [
  { code: 'ar', label: 'Arabic (العربية)', flag: '🇸🇦' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'French (Français)', flag: '🇫🇷' },
  { code: 'tr', label: 'Turkish (Türkçe)', flag: '🇹🇷' },
  { code: 'ur', label: 'Urdu (اردو)', flag: '🇵🇰' },
  { code: 'hi', label: 'Hindi (हिन्दी)', flag: '🇮🇳' },
];

const translatedContent: Record<string, { caption: string; hashtags: string }> = {
  ar: {
    caption: 'اكتشف شاورما الدجاج المميزة لدينا — متبلة لمدة 24 ساعة، مشوية بإتقان، وملفوفة بالخضار الطازجة وصلصة الثوم السرية. اطلب الآن! 🔥',
    hashtags: '#شاورما #مطاعم_الرياض #أكل_سعودي #شاورما_دجاج #لذيذ',
  },
  fr: {
    caption: 'Découvrez notre Shawarma au poulet signature — mariné 24 heures, grillé à la perfection, enveloppé de légumes frais et notre sauce à l\'ail secrète. Commandez maintenant ! 🔥',
    hashtags: '#Shawarma #CuisineSaoudienne #FoodPorn #PouletGrillé #Délicieux',
  },
  tr: {
    caption: 'Özel Tavuk Şavarmamızı keşfedin — 24 saat marine edilmiş, mükemmel pişirilmiş, taze sebzeler ve gizli sarımsak sosumuzla. Şimdi sipariş verin! 🔥',
    hashtags: '#Shawarma #Lezzetli #TürkYemekleri #TavukShawarma #Yemek',
  },
  ur: {
    caption: 'ہمارا خصوصی چکن شاورما دریافت کریں — 24 گھنٹے میرینیٹ، بالکل گرل کیا ہوا، تازہ سبزیوں اور ہمارے خفیہ لہسن ساس کے ساتھ۔ ابھی آرڈر کریں! 🔥',
    hashtags: '#شاورما #پاکستانی_کھانا #مزیدار #چکن_شاورما #کھانا',
  },
  hi: {
    caption: 'हमारा सिग्नेचर चिकन शावर्मा खोजें — 24 घंटे मैरीनेट, परफेक्ट ग्रिल्ड, ताज़ी सब्जियों और हमारी सीक्रेट गार्लिक सॉस के साथ। अभी ऑर्डर करें! 🔥',
    hashtags: '#शावर्मा #खाना #चिकनशावर्मा #स्वादिष्ट #फूडलवर्स',
  },
};

interface PostTranslationProps {
  currentLang?: string;
  onUseTranslation: (caption: string, hashtags: string) => void;
}

export const PostTranslation = ({ currentLang = 'en', onUseTranslation }: PostTranslationProps) => {
  const { t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedLang, setTranslatedLang] = useState<string | null>(null);

  const handleTranslate = (langCode: string) => {
    setShowDropdown(false);
    setTranslating(true);
    setTranslatedLang(langCode);
    setTimeout(() => setTranslating(false), 1500);
  };

  const langInfo = languages.find(l => l.code === translatedLang);
  const translated = translatedLang ? translatedContent[translatedLang] : null;

  return (
    <div className="relative">
      <button onClick={() => setShowDropdown(!showDropdown)}
        className="h-10 px-4 rounded-xl border border-border text-foreground text-[13px] font-medium btn-press flex items-center gap-1.5">
        🌐 {t('translate.button', 'Translate')} <ChevronDown size={14} />
      </button>

      {/* Language dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            className="absolute top-12 left-0 z-40 bg-card rounded-2xl border border-border shadow-xl p-2 min-w-[220px]">
            {languages.filter(l => l.code !== currentLang).map(l => (
              <button key={l.code} onClick={() => handleTranslate(l.code)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-start">
                <span className="text-[16px]">{l.flag}</span>
                <span className="text-[13px] text-foreground font-medium">{l.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Translation result */}
      <AnimatePresence>
        {translatedLang && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
            {translating ? (
              <div className="bg-card rounded-2xl p-5 border border-border-light">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-40" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-4/5" />
                </div>
                <p className="text-[12px] text-muted-foreground mt-3">
                  {t('translate.translating', 'Translating to')} {langInfo?.label}...
                </p>
              </div>
            ) : translated ? (
              <div className="bg-card rounded-2xl p-5 border border-border-light">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-blue bg-purple-soft px-2 py-0.5 rounded-md">
                  🌐 {langInfo?.label} {t('translate.translation', 'Translation')}
                </span>
                <p className="text-[14px] text-foreground leading-[1.6] mt-3" dir={translatedLang === 'ar' || translatedLang === 'ur' ? 'rtl' : 'ltr'}>
                  {translated.caption}
                </p>
                <p className="text-[12px] text-brand-blue mt-2">{translated.hashtags}</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => onUseTranslation(translated.caption, translated.hashtags)}
                    className="flex-1 h-10 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press">
                    {t('translate.useThis', 'Use This Translation')}
                  </button>
                  <button className="h-10 px-4 rounded-xl border border-border text-muted-foreground text-[12px] font-medium btn-press">
                    {t('common.edit', 'Edit')}
                  </button>
                </div>
                <button onClick={() => setTranslatedLang(null)} className="w-full text-center text-[12px] text-brand-blue font-medium mt-2">
                  {t('translate.again', 'Translate Again')}
                </button>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

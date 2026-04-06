import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const HASHTAGS_BY_INDUSTRY: Record<string, { ar: string[]; en: string[] }> = {
  restaurant: {
    ar: ['#مطعم', '#أكل', '#فطور', '#غداء', '#عشاء', '#طبخ', '#رياض_يأكل', '#جدة_تأكل', '#أكلات_سعودية', '#رمضان', '#إفطار', '#سحور'],
    en: ['#food', '#foodie', '#restaurant', '#riyadh', '#jeddah', '#saudifood', '#foodstagram', '#yummy', '#delicious', '#ramadan'],
  },
  cafe: {
    ar: ['#قهوة', '#كافيه', '#كوفي', '#باريستا', '#لاتيه', '#قهوة_مختصة', '#كافيهات_الرياض'],
    en: ['#coffee', '#cafe', '#coffeeshop', '#barista', '#latte', '#coffeelover'],
  },
  beauty: {
    ar: ['#جمال', '#مكياج', '#عناية', '#بشرة', '#شعر', '#صالون', '#تجميل'],
    en: ['#beauty', '#makeup', '#skincare', '#salon', '#hair', '#beautytips', '#glam'],
  },
  retail: {
    ar: ['#تسوق', '#عروض', '#خصم', '#تخفيضات', '#موضة', '#ستايل'],
    en: ['#shopping', '#sale', '#fashion', '#style', '#outfit', '#discount'],
  },
  fitness: {
    ar: ['#رياضة', '#لياقة', '#جيم', '#تمارين', '#صحة', '#فتنس'],
    en: ['#fitness', '#gym', '#workout', '#health', '#fit', '#training'],
  },
};

interface IndustryHashtagsProps {
  industry?: string;
  onAdd: (tag: string) => void;
  existingTags: string[];
}

export const IndustryHashtags = ({ industry = 'restaurant', onAdd, existingTags }: IndustryHashtagsProps) => {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const data = HASHTAGS_BY_INDUSTRY[industry] || HASHTAGS_BY_INDUSTRY.restaurant;
  const lang = i18n.language === 'ar' ? 'ar' : 'en';
  const tags = data[lang] || data.en;
  const available = tags.filter(t => !existingTags.includes(t));
  const shown = expanded ? available : available.slice(0, 6);

  if (available.length === 0) return null;

  return (
    <div className="mt-2">
      <p className="text-[12px] font-semibold text-muted-foreground mb-1.5">{t('suggestedHashtags')}</p>
      <div className="flex flex-wrap gap-1.5">
        {shown.map(tag => (
          <button key={tag} onClick={() => onAdd(tag)}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-muted text-foreground hover:bg-brand-blue hover:text-primary-foreground transition-colors">
            + {tag}
          </button>
        ))}
        {!expanded && available.length > 6 && (
          <button onClick={() => setExpanded(true)} className="text-[11px] text-brand-blue font-medium px-2 py-1">
            +{available.length - 6} more
          </button>
        )}
      </div>
    </div>
  );
};

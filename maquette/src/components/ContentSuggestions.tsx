import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const analytics = {
  bestFormat: 'Reels',
  worstFormat: 'Carousels',
  bestFormatEngagement: 1200,
  worstFormatEngagement: 450,
  bestDay: 'Thursday',
  bestTime: '8:00 PM',
  postsThisWeek: 2,
  avgPostsPerWeek: 4,
  topHashtag: '#SaudiFood',
  topHashtagEngagement: 890,
  avgEngagement: 620,
  topPostThumbnail: '📷',
};

interface ContentSuggestionsProps {
  onNavigate: (screen: string) => void;
}

export const ContentSuggestions = ({ onNavigate }: ContentSuggestionsProps) => {
  const { t } = useTranslation();
  const suggestions = useMemo(() => {
    const items: { text: string; action: string; nav: string }[] = [];

    if (analytics.bestFormatEngagement > analytics.worstFormatEngagement * 1.5) {
      const ratio = (analytics.bestFormatEngagement / analytics.worstFormatEngagement).toFixed(1);
      items.push({
        text: t('contentSuggestions.formatTip', { best: analytics.bestFormat, worst: analytics.worstFormat, ratio }),
        action: t('contentSuggestions.createReel'),
        nav: 'create',
      });
    }

    items.push({
      text: t('contentSuggestions.bestTime', { day: analytics.bestDay, time: analytics.bestTime }),
      action: t('contentSuggestions.schedule'),
      nav: 'create',
    });

    if (analytics.postsThisWeek < analytics.avgPostsPerWeek * 0.7) {
      items.push({
        text: t('contentSuggestions.consistency', { current: analytics.postsThisWeek, avg: analytics.avgPostsPerWeek }),
        action: t('contentSuggestions.postNow'),
        nav: 'create',
      });
    }

    if (analytics.topHashtagEngagement > analytics.avgEngagement * 1.3) {
      const pct = Math.round(((analytics.topHashtagEngagement - analytics.avgEngagement) / analytics.avgEngagement) * 100);
      items.push({
        text: t('contentSuggestions.hashtagBoost', { hashtag: analytics.topHashtag, pct }),
        action: t('contentSuggestions.useHashtag'),
        nav: 'create',
      });
    }

    items.push({
      text: t('contentSuggestions.topPost'),
      action: t('contentSuggestions.createSimilar'),
      nav: 'create',
    });

    return items.slice(0, 5);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  return (
    <div className="mt-6">
      <h2 className="text-[18px] font-bold text-foreground">{t('contentSuggestions.title')}</h2>
      <div className="mt-3 space-y-2">
        {suggestions.map((s, i) => (
          <button key={i} onClick={() => onNavigate(s.nav)}
            className="w-full flex items-start gap-3 bg-card rounded-2xl p-4 border border-border-light text-start border-s-2 border-s-brand-blue">
            <span className="text-brand-blue text-[14px] mt-0.5 flex-shrink-0">✦</span>
            <div className="flex-1">
              <p className="text-[13px] text-foreground leading-[1.5]">{s.text}</p>
              <span className="text-[12px] text-brand-blue font-semibold mt-1 inline-block">{s.action} →</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

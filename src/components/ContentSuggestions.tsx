import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePosts } from '@/hooks/usePosts';

interface ContentSuggestionsProps {
  onNavigate: (screen: string) => void;
}

export const ContentSuggestions = ({ onNavigate }: ContentSuggestionsProps) => {
  const { t } = useTranslation();
  const { data: analyticsData } = useAnalytics();
  const { data: postsData } = usePosts();

  const postsCount = postsData?.pagination?.total ?? 0;
  const reach = analyticsData?.reach ?? 0;
  const engagement = analyticsData?.engagement ?? 0;

  const suggestions = useMemo(() => {
    const items: { text: string; action: string; nav: string }[] = [];

    // Suggest creating content if few posts
    if (postsCount < 5) {
      items.push({
        text: `You have ${postsCount} post${postsCount !== 1 ? 's' : ''}. Creating more content increases your visibility and engagement.`,
        action: t('contentSuggestions.createReel'),
        nav: 'create',
      });
    }

    // Always suggest scheduling
    items.push({
      text: t('contentSuggestions.bestTime', { day: 'Thursday', time: '8:00 PM' }),
      action: t('contentSuggestions.schedule'),
      nav: 'create',
    });

    // Suggest posting if reach is low
    if (reach < 1000) {
      items.push({
        text: 'Your reach is growing. Post consistently to build momentum and attract more followers.',
        action: t('contentSuggestions.postNow'),
        nav: 'create',
      });
    }

    // If there is some engagement, suggest building on it
    if (engagement > 0) {
      items.push({
        text: `You have ${engagement} engagements. Create similar content to keep the momentum going.`,
        action: t('contentSuggestions.createSimilar'),
        nav: 'create',
      });
    }

    return items.slice(0, 3);
  }, [t, postsCount, reach, engagement]);

  if (suggestions.length === 0) return null;

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

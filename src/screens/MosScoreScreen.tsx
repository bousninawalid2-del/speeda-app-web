import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '../hooks/use-mobile';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export interface MosScoreFactor {
  name:   string;
  weight: number;
  pct:    number;
  pts:    string;
  desc:   string;
  key?:   string;
}

export interface MosScoreData {
  score:        number;
  tierLabel:    string;
  tierColor:    string;
  streak?:      number;
  questsDone?:  number;
  questsTotal?: number;
  factors?:     MosScoreFactor[];
  history?:     Array<{ week: string; score: number }>;
}

interface MosScoreScreenProps {
  onBack:      () => void;
  onNavigate:  (screen: string) => void;
  /** Live MOS score data from analytics API. Falls back to demo data. */
  liveData?:   MosScoreData;
  isLoading?:  boolean;
}

const FACTOR_KEYS = ['postingConsistency', 'engagementRate', 'responseTime', 'platformCoverage', 'campaignPerformance'] as const;

export const DEMO_SCORE: MosScoreData = {
  score:        74,
  tierLabel:    'Strong',
  tierColor:    'hsl(var(--green))',
  streak:       12,
  questsDone:   3,
  questsTotal:  5,
  factors: [
    { key: 'postingConsistency',  name: 'Posting Consistency', weight: 25, pct: 85, pts: '21/25', desc: 'How regularly you publish content across platforms' },
    { key: 'engagementRate',      name: 'Engagement Rate',     weight: 20, pct: 70, pts: '14/20', desc: 'Likes, comments, shares, and saves relative to your followers' },
    { key: 'responseTime',        name: 'Response Time',       weight: 20, pct: 60, pts: '12/20', desc: 'How quickly you respond to comments, DMs, and reviews' },
    { key: 'platformCoverage',    name: 'Platform Coverage',   weight: 15, pct: 90, pts: '13.5/15', desc: 'Number of active platforms out of your connected platforms' },
    { key: 'campaignPerformance', name: 'Campaign Performance',weight: 20, pct: 67, pts: '13.5/20', desc: 'ROAS and conversion rates on your active campaigns' },
  ],
  history: [
    { week: 'Week 1', score: 58 },
    { week: 'Week 2', score: 63 },
    { week: 'Week 3', score: 69 },
    { week: 'Week 4', score: 74 },
  ],
};

const ZERO_SCORE_FALLBACK: MosScoreData = {
  score: 0,
  tierLabel: 'Developing',
  tierColor: 'hsl(var(--orange))',
  streak: 0,
  questsDone: 0,
  questsTotal: 5,
  factors: [],
  history: [],
};

const DEMO_RECOMMENDATION_KEYS = [
  { slug: 'responseTime', border: 'hsl(var(--orange))', nav: 'chat-engagement-reviews' },
  { slug: 'tiktok',       border: 'hsl(var(--brand-blue))', nav: 'create' },
  { slug: 'boost',        border: 'hsl(var(--green))', nav: 'create' },
] as const;

const DEMO_QUEST_KEYS = [
  { done: true,  slug: 'reels',    pts: '+5 pts' },
  { done: true,  slug: 'reviews',  pts: '+3 pts' },
  { done: true,  slug: 'campaign', pts: '+8 pts' },
  { done: false, slug: 'review',   pts: '+2 pts', ctaKey: 'doIt',    nav: 'create' },
  { done: false, slug: 'tiktok',   pts: '+2 pts', ctaKey: 'connect', nav: 'social' },
] as const;

const AnimatedBar = ({ pct, delay }: { pct: number; delay: number }) => (
  <div className="w-full h-2 rounded-full bg-border overflow-hidden">
    <motion.div
      className="h-full rounded-full"
      style={{ background: 'linear-gradient(90deg, hsl(var(--brand-blue)), hsl(var(--brand-teal)))' }}
      initial={{ width: 0 }}
      animate={{ width: `${pct}%` }}
      transition={{ duration: 0.8, delay, ease: 'easeOut' }}
    />
  </div>
);

const HeroRing = ({ score, size }: { score: number; size: number }) => {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="mos-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--brand-blue))" />
            <stop offset="100%" stopColor="hsl(var(--brand-teal))" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="url(#mos-grad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className="font-extrabold text-foreground"
          style={{ fontSize: size * 0.3 }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          {score}
        </motion.span>
      </div>
    </div>
  );
};

export const MosScoreScreen = ({ onBack, onNavigate, liveData, isLoading }: MosScoreScreenProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [calcOpen, setCalcOpen] = useState(true);
  const [faqOpen, setFaqOpen] = useState(false);
  const questsRef = useRef<HTMLDivElement>(null);
  const ringSize = isMobile ? 120 : 160;

  const data        = liveData ?? ZERO_SCORE_FALLBACK;
  const score       = data.score;
  const tierSlug    = data.tierLabel === 'Strong' ? 'strong' : 'developing';
  const tierLabel   = t(`mosScore.tiers.${tierSlug}`);
  const tierColor   = data.tierColor ?? 'hsl(var(--green))';
  const streak      = data.streak ?? 0;
  const questsDone  = data.questsDone ?? 0;
  const questsTotal = data.questsTotal ?? 5;
  const factors     = data.factors ?? [];
  const historyData = data.history ?? [];

  const resolveFactorName = (f: MosScoreFactor) => {
    if (f.key && FACTOR_KEYS.includes(f.key as typeof FACTOR_KEYS[number])) {
      return t(`mosScore.factors.${f.key}.name`);
    }
    return f.name;
  };

  const resolveFactorDesc = (f: MosScoreFactor) => {
    if (f.key && FACTOR_KEYS.includes(f.key as typeof FACTOR_KEYS[number])) {
      return t(`mosScore.factors.${f.key}.desc`);
    }
    return f.desc;
  };

  const handleRecAction = (nav: string) => {
    if (nav === '_quests') {
      questsRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      onNavigate(nav);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 size={32} className="text-brand-blue animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-background min-h-full pb-8">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border-light">
        <div className="flex items-center gap-3 px-4 py-3 max-w-[1200px] mx-auto">
          <button onClick={onBack} className="w-8 h-8 rounded-lg bg-card border border-border-light flex items-center justify-center">
            <ArrowLeft size={16} className="text-foreground rtl:rotate-180" />
          </button>
          <h1 className="text-[20px] font-bold text-foreground">{t('mosScore.title')}</h1>
        </div>
      </div>

      <div className={`px-4 pt-6 max-w-[1200px] mx-auto ${!isMobile ? 'grid grid-cols-2 gap-6' : 'space-y-5'}`}>
        <div className="space-y-5">
          <div className="bg-card rounded-2xl border border-border-light p-6 flex flex-col items-center">
            <HeroRing score={score} size={ringSize} />
            <motion.div
              className="mt-3 px-3 py-1 rounded-full text-[13px] font-bold"
              style={{ backgroundColor: 'hsl(var(--green-soft))', color: tierColor }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: 'spring' }}
            >
              {tierLabel}
            </motion.div>
            <div className="mt-3 flex flex-col items-center gap-1">
              {streak > 0 && (
                <span className="text-[14px] font-bold" style={{ background: 'linear-gradient(90deg, hsl(var(--brand-blue)), hsl(var(--brand-teal)))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {t('home.streak', { count: streak })}
                </span>
              )}
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-muted-foreground font-medium">{t('home.weeklyQuests', { done: questsDone, total: questsTotal })}</span>
                <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, hsl(var(--brand-blue)), hsl(var(--brand-teal)))' }}
                    initial={{ width: 0 }} animate={{ width: `${(questsDone / Math.max(questsTotal, 1)) * 100}%` }} transition={{ duration: 0.8, delay: 0.5 }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border-light overflow-hidden">
            <button onClick={() => setCalcOpen(!calcOpen)} className="w-full flex items-center justify-between p-4">
              <span className="text-[16px] font-bold text-foreground">{t('mosScore.howCalculated')}</span>
              {calcOpen ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
            </button>
            {calcOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-4 pb-4 space-y-4">
                {factors.map((f, i) => (
                  <div key={f.key ?? f.name} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-semibold text-foreground">{resolveFactorName(f)} <span className="text-muted-foreground font-normal">({f.weight}%)</span></span>
                      <span className="text-[13px] font-bold text-foreground">{f.pts}</span>
                    </div>
                    <p className="text-[12px] text-muted-foreground">{resolveFactorDesc(f)}</p>
                    <AnimatedBar pct={f.pct} delay={0.2 + i * 0.1} />
                  </div>
                ))}
                <div className="pt-2 border-t border-border-light flex justify-between">
                  <span className="text-[15px] font-bold text-foreground">{t('mosScore.total')}</span>
                  <span className="text-[15px] font-bold" style={{ color: tierColor }}>{score}/100</span>
                </div>
              </motion.div>
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border-light p-4">
            <h3 className="text-[16px] font-bold text-foreground mb-3">{t('mosScore.scoreHistory')}</h3>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(233,100%,42%)" />
                      <stop offset="100%" stopColor="hsl(193,100%,48%)" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'hsl(220,9%,46%)' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(220,9%,46%)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid hsl(264,25%,92%)' }} />
                  <Line type="monotone" dataKey="score" stroke="url(#lineGrad)" strokeWidth={3} dot={{ r: 5, fill: 'hsl(233,100%,42%)', stroke: 'white', strokeWidth: 2 }} animationDuration={1500} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-[18px] font-bold text-foreground">{t('mosScore.aiRecommendations')}</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--brand-teal) / 0.1)', color: 'hsl(var(--brand-teal))' }}>{t('mosScore.poweredByAi')}</span>
            </div>
            <div className="space-y-3">
              {DEMO_RECOMMENDATION_KEYS.map((r) => (
                <motion.div
                  key={r.slug}
                  className="bg-card rounded-2xl border border-border-light p-4 overflow-hidden"
                  style={{ borderLeft: `4px solid ${r.border}` }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-[15px] font-bold text-foreground">{t(`mosScore.recommendations.${r.slug}.title`)}</p>
                  <p className="text-[13px] text-muted-foreground mt-1">{t(`mosScore.recommendations.${r.slug}.desc`)}</p>
                  <button onClick={() => handleRecAction(r.nav)} className="mt-3 text-[13px] font-bold px-4 py-2 rounded-xl text-primary-foreground" style={{ background: 'linear-gradient(135deg, hsl(var(--brand-blue)), hsl(var(--brand-teal)))' }}>
                    {t(`mosScore.recommendations.${r.slug}.cta`)}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>

          <div ref={questsRef}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-[18px] font-bold text-foreground">{t('mosScore.weeklyQuests')}</h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{t('mosScore.completed', { done: questsDone, total: questsTotal })}</span>
            </div>
            <div className="bg-card rounded-2xl border border-border-light p-4 space-y-3">
              {DEMO_QUEST_KEYS.map((q, i) => (
                <div key={i} className={`flex items-center justify-between ${q.done ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span>{q.done ? '✅' : '⬜'}</span>
                    <span className={`text-[13px] ${q.done ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}`}>{t(`mosScore.questList.${q.slug}`)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-primary">{q.pts}</span>
                    {!q.done && 'ctaKey' in q && q.ctaKey && 'nav' in q && q.nav && (
                      <button onClick={() => onNavigate(q.nav)} className="text-[11px] font-bold text-primary">{t(`mosScore.questCta.${q.ctaKey}`)}</button>
                    )}
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-border-light">
                <div className="flex justify-between text-[12px] text-muted-foreground mb-1.5">
                  <span>{questsDone}/{questsTotal} {t('mosScore.quests')}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, hsl(var(--brand-blue)), hsl(var(--brand-teal)))' }}
                    initial={{ width: 0 }} animate={{ width: `${(questsDone / Math.max(questsTotal, 1)) * 100}%` }} transition={{ duration: 0.8 }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border-light overflow-hidden">
            <button onClick={() => setFaqOpen(!faqOpen)} className="w-full flex items-center justify-between p-4">
              <span className="text-[14px] font-bold text-foreground">{t('mosScore.whatIsMos')}</span>
              {faqOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
            </button>
            {faqOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-4 pb-4">
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  {t('mosScore.whatIsMosBody')}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

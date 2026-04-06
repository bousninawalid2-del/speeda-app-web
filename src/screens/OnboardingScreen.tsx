import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { InstagramLogo, TikTokLogo, SnapchatLogo, GoogleLogo } from '../components/PlatformLogos';
import { Pen, BarChart3, Megaphone, MessageSquare, Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OnboardingProps {
  onComplete: () => void;
}

// Slide 1: Premium constellation visualization
const Slide1Illustration = () => {
  const nodes = [
    { x: 140, y: 80, icon: Pen, delay: 0 },
    { x: 60, y: 130, icon: BarChart3, delay: 0.5 },
    { x: 220, y: 130, icon: Megaphone, delay: 1 },
    { x: 90, y: 200, icon: MessageSquare, delay: 1.5 },
    { x: 190, y: 200, icon: Brain, delay: 2 },
  ];
  return (
    <div className="w-full aspect-square max-w-[280px] relative flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 280 280">
        {/* Connection lines */}
        <line x1="140" y1="140" x2="140" y2="80" stroke="url(#line-grad)" strokeWidth="1" opacity="0.3" />
        <line x1="140" y1="140" x2="60" y2="130" stroke="url(#line-grad)" strokeWidth="1" opacity="0.3" />
        <line x1="140" y1="140" x2="220" y2="130" stroke="url(#line-grad)" strokeWidth="1" opacity="0.3" />
        <line x1="140" y1="140" x2="90" y2="200" stroke="url(#line-grad)" strokeWidth="1" opacity="0.3" />
        <line x1="140" y1="140" x2="190" y2="200" stroke="url(#line-grad)" strokeWidth="1" opacity="0.3" />
        <line x1="60" y1="130" x2="90" y2="200" stroke="url(#line-grad)" strokeWidth="0.5" opacity="0.2" />
        <line x1="220" y1="130" x2="190" y2="200" stroke="url(#line-grad)" strokeWidth="0.5" opacity="0.2" />
        <defs>
          <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0020d4" />
            <stop offset="100%" stopColor="#00c7f3" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center orb */}
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-20 h-20 rounded-full absolute"
        style={{ background: 'radial-gradient(circle, rgba(0,199,243,0.4) 0%, rgba(0,32,212,0.3) 50%, transparent 70%)', top: '42%', left: '50%', transform: 'translate(-50%, -50%)' }}
      />
      <motion.div className="w-10 h-10 rounded-full gradient-hero absolute shadow-lg" style={{ top: '42%', left: '50%', transform: 'translate(-50%, -50%)' }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Nodes */}
      {nodes.map((node, i) => (
        <motion.div
          key={i}
          className="absolute w-10 h-10 rounded-full bg-card border border-border-light shadow-md flex items-center justify-center"
          style={{ left: node.x - 20, top: node.y - 20 }}
          animate={{ y: [0, -3, 0, 3, 0] }}
          transition={{ duration: 4 + i, repeat: Infinity, delay: node.delay }}
        >
          <node.icon size={16} className="text-brand-blue" />
        </motion.div>
      ))}
    </div>
  );
};

// Slide 2: Phone mockups
const Slide2Illustration = () => (
  <div className="w-full aspect-square max-w-[280px] relative flex items-center justify-center">
    {[-5, 0, 5].map((rot, i) => (
      <motion.div
        key={i}
        className="absolute w-[90px] h-[160px] rounded-2xl bg-card border-2 shadow-lg flex flex-col items-center justify-center overflow-hidden"
        style={{
          borderColor: i === 0 ? '#d62976' : i === 1 ? '#000' : '#FFFC00',
          transform: `rotate(${rot}deg)`,
          left: `${80 + i * 40}px`,
          zIndex: 10 - Math.abs(i - 1),
        }}
        animate={{ rotate: [rot, rot + 1, rot, rot - 1, rot] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className={`w-full h-8 flex items-center justify-center ${i === 0 ? 'bg-gradient-to-r from-[#fa7e1e] to-[#d62976]' : i === 1 ? 'bg-black' : 'bg-[#FFFC00]'}`}>
          {i === 0 && <InstagramLogo size={14} />}
          {i === 1 && <TikTokLogo size={14} />}
          {i === 2 && <SnapchatLogo size={14} />}
        </div>
        <div className="flex-1 w-full bg-muted flex items-center justify-center">
          <div className="w-12 h-12 rounded-lg gradient-hero opacity-30" />
        </div>
      </motion.div>
    ))}
    {/* Sparkles */}
    {[{ x: 50, y: 60 }, { x: 230, y: 80 }, { x: 140, y: 40 }, { x: 60, y: 190 }].map((s, i) => (
      <motion.div
        key={i}
        className="absolute text-brand-blue text-[10px]"
        style={{ left: s.x, top: s.y }}
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
      >✦</motion.div>
    ))}
  </div>
);

// Slide 3: Growth chart with platform logos
const Slide3Illustration = () => (
  <div className="w-full aspect-square max-w-[280px] relative flex items-center justify-center">
    {/* Grid */}
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 280 280">
      {[60, 100, 140, 180, 220].map(y => (
        <line key={y} x1="20" y1={y} x2="260" y2={y} stroke="hsl(264,25%,92%)" strokeWidth="0.5" />
      ))}
      <defs>
        <linearGradient id="chart-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0020d4" />
          <stop offset="100%" stopColor="#00c7f3" />
        </linearGradient>
      </defs>
      <motion.path
        d="M30 200 Q80 180, 100 160 T160 120 T220 70 T260 50"
        fill="none"
        stroke="url(#chart-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />
    </svg>
    {/* Platform logos along curve */}
    {[
      { Logo: InstagramLogo, x: 80, y: 165 },
      { Logo: TikTokLogo, x: 140, y: 120 },
      { Logo: SnapchatLogo, x: 190, y: 85 },
      { Logo: GoogleLogo, x: 235, y: 55 },
    ].map((p, i) => (
      <motion.div
        key={i}
        className="absolute w-8 h-8 rounded-full bg-card shadow-md flex items-center justify-center"
        style={{ left: p.x - 16, top: p.y - 16 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 + i * 0.3 }}
      >
        <p.Logo size={16} />
      </motion.div>
    ))}
    {/* Floating coins */}
    {[{ x: 200, y: 40 }, { x: 240, y: 30 }, { x: 220, y: 20 }].map((c, i) => (
      <motion.div
        key={i}
        className="absolute text-[14px]"
        style={{ left: c.x, top: c.y }}
        animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
      >💰</motion.div>
    ))}
  </div>
);

export const OnboardingScreen = ({ onComplete }: OnboardingProps) => {
  const { t } = useTranslation();
  const slides = [
    {
      title: t('onboardingSlides.slide1Title'),
      subtitle: t('onboardingSlides.slide1Subtitle'),
      Illustration: Slide1Illustration,
    },
    {
      title: t('onboardingSlides.slide2Title'),
      subtitle: t('onboardingSlides.slide2Subtitle'),
      Illustration: Slide2Illustration,
    },
    {
      title: t('onboardingSlides.slide3Title'),
      subtitle: t('onboardingSlides.slide3Subtitle'),
      Illustration: Slide3Illustration,
    },
  ];
  const [current, setCurrent] = useState(0);
  const isLast = current === slides.length - 1;

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -50 && current < slides.length - 1) setCurrent(c => c + 1);
    if (info.offset.x > 50 && current > 0) setCurrent(c => c - 1);
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col z-[90]">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.3 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          className="flex-1 flex flex-col items-center justify-center px-8"
        >
          {(() => { const Ill = slides[current].Illustration; return <Ill />; })()}

          <h2 className="text-[28px] font-extrabold tracking-[-0.02em] text-foreground text-center mt-8">
            {slides[current].title}
          </h2>
          <p className="text-[14px] text-muted-foreground text-center mt-3 leading-[1.55] max-w-[300px]">
            {slides[current].subtitle}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="px-6 pb-10 flex flex-col items-center gap-5">
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? 'w-6 gradient-hero' : 'w-2 bg-border'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => isLast ? onComplete() : setCurrent(c => c + 1)}
          className="w-full h-[56px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press"
        >
          {isLast ? t('onboardingSlides.getStarted') : t('common.next')}
        </button>

        {isLast ? (
          <button onClick={onComplete} className="text-muted-foreground text-[13px] font-medium">
            {t('onboardingSlides.alreadyHaveAccount')}{' '}
            <span className="text-brand-blue font-semibold">{t('onboardingSlides.signIn')}</span>
          </button>
        ) : (
          <button onClick={onComplete} className="text-muted-foreground text-[13px] font-medium">
            {t('common.skip')}
          </button>
        )}
      </div>
    </div>
  );
};

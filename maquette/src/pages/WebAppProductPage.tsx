import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Monitor, Smartphone, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import webHome from '@/assets/web-screenshot-home.png';
import webAiChat from '@/assets/web-screenshot-ai-chat.png';
import webContentStudio from '@/assets/web-screenshot-content-studio.png';
import webCalendar from '@/assets/web-screenshot-calendar.png';
import webAnalytics from '@/assets/web-screenshot-analytics.png';
import webAds from '@/assets/web-screenshot-ads.png';

// ── MacBook Frame ──────────────────────────────────────────────
const MacBookFrame = ({
  src,
  alt,
  className = '',
  style = {},
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div
    className={`relative ${className}`}
    style={{
      filter: 'drop-shadow(0 20px 60px rgba(0,0,0,0.12))',
      ...style,
    }}
  >
    {/* Screen bezel */}
    <div className="bg-[#1a1a1a] rounded-t-[12px] pt-[8px] px-[8px] pb-0 relative">
      {/* Camera notch */}
      <div className="absolute top-[3px] left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full bg-[#2a2a2a] border border-[#333]" />
      {/* Screen */}
      <div className="rounded-[4px] overflow-hidden">
        <img src={src} alt={alt} className="w-full h-auto block" loading="lazy" />
      </div>
    </div>
    {/* Bottom body / keyboard hint */}
    <div className="relative">
      <div className="h-[14px] bg-gradient-to-b from-[#c0c0c0] to-[#a8a8a8] rounded-b-[8px]" />
      {/* Hinge indent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[18%] h-[4px] bg-[#b0b0b0] rounded-b-[4px]" />
    </div>
  </div>
);

// ── Animated Feature Block ─────────────────────────────────────
const FeatureBlock = ({
  src,
  alt,
  category,
  title,
  description,
  highlights,
  bgClass,
  tiltDirection,
  index,
}: {
  src: string;
  alt: string;
  category: string;
  title: string;
  description: string;
  highlights: string[];
  bgClass: string;
  tiltDirection: 'left' | 'right';
  index: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className={`${bgClass} py-16 md:py-24`} ref={ref}>
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
        {/* Laptop */}
        <motion.div
          className="flex justify-center mb-10 md:mb-14"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <MacBookFrame
            src={src}
            alt={alt}
            className="w-full max-w-[800px]"
            style={{
              transform:
                tiltDirection === 'right'
                  ? 'perspective(1200px) rotateY(2deg)'
                  : 'perspective(1200px) rotateY(-2deg)',
            }}
          />
        </motion.div>

        {/* Text */}
        <motion.div
          className="max-w-[600px] mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <span className="inline-block gradient-hero text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-wide">
            {category}
          </span>
          <h2 className="text-2xl md:text-[28px] font-extrabold text-foreground leading-tight mb-4">
            {title}
          </h2>
          <p className="text-[15px] text-muted-foreground leading-[1.7] mb-6">
            {description}
          </p>
          <div className="flex flex-col gap-2 items-center">
            {highlights.map((h) => (
              <p key={h} className="text-sm text-foreground/80">
                <span className="text-brand-blue mr-1.5">✦</span>
                {h}
              </p>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ── Sparkle ────────────────────────────────────────────────────
const Sparkle = ({ x, y, delay }: { x: string; y: string; delay: number }) => (
  <motion.span
    className="absolute text-brand-blue text-xs pointer-events-none select-none"
    style={{ left: x, top: y }}
    animate={{ opacity: [0, 1, 0], scale: [0.7, 1.2, 0.7] }}
    transition={{ duration: 2.5, repeat: Infinity, delay }}
  >
    ✦
  </motion.span>
);

// ── Platform Logos (same as other product pages) ───────────────
const platformLogos = [
  { name: 'Instagram', color: '#E4405F' },
  { name: 'TikTok', color: '#010101' },
  { name: 'Snapchat', color: '#FFFC00' },
  { name: 'Facebook', color: '#1877F2' },
  { name: 'X', color: '#000' },
  { name: 'YouTube', color: '#FF0000' },
  { name: 'LinkedIn', color: '#0A66C2' },
  { name: 'Google Biz', color: '#4285F4' },
];

// ── Main Page ──────────────────────────────────────────────────
const WebAppProductPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background font-poppins overflow-x-hidden">
      {/* ═══ HERO ═══ */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        {/* Gradient blobs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]" style={{ background: 'hsl(var(--brand-blue))' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]" style={{ background: 'hsl(var(--brand-teal))' }} />

        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 relative z-10">
          {/* Text */}
          <motion.div
            className="text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-1.5 gradient-hero text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full mb-5">
              <Monitor className="w-3.5 h-3.5" /> Web Application
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground leading-tight mb-4 max-w-[700px] mx-auto">
              The Full Marketing Command Center
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-[560px] mx-auto leading-relaxed mb-8">
              Everything you need to run your restaurant's marketing — content creation, scheduling, analytics, ads, and AI — on one powerful desktop dashboard.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                className="gradient-hero text-primary-foreground font-bold text-sm px-7 py-3 rounded-full shadow-btn btn-press flex items-center gap-2"
                onClick={() => navigate('/')}
              >
                Try Speeda AI Free <ArrowRight className="w-4 h-4" />
              </button>
              <button
                className="bg-card text-foreground font-semibold text-sm px-7 py-3 rounded-full border border-border shadow-card btn-press"
                onClick={() => navigate('/')}
              >
                View Demo
              </button>
            </div>
          </motion.div>

          {/* Hero MacBook */}
          <motion.div
            className="relative flex justify-center"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
              className="relative"
            >
              <MacBookFrame
                src={webHome}
                alt="Speeda AI Dashboard"
                className="w-full max-w-[900px]"
                style={{
                  transform: 'perspective(1200px) rotateX(2deg) rotateY(-2deg)',
                }}
              />
              {/* Sparkles */}
              <Sparkle x="-3%" y="10%" delay={0} />
              <Sparkle x="102%" y="20%" delay={0.8} />
              <Sparkle x="5%" y="85%" delay={1.5} />
              <Sparkle x="95%" y="75%" delay={2.2} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══ FEATURE BLOCKS ═══ */}
      <FeatureBlock
        src={webAiChat}
        alt="AI Chat Interface"
        category="AI Assistant"
        title="AI Chat — Like ChatGPT, but for your marketing"
        description="Three intelligent panels working together. Your conversation history on the left, the active AI chat in the center, and a context panel on the right showing full post previews, campaign details, and quick actions. Ask Speeda anything — create content, launch campaigns, check analytics — and see results in real-time."
        highlights={[
          'Full conversation history across all sessions',
          'Context panel with post preview and one-click actions',
          'Approve and schedule without leaving the chat',
        ]}
        bgClass="bg-card"
        tiltDirection="right"
        index={0}
      />

      <FeatureBlock
        src={webContentStudio}
        alt="Content Studio"
        category="Content Creation"
        title="Create content with precision and control"
        description="The Content Studio gives you full control over every post. Choose your platform, content type, tone, and template — then let AI generate. Schedule for the perfect time, preview across platforms, and fine-tune every detail before publishing. Built for marketers who want quality and speed."
        highlights={[
          'Platform-specific templates and content types',
          'Schedule for optimal posting times with one click',
          'Multi-platform strategy builder for weekly plans',
        ]}
        bgClass="bg-[#f8f6fd]"
        tiltDirection="left"
        index={1}
      />

      <FeatureBlock
        src={webCalendar}
        alt="Calendar View"
        category="Planning"
        title="Your entire month of marketing — one screen"
        description="See every post, every campaign, and every gap in your content strategy on a full month calendar. Posts are color-coded by platform. Empty days are flagged by AI with suggestions. Drag and drop to reschedule. Click any post to preview, edit, or boost it directly from the calendar."
        highlights={[
          'Full month grid view with platform color coding',
          'AI detects empty days and suggests content',
          'Boost any post directly from the calendar view',
        ]}
        bgClass="bg-card"
        tiltDirection="right"
        index={2}
      />

      <FeatureBlock
        src={webAnalytics}
        alt="Analytics Dashboard"
        category="Analytics"
        title="Data that drives decisions, not confusion"
        description="Every metric that matters — reach, engagement, followers, conversions — displayed across all your platforms on one dashboard. The weekly engagement chart shows trends at a glance. Platform breakdown with real logos shows where your audience lives. AI insights explain the numbers and tell you exactly what to do next."
        highlights={[
          'Cross-platform KPIs with real-time updates',
          'Platform breakdown with actual social media logos',
          'AI-powered insights and competitor benchmarking',
        ]}
        bgClass="bg-[#f8f6fd]"
        tiltDirection="left"
        index={3}
      />

      <FeatureBlock
        src={webAds}
        alt="Ads Manager"
        category="Advertising"
        title="Launch, optimize, and scale your ads from one place"
        description="Manage all your advertising campaigns across Instagram, Facebook, and other social platforms from a unified dashboard. See your ad balance, active campaigns, and performance metrics at a glance. AI optimizes your budget allocation 24/7 and pauses underperforming ads automatically."
        highlights={[
          'Cross-platform ad management in one dashboard',
          'Real-time ROAS tracking per campaign',
          'AI budget optimization runs 24/7',
        ]}
        bgClass="bg-card"
        tiltDirection="right"
        index={4}
      />

      {/* ═══ WHY CHOOSE WEB APP ═══ */}
      <section className="py-16 md:py-24 bg-[#f8f6fd]">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground text-center mb-4">
            Why serious marketers choose the web app
          </h2>
          <p className="text-muted-foreground text-center max-w-[500px] mx-auto mb-12">
            The desktop experience gives you the full power of Speeda AI with no compromises.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🖥️', title: 'Full-size dashboard', desc: 'See more data, more context, and more detail on every screen.' },
              { icon: '⌨️', title: 'Keyboard shortcuts', desc: 'Power users move faster with shortcuts for every action.' },
              { icon: '📊', title: 'Multi-panel views', desc: 'View analytics, chat, and calendar side-by-side.' },
              { icon: '🎯', title: 'Drag & drop calendar', desc: 'Reschedule posts by dragging them on the full month view.' },
              { icon: '✏️', title: 'Advanced editing', desc: 'Fine-tune content with the full text editor and preview.' },
              { icon: '🔒', title: 'Enterprise-grade security', desc: '2FA, session management, and role-based access control.' },
            ].map((b) => (
              <div key={b.title} className="bg-card rounded-2xl p-6 shadow-card desktop-hover">
                <span className="text-2xl mb-3 block">{b.icon}</span>
                <h3 className="text-[15px] font-bold text-foreground mb-1">{b.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PLATFORMS ═══ */}
      <section className="py-16 md:py-20">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3">
            Publish to every platform
          </h2>
          <p className="text-muted-foreground mb-10">
            One dashboard, all your channels.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {platformLogos.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-2 bg-card rounded-full px-5 py-2.5 shadow-card border border-border"
              >
                <div className="w-5 h-5 rounded-full" style={{ background: p.color }} />
                <span className="text-sm font-semibold text-foreground">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CROSS-SELL ═══ */}
      <section className="py-16 md:py-20 bg-[#f8f6fd]">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground text-center mb-10">
            Speeda AI is everywhere you are
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mobile */}
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border desktop-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-foreground">Mobile App</h3>
                  <p className="text-xs text-muted-foreground">Marketing on the go</p>
                </div>
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
                Approve posts, respond to reviews, and check analytics from your phone. Everything syncs with the web app in real-time.
              </p>
              <button className="text-sm font-bold text-brand-blue flex items-center gap-1">
                Learn more <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* WhatsApp */}
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border desktop-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-foreground">WhatsApp Assistant</h3>
                  <p className="text-xs text-muted-foreground">AI in your pocket</p>
                </div>
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
                Chat with Speeda AI directly on WhatsApp. Create posts, get insights, and manage campaigns without opening any app.
              </p>
              <button className="text-sm font-bold text-brand-blue flex items-center gap-1">
                Learn more <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20 md:py-28">
        <div className="max-w-[600px] mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4">
            Ready to take control of your marketing?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-[440px] mx-auto">
            Join thousands of restaurants using Speeda AI to grow faster with less effort.
          </p>
          <button
            className="gradient-hero text-primary-foreground font-bold text-base px-8 py-3.5 rounded-full shadow-btn btn-press flex items-center gap-2 mx-auto"
            onClick={() => navigate('/')}
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ═══ Mobile hint ═══ */}
      <div className="md:hidden text-center pb-8 px-4">
        <p className="text-xs text-muted-foreground">
          <Monitor className="w-3 h-3 inline mr-1" />
          Best experienced on desktop ·{' '}
          <a href="https://speeda-ai-companion.lovable.app" className="text-brand-blue underline">
            Open web app
          </a>
        </p>
      </div>
    </div>
  );
};

export default WebAppProductPage;

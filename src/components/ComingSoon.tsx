import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ComingSoonConfig {
  icon: string;
  iconBg: string;
  title: string;
  description: string;
}

export const comingSoonFeatures: Record<string, ComingSoonConfig> = {
  competitorIntelligence: {
    icon: '🔍',
    iconBg: 'hsl(264 80% 55%)',
    title: 'Competitor Intelligence',
    description: 'Track your competitors\' social media activity, compare performance, and get AI-powered counter-moves.',
  },
  autoBoost: {
    icon: '🚀',
    iconBg: 'hsl(25 100% 55%)',
    title: 'AI Auto-Boost',
    description: 'AI automatically promotes your best-performing posts to reach more customers.',
  },
  budgetOptimization: {
    icon: '💰',
    iconBg: 'hsl(233 100% 42%)',
    title: 'AI Budget Optimization',
    description: 'AI automatically reallocates your ad budget to the highest-performing platforms and campaigns.',
  },
  pdfReports: {
    icon: '📄',
    iconBg: 'hsl(0 70% 55%)',
    title: 'PDF Reports',
    description: 'Download and share beautiful PDF reports of your marketing performance.',
  },
  frenchLanguage: {
    icon: '🇫🇷',
    iconBg: 'hsl(233 80% 55%)',
    title: 'French Language',
    description: 'Full French language support is coming soon.',
  },
  dataExport: {
    icon: '📤',
    iconBg: 'hsl(193 100% 42%)',
    title: 'Data Export',
    description: 'Export your analytics data to CSV or Excel for custom reporting.',
  },
};

interface ComingSoonModalProps {
  feature: string;
  open: boolean;
  onClose: () => void;
}

export const ComingSoonModal = ({ feature, open, onClose }: ComingSoonModalProps) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const config = comingSoonFeatures[feature];

  if (!config) return null;

  const handleNotify = () => {
    if (email.includes('@')) {
      setSubmitted(true);
      setTimeout(() => { setSubmitted(false); setEmail(''); onClose(); }, 1500);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-5"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/40" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-card rounded-3xl p-8 max-w-[380px] w-full border border-border-light shadow-xl text-center z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <X size={20} />
            </button>

            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ background: `linear-gradient(135deg, ${config.iconBg}, ${config.iconBg}dd)` }}
            >
              <span className="text-[28px]">{config.icon}</span>
            </div>

            <h3 className="text-[20px] font-extrabold text-foreground mt-5">{config.title}</h3>

            <p className="text-[14px] text-muted-foreground mt-2 leading-relaxed max-w-[320px] mx-auto">
              {config.description}
            </p>

            <span className="inline-block mt-4 text-[11px] font-bold uppercase tracking-[0.08em] text-primary-foreground gradient-hero px-5 py-1.5 rounded-full">
              Coming Soon
            </span>

            {!submitted ? (
              <div className="mt-6 flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 h-12 rounded-2xl bg-background border border-border px-4 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <button
                  onClick={handleNotify}
                  className="h-12 px-6 rounded-2xl gradient-btn text-primary-foreground font-bold text-[13px] shadow-btn btn-press whitespace-nowrap"
                >
                  Notify Me
                </button>
              </div>
            ) : (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 text-[14px] font-semibold text-green-accent"
              >
                ✓ We'll notify you when it's ready!
              </motion.p>
            )}

            <p className="text-[11px] text-muted-foreground mt-3">
              We'll let you know as soon as this feature is ready
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

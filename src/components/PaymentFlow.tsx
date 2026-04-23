import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Check, ArrowRight, X } from 'lucide-react';

type PaymentStep = 'redirect' | 'success';

// Mamo Pay logo placeholder
const MamoPayLogo = () => (
  <span className="text-[11px] font-bold text-muted-foreground/60 tracking-wide">MAMO PAY</span>
);

// ── Redirect Screen ──
interface PaymentRedirectProps {
  title: string;       // e.g. "Completing your upgrade…"
  subtitle: string;    // e.g. "You'll be redirected to our secure payment page"
  summaryLabel: string; // e.g. "Pro Plan"
  summaryValue: string; // e.g. "1,449 SAR/month"
  summaryDetails?: string[]; // optional feature list
  onConfirm: () => void;
  onCancel: () => void;
}

export const PaymentRedirectScreen = ({ title, subtitle, summaryLabel, summaryValue, summaryDetails, onConfirm, onCancel }: PaymentRedirectProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center px-8"
  >
    {/* Logo */}
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="w-16 h-16 rounded-2xl gradient-btn flex items-center justify-center mb-6"
    >
      <span className="text-[24px] font-extrabold text-primary-foreground">S</span>
    </motion.div>

    <h2 className="text-[18px] font-bold text-foreground text-center mb-2">{title}</h2>
    <p className="text-[14px] text-muted-foreground text-center mb-6">{subtitle}</p>

    {/* Summary card */}
    <div className="bg-card rounded-2xl border border-border-light p-5 w-full max-w-[340px] mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[14px] font-bold text-foreground">{summaryLabel}</span>
        <span className="text-[16px] font-extrabold text-brand-blue">{summaryValue}</span>
      </div>
      {summaryDetails && summaryDetails.map((d, i) => (
        <div key={i} className="flex items-center gap-2 mt-1.5">
          <Check size={12} className="text-green-accent flex-shrink-0" />
          <span className="text-[12px] text-muted-foreground">{d}</span>
        </div>
      ))}
    </div>

    <button
      onClick={onConfirm}
      className="w-full max-w-[340px] h-[52px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press flex items-center justify-center gap-2 mb-3"
    >
      Continue to Payment <ArrowRight size={16} className="rtl:rotate-180" />
    </button>
    <button onClick={onCancel} className="text-muted-foreground text-[13px] font-medium mb-6">Cancel</button>

    <div className="flex items-center gap-1.5">
      <Lock size={12} className="text-muted-foreground/50" />
      <span className="text-[11px] text-muted-foreground/50">Secured by</span>
      <MamoPayLogo />
    </div>
  </motion.div>
);

// ── Success Celebration Screen ──
interface PaymentSuccessProps {
  icon?: string;       // emoji like "✦"
  title: string;       // "Welcome to Pro! ✦"
  subtitle: string;    // "Your plan has been upgraded successfully"
  detail?: string;     // "Your 500 tokens are now available"
  badge?: string;      // "Pro Pack"
  buttonLabel: string; // "Start Creating →"
  onContinue: () => void;
  variant?: 'plan' | 'tokens' | 'topup';
}

export const PaymentSuccessScreen = ({ title, subtitle, detail, badge, buttonLabel, onContinue, variant = 'plan' }: PaymentSuccessProps) => {
  useEffect(() => {
    const timer = setTimeout(onContinue, 8000);
    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-8"
      style={{
        background: variant === 'plan'
          ? 'linear-gradient(135deg, hsl(230,100%,41%), hsl(190,100%,48%))'
          : undefined,
      }}
    >
      {variant !== 'plan' && <div className="absolute inset-0 bg-background" />}

      {/* Confetti */}
      {Array.from({ length: 16 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full z-10"
          style={{
            background: ['#fff', '#f7c948', '#00d68f', '#ff6b6b', '#00c7f3'][i % 5],
            top: '45%',
            left: '50%',
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 400,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 2.5, delay: i * 0.04, ease: 'easeOut' }}
        />
      ))}

      {/* Sparkles */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={`s${i}`}
          className="absolute text-[18px] z-10"
          style={{
            color: variant === 'plan' ? 'rgba(255,255,255,0.7)' : 'hsl(230,100%,41%)',
            top: `${20 + Math.random() * 60}%`,
            left: `${10 + Math.random() * 80}%`,
          }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], rotate: [0, 180] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
        >✦</motion.div>
      ))}

      <div className="relative z-20 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10 }}
          className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${variant === 'plan' ? 'bg-white/20' : 'bg-green-accent'}`}
        >
          <Check size={32} className={variant === 'plan' ? 'text-white' : 'text-primary-foreground'} strokeWidth={3} />
        </motion.div>

        <h2 className={`text-[28px] font-extrabold mb-2 ${variant === 'plan' ? 'text-white' : 'text-foreground'}`}>
          {title}
        </h2>
        <p className={`text-[16px] mb-3 ${variant === 'plan' ? 'text-white/80' : 'text-muted-foreground'}`}>
          {subtitle}
        </p>

        {badge && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="gradient-btn px-5 py-2 rounded-xl mb-3"
          >
            <span className="text-[14px] font-bold text-primary-foreground">{badge}</span>
          </motion.div>
        )}

        {detail && (
          <p className={`text-[14px] mb-6 ${variant === 'plan' ? 'text-white/70' : 'text-muted-foreground'}`}>
            {detail}
          </p>
        )}

        <button
          onClick={onContinue}
          className={`w-full max-w-[300px] h-[52px] rounded-2xl font-bold text-[15px] btn-press ${
            variant === 'plan'
              ? 'bg-white text-brand-blue shadow-lg'
              : 'gradient-btn text-primary-foreground shadow-btn'
          }`}
        >
          {buttonLabel}
        </button>
      </div>
    </motion.div>
  );
};

// ── Full Payment Flow (redirect → simulated processing → success) ──
interface PaymentFlowProps {
  // Redirect screen props
  redirectTitle: string;
  redirectSubtitle: string;
  summaryLabel: string;
  summaryValue: string;
  summaryDetails?: string[];
  // Success screen props
  successTitle: string;
  successSubtitle: string;
  successDetail?: string;
  successBadge?: string;
  successButton: string;
  variant?: 'plan' | 'tokens' | 'topup';
  // Callbacks
  onComplete: () => void;
  onCancel: () => void;
}

export const PaymentFlow = (props: PaymentFlowProps) => {
  const [step, setStep] = useState<PaymentStep>('redirect');

  const handleConfirmPayment = () => {
    // Simulate 3-second redirect processing
    setTimeout(() => setStep('success'), 3000);
  };

  return (
    <AnimatePresence mode="wait">
      {step === 'redirect' && (
        <PaymentRedirectScreen
          key="redirect"
          title={props.redirectTitle}
          subtitle={props.redirectSubtitle}
          summaryLabel={props.summaryLabel}
          summaryValue={props.summaryValue}
          summaryDetails={props.summaryDetails}
          onConfirm={handleConfirmPayment}
          onCancel={props.onCancel}
        />
      )}
      {step === 'success' && (
        <PaymentSuccessScreen
          key="success"
          title={props.successTitle}
          subtitle={props.successSubtitle}
          detail={props.successDetail}
          badge={props.successBadge}
          buttonLabel={props.successButton}
          onContinue={props.onComplete}
          variant={props.variant}
        />
      )}
    </AnimatePresence>
  );
};

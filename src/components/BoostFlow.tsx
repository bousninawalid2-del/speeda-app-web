import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, MapPin, User, Utensils, Smartphone } from 'lucide-react';
import { CalendarPost } from './CalendarData';
import { platformLogoMap } from './PlatformLogos';
import { PaymentFlow } from './PaymentFlow';

const budgetOptions = [100, 250, 500, 1000];
const durationOptions = ['3 days', '1 week', '2 weeks'];

interface BoostFlowProps {
  post: CalendarPost;
  onComplete: () => void;
  onCancel: () => void;
}

export const BoostFlow = ({ post, onComplete, onCancel }: BoostFlowProps) => {
  const [budget, setBudget] = useState(500);
  const [customBudget, setCustomBudget] = useState(false);
  const [duration, setDuration] = useState('1 week');
  const [showPayment, setShowPayment] = useState(false);
  const PlatformLogo = platformLogoMap[post.platform];

  const fee = Math.round(budget * 0.15);
  const total = budget + fee;

  const expected = useMemo(() => {
    const multiplier = budget / 500;
    const durMultiplier = duration === '3 days' ? 0.5 : duration === '2 weeks' ? 1.8 : 1;
    return {
      reach: `~${Math.round(12 * multiplier * durMultiplier)}K`,
      clicks: `~${Math.round(180 * multiplier * durMultiplier)}`,
      orders: `~${Math.round(24 * multiplier * durMultiplier)}`,
      roas: `${(2.4 * (multiplier > 1 ? 1 + (multiplier - 1) * 0.3 : multiplier)).toFixed(1)}x`,
    };
  }, [budget, duration]);

  if (showPayment) {
    return (
      <PaymentFlow
        redirectTitle="Launching your boost…"
        redirectSubtitle="You'll be redirected to complete payment"
        summaryLabel={`Boost: ${post.title}`}
        summaryValue={`SAR ${total}`}
        summaryDetails={[`Ad spend: SAR ${budget}`, `Duration: ${duration}`, `Platform: ${post.platform}`]}
        successTitle="Boost Launched! 🚀"
        successSubtitle="Your post is now being promoted"
        successDetail={`Expected reach: ${expected.reach}`}
        successBadge="Boosted"
        successButton="Back to Calendar →"
        variant="topup"
        onComplete={onComplete}
        onCancel={() => setShowPayment(false)}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Post preview */}
      <div className="flex items-center gap-3 bg-muted/30 rounded-xl p-3">
        <div className="w-12 h-12 rounded-lg gradient-hero flex items-center justify-center flex-shrink-0">
          <span className="text-lg">📷</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-foreground truncate">{post.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {PlatformLogo && <PlatformLogo size={14} />}
            <span className="text-[11px] text-muted-foreground">{post.type}</span>
          </div>
        </div>
      </div>

      {/* Budget */}
      <div>
        <label className="text-[14px] font-bold text-foreground">Budget</label>
        <div className="flex gap-2 mt-2 flex-wrap">
          {budgetOptions.map(b => (
            <button key={b} onClick={() => { setBudget(b); setCustomBudget(false); }}
              className={`rounded-xl px-4 py-2.5 text-[13px] font-bold transition-all ${
                budget === b && !customBudget ? 'gradient-hero text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
              }`}>
              SAR {b}
            </button>
          ))}
        </div>
        <button onClick={() => setCustomBudget(!customBudget)} className="text-[12px] text-brand-blue font-medium mt-2">
          {customBudget ? 'Use preset' : 'Custom amount'}
        </button>
        {customBudget && (
          <input type="number" value={budget} onChange={e => setBudget(Number(e.target.value) || 0)}
            className="w-full mt-2 rounded-xl bg-card border border-border px-4 py-2.5 text-[14px] focus:border-primary focus:outline-none" />
        )}
      </div>

      {/* Duration */}
      <div>
        <label className="text-[14px] font-bold text-foreground">Duration</label>
        <div className="flex gap-2 mt-2">
          {durationOptions.map(d => (
            <button key={d} onClick={() => setDuration(d)}
              className={`rounded-xl px-4 py-2.5 text-[13px] font-bold transition-all flex-1 ${
                duration === d ? 'gradient-hero text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
              }`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* AI Targeting */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-[14px] font-bold text-foreground">Targeting</label>
          <span className="text-[10px] font-bold text-brand-teal bg-green-soft px-2 py-0.5 rounded-md">✦ AI optimized</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { icon: <MapPin size={12} />, label: 'Riyadh' },
            { icon: <User size={12} />, label: 'Age 22-38' },
            { icon: <Utensils size={12} />, label: 'Food Lovers' },
            { icon: <Smartphone size={12} />, label: 'Active 7-10 PM' },
          ].map((tag, i) => (
            <span key={i} className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-1.5 text-[12px] text-foreground font-medium">
              {tag.icon} {tag.label}
            </span>
          ))}
        </div>
        <button className="text-[12px] text-brand-blue font-medium mt-2">Edit targeting →</button>
      </div>

      {/* Expected Results */}
      <div className="bg-green-soft rounded-xl p-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { value: expected.reach, label: 'Reach' },
            { value: expected.clicks, label: 'Clicks' },
            { value: expected.orders, label: 'Orders' },
            { value: expected.roas, label: 'Est. ROAS' },
          ].map((stat, i) => (
            <div key={i}>
              <motion.p key={`${budget}-${duration}-${i}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                className="text-[16px] font-bold text-green-accent">{stat.value}</motion.p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fee breakdown */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-2">
        <div className="flex justify-between text-[13px]">
          <span className="text-muted-foreground">Ad spend</span>
          <span className="text-foreground">SAR {budget}</span>
        </div>
        <div className="flex justify-between text-[13px]">
          <span className="text-muted-foreground">Speeda fee (15%)</span>
          <span className="text-foreground">SAR {fee}</span>
        </div>
        <div className="border-t border-border pt-2 flex justify-between">
          <span className="text-[14px] font-bold text-foreground">Total</span>
          <span className="text-[16px] font-extrabold text-brand-blue">SAR {total}</span>
        </div>
      </div>

      {/* Launch button */}
      <button onClick={() => setShowPayment(true)}
        className="w-full h-[52px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press">
        Launch Boost — SAR {total}
      </button>
      <div className="flex items-center justify-center gap-1.5">
        <Lock size={11} className="text-muted-foreground/50" />
        <span className="text-[11px] text-muted-foreground/50">Secured by Mamo Pay</span>
      </div>
    </div>
  );
};

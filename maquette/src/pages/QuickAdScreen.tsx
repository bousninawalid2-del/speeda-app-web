import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, Sparkles } from 'lucide-react';
import {
  InstagramLogo, TikTokLogo, SnapchatLogo, FacebookLogo, GoogleLogo, YouTubeLogo, XLogo, LinkedInLogo,
  ApplePayLogo, STCPayLogo, MadaLogo, VisaLogo,
} from '../components/PlatformLogos';

const socialPlatforms = [
  { id: 'instagram', name: 'Instagram', audience: '~12M', Logo: InstagramLogo },
  { id: 'facebook', name: 'Facebook', audience: '~10M', Logo: FacebookLogo },
];

const paymentMethods = [
  { id: 'apple', name: 'Apple Pay', Logo: ApplePayLogo },
  { id: 'stc', name: 'STC Pay', Logo: STCPayLogo },
  { id: 'mada', name: 'mada', Logo: MadaLogo },
  { id: 'visa', name: 'Visa/MC', Logo: VisaLogo },
];

export const QuickAdScreen = ({ onBack }: { onBack: () => void }) => {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<string[]>(['instagram']);
  const [budget, setBudget] = useState('500');
  const [duration, setDuration] = useState('1 week');
  const [payment, setPayment] = useState('apple');
  const [creative, setCreative] = useState(0);
  const [targetingMode, setTargetingMode] = useState<'ai' | 'manual'>('ai');
  const [manualLocation, setManualLocation] = useState('');
  const [manualAgeMin, setManualAgeMin] = useState(22);
  const [manualAgeMax, setManualAgeMax] = useState(38);
  const [manualInterests, setManualInterests] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const toggle = (id: string) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  if (success) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-background min-h-screen flex flex-col items-center justify-center px-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }} className="w-20 h-20 rounded-full bg-green-accent flex items-center justify-center">
          <Check size={40} className="text-primary-foreground" strokeWidth={3} />
        </motion.div>
        <h2 className="text-[24px] font-extrabold text-foreground mt-6">Ad Launched!</h2>
        <p className="text-[14px] text-muted-foreground mt-2 text-center">Your campaign is now live across {selected.length} platforms</p>
        <button onClick={onBack} className="w-full h-[56px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press mt-8">Back to Campaigns</button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-8">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : onBack()}><ChevronLeft size={24} className="text-foreground" /></button>
          <h1 className="text-[18px] font-bold text-foreground flex-1">Launch Quick Ad</h1>
          <span className="text-[13px] text-muted-foreground">Step {step} of 3</span>
        </div>
        {/* Progress */}
        <div className="flex gap-1 mt-3 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'gradient-hero' : 'bg-border'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 className="text-[18px] font-bold text-foreground">Where to advertise?</h2>
              <p className="text-[13px] text-muted-foreground mt-1">Select one or more platforms</p>

              <h3 className="text-[14px] font-bold text-foreground mt-5 mb-2">Social Platforms</h3>
              <div className="grid grid-cols-3 gap-2">
                {socialPlatforms.map(p => (
                  <button key={p.id} onClick={() => toggle(p.id)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${selected.includes(p.id) ? 'bg-purple-soft border-brand-blue' : 'bg-card border-border-light'}`}>
                    <p.Logo size={28} />
                    <span className="text-[11px] font-semibold text-foreground">{p.name}</span>
                    {p.audience && <span className="text-[9px] text-muted-foreground">{p.audience}</span>}
                  </button>
                ))}
              </div>


              <div className="bg-purple-soft rounded-2xl p-3 mt-4">
                <p className="text-[13px] text-purple font-semibold">✦ Recommended: Instagram + TikTok — best ROAS for restaurants</p>
              </div>

              <button onClick={() => setStep(2)} className="w-full h-[56px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press mt-5">Next →</button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 className="text-[18px] font-bold text-foreground">Budget & Targeting</h2>

              <h3 className="text-[14px] font-bold text-foreground mt-5 mb-2">Budget</h3>
              <div className="flex flex-wrap gap-2">
                {['250', '500', '1,000', '2,500'].map(b => (
                  <button key={b} onClick={() => setBudget(b)} className={`rounded-3xl px-5 py-2 text-[13px] font-semibold ${budget === b ? 'bg-brand-blue text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>SAR {b}</button>
                ))}
              </div>

              <h3 className="text-[14px] font-bold text-foreground mt-5 mb-2">Duration</h3>
              <div className="flex flex-wrap gap-2">
                {['3 days', '1 week', '2 weeks'].map(d => (
                  <button key={d} onClick={() => setDuration(d)} className={`rounded-3xl px-5 py-2 text-[13px] font-semibold ${duration === d ? 'bg-brand-blue text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>{d}</button>
                ))}
              </div>

              <h3 className="text-[14px] font-bold text-foreground mt-5 mb-2">Targeting</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* AI Targeting Card */}
                <button
                  onClick={() => setTargetingMode('ai')}
                  className={`relative rounded-2xl p-4 text-start transition-all overflow-hidden ${targetingMode === 'ai' ? 'border-2 border-brand-blue bg-purple-soft' : 'border border-border-light bg-card'}`}
                >
                  {targetingMode === 'ai' && (
                    <motion.div className="absolute inset-0 pointer-events-none" animate={{ backgroundPosition: ['200% 0', '-200% 0'] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} style={{ background: 'linear-gradient(90deg, transparent 0%, hsla(233,100%,42%,0.08) 50%, transparent 100%)', backgroundSize: '200% 100%' }} />
                  )}
                  <motion.span
                    className="text-[18px] block mb-1"
                    animate={targetingMode === 'ai' ? { scale: [1, 1.15, 1], filter: ['drop-shadow(0 0 0px transparent)', 'drop-shadow(0 0 6px hsl(233,100%,60%))', 'drop-shadow(0 0 0px transparent)'] } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >✦</motion.span>
                  <p className="text-[13px] font-bold text-foreground relative z-10">AI Targeting</p>
                  <p className="text-[11px] text-muted-foreground mt-1 relative z-10">AI analyzes your audience and sets optimal targeting automatically</p>
                </button>
                {/* Manual Targeting Card */}
                <button
                  onClick={() => setTargetingMode('manual')}
                  className={`rounded-2xl p-4 text-start transition-all ${targetingMode === 'manual' ? 'border-2 border-brand-blue bg-purple-soft' : 'border border-border-light bg-card'}`}
                >
                  <span className="text-[18px] block mb-1">🎯</span>
                  <p className="text-[13px] font-bold text-foreground">Manual Targeting</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Set your own location, age range, interests, and schedule</p>
                </button>
              </div>

              {targetingMode === 'ai' && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {['📍 Riyadh', '👤 22-38', '🍽️ Food Lovers', '📱 7-10 PM'].map(t => (
                    <span key={t} className="rounded-3xl px-4 py-2 text-[12px] font-semibold bg-purple-soft text-purple">{t}</span>
                  ))}
                </div>
              )}

              {targetingMode === 'manual' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-3 overflow-hidden">
                  <div>
                    <label className="text-[12px] font-bold text-foreground block mb-1">Location</label>
                    <input value={manualLocation} onChange={e => setManualLocation(e.target.value)} placeholder="e.g. Riyadh, Jeddah" className="w-full h-10 px-4 rounded-xl border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
                  </div>
                  <div>
                    <label className="text-[12px] font-bold text-foreground block mb-1">Age Range: {manualAgeMin} — {manualAgeMax}</label>
                    <div className="flex items-center gap-3">
                      <input type="range" min={13} max={65} value={manualAgeMin} onChange={e => setManualAgeMin(Number(e.target.value))} className="flex-1 accent-brand-blue" />
                      <input type="range" min={13} max={65} value={manualAgeMax} onChange={e => setManualAgeMax(Number(e.target.value))} className="flex-1 accent-brand-blue" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] font-bold text-foreground block mb-1">Interests</label>
                    <div className="flex flex-wrap gap-2">
                      {['Food', 'Restaurants', 'Lifestyle', 'Shopping', 'Travel', 'Fitness'].map(interest => (
                        <button key={interest} onClick={() => setManualInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest])} className={`rounded-3xl px-3 py-1.5 text-[11px] font-semibold ${manualInterests.includes(interest) ? 'bg-brand-blue text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>{interest}</button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="bg-green-soft rounded-2xl p-4 mt-5 grid grid-cols-4 gap-2 text-center">
                {[{ v: '~25K', l: 'Reach' }, { v: '~340', l: 'Clicks' }, { v: '~45', l: 'Conv.' }, { v: '3.2x', l: 'ROAS' }].map(r => (
                  <div key={r.l}><p className="text-[18px] font-extrabold text-green-accent">{r.v}</p><p className="text-[9px] text-green-accent font-semibold">{r.l}</p></div>
                ))}
              </div>

              <div className="bg-card rounded-2xl p-4 mt-4 border border-border-light space-y-2">
                <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Ad spend</span><span className="text-foreground">SAR {budget}</span></div>
                <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Speeda fee (15%)</span><span className="text-foreground">SAR {Math.round(parseInt(budget.replace(',', '')) * 0.15)}</span></div>
                <div className="border-t border-border-light pt-2 flex justify-between">
                  <span className="text-[14px] font-bold text-foreground">Total</span>
                  <span className="text-[16px] font-extrabold text-brand-blue">SAR {Math.round(parseInt(budget.replace(',', '')) * 1.15)}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(1)} className="flex-1 h-[56px] rounded-2xl border border-border text-foreground font-bold text-[15px] btn-press">← Back</button>
                <button onClick={() => setStep(3)} className="flex-1 h-[56px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press">Next →</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 className="text-[18px] font-bold text-foreground">Ad Creative & Payment</h2>

              <button className="w-full mt-4 p-5 rounded-2xl border-2 border-dashed border-border flex items-center gap-3 card-tap">
                <Sparkles size={24} className="text-brand-teal" />
                <div className="text-left">
                  <p className="text-[14px] font-bold text-foreground">Generate New with AI</p>
                  <p className="text-[12px] text-muted-foreground">AI creates optimized ad creative</p>
                </div>
              </button>

              <p className="text-[13px] text-muted-foreground mt-4 mb-2">Or use existing:</p>
              {[
                { title: 'Chicken Shawarma Promo', platform: 'Instagram · Feed Post', eng: '4.2%' },
                { title: 'Weekend Brunch Reel', platform: 'Instagram · Reel', eng: '8.1%' },
                { title: 'New Menu Reveal', platform: 'TikTok · Video', eng: '6.5%' },
              ].map((c, i) => (
                <button key={i} onClick={() => setCreative(i)} className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 mt-2 transition-all ${creative === i ? 'border-brand-blue bg-purple-soft' : 'border-border-light bg-card'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${creative === i ? 'border-brand-blue' : 'border-border'}`}>
                    {creative === i && <div className="w-3 h-3 rounded-full bg-brand-blue" />}
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-[13px] font-bold text-foreground">🖼️ {c.title}</p>
                    <p className="text-[11px] text-muted-foreground">{c.platform} · {c.eng} eng.</p>
                  </div>
                </button>
              ))}

              <h3 className="text-[14px] font-bold text-foreground mt-5 mb-2">Payment Method</h3>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map(p => (
                  <button key={p.id} onClick={() => setPayment(p.id)} className={`flex items-center gap-2 rounded-2xl px-4 py-3 border-2 transition-all ${payment === p.id ? 'border-brand-blue bg-purple-soft' : 'border-border-light bg-card'}`}>
                    <p.Logo size={20} />
                    <span className="text-[12px] font-semibold text-foreground">{p.name}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="h-[56px] px-6 rounded-2xl border border-border text-foreground font-bold text-[14px] btn-press">← Back</button>
                <button onClick={() => setSuccess(true)} className="flex-1 h-[56px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[14px] shadow-btn btn-press">
                  Launch Ad — SAR {Math.round(parseInt(budget.replace(',', '')) * 1.15)}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      
    </motion.div>
  );
};

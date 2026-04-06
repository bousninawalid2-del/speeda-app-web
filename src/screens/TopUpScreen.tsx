import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TopUpScreenProps {
  onBack:       () => void;
  /** Live ad balance from tokens/billing API */
  adBalance?:   number;
  isLoading?:   boolean;
  /** Called with the selected amount in SAR; should trigger MamoPay checkout */
  onTopUp?:     (amount: number) => Promise<void>;
}

const PRESET_AMOUNTS = [500, 1000, 2500, 5000];

export const TopUpScreen = ({ onBack, adBalance, isLoading, onTopUp }: TopUpScreenProps) => {
  const [amount, setAmount] = useState(1000);
  const [custom, setCustom] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [processing, setProcessing] = useState(false);

  const displayAmount = isCustom ? (parseInt(custom) || 0) : amount;

  const handleContinue = async () => {
    if (displayAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!onTopUp) return;
    setProcessing(true);
    try {
      await onTopUp(displayAmount);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to process top-up');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-8">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
          <h1 className="text-[20px] font-bold text-foreground">Top Up Ad Balance</h1>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border-light text-center mb-6">
          <p className="text-[13px] text-muted-foreground">Current Balance</p>
          {isLoading ? (
            <Loader2 size={24} className="text-brand-blue animate-spin mx-auto mt-1" />
          ) : (
            <p className="text-[32px] font-extrabold text-foreground mt-1">
              SAR {(adBalance ?? 0).toLocaleString()}
            </p>
          )}
        </div>

        <h3 className="text-[16px] font-bold text-foreground mb-3">Select Amount</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          {PRESET_AMOUNTS.map(a => (
            <button key={a} onClick={() => { setAmount(a); setIsCustom(false); }}
              className={`rounded-3xl px-5 py-[9px] text-[13px] font-semibold transition-all ${!isCustom && amount === a ? 'bg-brand-blue text-primary-foreground' : 'bg-card text-muted-foreground border border-border'}`}>
              SAR {a.toLocaleString()}
            </button>
          ))}
          <button onClick={() => setIsCustom(true)}
            className={`rounded-3xl px-5 py-[9px] text-[13px] font-semibold transition-all ${isCustom ? 'bg-brand-blue text-primary-foreground' : 'bg-card text-muted-foreground border border-border'}`}>
            Custom
          </button>
        </div>
        {isCustom && (
          <input
            className="w-full h-[50px] rounded-2xl bg-card border border-border px-4 text-[14px] text-foreground focus:border-primary focus:outline-none mt-2"
            placeholder="Enter amount in SAR"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            type="number"
            min="100"
          />
        )}

        <div className="bg-card rounded-2xl p-4 mt-5 border border-border-light space-y-2">
          <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Amount</span><span className="text-foreground">SAR {displayAmount.toLocaleString()}</span></div>
          <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Processing fee</span><span className="text-foreground">SAR 0</span></div>
          <div className="border-t border-border-light pt-2 flex justify-between">
            <span className="text-[14px] font-bold text-foreground">Total</span>
            <span className="text-[16px] font-extrabold text-brand-blue">SAR {displayAmount.toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={handleContinue}
          disabled={processing || !onTopUp || displayAmount <= 0}
          className="w-full h-[56px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press mt-6 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {processing && <Loader2 size={16} className="animate-spin" />}
          Continue to Payment — SAR {displayAmount.toLocaleString()}
        </button>

        <p className="text-[11px] text-muted-foreground text-center mt-3">
          Secured by MamoPay
        </p>
      </div>
    </motion.div>
  );
};

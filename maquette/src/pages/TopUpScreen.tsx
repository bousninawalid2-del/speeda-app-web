import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check } from 'lucide-react';
import { PaymentFlow } from '../components/PaymentFlow';

interface TopUpScreenProps {
  onBack: () => void;
}

const amounts = ['500', '1,000', '2,500', '5,000'];

export const TopUpScreen = ({ onBack }: TopUpScreenProps) => {
  const [amount, setAmount] = useState('1,000');
  const [custom, setCustom] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const displayAmount = isCustom ? (custom || '0') : amount;
  const numAmount = parseInt(displayAmount.replace(',', '')) || 0;

  return (
    <>
      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-8">
        <div className="px-5 pt-6">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={onBack}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
            <h1 className="text-[20px] font-bold text-foreground">Top Up Ad Balance</h1>
          </div>

          <div className="bg-card rounded-2xl p-5 border border-border-light text-center mb-6">
            <p className="text-[13px] text-muted-foreground">Current Balance</p>
            <p className="text-[32px] font-extrabold text-foreground mt-1">SAR 2,400</p>
          </div>

          <h3 className="text-[16px] font-bold text-foreground mb-3">Select Amount</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {amounts.map(a => (
              <button key={a} onClick={() => { setAmount(a); setIsCustom(false); }} className={`rounded-3xl px-5 py-[9px] text-[13px] font-semibold transition-all ${!isCustom && amount === a ? 'bg-brand-blue text-primary-foreground' : 'bg-card text-muted-foreground border border-border'}`}>SAR {a}</button>
            ))}
            <button onClick={() => setIsCustom(true)} className={`rounded-3xl px-5 py-[9px] text-[13px] font-semibold transition-all ${isCustom ? 'bg-brand-blue text-primary-foreground' : 'bg-card text-muted-foreground border border-border'}`}>Custom</button>
          </div>
          {isCustom && (
            <input className="w-full h-[50px] rounded-2xl bg-card border border-border px-4 text-[14px] text-foreground focus:border-primary focus:outline-none mt-2" placeholder="Enter amount in SAR" value={custom} onChange={e => setCustom(e.target.value)} type="number" />
          )}

          <div className="bg-card rounded-2xl p-4 mt-5 border border-border-light space-y-2">
            <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Amount</span><span className="text-foreground">SAR {displayAmount}</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Processing fee</span><span className="text-foreground">SAR 0</span></div>
            <div className="border-t border-border-light pt-2 flex justify-between">
              <span className="text-[14px] font-bold text-foreground">Total</span>
              <span className="text-[16px] font-extrabold text-brand-blue">SAR {displayAmount}</span>
            </div>
          </div>

          <button onClick={() => setShowPayment(true)} className="w-full h-[56px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press mt-6">
            Continue to Payment — SAR {displayAmount}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showPayment && (
          <PaymentFlow
            redirectTitle="Adding to your ad balance…"
            redirectSubtitle="You'll be redirected to our secure payment page"
            summaryLabel="Ad Balance Top-Up"
            summaryValue={`SAR ${displayAmount}`}
            successTitle="Balance Updated! ✦"
            successSubtitle={`SAR ${displayAmount} added to your ad balance`}
            successDetail={`New balance: SAR ${(2400 + numAmount).toLocaleString()}`}
            successButton="Back to Ads"
            variant="topup"
            onComplete={() => { setShowPayment(false); onBack(); }}
            onCancel={() => setShowPayment(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

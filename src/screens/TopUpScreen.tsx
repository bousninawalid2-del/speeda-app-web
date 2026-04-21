import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTokenPackages, usePurchaseTokenPackage, type TokenPackage } from '@/hooks/useTokens';
import { useTokens } from '@/hooks/useTokens';

interface TopUpScreenProps {
  onBack: () => void;
}

export const TopUpScreen = ({ onBack }: TopUpScreenProps) => {
  const { data: packages, isLoading: packagesLoading } = useTokenPackages();
  const { data: tokensData } = useTokens();
  const { mutateAsync: purchaseTokens, isPending } = usePurchaseTokenPackage();

  const [selectedPkg, setSelectedPkg] = useState<TokenPackage | null>(null);
  const [custom, setCustom] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const displayAmount = isCustom ? (parseInt(custom) || 0) : (selectedPkg?.price ?? 0);

  const handlePurchase = async () => {
    if (isCustom) {
      toast.error('Custom amounts require selecting a predefined package');
      return;
    }
    if (!selectedPkg) {
      toast.error('Please select a package');
      return;
    }
    try {
      const { checkoutUrl } = await purchaseTokens(selectedPkg.id);
      window.open(checkoutUrl, '_blank');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to process top-up');
    }
  };

  if (packagesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 size={32} className="text-brand-blue animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-8">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
          <h1 className="text-[20px] font-bold text-foreground">Top Up Ad Balance</h1>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border-light text-center mb-6">
          <p className="text-[13px] text-muted-foreground">Current Balance</p>
          <p className="text-[32px] font-extrabold text-foreground mt-1">
            SAR {(tokensData?.balance ?? 0).toLocaleString()}
          </p>
        </div>

        <h3 className="text-[16px] font-bold text-foreground mb-3">Select Package</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          {(packages ?? []).map(pkg => (
            <button key={pkg.id} onClick={() => { setSelectedPkg(pkg); setIsCustom(false); }}
              disabled={isPending}
              className={`rounded-3xl px-5 py-[9px] text-[13px] font-semibold transition-all ${!isCustom && selectedPkg?.id === pkg.id ? 'bg-brand-blue text-primary-foreground' : 'bg-card text-muted-foreground border border-border'}`}>
              {pkg.tokenCount} tokens — SAR {pkg.price.toLocaleString()}
            </button>
          ))}
          <button onClick={() => setIsCustom(true)}
            disabled={isPending}
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
          onClick={handlePurchase}
          disabled={isPending || (!selectedPkg && !isCustom) || displayAmount <= 0}
          className="w-full h-[56px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press mt-6 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isPending && <Loader2 size={16} className="animate-spin" />}
          Continue to Payment — SAR {displayAmount.toLocaleString()}
        </button>

        <p className="text-[11px] text-muted-foreground text-center mt-3">
          Secured by MamoPay
        </p>
      </div>
    </motion.div>
  );
};

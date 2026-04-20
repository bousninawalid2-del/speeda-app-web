import { motion } from 'framer-motion';
import { ChevronLeft, Download, Loader2 } from 'lucide-react';
import { useBilling, BillingPayment } from '@/hooks/useBilling';

interface BillingHistoryScreenProps {
  onBack:       () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function statusBadge(status: BillingPayment['status']) {
  if (status === 'succeeded') return <span className="text-[11px] font-semibold text-green-accent bg-green-soft px-2 py-0.5 rounded-md">✅ Paid</span>;
  if (status === 'failed')    return <span className="text-[11px] font-semibold text-red-accent bg-red-soft px-2 py-0.5 rounded-md">❌ Failed</span>;
  if (status === 'refunded')  return <span className="text-[11px] font-semibold text-muted-foreground bg-border px-2 py-0.5 rounded-md">↩ Refunded</span>;
  return <span className="text-[11px] font-semibold text-orange-accent bg-orange-soft px-2 py-0.5 rounded-md">⏳ Pending</span>;
}

export const BillingHistoryScreen = ({ onBack }: BillingHistoryScreenProps) => {
  const { data: payments, isLoading, isError } = useBilling();

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-8">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
          <h1 className="text-[20px] font-bold text-foreground">Billing History</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="text-brand-blue animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[15px] font-semibold text-foreground mb-1">Failed to load billing history</p>
            <p className="text-[13px] text-muted-foreground">Please try again later.</p>
          </div>
        ) : !payments || payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[15px] font-semibold text-foreground mb-1">No payments yet</p>
            <p className="text-[13px] text-muted-foreground">Your billing history will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map(tx => (
              <div key={tx.id} className="bg-card rounded-2xl p-4 border border-border-light">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-foreground">{tx.description ?? tx.type}</p>
                    <p className="text-[12px] text-muted-foreground mt-1">{formatDate(tx.createdAt)}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-[16px] font-bold text-foreground">{tx.currency} {tx.amount.toLocaleString()}</p>
                    {statusBadge(tx.status)}
                  </div>
                </div>
                {tx.status === 'succeeded' && (
                  <button className="flex items-center gap-1 text-brand-blue text-[12px] font-semibold mt-2">
                    <Download size={12} /> Download Invoice
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

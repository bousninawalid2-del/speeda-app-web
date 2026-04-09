import { motion } from 'framer-motion';
import { ChevronLeft, Download } from 'lucide-react';

interface BillingHistoryScreenProps {
  onBack: () => void;
}

const transactions = [
  { desc: 'Pro Pack — Monthly Subscription', amount: '1,449', date: 'Mar 1, 2026', status: 'Paid' },
  { desc: 'Token Pack — 500 tokens', amount: '749', date: 'Feb 22, 2026', status: 'Paid' },
  { desc: 'Ad Top-Up', amount: '575', date: 'Feb 18, 2026', status: 'Paid' },
  { desc: 'Pro Pack — Monthly Subscription', amount: '1,449', date: 'Feb 1, 2026', status: 'Paid' },
  { desc: 'Pro Pack — Monthly Subscription', amount: '1,449', date: 'Jan 1, 2026', status: 'Paid' },
];

export const BillingHistoryScreen = ({ onBack }: BillingHistoryScreenProps) => {
  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-8">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
          <h1 className="text-[20px] font-bold text-foreground">Billing History</h1>
        </div>

        <div className="space-y-3">
          {transactions.map((tx, i) => (
            <div key={i} className="bg-card rounded-2xl p-4 border border-border-light">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-foreground">{tx.desc}</p>
                  <p className="text-[12px] text-muted-foreground mt-1">{tx.date}</p>
                </div>
                <div className="text-end">
                  <p className="text-[16px] font-bold text-foreground">SAR {tx.amount}</p>
                  <span className="text-[11px] font-semibold text-green-accent bg-green-soft px-2 py-0.5 rounded-md">✅ {tx.status}</span>
                </div>
              </div>
              <button className="flex items-center gap-1 text-brand-blue text-[12px] font-semibold mt-2">
                <Download size={12} /> Download Invoice
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

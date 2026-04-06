import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pause, Play, ChevronLeft, X, DollarSign, StopCircle, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

// ─── Status colors ───────────────────────────────────────────────────────────

const campaignStatusColors: Record<string, { bg: string; text: string }> = {
  Active: { bg: 'bg-green-accent', text: 'text-primary-foreground' },
  Scheduled: { bg: 'bg-brand-blue', text: 'text-primary-foreground' },
  Completed: { bg: 'bg-muted-foreground', text: 'text-primary-foreground' },
  Paused: { bg: 'bg-orange', text: 'text-primary-foreground' },
  Draft: { bg: 'bg-brand-blue/20', text: 'text-brand-blue' },
};

type Filter = 'Active' | 'Scheduled' | 'Completed' | 'Drafts';

interface CampaignsScreenProps {
  onNavigate?: (screen: string) => void;
  externalCampaigns?: Record<string, any[]>;
  externalStats?: { totalBudget: number; totalReach: number; avgRoi: number; activeCount: number };
  isLoading?: boolean;
  onUpdateCampaign?: (id: string, data: { status?: string; budget?: number }) => Promise<void>;
  onRefresh?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DualLineChart = ({ data1, data2, color1, color2 }: { data1: number[]; data2: number[]; color1: string; color2: string }) => {
  if (!data1.length || !data2.length) return <div className="h-40 flex items-center justify-center text-muted-foreground text-[13px]">No data yet</div>;
  const max = Math.max(...data1, ...data2);
  if (max === 0) return <div className="h-40 flex items-center justify-center text-muted-foreground text-[13px]">No data yet</div>;
  const h = 120;
  const w = 300;
  const toPoints = (data: number[]) => data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 10)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
      <polyline points={toPoints(data1)} fill="none" stroke={color1} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={toPoints(data2)} fill="none" stroke={color2} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const CampaignSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-card rounded-2xl border border-border-light overflow-hidden animate-pulse" style={{ borderLeft: '4px solid hsl(157,100%,42%)' }}>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-32 bg-muted rounded-lg" />
            <div className="h-4 w-12 bg-muted rounded-md ml-auto" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(j => (
              <div key={j}>
                <div className="h-2 w-8 bg-muted rounded mb-1" />
                <div className="h-4 w-12 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const StatSkeleton = () => (
  <div className="min-w-[160px] bg-card rounded-2xl p-4 border border-border-light flex-shrink-0 animate-pulse">
    <div className="w-10 h-10 rounded-xl bg-muted mb-2" />
    <div className="h-6 w-20 bg-muted rounded mb-1" />
    <div className="h-3 w-16 bg-muted rounded" />
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export const CampaignsScreen = ({ onNavigate, externalCampaigns, externalStats, isLoading, onUpdateCampaign }: CampaignsScreenProps) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>('Active');
  const [updatingCampaign, setUpdatingCampaign] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [newBudget, setNewBudget] = useState('');

  const campaigns = externalCampaigns ?? {};
  const stats = externalStats ?? { totalBudget: 0, totalReach: 0, avgRoi: 0, activeCount: 0 };

  // ── Campaign Detail View ──
  if (selectedCampaign) {
    const c = selectedCampaign;
    const statusStyle = campaignStatusColors[c.status] || campaignStatusColors.Active;
    const spentPercent = c.budgetNum > 0 ? Math.min((c.spentNum / c.budgetNum) * 100, 100) : 0;

    return (
      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-24">
        <div className="px-5 pt-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => setSelectedCampaign(null)}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
            <div className="flex-1">
              <h1 className="text-[20px] font-extrabold text-foreground">{c.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${statusStyle.bg} ${statusStyle.text}`}>{c.status}</span>
                <span className="text-[11px] text-muted-foreground">{c.date}</span>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: t('campaigns.impressions'), value: c.impressions },
              { label: t('campaigns.clicks'), value: c.clicks },
              { label: t('campaigns.roas'), value: c.roas },
              { label: `${t('campaigns.spent')} / ${t('common.budget')}`, value: `${c.spent} / ${c.budget}`, isProgress: true, percent: spentPercent },
            ].map((kpi, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border-light">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{kpi.label}</p>
                <p className="text-[20px] font-extrabold text-foreground mt-1">{kpi.value}</p>
                {kpi.isProgress && (
                  <div className="h-2 rounded-full bg-muted mt-2 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${kpi.percent}%` }} className="h-full rounded-full gradient-hero" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Performance Chart */}
          <div className="bg-card rounded-2xl p-4 border border-border-light mb-4">
            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Performance</p>
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-1.5"><div className="w-3 h-1 rounded-full bg-brand-blue" /><span className="text-[10px] text-muted-foreground">Impressions</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-1 rounded-full bg-brand-teal" /><span className="text-[10px] text-muted-foreground">Clicks</span></div>
            </div>
            <DualLineChart data1={c.dailyImpr ?? []} data2={c.dailyClicks ?? []} color1="hsl(233, 100%, 42%)" color2="hsl(193, 100%, 48%)" />
          </div>

          {/* Campaign Details */}
          <div className="bg-card rounded-2xl p-4 border border-border-light mb-4 space-y-3">
            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">Campaign Details</p>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">{t('common.budget')}</span>
              <span className="text-[12px] font-bold text-foreground">SAR {c.budget}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">Duration</span>
              <span className="text-[12px] text-foreground">{c.date}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">Platforms</span>
              <span className="text-[12px] text-foreground">{c.platforms}</span>
            </div>
            {c.location && (
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">Location</span>
                <span className="text-[12px] text-foreground">{c.location}</span>
              </div>
            )}
            {c.ageRange && (
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">Age Range</span>
                <span className="text-[12px] text-foreground">{c.ageRange}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {(c.status === 'Active' || c.status === 'Paused') && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                disabled={updatingCampaign === c.id}
                onClick={async () => {
                  if (!onUpdateCampaign) return;
                  const newStatus = c.status === 'Active' ? 'Paused' : 'Active';
                  setUpdatingCampaign(c.id);
                  try {
                    await onUpdateCampaign(c.id, { status: newStatus });
                    toast.success(newStatus === 'Paused' ? 'Campaign paused' : 'Campaign resumed');
                    setSelectedCampaign({ ...c, status: newStatus });
                  } catch { toast.error('Failed to update'); }
                  finally { setUpdatingCampaign(null); }
                }}
                className={`h-11 rounded-xl text-[12px] font-bold btn-press flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                  c.status === 'Paused' ? 'bg-green-accent/10 text-green-accent' : 'bg-muted text-muted-foreground'
                }`}
              >
                {c.status === 'Paused' ? <><Play size={14} /> Resume</> : <><Pause size={14} /> Pause</>}
              </button>
              <button
                onClick={() => { setNewBudget(''); setShowBudgetModal(true); }}
                className="h-11 rounded-xl bg-brand-blue/10 text-brand-blue text-[12px] font-bold btn-press flex items-center justify-center gap-1.5"
              >
                <DollarSign size={14} /> Budget
              </button>
              <button
                onClick={() => setShowStopConfirm(true)}
                className="h-11 rounded-xl bg-destructive/10 text-destructive text-[12px] font-bold btn-press flex items-center justify-center gap-1.5"
              >
                <StopCircle size={14} /> Stop
              </button>
            </div>
          )}
        </div>

        {/* Budget Modal */}
        <AnimatePresence>
          {showBudgetModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-foreground/40 flex items-center justify-center px-6" onClick={() => setShowBudgetModal(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="bg-card rounded-2xl p-6 w-full max-w-[360px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[16px] font-bold text-foreground">Increase Budget</h3>
                  <button onClick={() => setShowBudgetModal(false)}><X size={18} className="text-muted-foreground" /></button>
                </div>
                <input type="number" value={newBudget} onChange={e => setNewBudget(e.target.value)} placeholder="Amount to add (SAR)"
                  className="w-full h-11 px-4 rounded-xl border border-border bg-background text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
                <div className="flex gap-2 mt-4">
                  {[100, 500, 1000].map(v => (
                    <button key={v} onClick={() => setNewBudget(String(v))} className={`flex-1 h-9 rounded-lg text-[12px] font-bold transition-all ${newBudget === String(v) ? 'gradient-hero text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>+{v} SAR</button>
                  ))}
                </div>
                <button
                  disabled={updatingCampaign === c.id}
                  onClick={async () => {
                    const amount = parseInt(newBudget);
                    if (!amount || amount < 10) { toast.error('Minimum SAR 10'); return; }
                    if (!onUpdateCampaign) return;
                    setUpdatingCampaign(c.id);
                    try {
                      await onUpdateCampaign(c.id, { budget: c.budgetNum + amount });
                      toast.success(`Budget increased by SAR ${amount}`);
                      setShowBudgetModal(false);
                      setSelectedCampaign({ ...c, budgetNum: c.budgetNum + amount, budget: (c.budgetNum + amount).toLocaleString() });
                    } catch { toast.error('Failed'); }
                    finally { setUpdatingCampaign(null); }
                  }}
                  className="w-full h-11 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press mt-4 disabled:opacity-50"
                >Confirm</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stop Confirmation */}
        <AnimatePresence>
          {showStopConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-foreground/40 flex items-center justify-center px-6" onClick={() => setShowStopConfirm(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="bg-card rounded-2xl p-6 w-full max-w-[360px] text-center">
                <h3 className="text-[18px] font-bold text-foreground mb-2">{t('common.areYouSure')}</h3>
                <p className="text-[13px] text-muted-foreground mb-4">This will permanently stop the campaign.</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowStopConfirm(false)} className="flex-1 h-11 rounded-xl border border-border text-foreground text-[13px] font-bold btn-press">{t('common.cancel')}</button>
                  <button
                    disabled={updatingCampaign === c.id}
                    onClick={async () => {
                      if (!onUpdateCampaign) return;
                      setUpdatingCampaign(c.id);
                      try {
                        await onUpdateCampaign(c.id, { status: 'Completed' });
                        toast.success('Campaign stopped');
                        setShowStopConfirm(false);
                        setSelectedCampaign(null);
                      } catch { toast.error('Failed'); }
                      finally { setUpdatingCampaign(null); }
                    }}
                    className="flex-1 h-11 rounded-xl bg-destructive text-primary-foreground text-[13px] font-bold btn-press disabled:opacity-50"
                  >Stop Campaign</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ── Main List View ──
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">{t('campaigns.title')}</h1>
            <p className="text-[14px] text-muted-foreground">{t('campaigns.activeCampaigns', { count: stats.activeCount })}</p>
          </div>
          <button onClick={() => onNavigate?.('quickad')}
            className="h-[42px] px-4 rounded-xl bg-brand-blue text-primary-foreground text-[13px] font-bold flex items-center gap-1.5 btn-press">
            <Plus size={18} /> New Campaign
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mt-4 overflow-x-auto pb-1 -mx-1 px-1">
          {isLoading ? (
            <>{[1, 2, 3].map(i => <StatSkeleton key={i} />)}</>
          ) : (
            <>
              {[
                { icon: '💰', value: `SAR ${stats.totalBudget.toLocaleString()}`, label: t('campaigns.totalBudget'), bg: 'bg-purple-soft' },
                { icon: '👁️', value: stats.totalReach >= 1000 ? `${(stats.totalReach / 1000).toFixed(1)}K` : String(stats.totalReach), label: t('campaigns.totalReach'), bg: 'bg-green-soft' },
                { icon: '📈', value: `${stats.avgRoi}x`, label: t('campaigns.avgRoi'), bg: 'bg-green-soft' },
              ].map((s, i) => (
                <div key={i} className="min-w-[160px] bg-card rounded-2xl p-4 border border-border-light flex-shrink-0">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center text-lg mb-2`}>{s.icon}</div>
                  <span className="text-[20px] font-extrabold text-foreground">{s.value}</span>
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Filter */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {(['Active', 'Scheduled', 'Completed', 'Drafts'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-3xl px-4 py-2 text-[12px] font-semibold whitespace-nowrap ${
                filter === f ? 'bg-brand-blue text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
              }`}>
              {t(`campaigns.${f.toLowerCase()}`)}
            </button>
          ))}
        </div>

        {/* Campaign List */}
        <div className="mt-3 space-y-3">
          {isLoading ? (
            <CampaignSkeleton />
          ) : (campaigns[filter] ?? []).length === 0 ? (
            <div className="bg-card rounded-2xl p-8 border border-border-light text-center">
              <span className="text-3xl">📋</span>
              <p className="text-[14px] font-semibold text-foreground mt-2">No {filter.toLowerCase()} campaigns</p>
              <p className="text-[12px] text-muted-foreground mt-1">{t('campaigns.createFirst')}</p>
              <button onClick={() => onNavigate?.('quickad')} className="mt-3 h-10 px-5 rounded-2xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press">
                {t('campaigns.createCampaign')}
              </button>
            </div>
          ) : (
            (campaigns[filter] ?? []).map((c: any, i: number) => {
              const statusStyle = campaignStatusColors[c.status] || campaignStatusColors.Active;
              return (
                <motion.div
                  key={c.id ?? i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-2xl border border-border-light overflow-hidden card-tap cursor-pointer"
                  style={{ borderLeft: `4px solid ${c.status === 'Active' ? 'hsl(157,100%,42%)' : c.status === 'Scheduled' ? 'hsl(233,100%,42%)' : '#9ca3af'}` }}
                  onClick={() => setSelectedCampaign(c)}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[16px] font-bold text-foreground">{c.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${statusStyle.bg} ${statusStyle.text}`}>{c.status}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">{c.platforms}</p>
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {[
                        { label: t('common.budget'), val: `SAR ${c.budget}` },
                        { label: t('campaigns.spent'), val: `SAR ${c.spent}` },
                        { label: t('campaigns.totalReach'), val: c.reach },
                        { label: 'ROI', val: c.roi },
                      ].map((m, j) => (
                        <div key={j}>
                          <span className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">{m.label}</span>
                          <p className={`text-[14px] font-bold ${m.label === 'ROI' && m.val !== '—' ? 'text-green-accent' : 'text-foreground'}`}>{m.val}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">{c.date}</p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
};

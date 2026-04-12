import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Copy, ExternalLink, Search, X, ChevronDown, Link2, QrCode } from 'lucide-react';
import { InstagramLogo, TikTokLogo, FacebookLogo, XLogo, YouTubeLogo } from '../components/PlatformLogos';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useIsMobile } from '../hooks/use-mobile';
import { QRCodeModal } from '../components/QRCodeModal';

// STATIC: Link shortener service — Phase 2
// TODO: link shortener service
const linksData = [
  { id: '1', short: 'spda.ai/Xk3m', original: 'malekskitchen.com/menu', Logo: InstagramLogo, platform: 'Instagram', post: 'Weekend Brunch Special — Try our new...', clicks: 142, unique: 98, topSource: 'Instagram Bio', created: 'Mar 18', sources: [{ name: 'Instagram Bio', pct: 45 }, { name: 'Instagram Story', pct: 22 }, { name: 'Facebook Post', pct: 18 }, { name: 'Direct/Other', pct: 15 }], geo: [{ name: 'Saudi Arabia', pct: 62 }, { name: 'UAE', pct: 18 }, { name: 'Egypt', pct: 8 }, { name: 'Other', pct: 12 }], device: [{ name: 'Mobile', pct: 78 }, { name: 'Desktop', pct: 22 }] },
  { id: '2', short: 'spda.ai/B7nw', original: 'malekskitchen.com/order', Logo: TikTokLogo, platform: 'TikTok', post: 'New Burger Drop — Smash Burger is here!', clicks: 87, unique: 65, topSource: 'TikTok Link', created: 'Mar 15', sources: [{ name: 'TikTok Bio', pct: 55 }, { name: 'TikTok Comment', pct: 25 }, { name: 'Direct', pct: 20 }], geo: [{ name: 'Saudi Arabia', pct: 58 }, { name: 'UAE', pct: 22 }, { name: 'Kuwait', pct: 10 }, { name: 'Other', pct: 10 }], device: [{ name: 'Mobile', pct: 88 }, { name: 'Desktop', pct: 12 }] },
  { id: '3', short: 'spda.ai/R2kp', original: 'malekskitchen.com/reserve', Logo: FacebookLogo, platform: 'Facebook', post: 'Book Your Table — Weekend reservation...', clicks: 54, unique: 41, topSource: 'Facebook Post', created: 'Mar 12', sources: [{ name: 'Facebook Post', pct: 60 }, { name: 'Facebook Ad', pct: 25 }, { name: 'Direct', pct: 15 }], geo: [{ name: 'Saudi Arabia', pct: 70 }, { name: 'UAE', pct: 15 }, { name: 'Other', pct: 15 }], device: [{ name: 'Mobile', pct: 65 }, { name: 'Desktop', pct: 35 }] },
  { id: '4', short: 'spda.ai/K9mz', original: 'malekskitchen.com/delivery', Logo: XLogo, platform: 'X', post: 'Now delivering to your door! Order via...', clicks: 38, unique: 29, topSource: 'X Post', created: 'Mar 10', sources: [{ name: 'X Post', pct: 50 }, { name: 'X Bio', pct: 30 }, { name: 'Direct', pct: 20 }], geo: [{ name: 'Saudi Arabia', pct: 75 }, { name: 'Other', pct: 25 }], device: [{ name: 'Mobile', pct: 72 }, { name: 'Desktop', pct: 28 }] },
  { id: '5', short: 'spda.ai/W4jt', original: 'malekskitchen.com/catering', Logo: YouTubeLogo, platform: 'YouTube', post: 'Catering for your events — Full menu...', clicks: 23, unique: 18, topSource: 'YouTube Desc', created: 'Mar 8', sources: [{ name: 'YouTube Description', pct: 65 }, { name: 'Direct', pct: 35 }], geo: [{ name: 'Saudi Arabia', pct: 80 }, { name: 'Other', pct: 20 }], device: [{ name: 'Mobile', pct: 55 }, { name: 'Desktop', pct: 45 }] },
];

const clickTrend = [
  { day: '1', val: 32 }, { day: '3', val: 45 }, { day: '5', val: 38 }, { day: '7', val: 52 },
  { day: '9', val: 48 }, { day: '11', val: 61 }, { day: '13', val: 55 }, { day: '15', val: 72 },
  { day: '17', val: 68 }, { day: '19', val: 58 }, { day: '21', val: 75 }, { day: '23', val: 82 },
  { day: '25', val: 78 }, { day: '27', val: 88 }, { day: '29', val: 92 },
];

interface LinkTrackingScreenProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

export const LinkTrackingScreen = ({ onBack, onNavigate }: LinkTrackingScreenProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [selectedLink, setSelectedLink] = useState<typeof linksData[0] | null>(null);
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [shortenedUrl, setShortenedUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sortBy, setSortBy] = useState<'clicks' | 'unique'>('clicks');
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const platformFilters = ['All', 'Instagram', 'TikTok', 'Facebook', 'X', 'YouTube'];

  const filtered = linksData
    .filter(l => platformFilter === 'All' || l.platform === platformFilter)
    .filter(l => l.short.toLowerCase().includes(searchQuery.toLowerCase()) || l.original.toLowerCase().includes(searchQuery.toLowerCase()) || l.post.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => sortBy === 'clicks' ? b.clicks - a.clicks : b.unique - a.unique);

  const totalClicks = linksData.reduce((s, l) => s + l.clicks, 0);
  const totalUnique = linksData.reduce((s, l) => s + l.unique, 0);
  const topLink = linksData.reduce((a, b) => a.clicks > b.clicks ? a : b);
  const maxVal = Math.max(...clickTrend.map(d => d.val));

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied ✓'));
  };

  const handleShortenLink = () => {
    if (!newUrl.trim()) return;
    const hash = Math.random().toString(36).substring(2, 6);
    setShortenedUrl(`spda.ai/${hash}`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground" /></button>
          <div>
            <h1 className="text-[24px] font-extrabold tracking-[-0.02em]">🔗 Link Tracking</h1>
            <p className="text-[14px] text-muted-foreground">Track every click from your social media posts</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          {[
            { icon: '🔗', value: '47', label: 'Total Links Created' },
            { icon: '👆', value: '1,284', label: 'Total Clicks This Month' },
            { icon: '👤', value: '892', label: 'Unique Clicks' },
            { icon: '🏆', value: topLink.short, label: `Top Link · ${topLink.clicks} clicks` },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }} className="bg-card rounded-2xl p-4 border border-border-light">
              <span className="text-lg">{kpi.icon}</span>
              <p className="text-[20px] font-extrabold text-foreground mt-1">{kpi.value}</p>
              <span className="text-[11px] text-muted-foreground">{kpi.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Click Trend Chart */}
        <div className="mt-5">
          <h2 className="text-[18px] font-bold text-foreground">Click Trend (30 days)</h2>
          <div className="bg-card rounded-2xl p-5 border border-border-light mt-3">
            <div className="relative" style={{ height: 160 }}>
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-muted-foreground w-8">
                <span>{maxVal}</span><span>{Math.round(maxVal / 2)}</span><span>0</span>
              </div>
              <div className="flex items-end gap-1 h-full ml-9">
                {clickTrend.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <div className="absolute -top-6 bg-foreground text-primary-foreground text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">{d.val} clicks</div>
                    <motion.div initial={{ height: 0 }} animate={{ height: `${(d.val / maxVal) * 100}%` }} transition={{ delay: 0.1 + i * 0.03, duration: 0.5 }} className="w-full rounded-t-sm gradient-hero opacity-80 cursor-pointer" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="mt-5 flex gap-2 items-center flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-[12px] text-muted-foreground" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search URLs..." className="w-full h-10 rounded-xl bg-card border border-border-light pl-9 pr-3 text-[13px] focus:outline-none focus:border-primary" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {platformFilters.map(pf => (
              <button key={pf} onClick={() => setPlatformFilter(pf)} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${platformFilter === pf ? 'bg-brand-blue text-primary-foreground' : 'bg-card border border-border-light text-muted-foreground'}`}>{pf}</button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="mt-3 flex gap-2">
          {[{ key: 'clicks' as const, label: 'Most Clicks' }, { key: 'unique' as const, label: 'Most Unique' }].map(s => (
            <button key={s.key} onClick={() => setSortBy(s.key)} className={`text-[11px] font-semibold px-3 py-1 rounded-lg ${sortBy === s.key ? 'bg-purple-soft text-primary' : 'text-muted-foreground'}`}>{s.label}</button>
          ))}
        </div>

        {/* Links Table */}
        <div className="mt-4 overflow-x-auto -mx-5 px-5">
          <div className="bg-card rounded-2xl border border-border-light overflow-hidden min-w-[750px]">
            <div className="grid grid-cols-[130px_1fr_60px_1fr_60px_60px_90px_40px_80px] gap-2 px-4 py-2.5 bg-muted text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              <span>Short URL</span><span>Original</span><span>Platform</span><span>Post</span><span>Clicks</span><span>Unique</span><span>Top Source</span><span>QR</span><span>Actions</span>
            </div>
            {filtered.map((link, i) => (
              <div key={link.id} className={`grid grid-cols-[130px_1fr_60px_1fr_60px_60px_90px_40px_80px] gap-2 px-4 py-3 items-center cursor-pointer hover:bg-muted/50 transition-colors ${i > 0 ? 'border-t border-border-light' : ''}`} onClick={() => setSelectedLink(link)}>
                <span className="text-[12px] font-bold text-brand-blue truncate">{link.short}</span>
                <span className="text-[11px] text-muted-foreground truncate">{link.original}</span>
                <span><link.Logo size={18} /></span>
                <span className="text-[11px] text-foreground truncate">{link.post}</span>
                <span className="text-[13px] font-bold text-foreground">{link.clicks}</span>
                <span className="text-[12px] text-muted-foreground">{link.unique}</span>
                <span className="text-[11px] text-muted-foreground truncate">{link.topSource}</span>
                <span onClick={e => { e.stopPropagation(); setQrUrl(link.short); }}>
                  <QrCode size={16} className="text-muted-foreground hover:text-brand-blue cursor-pointer transition-colors" />
                </span>
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setSelectedLink(link)} className="text-[11px] font-semibold text-brand-blue">View</button>
                  <button onClick={() => copyToClipboard(link.short)} className="text-[11px] font-semibold text-muted-foreground">Copy</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Short Link Button */}
        <button onClick={() => setShowCreateLink(!showCreateLink)} className="w-full h-12 rounded-2xl gradient-btn text-primary-foreground font-bold text-[14px] shadow-btn btn-press flex items-center justify-center gap-2 mt-6">
          <Link2 size={18} /> + Create Short Link
        </button>
      </div>

      {/* Create Link Panel */}
      <AnimatePresence>
        {showCreateLink && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-5 mt-4">
            <div className="bg-card rounded-2xl p-5 border border-border-light space-y-4">
              <h3 className="text-[16px] font-bold text-foreground">Create Short Link</h3>
              <input value={newUrl} onChange={e => { setNewUrl(e.target.value); setShortenedUrl(''); }} placeholder="Paste your URL here..." className="w-full h-12 rounded-xl bg-muted border-none px-4 text-[14px] focus:outline-none" />
              <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-[12px] text-brand-blue font-medium flex items-center gap-1">
                <ChevronDown size={14} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} /> Advanced (UTM)
              </button>
              {showAdvanced && (
                <div className="space-y-2">
                  {['Campaign Name', 'Source', 'Medium', 'Term', 'Content'].map(f => (
                    <input key={f} placeholder={f} className="w-full h-10 rounded-xl bg-muted border-none px-4 text-[13px] focus:outline-none" />
                  ))}
                </div>
              )}
              <button onClick={handleShortenLink} className="w-full h-12 rounded-2xl gradient-btn text-primary-foreground font-bold text-[14px] shadow-btn btn-press">Shorten Link</button>
              {shortenedUrl && (
                <div className="bg-green-soft rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Your short link:</p>
                      <p className="text-[16px] font-bold text-green-accent">{shortenedUrl}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => copyToClipboard(shortenedUrl)} className="w-9 h-9 rounded-lg bg-card border border-border-light flex items-center justify-center"><Copy size={14} /></button>
                      <button onClick={() => setQrUrl(shortenedUrl)} className="w-9 h-9 rounded-lg bg-card border border-border-light flex items-center justify-center"><QrCode size={14} className="text-muted-foreground" /></button>
                    </div>
                  </div>
                  <button onClick={() => setQrUrl(shortenedUrl)} className="w-full h-10 rounded-xl bg-brand-blue/10 text-brand-blue text-[12px] font-semibold flex items-center justify-center gap-1.5">
                    <QrCode size={14} /> {t('qr.generate', 'Generate QR Code')}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Link Detail Panel */}
      <AnimatePresence>
        {selectedLink && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLink(null)} className="fixed inset-0 bg-foreground/30 z-40" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }} className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-xl max-w-[430px] md:max-w-[600px] mx-auto max-h-[85vh] flex flex-col">
              <div className="p-5 pb-3 flex items-center justify-between border-b border-border-light">
                <h3 className="text-[16px] font-bold text-foreground">Link Details</h3>
                <button onClick={() => setSelectedLink(null)}><X size={20} className="text-muted-foreground" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div className="flex items-center gap-3">
                  <p className="text-[18px] font-bold text-brand-blue flex-1">{selectedLink.short}</p>
                  <button onClick={() => copyToClipboard(selectedLink.short)} className="h-9 px-3 rounded-lg bg-brand-blue text-primary-foreground text-[12px] font-bold flex items-center gap-1"><Copy size={12} /> Copy</button>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <ExternalLink size={14} /><span className="truncate">{selectedLink.original}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted rounded-xl p-3 text-center"><p className="text-[18px] font-bold text-foreground">{selectedLink.clicks}</p><span className="text-[10px] text-muted-foreground">Total Clicks</span></div>
                  <div className="bg-muted rounded-xl p-3 text-center"><p className="text-[18px] font-bold text-foreground">{selectedLink.unique}</p><span className="text-[10px] text-muted-foreground">Unique</span></div>
                  <div className="bg-muted rounded-xl p-3 text-center"><p className="text-[12px] font-bold text-foreground">{selectedLink.topSource}</p><span className="text-[10px] text-muted-foreground">Top Source</span></div>
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-foreground mb-2">Click Sources</h4>
                  {selectedLink.sources.map((s, i) => (
                    <div key={i} className="mb-2">
                      <div className="flex justify-between text-[12px]"><span className="text-foreground">{s.name}</span><span className="font-bold">{s.pct}%</span></div>
                      <div className="h-2 rounded-full bg-muted mt-1"><motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} className="h-full rounded-full gradient-hero" /></div>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-foreground mb-2">Geography</h4>
                  {selectedLink.geo.map((g, i) => (
                    <div key={i} className="mb-2">
                      <div className="flex justify-between text-[12px]"><span className="text-foreground">{g.name}</span><span className="font-bold">{g.pct}%</span></div>
                      <div className="h-2 rounded-full bg-muted mt-1"><motion.div initial={{ width: 0 }} animate={{ width: `${g.pct}%` }} className="h-full rounded-full bg-brand-teal" /></div>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-foreground mb-2">Device</h4>
                  <div className="flex gap-3">
                    {selectedLink.device.map((d, i) => (
                      <div key={i} className="flex-1 bg-muted rounded-xl p-3 text-center"><p className="text-[16px] font-bold text-foreground">{d.pct}%</p><span className="text-[11px] text-muted-foreground">{d.name}</span></div>
                    ))}
                  </div>
                </div>
                <div className="bg-muted rounded-xl p-3">
                  <div className="flex items-center gap-2"><selectedLink.Logo size={16} /><p className="text-[13px] font-semibold text-foreground truncate">{selectedLink.post}</p></div>
                </div>
                <button onClick={() => { setSelectedLink(null); onNavigate?.('create'); }} className="w-full h-12 rounded-2xl gradient-btn text-primary-foreground font-bold text-[13px] shadow-btn btn-press">Create New Post with This Link</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {qrUrl && <QRCodeModal url={qrUrl} onClose={() => setQrUrl(null)} />}
      </AnimatePresence>
    </motion.div>
  );
};
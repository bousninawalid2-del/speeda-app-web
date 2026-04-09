import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { platformLogoMap, InstagramLogo, TikTokLogo, SnapchatLogo, FacebookLogo, XLogo, YouTubeLogo, LinkedInLogo, GoogleLogo, PinterestLogo, ThreadsLogo } from '../components/PlatformLogos';
import { Check, ChevronDown, Search, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { PlatformConnectFlow } from '../components/PlatformConnectFlow';

interface SetupProps {
  onComplete: () => void;
}

const businessTypes = ['🍽️ Restaurant', '☕ Café', '🍳 Cloud Kitchen', '🚚 Food Truck', '🧁 Bakery', '📦 Other'];

const countryCityData: Record<string, string[]> = {
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Dammam', 'Makkah', 'Madinah', 'Khobar', 'Dhahran', 'Tabuk', 'Abha', 'Jazan', 'Hail', 'Najran', 'Buraidah', 'Al Ahsa', 'Yanbu', 'Taif'],
  'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Al Ain'],
  'Tunisia': ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Gabes', 'Ariana', 'Monastir', 'Ben Arous', 'Nabeul'],
  'Bahrain': ['Manama', 'Muharraq', 'Riffa', 'Hamad Town', 'Isa Town'],
  'Kuwait': ['Kuwait City', 'Hawalli', 'Salmiya', 'Farwaniya', 'Jahra'],
  'Qatar': ['Doha', 'Al Wakrah', 'Al Khor', 'Umm Salal', 'Al Rayyan'],
  'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Sharm El Sheikh', 'Hurghada', 'Luxor', 'Aswan'],
  'Morocco': ['Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tangier', 'Agadir'],
  'France': ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Bordeaux', 'Lille'],
};

const countries = Object.keys(countryCityData);
const tones = ['Professional', 'Casual', 'Fun', 'Inspiring', 'Bold', 'Warm'];
const businessSizes = ['Just me', '2-5', '6-15', '16-50', '50+'];
const socialGoals = ['More Followers', 'More Engagement', 'More Orders', 'Brand Awareness', 'Customer Loyalty', 'Hiring'];

const hours = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  const ampm = i < 12 ? 'AM' : 'PM';
  return `${h}:00 ${ampm}`;
});

const socialPlatforms = [
  { id: 'instagram', name: 'Instagram', Logo: InstagramLogo },
  { id: 'tiktok', name: 'TikTok', Logo: TikTokLogo },
  { id: 'snapchat', name: 'Snapchat', Logo: SnapchatLogo, note: 'Stories only' },
  { id: 'facebook', name: 'Facebook', Logo: FacebookLogo },
  { id: 'x', name: 'X', Logo: XLogo },
  { id: 'youtube', name: 'YouTube', Logo: YouTubeLogo },
  { id: 'linkedin', name: 'LinkedIn', Logo: LinkedInLogo },
  { id: 'google', name: 'Google Biz', Logo: GoogleLogo },
  { id: 'pinterest', name: 'Pinterest', Logo: PinterestLogo },
  { id: 'threads', name: 'Threads', Logo: ThreadsLogo },
];

const langOptions = [
  { id: 'saudi', label: '🇸🇦 Saudi' },
  { id: 'arabic', label: 'العربية Arabic' },
  { id: 'english', label: '🇬🇧 English' },
  { id: 'other', label: 'Other (Choose)' },
];

export const BusinessSetupScreen = ({ onComplete }: SetupProps) => {
  const [step, setStep] = useState(1);
  const [bizType, setBizType] = useState('');
  const [otherBizType, setOtherBizType] = useState('');
  const [country, setCountry] = useState('Saudi Arabia');
  const [city, setCity] = useState('');
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [connected, setConnected] = useState<string[]>([]);
  const [selectedTones, setSelectedTones] = useState<string[]>(['Professional']);
  const [selectedLangs, setSelectedLangs] = useState<string[]>(['saudi']);
  const [otherLang, setOtherLang] = useState('');
  const [brandFiles, setBrandFiles] = useState<string[]>([]);
  const [connectingPlatform, setConnectingPlatform] = useState<{ name: string; Logo: any } | null>(null);

  // Step 1 new fields
  const [yearFounded, setYearFounded] = useState('');
  const [bizSize, setBizSize] = useState('');
  const [openTime, setOpenTime] = useState('9:00 AM');
  const [closeTime, setCloseTime] = useState('11:00 PM');
  const [is24Hours, setIs24Hours] = useState(false);
  const [hoursVary, setHoursVary] = useState(false);

  // Step 4 (new marketing step)
  const [targetAudience, setTargetAudience] = useState('');
  const [usp, setUsp] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');

  const startConnect = (id: string, platforms: { id: string; name: string; Logo: any }[]) => {
    const p = platforms.find(pl => pl.id === id);
    if (p) setConnectingPlatform({ name: p.name, Logo: p.Logo });
  };

  const toggleConnect = (id: string) => setConnected(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id]);
  const toggleTone = (t: string) => setSelectedTones(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t]);

  const toggleLang = (id: string) => {
    if (selectedLangs.includes(id)) {
      setSelectedLangs(ls => ls.filter(x => x !== id));
    } else if (selectedLangs.length < 2) {
      setSelectedLangs(ls => [...ls, id]);
    } else {
      toast('Maximum 2 languages. Deselect one first.');
    }
  };

  const toggleGoal = (g: string) => {
    if (selectedGoals.includes(g)) {
      setSelectedGoals(gs => gs.filter(x => x !== g));
    } else if (selectedGoals.length < 3) {
      setSelectedGoals(gs => [...gs, g]);
    } else {
      toast('Maximum 3 goals. Deselect one first.');
    }
  };

  const availableCities = countryCityData[country] || [];
  const filteredCountries = countries.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()));
  const filteredCities = availableCities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));

  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} className={`rounded-3xl px-5 py-[9px] text-[13px] font-semibold transition-all duration-200 ${active ? 'bg-brand-blue text-primary-foreground' : 'bg-card text-muted-foreground border border-border'}`}>{label}</button>
  );

  const DropdownButton = ({ value, placeholder, onClick }: { value: string; placeholder: string; onClick: () => void }) => (
    <button onClick={onClick} className="w-full h-[56px] rounded-2xl bg-card border border-border px-4 text-[14px] flex items-center justify-between">
      <span className={value ? 'text-foreground' : 'text-muted-foreground'}>{value || placeholder}</span>
      <ChevronDown size={16} className="text-muted-foreground" />
    </button>
  );

  const totalSteps = 4;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-background px-6 pt-8 pb-8">
      <div className="flex gap-2 mb-8">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map(i => (
          <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= step ? 'gradient-hero' : 'bg-border'}`} />
        ))}
      </div>

      {/* Step 1: Business Info — ENRICHED */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">Tell us about your business</h2>
          <div className="mt-6 space-y-5">
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">Business Name</label>
              <input className="w-full h-[56px] rounded-2xl bg-card border border-border px-4 text-[14px] focus:border-primary focus:outline-none" placeholder="Your business name" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[14px] font-semibold text-foreground mb-2 block">Business Type</label>
                <div className="flex flex-wrap gap-2">
                  {businessTypes.map(t => <Chip key={t} label={t} active={bizType === t} onClick={() => setBizType(t)} />)}
                </div>
                <AnimatePresence>
                  {bizType === '📦 Other' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                      <input className="w-full h-[48px] rounded-2xl bg-card border border-border px-4 text-[14px] focus:border-primary focus:outline-none mt-2" placeholder="e.g., Catering service, Juice bar..." value={otherBizType} onChange={e => setOtherBizType(e.target.value)} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            {/* Year Founded */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">What year did you start?</label>
              <input type="number" className="w-full h-[56px] rounded-2xl bg-card border border-border px-4 text-[14px] focus:border-primary focus:outline-none" placeholder="2020" value={yearFounded} onChange={e => setYearFounded(e.target.value)} maxLength={4} />
            </div>
            {/* Business Size */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">How big is your team?</label>
              <div className="flex flex-wrap gap-2">
                {businessSizes.map(s => <Chip key={s} label={s} active={bizSize === s} onClick={() => setBizSize(s)} />)}
              </div>
            </div>
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">Country</label>
              <DropdownButton value={country} placeholder="Select country" onClick={() => setCountryOpen(true)} />
            </div>
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">City</label>
              {availableCities.length > 0 ? (
                <DropdownButton value={city} placeholder="Select city" onClick={() => setCityOpen(true)} />
              ) : (
                <input className="w-full h-[56px] rounded-2xl bg-card border border-border px-4 text-[14px] focus:border-primary focus:outline-none" placeholder="Enter your city" value={city} onChange={e => setCity(e.target.value)} />
              )}
            </div>
            {/* Opening Hours */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">Typical opening hours</label>
              {!is24Hours && !hoursVary && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <p className="text-[11px] text-muted-foreground mb-1">Opens at</p>
                    <select className="w-full h-[48px] rounded-2xl bg-card border border-border px-3 text-[13px] focus:border-primary focus:outline-none" value={openTime} onChange={e => setOpenTime(e.target.value)}>
                      {hours.map(h => <option key={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-muted-foreground mb-1">Closes at</p>
                    <select className="w-full h-[48px] rounded-2xl bg-card border border-border px-3 text-[13px] focus:border-primary focus:outline-none" value={closeTime} onChange={e => setCloseTime(e.target.value)}>
                      {hours.map(h => <option key={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              )}
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={is24Hours} onChange={() => { setIs24Hours(!is24Hours); if (!is24Hours) setHoursVary(false); }} className="w-4 h-4 rounded accent-brand-blue" />
                  <span className="text-[13px] text-foreground">Open 24 hours</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hoursVary} onChange={() => { setHoursVary(!hoursVary); if (!hoursVary) setIs24Hours(false); }} className="w-4 h-4 rounded accent-brand-blue" />
                  <span className="text-[13px] text-muted-foreground">Hours vary — I'll set this later</span>
                </label>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 2: Social Platforms */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">Connect your platforms</h2>
          <p className="text-[14px] text-muted-foreground mt-2">We'll use these to publish and analyze your content</p>
          <div className="grid grid-cols-2 gap-3 mt-6">
            {socialPlatforms.map(p => (
              <button key={p.id} onClick={() => {
                if (connected.includes(p.id)) { toggleConnect(p.id); } else { startConnect(p.id, socialPlatforms); }
              }} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all card-tap ${connected.includes(p.id) ? 'border-primary bg-purple-soft' : 'border-border bg-card'}`}>
                <p.Logo size={32} />
                <span className="text-[13px] font-bold text-foreground">{p.name}</span>
                {'note' in p && p.note && <span className="text-[10px] text-muted-foreground">{p.note}</span>}
                <span className={`text-[11px] font-semibold ${connected.includes(p.id) ? 'text-green-accent' : 'text-muted-foreground'}`}>
                  {connected.includes(p.id) ? '✓ Connected' : 'Connect'}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Step 3: About your marketing (was Step 4) */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">Tell us about your marketing</h2>
          <p className="text-[14px] text-muted-foreground mt-2">This helps our AI give you better recommendations</p>
          <div className="mt-6 space-y-5">
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">Who are your customers?</label>
              <textarea className="w-full min-h-[64px] rounded-2xl bg-card border border-border p-4 text-[14px] focus:border-primary focus:outline-none resize-none" placeholder="e.g., Families in Riyadh, young professionals 22-35, tourists in downtown area..." value={targetAudience} onChange={e => setTargetAudience(e.target.value)} />
            </div>
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">What makes your business special?</label>
              <textarea className="w-full min-h-[64px] rounded-2xl bg-card border border-border p-4 text-[14px] focus:border-primary focus:outline-none resize-none" placeholder="e.g., Best garlic sauce in town, unique atmosphere, only halal organic ingredients..." value={usp} onChange={e => setUsp(e.target.value)} />
            </div>
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">What do you want to achieve?</label>
              <p className="text-[11px] text-muted-foreground mb-2">Select 1-3 goals</p>
              <div className="flex flex-wrap gap-2">
                {socialGoals.map(g => <Chip key={g} label={g} active={selectedGoals.includes(g)} onClick={() => toggleGoal(g)} />)}
              </div>
            </div>
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">Your brand colors (optional)</label>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-1">
                  <label className="relative cursor-pointer">
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-border flex items-center justify-center" style={primaryColor ? { backgroundColor: primaryColor, borderStyle: 'solid', borderColor: primaryColor } : {}}>
                      {!primaryColor && <span className="text-[14px] text-muted-foreground">+</span>}
                    </div>
                    <input type="color" className="absolute inset-0 opacity-0 cursor-pointer" value={primaryColor || '#0020d4'} onChange={e => setPrimaryColor(e.target.value)} />
                  </label>
                  <span className="text-[10px] text-muted-foreground">Primary</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <label className="relative cursor-pointer">
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-border flex items-center justify-center" style={secondaryColor ? { backgroundColor: secondaryColor, borderStyle: 'solid', borderColor: secondaryColor } : {}}>
                      {!secondaryColor && <span className="text-[14px] text-muted-foreground">+</span>}
                    </div>
                    <input type="color" className="absolute inset-0 opacity-0 cursor-pointer" value={secondaryColor || '#00c7f3'} onChange={e => setSecondaryColor(e.target.value)} />
                  </label>
                  <span className="text-[10px] text-muted-foreground">Secondary</span>
                </div>
              </div>
              <button onClick={() => { setPrimaryColor(''); setSecondaryColor(''); }} className="text-brand-blue text-[12px] font-medium mt-2">Skip — AI will use Speeda's default palette</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 4: Brand Voice */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">How should Speeda talk for you?</h2>
          <div className="mt-6 space-y-5">
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">Tone</label>
              <div className="flex flex-wrap gap-2">
                {tones.map(t => <Chip key={t} label={t} active={selectedTones.includes(t)} onClick={() => toggleTone(t)} />)}
              </div>
            </div>
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-1 block">Language</label>
              <p className="text-[11px] text-muted-foreground mb-2">Select 1-2 languages for your content</p>
              <div className="flex flex-wrap gap-2">
                {langOptions.map(l => <Chip key={l.id} label={l.label} active={selectedLangs.includes(l.id)} onClick={() => toggleLang(l.id)} />)}
              </div>
              <AnimatePresence>
                {selectedLangs.includes('other') && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <input className="w-full h-[48px] rounded-2xl bg-card border border-border px-4 text-[14px] focus:border-primary focus:outline-none mt-2" placeholder="e.g., French, Urdu, Turkish..." value={otherLang} onChange={e => setOtherLang(e.target.value)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">Describe your business</label>
              <textarea className="w-full min-h-[100px] rounded-2xl bg-card border border-border p-4 text-[14px] focus:border-primary focus:outline-none resize-none" placeholder="e.g., Modern shawarma restaurant in Riyadh, family-friendly, best garlic sauce in town..." />
            </div>
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-1 block">Upload your brand identity</label>
              <p className="text-[12px] text-muted-foreground mb-2">Help our AI match your visual identity</p>
              {brandFiles.length > 0 && (
                <div className="flex gap-2 mb-2">
                  {brandFiles.map((f, i) => (
                    <div key={i} className="relative">
                      <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-[20px]">📎</div>
                      <button onClick={() => setBrandFiles(bf => bf.filter((_, j) => j !== i))} className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-red-accent text-primary-foreground flex items-center justify-center"><X size={10} /></button>
                    </div>
                  ))}
                </div>
              )}
              {brandFiles.length < 3 && (
                <button onClick={() => setBrandFiles(f => [...f, `brand_${f.length + 1}.png`])} className="w-full border-2 border-dashed border-brand-blue/25 rounded-2xl h-[70px] flex items-center justify-center gap-2 hover:bg-muted/30 transition-colors">
                  <Upload size={18} className="text-brand-blue" />
                  <span className="text-[13px] font-bold text-brand-blue">Upload logo, brand guidelines, or visual assets</span>
                </button>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">Supports PNG, JPG, PDF — Max 10MB · Optional</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation buttons */}
      <div className="mt-8 flex flex-col gap-3">
        <button onClick={() => step === totalSteps ? onComplete() : setStep(s => s + 1)} className={`w-full rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press ${step === totalSteps ? 'h-[60px]' : 'h-[56px]'}`}>
          {step === totalSteps ? 'Launch My Marketing OS' : 'Next'}
        </button>
        {(step === 2 || step === 3) && (
          <button onClick={() => setStep(s => s + 1)} className="text-muted-foreground text-[13px] font-medium text-center">Skip for now</button>
        )}
      </div>

      {/* Country Dropdown Modal */}
      <AnimatePresence>
        {countryOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCountryOpen(false)} className="fixed inset-0 bg-foreground/30 z-40" />
            <motion.div initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }} className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-xl max-w-[430px] mx-auto max-h-[60vh] flex flex-col">
              <div className="p-5 pb-3 flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-foreground">Select Country</h3>
                <button onClick={() => setCountryOpen(false)}><X size={20} className="text-muted-foreground" /></button>
              </div>
              <div className="px-5 py-2">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-[11px] text-muted-foreground" />
                  <input className="w-full h-[40px] rounded-xl bg-muted border-none pl-10 pr-4 text-[14px] focus:outline-none" placeholder="Search..." value={countrySearch} onChange={e => setCountrySearch(e.target.value)} autoFocus />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-5">
                {filteredCountries.map(c => (
                  <button key={c} onClick={() => { setCountry(c); setCity(''); setCountryOpen(false); setCountrySearch(''); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-start ${country === c ? 'bg-purple-soft' : 'hover:bg-muted'}`}>
                    <span className="text-[14px] font-medium text-foreground flex-1">{c}</span>
                    {country === c && <Check size={16} className="text-brand-blue" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* City Dropdown Modal */}
      <AnimatePresence>
        {cityOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCityOpen(false)} className="fixed inset-0 bg-foreground/30 z-40" />
            <motion.div initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }} className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-xl max-w-[430px] mx-auto max-h-[60vh] flex flex-col">
              <div className="p-5 pb-3 flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-foreground">Select City</h3>
                <button onClick={() => setCityOpen(false)}><X size={20} className="text-muted-foreground" /></button>
              </div>
              <div className="px-5 py-2">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-[11px] text-muted-foreground" />
                  <input className="w-full h-[40px] rounded-xl bg-muted border-none pl-10 pr-4 text-[14px] focus:outline-none" placeholder="Search..." value={citySearch} onChange={e => setCitySearch(e.target.value)} autoFocus />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-5">
                {filteredCities.map(c => (
                  <button key={c} onClick={() => { setCity(c); setCityOpen(false); setCitySearch(''); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-start ${city === c ? 'bg-purple-soft' : 'hover:bg-muted'}`}>
                    <span className="text-[14px] font-medium text-foreground flex-1">{c}</span>
                    {city === c && <Check size={16} className="text-brand-blue" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {connectingPlatform && (
          <PlatformConnectFlow
            platformName={connectingPlatform.name}
            platformLogo={<connectingPlatform.Logo size={64} />}
            onComplete={() => {
              toggleConnect(socialPlatforms.find(p => p.name === connectingPlatform.name)?.id || '');
              setConnectingPlatform(null);
            }}
            onCancel={() => setConnectingPlatform(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

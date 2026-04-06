import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Search, X, Upload, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { SetupPayload, ImageMeta } from '../lib/api-client';
import { InstagramLogo, TikTokLogo, SnapchatLogo, FacebookLogo, XLogo, YouTubeLogo, LinkedInLogo, GoogleLogo, PinterestLogo, ThreadsLogo } from '../components/PlatformLogos';

// ─── Static data ─────────────────────────────────────────────────────────────

const businessTypes = [
  { emoji: '🍽️', label: 'Restaurant' },
  { emoji: '☕', label: 'Café' },
  { emoji: '🍳', label: 'Cloud Kitchen' },
  { emoji: '🚚', label: 'Food Truck' },
  { emoji: '🧁', label: 'Bakery' },
  { emoji: '📦', label: 'Other' },
];

const businessSizes = ['Just me', '2-5', '6-15', '16-50', '50+'];

const socialGoals = [
  'More Followers', 'More Engagement', 'More Orders',
  'Brand Awareness', 'Customer Loyalty', 'Hiring',
];

const tones = ['Professional', 'Casual', 'Fun', 'Inspiring', 'Bold', 'Warm'];

const langOptions = [
  { id: 'saudi',   label: '🇸🇦 Saudi' },
  { id: 'arabic',  label: 'العربية Arabic' },
  { id: 'english', label: '🇬🇧 English' },
  { id: 'other',   label: 'Other (Choose)' },
];

const countryCityData: Record<string, string[]> = {
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Dammam', 'Makkah', 'Madinah', 'Khobar', 'Tabuk', 'Abha', 'Jazan', 'Hail', 'Najran', 'Buraidah', 'Al Ahsa', 'Yanbu', 'Taif'],
  'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Al Ain'],
  'Tunisia': ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Gabes', 'Ariana', 'Monastir', 'Nabeul'],
  'Bahrain': ['Manama', 'Muharraq', 'Riffa', 'Hamad Town', 'Isa Town'],
  'Kuwait': ['Kuwait City', 'Hawalli', 'Salmiya', 'Farwaniya', 'Jahra'],
  'Qatar': ['Doha', 'Al Wakrah', 'Al Khor', 'Umm Salal', 'Al Rayyan'],
  'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Sharm El Sheikh', 'Hurghada', 'Luxor', 'Aswan'],
  'Morocco': ['Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tangier', 'Agadir'],
  'France': ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Bordeaux'],
};

const countries = Object.keys(countryCityData);

const hours = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  const ampm = i < 12 ? 'AM' : 'PM';
  return `${h}:00 ${ampm}`;
});

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SetupInitialData {
  activity?: {
    business_name?: string | null;
    industry?: string | null;
    country?: string | null;
    location?: string | null;
    opening_hours?: string | null;
    business_size?: string | null;
    year_founded?: string | null;
    audience_target?: string | null;
    unique_selling_point?: string | null;
  } | null;
  preference?: {
    tone_of_voice?: string | null;
    language_preference?: string | null;
    business_description?: string | null;
    social_media_goals?: string | null;
    color_primary?: string | null;
    color_secondary?: string | null;
    other?: string | null;
  } | null;
  images?: ImageMeta[];
}

export interface SocialAccountStatus {
  platform: string;
  connected: boolean;
  username?: string;
}

const SOCIAL_PLATFORMS = [
  { id: 'instagram',       name: 'Instagram',  Logo: InstagramLogo },
  { id: 'tiktok',          name: 'TikTok',     Logo: TikTokLogo },
  { id: 'snapchat',        name: 'Snapchat',   Logo: SnapchatLogo },
  { id: 'facebook',        name: 'Facebook',    Logo: FacebookLogo },
  { id: 'x',               name: 'X',          Logo: XLogo },
  { id: 'youtube',         name: 'YouTube',     Logo: YouTubeLogo },
  { id: 'googlebusiness',  name: 'Google Biz',  Logo: GoogleLogo },
  { id: 'linkedin',        name: 'LinkedIn',    Logo: LinkedInLogo },
  { id: 'pinterest',       name: 'Pinterest',   Logo: PinterestLogo },
  { id: 'threads',         name: 'Threads',     Logo: ThreadsLogo },
];

interface SetupProps {
  onComplete: () => void;
  onSubmit?: (data: SetupPayload) => Promise<void>;
  onUploadImage?: (file: File) => Promise<ImageMeta>;
  onDeleteImage?: (id: string) => Promise<void>;
  initialData?: SetupInitialData;
  /** Called to initiate social connect — returns Ayrshare linking URL */
  onSocialConnect?: () => Promise<string | null>;
  /** Called to fetch current social account statuses */
  onFetchSocialAccounts?: () => Promise<SocialAccountStatus[]>;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-3xl px-5 py-[9px] text-[13px] font-semibold transition-all duration-200 ${
      active ? 'bg-brand-blue text-primary-foreground' : 'bg-card text-muted-foreground border border-border'
    }`}
  >
    {label}
  </button>
);

const DropdownButton = ({ value, placeholder, onClick }: { value: string; placeholder: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full h-[56px] rounded-2xl bg-card border border-border px-4 text-[14px] flex items-center justify-between"
  >
    <span className={value ? 'text-foreground' : 'text-muted-foreground'}>{value || placeholder}</span>
    <ChevronDown size={16} className="text-muted-foreground" />
  </button>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const BusinessSetupScreen = ({ onComplete, onSubmit, onUploadImage, onDeleteImage, initialData, onSocialConnect, onFetchSocialAccounts }: SetupProps) => {
  const act = initialData?.activity;
  const pref = initialData?.preference;

  // Parse opening hours from stored string
  const parseHours = (h?: string | null) => {
    if (!h) return { open: '9:00 AM', close: '11:00 PM', is24: false, varies: false };
    if (h === '24 hours') return { open: '9:00 AM', close: '11:00 PM', is24: true, varies: false };
    if (h === 'Varies') return { open: '9:00 AM', close: '11:00 PM', is24: false, varies: true };
    const parts = h.split(' – ');
    return { open: parts[0] || '9:00 AM', close: parts[1] || '11:00 PM', is24: false, varies: false };
  };
  const parsedHours = parseHours(act?.opening_hours);

  // Match industry to businessTypes emoji+label format
  const resolveIndustry = (industry?: string | null) => {
    if (!industry) return '';
    const match = businessTypes.find(b => b.label === industry || b.emoji + ' ' + b.label === industry);
    if (match) return match.emoji + ' ' + match.label;
    // custom type stored without emoji — treat as "Other"
    return '📦 Other';
  };
  const resolvedIndustry = resolveIndustry(act?.industry);
  const isOtherIndustry = resolvedIndustry === '📦 Other' && act?.industry && act.industry !== 'Other';

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1 — Business info
  const [bizName, setBizName] = useState(act?.business_name ?? '');
  const [bizType, setBizType] = useState(resolvedIndustry);
  const [otherBizType, setOtherBizType] = useState(isOtherIndustry ? act!.industry! : '');
  const [yearFounded, setYearFounded] = useState(act?.year_founded ?? '');
  const [bizSize, setBizSize] = useState(act?.business_size ?? '');
  const [country, setCountry] = useState(act?.country ?? 'Saudi Arabia');
  const [city, setCity] = useState(act?.location ?? '');
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [openTime, setOpenTime] = useState(parsedHours.open);
  const [closeTime, setCloseTime] = useState(parsedHours.close);
  const [is24Hours, setIs24Hours] = useState(parsedHours.is24);
  const [hoursVary, setHoursVary] = useState(parsedHours.varies);

  // Step 2 — Marketing
  const [targetAudience, setTargetAudience] = useState(act?.audience_target ?? '');
  const [usp, setUsp] = useState(act?.unique_selling_point ?? '');
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    pref?.social_media_goals?.split(', ').filter(Boolean) ?? []
  );
  const [colorPrimary, setColorPrimary] = useState(pref?.color_primary ?? '');
  const [colorSecondary, setColorSecondary] = useState(pref?.color_secondary ?? '');

  // Step 3 — Brand voice
  const [selectedTones, setSelectedTones] = useState<string[]>(
    pref?.tone_of_voice?.split(', ').filter(Boolean) ?? ['Professional']
  );
  const [selectedLangs, setSelectedLangs] = useState<string[]>(() => {
    if (!pref?.language_preference) return ['saudi'];
    const langs = pref.language_preference.split(', ').filter(Boolean);
    // If there was a custom language stored in "other", add the 'other' flag
    if (pref.other) return [...langs.filter(l => l !== pref.other), 'other'];
    return langs;
  });
  const [otherLang, setOtherLang] = useState(pref?.other ?? '');
  const [bizDescription, setBizDescription] = useState(pref?.business_description ?? '');
  const [uploadedImages, setUploadedImages] = useState<ImageMeta[]>(initialData?.images ?? []);
  const [isUploading, setIsUploading] = useState(false);

  // Step 4 — Social accounts
  const [socialAccounts, setSocialAccounts] = useState<SocialAccountStatus[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshingSocial, setIsRefreshingSocial] = useState(false);

  const refreshSocialAccounts = useCallback(async () => {
    if (!onFetchSocialAccounts) return;
    setIsRefreshingSocial(true);
    try {
      const accounts = await onFetchSocialAccounts();
      setSocialAccounts(accounts);
    } catch { /* ignore */ }
    finally { setIsRefreshingSocial(false); }
  }, [onFetchSocialAccounts]);

  // Load social accounts when reaching step 4
  useEffect(() => {
    if (step === 4) refreshSocialAccounts();
  }, [step, refreshSocialAccounts]);

  const handleSocialConnect = async () => {
    if (!onSocialConnect) return;
    setIsConnecting(true);
    try {
      const url = await onSocialConnect();
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
        toast.success('Complete the connection in the new tab, then click Refresh.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not start connection');
    } finally {
      setIsConnecting(false);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const toggleGoal = (g: string) => {
    if (selectedGoals.includes(g)) {
      setSelectedGoals(gs => gs.filter(x => x !== g));
    } else if (selectedGoals.length < 3) {
      setSelectedGoals(gs => [...gs, g]);
    } else {
      toast('Maximum 3 goals. Deselect one first.');
    }
  };

  const toggleTone = (t: string) => setSelectedTones(ts =>
    ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t]
  );

  const toggleLang = (id: string) => {
    if (selectedLangs.includes(id)) {
      setSelectedLangs(ls => ls.filter(x => x !== id));
    } else if (selectedLangs.length < 2) {
      setSelectedLangs(ls => [...ls, id]);
    } else {
      toast('Maximum 2 languages. Deselect one first.');
    }
  };

  const availableCities = countryCityData[country] || [];
  const filteredCountries = countries.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()));
  const filteredCities = availableCities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));

  // ─── File upload ──────────────────────────────────────────────────────────

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (uploadedImages.length + files.length > 3) {
      toast.error('Maximum 3 files allowed');
      return;
    }
    setIsUploading(true);
    try {
      for (const file of files) {
        if (onUploadImage) {
          const meta = await onUploadImage(file);
          setUploadedImages(imgs => [...imgs, meta]);
        } else {
          // local preview when no handler provided
          setUploadedImages(imgs => [...imgs, {
            id: Math.random().toString(36).slice(2),
            filename: file.name,
            mimetype: file.type,
            size: file.size,
            createdAt: new Date().toISOString(),
          }]);
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      if (onDeleteImage) await onDeleteImage(id);
      setUploadedImages(imgs => imgs.filter(i => i.id !== id));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not delete file');
    }
  };

  // ─── Step validation ──────────────────────────────────────────────────────

  const validateStep = (): boolean => {
    setStepError('');
    if (step === 1) {
      if (!bizName.trim()) { setStepError('Please enter your business name'); return false; }
      if (!bizType) { setStepError('Please select a business type'); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep(s => s + 1);
  };

  // ─── Build payload ────────────────────────────────────────────────────────

  const buildPayload = (): SetupPayload => {
    const openingHours = is24Hours
      ? '24 hours'
      : hoursVary
        ? 'Varies'
        : `${openTime} – ${closeTime}`;

    const langValue = selectedLangs.includes('other')
      ? [...selectedLangs.filter(l => l !== 'other'), otherLang].filter(Boolean).join(', ')
      : selectedLangs.join(', ');

    return {
      business_name:        bizName.trim(),
      industry:             bizType === '📦 Other' ? (otherBizType.trim() || 'Other') : bizType || undefined,
      country:              country || undefined,
      location:             city || undefined,
      opening_hours:        openingHours,
      business_size:        bizSize || undefined,
      year_founded:         yearFounded || undefined,
      audience_target:      targetAudience.trim() || undefined,
      unique_selling_point: usp.trim() || undefined,
      tone_of_voice:        selectedTones.join(', ') || undefined,
      language_preference:  langValue || undefined,
      business_description: bizDescription.trim() || undefined,
      social_media_goals:   selectedGoals.join(', ') || undefined,
      color_primary:        colorPrimary || undefined,
      color_secondary:      colorSecondary || undefined,
      other:                selectedLangs.includes('other') ? otherLang : undefined,
    };
  };

  // ─── Save setup (after step 3, before social connect) ────────────────────

  const handleSaveAndContinue = async () => {
    if (!validateStep()) return;
    setIsSubmitting(true);
    try {
      if (onSubmit) await onSubmit(buildPayload());
      setStep(4);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save setup');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Final launch (step 4) ───────────────────────────────────────────────

  const handleLaunch = () => {
    onComplete();
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const totalSteps = 4;
  const connectedCount = socialAccounts.filter(a => a.connected).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background px-6 pt-8 pb-10"
    >
      {/* Progress bar */}
      <div className="flex gap-2 mb-8">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map(i => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'gradient-hero' : 'bg-border'}`} />
        ))}
      </div>

      {/* ── Step 1: Business Info ──────────────────────────────────────────── */}
      {step === 1 && (
        <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">Tell us about your business</h2>

          <div className="mt-6 space-y-5">
            {/* Business name */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">Business Name</label>
              <input
                className="w-full h-[56px] rounded-2xl bg-card border border-border px-4 text-[14px] focus:border-primary focus:outline-none transition-colors"
                placeholder="Your business name"
                value={bizName}
                onChange={e => setBizName(e.target.value)}
              />
            </div>

            {/* Business type */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">Business Type</label>
              <div className="flex flex-wrap gap-2">
                {businessTypes.map(t => (
                  <Chip
                    key={t.label}
                    label={`${t.emoji} ${t.label}`}
                    active={bizType === t.label}
                    onClick={() => setBizType(t.label)}
                  />
                ))}
              </div>
              <AnimatePresence>
                {bizType === 'Other' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <input
                      className="w-full h-[48px] rounded-2xl bg-card border border-border px-4 text-[14px] focus:border-primary focus:outline-none mt-2"
                      placeholder="e.g., Catering service, Juice bar…"
                      value={otherBizType}
                      onChange={e => setOtherBizType(e.target.value)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Year founded */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">What year did you start?</label>
              <input
                type="number"
                className="w-full h-[56px] rounded-2xl bg-card border border-border px-4 text-[14px] focus:border-primary focus:outline-none"
                placeholder="2020"
                value={yearFounded}
                onChange={e => setYearFounded(e.target.value)}
              />
            </div>

            {/* Team size */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">How big is your team?</label>
              <div className="flex flex-wrap gap-2">
                {businessSizes.map(s => (
                  <Chip key={s} label={s} active={bizSize === s} onClick={() => setBizSize(s)} />
                ))}
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">Country</label>
              <DropdownButton value={country} placeholder="Select country" onClick={() => setCountryOpen(true)} />
            </div>

            {/* City */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">City</label>
              {country === 'Saudi Arabia' ? (
                <div className="flex flex-wrap gap-2">
                  {['Riyadh', 'Jeddah', 'Dammam', 'Makkah', 'Madinah', 'Other'].map(c => (
                    <Chip key={c} label={c} active={city === c} onClick={() => setCity(c)} />
                  ))}
                </div>
              ) : availableCities.length > 0 ? (
                <DropdownButton value={city} placeholder="Select city" onClick={() => setCityOpen(true)} />
              ) : (
                <input
                  className="w-full h-[56px] rounded-2xl bg-card border border-border px-4 text-[14px] focus:border-primary focus:outline-none"
                  placeholder="Enter your city"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                />
              )}
            </div>

            {/* Opening hours */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">Typical opening hours</label>
              {!is24Hours && !hoursVary && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <p className="text-[11px] text-muted-foreground mb-1">Opens at</p>
                    <select
                      className="w-full h-[48px] rounded-2xl bg-card border border-border px-3 text-[13px] focus:border-primary focus:outline-none"
                      value={openTime}
                      onChange={e => setOpenTime(e.target.value)}
                    >
                      {hours.map(h => <option key={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-muted-foreground mb-1">Closes at</p>
                    <select
                      className="w-full h-[48px] rounded-2xl bg-card border border-border px-3 text-[13px] focus:border-primary focus:outline-none"
                      value={closeTime}
                      onChange={e => setCloseTime(e.target.value)}
                    >
                      {hours.map(h => <option key={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              )}
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={is24Hours} onChange={() => { setIs24Hours(v => !v); setHoursVary(false); }} className="w-4 h-4 rounded accent-brand-blue" />
                  <span className="text-[13px] text-foreground">Open 24 hours</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hoursVary} onChange={() => { setHoursVary(v => !v); setIs24Hours(false); }} className="w-4 h-4 rounded accent-brand-blue" />
                  <span className="text-[13px] text-muted-foreground">Hours vary — I'll set this later</span>
                </label>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Step 2: Marketing ─────────────────────────────────────────────── */}
      {step === 2 && (
        <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">Tell us about your marketing</h2>
          <p className="text-[14px] text-muted-foreground mt-2">This helps our AI give you better recommendations</p>

          <div className="mt-6 space-y-5">
            {/* Target audience */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">Who are your customers?</label>
              <textarea
                className="w-full min-h-[72px] rounded-2xl bg-card border border-border p-4 text-[14px] focus:border-primary focus:outline-none resize-none"
                placeholder="e.g., Families in Riyadh, young professionals 22-35, tourists in downtown area…"
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
              />
            </div>

            {/* USP */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">What makes your business special?</label>
              <textarea
                className="w-full min-h-[72px] rounded-2xl bg-card border border-border p-4 text-[14px] focus:border-primary focus:outline-none resize-none"
                placeholder="e.g., Best garlic sauce in town, unique atmosphere, only halal organic ingredients…"
                value={usp}
                onChange={e => setUsp(e.target.value)}
              />
            </div>

            {/* Goals */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">What do you want to achieve?</label>
              <p className="text-[11px] text-muted-foreground mb-2">Select 1-3 goals</p>
              <div className="flex flex-wrap gap-2">
                {socialGoals.map(g => (
                  <Chip key={g} label={g} active={selectedGoals.includes(g)} onClick={() => toggleGoal(g)} />
                ))}
              </div>
            </div>

            {/* Brand colors */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">Your brand colors <span className="text-muted-foreground font-normal">(optional)</span></label>
              <div className="flex items-center gap-5">
                <div className="flex flex-col items-center gap-1.5">
                  <label className="relative cursor-pointer">
                    <div
                      className="w-12 h-12 rounded-full border-2 border-dashed border-border flex items-center justify-center"
                      style={colorPrimary ? { backgroundColor: colorPrimary, borderStyle: 'solid', borderColor: colorPrimary } : {}}
                    >
                      {!colorPrimary && <span className="text-[18px] text-muted-foreground">+</span>}
                    </div>
                    <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" value={colorPrimary || '#0020d4'} onChange={e => setColorPrimary(e.target.value)} />
                  </label>
                  <span className="text-[11px] text-muted-foreground">Primary</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <label className="relative cursor-pointer">
                    <div
                      className="w-12 h-12 rounded-full border-2 border-dashed border-border flex items-center justify-center"
                      style={colorSecondary ? { backgroundColor: colorSecondary, borderStyle: 'solid', borderColor: colorSecondary } : {}}
                    >
                      {!colorSecondary && <span className="text-[18px] text-muted-foreground">+</span>}
                    </div>
                    <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" value={colorSecondary || '#00c7f3'} onChange={e => setColorSecondary(e.target.value)} />
                  </label>
                  <span className="text-[11px] text-muted-foreground">Secondary</span>
                </div>
                {(colorPrimary || colorSecondary) && (
                  <button
                    type="button"
                    onClick={() => { setColorPrimary(''); setColorSecondary(''); }}
                    className="text-brand-blue text-[12px] font-medium ml-2"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">Skip — AI will use Speeda's default palette</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Step 3: Brand Voice ───────────────────────────────────────────── */}
      {step === 3 && (
        <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">How should Speeda talk for you?</h2>

          <div className="mt-6 space-y-5">
            {/* Tone */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">Tone</label>
              <div className="flex flex-wrap gap-2">
                {tones.map(t => (
                  <Chip key={t} label={t} active={selectedTones.includes(t)} onClick={() => toggleTone(t)} />
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-1 block">Language</label>
              <p className="text-[11px] text-muted-foreground mb-2">Select 1-2 languages for your content</p>
              <div className="flex flex-wrap gap-2">
                {langOptions.map(l => (
                  <Chip key={l.id} label={l.label} active={selectedLangs.includes(l.id)} onClick={() => toggleLang(l.id)} />
                ))}
              </div>
              <AnimatePresence>
                {selectedLangs.includes('other') && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <input
                      className="w-full h-[48px] rounded-2xl bg-card border border-border px-4 text-[14px] focus:border-primary focus:outline-none mt-2"
                      placeholder="e.g., French, Urdu, Turkish…"
                      value={otherLang}
                      onChange={e => setOtherLang(e.target.value)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Business description */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">Describe your business</label>
              <textarea
                className="w-full min-h-[100px] rounded-2xl bg-card border border-border p-4 text-[14px] focus:border-primary focus:outline-none resize-none"
                placeholder="e.g., Modern shawarma restaurant in Riyadh, family-friendly, best garlic sauce in town…"
                value={bizDescription}
                onChange={e => setBizDescription(e.target.value)}
              />
            </div>

            {/* Brand identity upload */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-1 block">Upload your brand identity</label>
              <p className="text-[12px] text-muted-foreground mb-2">Help our AI match your visual identity</p>

              {/* Uploaded files list */}
              {uploadedImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {uploadedImages.map(img => (
                    <div key={img.id} className="relative flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
                      <span className="text-[18px]">{img.mimetype === 'application/pdf' ? '📄' : '🖼️'}</span>
                      <span className="text-[12px] text-foreground font-medium max-w-[100px] truncate">{img.filename}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.id)}
                        className="ml-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {uploadedImages.length < 3 && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full border-2 border-dashed border-brand-blue/25 rounded-2xl h-[70px] flex items-center justify-center gap-2 hover:bg-muted/30 transition-colors disabled:opacity-60"
                  >
                    {isUploading ? (
                      <span className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload size={18} className="text-brand-blue" />
                    )}
                    <span className="text-[13px] font-bold text-brand-blue">
                      {isUploading ? 'Uploading…' : 'Upload logo, brand guidelines, or visual assets'}
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">Supports PNG, JPG, PDF — Max 10 MB · Optional ({uploadedImages.length}/3)</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Step 4: Connect Social Media ──────────────────────────────────── */}
      {step === 4 && (
        <motion.div key="step4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">Connect your social media</h2>
          <p className="text-[14px] text-muted-foreground mt-2">
            Link your accounts so Speeda can publish, track analytics, and manage engagement for you.
          </p>

          {/* Connect button */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleSocialConnect}
              disabled={isConnecting}
              className="w-full h-[56px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Opening connection…
                </>
              ) : (
                <>
                  <ExternalLink size={18} />
                  Connect Platforms via Ayrshare
                </>
              )}
            </button>
            <p className="text-[11px] text-muted-foreground mt-2 text-center">
              Opens a secure page where you can connect Instagram, TikTok, Facebook, and more.
            </p>
          </div>

          {/* Refresh button */}
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={refreshSocialAccounts}
              disabled={isRefreshingSocial}
              className="flex items-center gap-2 text-brand-blue text-[13px] font-semibold hover:underline disabled:opacity-60"
            >
              <RefreshCw size={14} className={isRefreshingSocial ? 'animate-spin' : ''} />
              {isRefreshingSocial ? 'Checking…' : 'Refresh account status'}
            </button>
          </div>

          {/* Platform status grid */}
          <div className="mt-6 space-y-2">
            {SOCIAL_PLATFORMS.map(platform => {
              const account = socialAccounts.find(a => a.platform === platform.id);
              const connected = account?.connected ?? false;
              return (
                <div
                  key={platform.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    connected ? 'border-green-accent/30 bg-green-accent/5' : 'border-border bg-card'
                  }`}
                >
                  <platform.Logo size={28} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-foreground">{platform.name}</p>
                    {connected && account?.username && (
                      <p className="text-[11px] text-muted-foreground truncate">@{account.username}</p>
                    )}
                  </div>
                  {connected ? (
                    <span className="text-[12px] font-semibold text-green-accent flex items-center gap-1">
                      <Check size={14} /> Connected
                    </span>
                  ) : (
                    <span className="text-[12px] text-muted-foreground">Not connected</span>
                  )}
                </div>
              );
            })}
          </div>

          {connectedCount > 0 && (
            <p className="mt-4 text-[13px] text-green-accent font-medium text-center">
              {connectedCount} platform{connectedCount > 1 ? 's' : ''} connected
            </p>
          )}
        </motion.div>
      )}

      {/* ── Error message ──────────────────────────────────────────────────── */}
      {stepError && (
        <p className="mt-4 text-[13px] text-destructive font-medium text-center">{stepError}</p>
      )}

      {/* ── Navigation buttons ─────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={step === 3 ? handleSaveAndContinue : step === totalSteps ? handleLaunch : handleNext}
          disabled={isSubmitting}
          className={`w-full rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press disabled:opacity-60 ${step === totalSteps ? 'h-[60px]' : 'h-[56px]'}`}
        >
          {step === 3 ? (
            isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving…
              </span>
            ) : 'Save & Connect Platforms'
          ) : step === totalSteps ? 'Launch My Marketing OS' : 'Next'}
        </button>

        {step === 2 && (
          <button type="button" onClick={() => setStep(3)} className="text-muted-foreground text-[13px] font-medium text-center">
            Skip for now
          </button>
        )}

        {step === 4 && (
          <button type="button" onClick={handleLaunch} className="text-muted-foreground text-[13px] font-medium text-center">
            Skip — I'll connect later
          </button>
        )}

        {step > 1 && (
          <button type="button" onClick={() => { setStep(s => s - 1); setStepError(''); }} className="text-brand-blue text-[13px] font-medium text-center">
            ← Back
          </button>
        )}
      </div>

      {/* ── Country Dropdown ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {countryOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCountryOpen(false)} className="fixed inset-0 bg-foreground/30 z-40" />
            <motion.div initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }} className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-xl max-w-[430px] mx-auto max-h-[60vh] flex flex-col">
              <div className="p-5 pb-3 flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-foreground">Select Country</h3>
                <button type="button" onClick={() => setCountryOpen(false)}><X size={20} className="text-muted-foreground" /></button>
              </div>
              <div className="px-5 py-2">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-[11px] text-muted-foreground" />
                  <input className="w-full h-[40px] rounded-xl bg-muted border-none pl-10 pr-4 text-[14px] focus:outline-none" placeholder="Search…" value={countrySearch} onChange={e => setCountrySearch(e.target.value)} autoFocus />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-5">
                {filteredCountries.map(c => (
                  <button key={c} type="button" onClick={() => { setCountry(c); setCity(''); setCountryOpen(false); setCountrySearch(''); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-start ${country === c ? 'bg-purple-soft' : 'hover:bg-muted'}`}>
                    <span className="text-[14px] font-medium text-foreground flex-1">{c}</span>
                    {country === c && <Check size={16} className="text-brand-blue" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── City Dropdown ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {cityOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCityOpen(false)} className="fixed inset-0 bg-foreground/30 z-40" />
            <motion.div initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }} className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-xl max-w-[430px] mx-auto max-h-[60vh] flex flex-col">
              <div className="p-5 pb-3 flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-foreground">Select City</h3>
                <button type="button" onClick={() => setCityOpen(false)}><X size={20} className="text-muted-foreground" /></button>
              </div>
              <div className="px-5 py-2">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-[11px] text-muted-foreground" />
                  <input className="w-full h-[40px] rounded-xl bg-muted border-none pl-10 pr-4 text-[14px] focus:outline-none" placeholder="Search…" value={citySearch} onChange={e => setCitySearch(e.target.value)} autoFocus />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-5">
                {filteredCities.map(c => (
                  <button key={c} type="button" onClick={() => { setCity(c); setCityOpen(false); setCitySearch(''); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-start ${city === c ? 'bg-purple-soft' : 'hover:bg-muted'}`}>
                    <span className="text-[14px] font-medium text-foreground flex-1">{c}</span>
                    {city === c && <Check size={16} className="text-brand-blue" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Search, X, Upload, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { SetupPayload, ImageMeta } from '../lib/api-client';
import { InstagramLogo, TikTokLogo, SnapchatLogo, FacebookLogo, XLogo, YouTubeLogo, LinkedInLogo, GoogleLogo, PinterestLogo, ThreadsLogo } from '../components/PlatformLogos';

// ─── Static data ─────────────────────────────────────────────────────────────
// `label` fields are the stable English labels persisted to the backend.
// `key` fields are the i18n slug used only for display.

const businessTypes: { emoji: string; key: string; label: string }[] = [
  { emoji: '🍽️', key: 'restaurant',   label: 'Restaurant' },
  { emoji: '☕',  key: 'cafe',         label: 'Café' },
  { emoji: '🍳', key: 'cloudKitchen', label: 'Cloud Kitchen' },
  { emoji: '🚚', key: 'foodTruck',    label: 'Food Truck' },
  { emoji: '🧁', key: 'bakery',       label: 'Bakery' },
  { emoji: '📦', key: 'other',        label: 'Other' },
];

const businessSizes: { key: string; label: string }[] = [
  { key: 'solo',   label: 'Just me' },
  { key: 'small',  label: '2-5' },
  { key: 'medium', label: '6-15' },
  { key: 'large',  label: '16-50' },
  { key: 'xl',     label: '50+' },
];

const socialGoals: { key: string; label: string }[] = [
  { key: 'moreFollowers',   label: 'More Followers' },
  { key: 'moreEngagement',  label: 'More Engagement' },
  { key: 'moreOrders',      label: 'More Orders' },
  { key: 'brandAwareness',  label: 'Brand Awareness' },
  { key: 'customerLoyalty', label: 'Customer Loyalty' },
  { key: 'hiring',          label: 'Hiring' },
];

const tones: { key: string; label: string }[] = [
  { key: 'professional', label: 'Professional' },
  { key: 'casual',       label: 'Casual' },
  { key: 'fun',          label: 'Fun' },
  { key: 'inspiring',    label: 'Inspiring' },
  { key: 'bold',         label: 'Bold' },
  { key: 'warm',         label: 'Warm' },
];

const langOptions: { id: string; labelKey: string }[] = [
  { id: 'saudi',   labelKey: 'saudi' },
  { id: 'arabic',  labelKey: 'arabic' },
  { id: 'english', labelKey: 'english' },
  { id: 'other',   labelKey: 'other' },
];

// Country/city data: stable slug keys for translation + the canonical English label
// used for persistence. The top-level country key must match what's stored in the DB.
const countryCityData: Record<string, { key: string; cities: { key: string; label: string }[] }> = {
  'Saudi Arabia': { key: 'sa', cities: [
    { key: 'riyadh', label: 'Riyadh' }, { key: 'jeddah', label: 'Jeddah' },
    { key: 'dammam', label: 'Dammam' }, { key: 'makkah', label: 'Makkah' },
    { key: 'madinah', label: 'Madinah' }, { key: 'khobar', label: 'Khobar' },
    { key: 'tabuk', label: 'Tabuk' }, { key: 'abha', label: 'Abha' },
    { key: 'jazan', label: 'Jazan' }, { key: 'hail', label: 'Hail' },
    { key: 'najran', label: 'Najran' }, { key: 'buraidah', label: 'Buraidah' },
    { key: 'alAhsa', label: 'Al Ahsa' }, { key: 'yanbu', label: 'Yanbu' },
    { key: 'taif', label: 'Taif' },
  ]},
  'UAE': { key: 'ae', cities: [
    { key: 'dubai', label: 'Dubai' }, { key: 'abuDhabi', label: 'Abu Dhabi' },
    { key: 'sharjah', label: 'Sharjah' }, { key: 'ajman', label: 'Ajman' },
    { key: 'rasAlKhaimah', label: 'Ras Al Khaimah' }, { key: 'fujairah', label: 'Fujairah' },
    { key: 'alAin', label: 'Al Ain' },
  ]},
  'Tunisia': { key: 'tn', cities: [
    { key: 'tunis', label: 'Tunis' }, { key: 'sfax', label: 'Sfax' },
    { key: 'sousse', label: 'Sousse' }, { key: 'kairouan', label: 'Kairouan' },
    { key: 'bizerte', label: 'Bizerte' }, { key: 'gabes', label: 'Gabes' },
    { key: 'ariana', label: 'Ariana' }, { key: 'monastir', label: 'Monastir' },
    { key: 'nabeul', label: 'Nabeul' },
  ]},
  'Bahrain': { key: 'bh', cities: [
    { key: 'manama', label: 'Manama' }, { key: 'muharraq', label: 'Muharraq' },
    { key: 'riffa', label: 'Riffa' }, { key: 'hamadTown', label: 'Hamad Town' },
    { key: 'isaTown', label: 'Isa Town' },
  ]},
  'Kuwait': { key: 'kw', cities: [
    { key: 'kuwaitCity', label: 'Kuwait City' }, { key: 'hawalli', label: 'Hawalli' },
    { key: 'salmiya', label: 'Salmiya' }, { key: 'farwaniya', label: 'Farwaniya' },
    { key: 'jahra', label: 'Jahra' },
  ]},
  'Qatar': { key: 'qa', cities: [
    { key: 'doha', label: 'Doha' }, { key: 'alWakrah', label: 'Al Wakrah' },
    { key: 'alKhor', label: 'Al Khor' }, { key: 'ummSalal', label: 'Umm Salal' },
    { key: 'alRayyan', label: 'Al Rayyan' },
  ]},
  'Egypt': { key: 'eg', cities: [
    { key: 'cairo', label: 'Cairo' }, { key: 'alexandria', label: 'Alexandria' },
    { key: 'giza', label: 'Giza' }, { key: 'sharmElSheikh', label: 'Sharm El Sheikh' },
    { key: 'hurghada', label: 'Hurghada' }, { key: 'luxor', label: 'Luxor' },
    { key: 'aswan', label: 'Aswan' },
  ]},
  'Morocco': { key: 'ma', cities: [
    { key: 'casablanca', label: 'Casablanca' }, { key: 'rabat', label: 'Rabat' },
    { key: 'marrakech', label: 'Marrakech' }, { key: 'fes', label: 'Fes' },
    { key: 'tangier', label: 'Tangier' }, { key: 'agadir', label: 'Agadir' },
  ]},
  'France': { key: 'fr', cities: [
    { key: 'paris', label: 'Paris' }, { key: 'lyon', label: 'Lyon' },
    { key: 'marseille', label: 'Marseille' }, { key: 'toulouse', label: 'Toulouse' },
    { key: 'nice', label: 'Nice' }, { key: 'bordeaux', label: 'Bordeaux' },
  ]},
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
  { id: 'instagram',       name: 'Instagram',     Logo: InstagramLogo },
  { id: 'tiktok',          name: 'TikTok',        Logo: TikTokLogo },
  { id: 'snapchat',        name: 'Snapchat',      Logo: SnapchatLogo },
  { id: 'facebook',        name: 'Facebook',      Logo: FacebookLogo },
  { id: 'x',               name: 'X',             Logo: XLogo },
  { id: 'youtube',         name: 'YouTube',       Logo: YouTubeLogo },
  { id: 'googlebusiness',  name: 'googleBiz',     Logo: GoogleLogo },
  { id: 'linkedin',        name: 'LinkedIn',      Logo: LinkedInLogo },
  { id: 'pinterest',       name: 'Pinterest',     Logo: PinterestLogo },
  { id: 'threads',         name: 'Threads',       Logo: ThreadsLogo },
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
  const { t } = useTranslation();
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

  // Match stored industry to a businessTypes entry; if custom, treat as "other".
  const resolveIndustryKey = (industry?: string | null): string => {
    if (!industry) return '';
    const match = businessTypes.find(b =>
      b.label === industry || `${b.emoji} ${b.label}` === industry
    );
    if (match) return match.key;
    return 'other';
  };
  const resolvedKey = resolveIndustryKey(act?.industry);
  const isCustomIndustry = resolvedKey === 'other' && !!act?.industry && act.industry !== 'Other';

  // Map stored city English label -> slug key (or keep raw if free-form)
  const resolveCityKey = (countryName?: string | null, cityLabel?: string | null): string => {
    if (!cityLabel) return '';
    const data = countryName ? countryCityData[countryName] : undefined;
    if (!data) return cityLabel;
    const match = data.cities.find(c => c.label === cityLabel);
    return match ? match.key : cityLabel;
  };

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1 — Business info
  const [bizName, setBizName] = useState(act?.business_name ?? '');
  // bizTypeKey holds the i18n slug (e.g., "restaurant"); empty string = none selected.
  const [bizTypeKey, setBizTypeKey] = useState<string>(resolvedKey);
  const [otherBizType, setOtherBizType] = useState(isCustomIndustry ? act!.industry! : '');
  const [yearFounded, setYearFounded] = useState(act?.year_founded ?? '');
  // bizSize stores the stable English label (e.g., "Just me"); display is translated.
  const [bizSize, setBizSize] = useState(act?.business_size ?? '');
  // country stores the English country name (persistence key + map lookup).
  const [country, setCountry] = useState(act?.country ?? 'Saudi Arabia');
  // city stores slug key OR Saudi special-case labels OR free-text for countries w/o list.
  const [city, setCity] = useState(resolveCityKey(act?.country, act?.location));
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [openTime, setOpenTime] = useState(parsedHours.open);
  const [closeTime, setCloseTime] = useState(parsedHours.close);
  const [is24Hours, setIs24Hours] = useState(parsedHours.is24);
  const [hoursVary, setHoursVary] = useState(parsedHours.varies);

  // Step 2 — Marketing — goals persist as English labels
  const [targetAudience, setTargetAudience] = useState(act?.audience_target ?? '');
  const [usp, setUsp] = useState(act?.unique_selling_point ?? '');
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    pref?.social_media_goals?.split(', ').filter(Boolean) ?? []
  );
  const [colorPrimary, setColorPrimary] = useState(pref?.color_primary ?? '');
  const [colorSecondary, setColorSecondary] = useState(pref?.color_secondary ?? '');

  // Step 3 — Brand voice — tones persist as English labels
  const [selectedTones, setSelectedTones] = useState<string[]>(
    pref?.tone_of_voice?.split(', ').filter(Boolean) ?? ['Professional']
  );
  const [selectedLangs, setSelectedLangs] = useState<string[]>(() => {
    if (!pref?.language_preference) return ['saudi'];
    const langs = pref.language_preference.split(', ').filter(Boolean);
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
        toast.success(t('setup.toasts.completeInNewTab'));
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('setup.toasts.connectStartFailed'));
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
      toast(t('setup.toasts.maxGoals'));
    }
  };

  const toggleTone = (tn: string) => setSelectedTones(ts =>
    ts.includes(tn) ? ts.filter(x => x !== tn) : [...ts, tn]
  );

  const toggleLang = (id: string) => {
    if (selectedLangs.includes(id)) {
      setSelectedLangs(ls => ls.filter(x => x !== id));
    } else if (selectedLangs.length < 2) {
      setSelectedLangs(ls => [...ls, id]);
    } else {
      toast(t('setup.toasts.maxLangs'));
    }
  };

  const countryData = countryCityData[country];
  const availableCities = countryData?.cities ?? [];
  const filteredCountries = countries.filter(c => {
    const localized = t(`setup.countries.${countryCityData[c].key}`);
    return c.toLowerCase().includes(countrySearch.toLowerCase())
      || localized.toLowerCase().includes(countrySearch.toLowerCase());
  });
  const filteredCities = availableCities.filter(c => {
    const localized = t(`setup.cities.${c.key}`);
    return c.label.toLowerCase().includes(citySearch.toLowerCase())
      || localized.toLowerCase().includes(citySearch.toLowerCase());
  });

  // Resolve the displayed city string (localized slug, raw Saudi chip label, or raw free text)
  const saudiQuickCities: { key: string; label: string }[] = [
    { key: 'riyadh', label: 'Riyadh' }, { key: 'jeddah', label: 'Jeddah' },
    { key: 'dammam', label: 'Dammam' }, { key: 'makkah', label: 'Makkah' },
    { key: 'madinah', label: 'Madinah' }, { key: 'other', label: 'Other' },
  ];

  const cityDisplay = (() => {
    if (!city) return '';
    const found = availableCities.find(c => c.key === city);
    if (found) return t(`setup.cities.${found.key}`);
    // Saudi quick-chip special case
    const sa = saudiQuickCities.find(c => c.key === city);
    if (sa) return t(`setup.cities.${sa.key}`);
    return city; // raw free-text
  })();

  // ─── File upload ──────────────────────────────────────────────────────────

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (uploadedImages.length + files.length > 3) {
      toast.error(t('setup.toasts.maxFiles'));
      return;
    }
    setIsUploading(true);
    try {
      for (const file of files) {
        if (onUploadImage) {
          const meta = await onUploadImage(file);
          setUploadedImages(imgs => [...imgs, meta]);
        } else {
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
      toast.error(err instanceof Error ? err.message : t('setup.toasts.uploadFailed'));
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
      toast.error(err instanceof Error ? err.message : t('setup.toasts.deleteFailed'));
    }
  };

  // ─── Step validation ──────────────────────────────────────────────────────

  const validateStep = (): boolean => {
    setStepError('');
    if (step === 1) {
      if (!bizName.trim()) { setStepError(t('setup.validation.nameRequired')); return false; }
      if (!bizTypeKey) { setStepError(t('setup.validation.typeRequired')); return false; }
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

    // Persist industry as English canonical label, with custom text when "Other"
    const bizTypeEntry = businessTypes.find(b => b.key === bizTypeKey);
    const industryValue = bizTypeKey === 'other'
      ? (otherBizType.trim() || 'Other')
      : bizTypeEntry
        ? bizTypeEntry.label
        : undefined;

    // Persist city as the English label where possible; for Saudi chips and free text, keep as-is
    let cityValue: string | undefined = city || undefined;
    const found = availableCities.find(c => c.key === city);
    if (found) cityValue = found.label;
    else {
      const sa = saudiQuickCities.find(c => c.key === city);
      if (sa) cityValue = sa.label;
    }

    return {
      business_name:        bizName.trim(),
      industry:             industryValue,
      country:              country || undefined,
      location:             cityValue,
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
      toast.error(err instanceof Error ? err.message : t('setup.toasts.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">{t('setup.steps.s1Title')}</h2>

          <div className="mt-6 space-y-5">
            {/* Business name */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">{t('setup.labels.businessName')}</label>
              <input
                className="w-full h-[56px] rounded-2xl bg-card border border-border px-4 text-[14px] focus:border-primary focus:outline-none transition-colors"
                placeholder={t('setup.labels.businessNamePlaceholder')}
                value={bizName}
                onChange={e => setBizName(e.target.value)}
              />
            </div>

            {/* Business type */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">{t('setup.labels.businessType')}</label>
              <div className="flex flex-wrap gap-2">
                {businessTypes.map(bt => (
                  <Chip
                    key={bt.key}
                    label={`${bt.emoji} ${t(`setup.businessTypes.${bt.key}`)}`}
                    active={bizTypeKey === bt.key}
                    onClick={() => setBizTypeKey(bt.key)}
                  />
                ))}
              </div>
              <AnimatePresence>
                {bizTypeKey === 'other' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <input
                      className="w-full h-[48px] rounded-2xl bg-card border border-border px-4 text-[14px] focus:border-primary focus:outline-none mt-2"
                      placeholder={t('setup.labels.otherBizTypePlaceholder')}
                      value={otherBizType}
                      onChange={e => setOtherBizType(e.target.value)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Year founded */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">{t('setup.labels.yearFounded')}</label>
              <input
                type="number"
                className="w-full h-[56px] rounded-2xl bg-card border border-border px-4 text-[14px] focus:border-primary focus:outline-none"
                placeholder={t('setup.labels.yearFoundedPlaceholder')}
                value={yearFounded}
                onChange={e => setYearFounded(e.target.value)}
              />
            </div>

            {/* Team size */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">{t('setup.labels.teamSize')}</label>
              <div className="flex flex-wrap gap-2">
                {businessSizes.map(s => (
                  <Chip
                    key={s.key}
                    label={t(`setup.sizes.${s.key}`)}
                    active={bizSize === s.label}
                    onClick={() => setBizSize(s.label)}
                  />
                ))}
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">{t('setup.labels.country')}</label>
              <DropdownButton
                value={country ? t(`setup.countries.${countryCityData[country].key}`) : ''}
                placeholder={t('setup.labels.selectCountry')}
                onClick={() => setCountryOpen(true)}
              />
            </div>

            {/* City */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">{t('setup.labels.city')}</label>
              {country === 'Saudi Arabia' ? (
                <div className="flex flex-wrap gap-2">
                  {saudiQuickCities.map(c => (
                    <Chip
                      key={c.key}
                      label={t(`setup.cities.${c.key}`)}
                      active={city === c.key}
                      onClick={() => setCity(c.key)}
                    />
                  ))}
                </div>
              ) : availableCities.length > 0 ? (
                <DropdownButton value={cityDisplay} placeholder={t('setup.labels.selectCity')} onClick={() => setCityOpen(true)} />
              ) : (
                <input
                  className="w-full h-[56px] rounded-2xl bg-card border border-border px-4 text-[14px] focus:border-primary focus:outline-none"
                  placeholder={t('setup.labels.enterCity')}
                  value={city}
                  onChange={e => setCity(e.target.value)}
                />
              )}
            </div>

            {/* Opening hours */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">{t('setup.labels.openingHours')}</label>
              {!is24Hours && !hoursVary && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <p className="text-[11px] text-muted-foreground mb-1">{t('setup.labels.opensAt')}</p>
                    <select
                      className="w-full h-[48px] rounded-2xl bg-card border border-border px-3 text-[13px] focus:border-primary focus:outline-none"
                      value={openTime}
                      onChange={e => setOpenTime(e.target.value)}
                    >
                      {hours.map(h => <option key={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-muted-foreground mb-1">{t('setup.labels.closesAt')}</p>
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
                  <span className="text-[13px] text-foreground">{t('setup.labels.open24')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hoursVary} onChange={() => { setHoursVary(v => !v); setIs24Hours(false); }} className="w-4 h-4 rounded accent-brand-blue" />
                  <span className="text-[13px] text-muted-foreground">{t('setup.labels.hoursVary')}</span>
                </label>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Step 2: Marketing ─────────────────────────────────────────────── */}
      {step === 2 && (
        <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">{t('setup.steps.s2Title')}</h2>
          <p className="text-[14px] text-muted-foreground mt-2">{t('setup.steps.s2Subtitle')}</p>

          <div className="mt-6 space-y-5">
            {/* Target audience */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">{t('setup.labels.targetAudience')}</label>
              <textarea
                className="w-full min-h-[72px] rounded-2xl bg-card border border-border p-4 text-[14px] focus:border-primary focus:outline-none resize-none"
                placeholder={t('setup.labels.targetAudiencePlaceholder')}
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
              />
            </div>

            {/* USP */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">{t('setup.labels.usp')}</label>
              <textarea
                className="w-full min-h-[72px] rounded-2xl bg-card border border-border p-4 text-[14px] focus:border-primary focus:outline-none resize-none"
                placeholder={t('setup.labels.uspPlaceholder')}
                value={usp}
                onChange={e => setUsp(e.target.value)}
              />
            </div>

            {/* Goals */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">{t('setup.labels.goals')}</label>
              <p className="text-[11px] text-muted-foreground mb-2">{t('setup.labels.goalsHint')}</p>
              <div className="flex flex-wrap gap-2">
                {socialGoals.map(g => (
                  <Chip
                    key={g.key}
                    label={t(`setup.goals.${g.key}`)}
                    active={selectedGoals.includes(g.label)}
                    onClick={() => toggleGoal(g.label)}
                  />
                ))}
              </div>
            </div>

            {/* Brand colors */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">
                {t('setup.labels.brandColors')} <span className="text-muted-foreground font-normal">{t('setup.labels.optional')}</span>
              </label>
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
                  <span className="text-[11px] text-muted-foreground">{t('setup.labels.primary')}</span>
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
                  <span className="text-[11px] text-muted-foreground">{t('setup.labels.secondary')}</span>
                </div>
                {(colorPrimary || colorSecondary) && (
                  <button
                    type="button"
                    onClick={() => { setColorPrimary(''); setColorSecondary(''); }}
                    className="text-brand-blue text-[12px] font-medium ms-2"
                  >
                    {t('setup.labels.clear')}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">{t('setup.labels.defaultPaletteHint')}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Step 3: Brand Voice ───────────────────────────────────────────── */}
      {step === 3 && (
        <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">{t('setup.steps.s3Title')}</h2>

          <div className="mt-6 space-y-5">
            {/* Tone */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">{t('setup.labels.tone')}</label>
              <div className="flex flex-wrap gap-2">
                {tones.map(tn => (
                  <Chip
                    key={tn.key}
                    label={t(`setup.tones.${tn.key}`)}
                    active={selectedTones.includes(tn.label)}
                    onClick={() => toggleTone(tn.label)}
                  />
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-1 block">{t('setup.labels.language')}</label>
              <p className="text-[11px] text-muted-foreground mb-2">{t('setup.labels.languageHint')}</p>
              <div className="flex flex-wrap gap-2">
                {langOptions.map(l => (
                  <Chip
                    key={l.id}
                    label={t(`setup.langs.${l.labelKey}`)}
                    active={selectedLangs.includes(l.id)}
                    onClick={() => toggleLang(l.id)}
                  />
                ))}
              </div>
              <AnimatePresence>
                {selectedLangs.includes('other') && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <input
                      className="w-full h-[48px] rounded-2xl bg-card border border-border px-4 text-[14px] focus:border-primary focus:outline-none mt-2"
                      placeholder={t('setup.labels.otherLangPlaceholder')}
                      value={otherLang}
                      onChange={e => setOtherLang(e.target.value)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Business description */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-2 block">{t('setup.labels.describeBusiness')}</label>
              <textarea
                className="w-full min-h-[100px] rounded-2xl bg-card border border-border p-4 text-[14px] focus:border-primary focus:outline-none resize-none"
                placeholder={t('setup.labels.describePlaceholder')}
                value={bizDescription}
                onChange={e => setBizDescription(e.target.value)}
              />
            </div>

            {/* Brand identity upload */}
            <div>
              <label className="text-[14px] font-semibold text-foreground mb-1 block">{t('setup.labels.uploadBrand')}</label>
              <p className="text-[12px] text-muted-foreground mb-2">{t('setup.labels.uploadBrandHint')}</p>

              {uploadedImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {uploadedImages.map(img => (
                    <div key={img.id} className="relative flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
                      <span className="text-[18px]">{img.mimetype === 'application/pdf' ? '📄' : '🖼️'}</span>
                      <span className="text-[12px] text-foreground font-medium max-w-[100px] truncate">{img.filename}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.id)}
                        className="ms-1 text-muted-foreground hover:text-destructive"
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
                      {isUploading ? t('setup.labels.uploading') : t('setup.labels.uploadCta')}
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
              <p className="text-[11px] text-muted-foreground mt-1">
                {t('setup.labels.uploadSupport', { count: uploadedImages.length })}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Step 4: Connect Social Media ──────────────────────────────────── */}
      {step === 4 && (
        <motion.div key="step4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">{t('setup.steps.s4Title')}</h2>
          <p className="text-[14px] text-muted-foreground mt-2">{t('setup.steps.s4Subtitle')}</p>

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
                  {t('setup.social.opening')}
                </>
              ) : (
                <>
                  <ExternalLink size={18} />
                  {t('setup.social.connectCta')}
                </>
              )}
            </button>
            <p className="text-[11px] text-muted-foreground mt-2 text-center">
              {t('setup.social.connectHint')}
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
              {isRefreshingSocial ? t('setup.social.checking') : t('setup.social.refresh')}
            </button>
          </div>

          {/* Platform status grid */}
          <div className="mt-6 space-y-2">
            {SOCIAL_PLATFORMS.map(platform => {
              const account = socialAccounts.find(a => a.platform === platform.id);
              const connected = account?.connected ?? false;
              // Only the Google Business label is translatable; others are brand names
              const displayName = platform.id === 'googlebusiness'
                ? t('setup.social.googleBiz')
                : platform.name;
              return (
                <div
                  key={platform.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    connected ? 'border-green-accent/30 bg-green-accent/5' : 'border-border bg-card'
                  }`}
                >
                  <platform.Logo size={28} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-foreground">{displayName}</p>
                    {connected && account?.username && (
                      <p className="text-[11px] text-muted-foreground truncate">@{account.username}</p>
                    )}
                  </div>
                  {connected ? (
                    <span className="text-[12px] font-semibold text-green-accent flex items-center gap-1">
                      <Check size={14} /> {t('setup.social.connected')}
                    </span>
                  ) : (
                    <span className="text-[12px] text-muted-foreground">{t('setup.social.notConnected')}</span>
                  )}
                </div>
              );
            })}
          </div>

          {connectedCount > 0 && (
            <p className="mt-4 text-[13px] text-green-accent font-medium text-center">
              {connectedCount === 1
                ? t('setup.social.oneConnected', { count: connectedCount })
                : t('setup.social.manyConnected', { count: connectedCount })}
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
                {t('setup.buttons.saving')}
              </span>
            ) : t('setup.buttons.saveAndConnect')
          ) : step === totalSteps ? t('setup.buttons.launch') : t('setup.buttons.next')}
        </button>

        {step === 2 && (
          <button type="button" onClick={() => setStep(3)} className="text-muted-foreground text-[13px] font-medium text-center">
            {t('setup.buttons.skipForNow')}
          </button>
        )}

        {step === 4 && (
          <button type="button" onClick={handleLaunch} className="text-muted-foreground text-[13px] font-medium text-center">
            {t('setup.buttons.skipConnectLater')}
          </button>
        )}

        {step > 1 && (
          <button type="button" onClick={() => { setStep(s => s - 1); setStepError(''); }} className="text-brand-blue text-[13px] font-medium text-center">
            {t('setup.buttons.back')}
          </button>
        )}
      </div>

      {/* ── Country Dropdown ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {countryOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCountryOpen(false)} className="fixed inset-0 bg-foreground/30 z-40" />
            <motion.div initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }} className="fixed bottom-0 start-0 end-0 z-50 bg-card rounded-t-3xl shadow-xl max-w-[430px] mx-auto max-h-[60vh] flex flex-col">
              <div className="p-5 pb-3 flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-foreground">{t('setup.dropdown.selectCountry')}</h3>
                <button type="button" onClick={() => setCountryOpen(false)}><X size={20} className="text-muted-foreground" /></button>
              </div>
              <div className="px-5 py-2">
                <div className="relative">
                  <Search size={16} className="absolute start-3 top-[11px] text-muted-foreground" />
                  <input className="w-full h-[40px] rounded-xl bg-muted border-none ps-10 pe-4 text-[14px] focus:outline-none" placeholder={t('setup.dropdown.search')} value={countrySearch} onChange={e => setCountrySearch(e.target.value)} autoFocus />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-5">
                {filteredCountries.map(c => (
                  <button key={c} type="button" onClick={() => { setCountry(c); setCity(''); setCountryOpen(false); setCountrySearch(''); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-start ${country === c ? 'bg-purple-soft' : 'hover:bg-muted'}`}>
                    <span className="text-[14px] font-medium text-foreground flex-1">{t(`setup.countries.${countryCityData[c].key}`)}</span>
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
            <motion.div initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }} className="fixed bottom-0 start-0 end-0 z-50 bg-card rounded-t-3xl shadow-xl max-w-[430px] mx-auto max-h-[60vh] flex flex-col">
              <div className="p-5 pb-3 flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-foreground">{t('setup.dropdown.selectCity')}</h3>
                <button type="button" onClick={() => setCityOpen(false)}><X size={20} className="text-muted-foreground" /></button>
              </div>
              <div className="px-5 py-2">
                <div className="relative">
                  <Search size={16} className="absolute start-3 top-[11px] text-muted-foreground" />
                  <input className="w-full h-[40px] rounded-xl bg-muted border-none ps-10 pe-4 text-[14px] focus:outline-none" placeholder={t('setup.dropdown.search')} value={citySearch} onChange={e => setCitySearch(e.target.value)} autoFocus />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-5">
                {filteredCities.map(c => (
                  <button key={c.key} type="button" onClick={() => { setCity(c.key); setCityOpen(false); setCitySearch(''); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-start ${city === c.key ? 'bg-purple-soft' : 'hover:bg-muted'}`}>
                    <span className="text-[14px] font-medium text-foreground flex-1">{t(`setup.cities.${c.key}`)}</span>
                    {city === c.key && <Check size={16} className="text-brand-blue" />}
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

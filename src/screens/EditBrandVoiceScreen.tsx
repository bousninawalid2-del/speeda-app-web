import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, X, Upload, Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export interface BrandVoiceInitialData {
  tone_of_voice?: string | null;
  language_preference?: string | null;
  business_description?: string | null;
  hashtags?: string | null;
  emojis?: string | null;
  other?: string | null;
}

interface EditBrandVoiceScreenProps {
  onBack: () => void;
  initialData?: BrandVoiceInitialData;
  isLoading?: boolean;
  onSave?: (data: {
    tone_of_voice?: string;
    language_preference?: string;
    business_description?: string;
    hashtags?: string;
    other?: string;
  }) => Promise<void>;
}

const toneOptions = ['Professional', 'Casual', 'Fun', 'Urgent', 'Inspirational', 'Bold', 'Warm'];
const langOptions = [
  { id: 'saudi', label: '\u{1F1F8}\u{1F1E6} Saudi', name: 'Saudi' },
  { id: 'arabic', label: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629 Arabic', name: 'Arabic' },
  { id: 'english', label: '\u{1F1EC}\u{1F1E7} English', name: 'English' },
  { id: 'other', label: 'Other (Choose)', name: 'Other' },
];

export const EditBrandVoiceScreen = ({ onBack, initialData, isLoading, onSave }: EditBrandVoiceScreenProps) => {
  const { t } = useTranslation();
  const [tones, setTones] = useState<string[]>(
    initialData?.tone_of_voice?.split(', ').filter(Boolean) ?? ['Professional', 'Fun']
  );
  const [langs, setLangs] = useState<string[]>(() => {
    if (!initialData?.language_preference) return ['saudi', 'english'];
    const parsed = initialData.language_preference.split(', ').filter(Boolean);
    if (initialData.other) return [...parsed.filter(l => l !== initialData.other), 'other'];
    return parsed;
  });
  const [keywords, setKeywords] = useState<string[]>(
    initialData?.hashtags?.split(', ').filter(Boolean) ?? ['shawarma', 'brunch', 'Riyadh', 'family']
  );
  const [newKeyword, setNewKeyword] = useState('');
  const [brandFiles, setBrandFiles] = useState<string[]>([]);
  const [otherLang, setOtherLang] = useState(initialData?.other ?? '');
  const [bizDescription, setBizDescription] = useState(
    initialData?.business_description ?? 'Modern shawarma restaurant in Riyadh, family-friendly, best garlic sauce in town'
  );
  const [businessPhotos, setBusinessPhotos] = useState<{ name: string; desc: string }[]>([
    { name: 'kitchen_1.jpg', desc: 'Kitchen interior' },
    { name: 'shawarma_plate.jpg', desc: 'Signature shawarma' },
    { name: 'restaurant_front.jpg', desc: '' },
  ]);
  const [saving, setSaving] = useState(false);

  // Sync when live data arrives
  useEffect(() => {
    if (!initialData) return;
    if (initialData.tone_of_voice) setTones(initialData.tone_of_voice.split(', ').filter(Boolean));
    if (initialData.language_preference) {
      const parsed = initialData.language_preference.split(', ').filter(Boolean);
      if (initialData.other) setLangs([...parsed.filter(l => l !== initialData.other), 'other']);
      else setLangs(parsed);
    }
    if (initialData.hashtags) setKeywords(initialData.hashtags.split(', ').filter(Boolean));
    if (initialData.business_description) setBizDescription(initialData.business_description);
    if (initialData.other) setOtherLang(initialData.other);
  }, [initialData]);

  const toggleTone = (t: string) => setTones(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t]);

  const toggleLang = (id: string) => {
    if (langs.includes(id)) {
      setLangs(ls => ls.filter(x => x !== id));
    } else if (langs.length < 2) {
      setLangs(ls => [...ls, id]);
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords(ks => [...ks, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const addBrandFile = () => {
    if (brandFiles.length < 3) setBrandFiles(f => [...f, `brand_asset_${f.length + 1}.png`]);
  };

  const addBusinessPhoto = () => {
    if (businessPhotos.length < 20) {
      setBusinessPhotos(p => [...p, { name: `photo_${p.length + 1}.jpg`, desc: '' }]);
    }
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      const langValue = langs.includes('other')
        ? [...langs.filter(l => l !== 'other'), otherLang].filter(Boolean).join(', ')
        : langs.join(', ');

      await onSave({
        tone_of_voice: tones.join(', ') || undefined,
        language_preference: langValue || undefined,
        business_description: bizDescription.trim() || undefined,
        hashtags: keywords.join(', ') || undefined,
        other: langs.includes('other') ? otherLang : undefined,
      });
      toast.success('Brand voice saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-8">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
          <h1 className="text-[20px] font-bold text-foreground">Edit Brand Voice</h1>
        </div>

        {/* Tone */}
        <div className="mb-6">
          <label className="text-[14px] font-bold text-foreground mb-2 block">{t('settings.tone')}</label>
          <div className="flex flex-wrap gap-2">
            {toneOptions.map(to => (
              <button key={to} onClick={() => toggleTone(to)} className={`rounded-3xl px-5 py-[9px] text-[13px] font-semibold transition-all ${tones.includes(to) ? 'bg-brand-blue text-primary-foreground' : 'bg-card text-muted-foreground border border-border'}`}>{to}</button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="mb-6">
          <label className="text-[14px] font-bold text-foreground mb-1 block">{t('settings.language')}</label>
          <p className="text-[12px] text-muted-foreground mb-2">Select 1-2 languages for your content</p>
          <div className="flex flex-wrap gap-2">
            {langOptions.map(l => (
              <button key={l.id} onClick={() => toggleLang(l.id)} className={`rounded-3xl px-5 py-[9px] text-[13px] font-semibold transition-all ${langs.includes(l.id) ? 'bg-brand-blue text-primary-foreground' : 'bg-card text-muted-foreground border border-border'}`}>{l.label}</button>
            ))}
          </div>
          {langs.includes('other') && (
            <input className="w-full h-[48px] rounded-2xl bg-card border border-border px-4 text-[14px] mt-2 focus:border-primary focus:outline-none" placeholder="e.g., French, Urdu, Turkish..." value={otherLang} onChange={e => setOtherLang(e.target.value)} />
          )}
        </div>

        {/* Brand Description */}
        <div className="mb-6">
          <label className="text-[14px] font-bold text-foreground mb-2 block">Brand Description</label>
          <textarea className="w-full min-h-[100px] rounded-2xl bg-card border border-border p-4 text-[14px] focus:border-primary focus:outline-none resize-none" value={bizDescription} onChange={e => setBizDescription(e.target.value)} />
        </div>

        {/* Brand Identity Assets */}
        <div className="mb-6">
          <label className="text-[14px] font-bold text-foreground mb-2 block">Brand Identity</label>
          {brandFiles.length > 0 && (
            <div className="flex gap-2 mb-2">
              {brandFiles.map((f, i) => (
                <div key={i} className="relative">
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-[20px]">{'\u{1F4CE}'}</div>
                  <button onClick={() => setBrandFiles(bf => bf.filter((_, j) => j !== i))} className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-red-accent text-primary-foreground flex items-center justify-center"><X size={10} /></button>
                  <p className="text-[9px] text-muted-foreground text-center mt-0.5 truncate w-16">{f}</p>
                </div>
              ))}
            </div>
          )}
          {brandFiles.length < 3 && (
            <button onClick={addBrandFile} className="w-full border-2 border-dashed border-brand-blue/25 rounded-2xl h-[70px] flex items-center justify-center gap-2 hover:bg-muted/30 transition-colors">
              <Upload size={18} className="text-brand-blue" />
              <span className="text-[13px] font-bold text-brand-blue">Upload logo, brand guidelines, or visual assets</span>
            </button>
          )}
          <p className="text-[11px] text-muted-foreground mt-1">Supports PNG, JPG, PDF — Max 10MB</p>
        </div>

        {/* Business Photos */}
        <div className="mb-6">
          <label className="text-[14px] font-bold text-foreground mb-1 block">Business Photos</label>
          <p className="text-[12px] text-muted-foreground mb-3">Photos AI can use when creating your content</p>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-3">
            {businessPhotos.map((photo, i) => (
              <div key={i} className="relative">
                <div className="w-full aspect-square rounded-xl bg-muted flex items-center justify-center">
                  <Camera size={20} className="text-muted-foreground" />
                </div>
                <button onClick={() => setBusinessPhotos(bp => bp.filter((_, j) => j !== i))} className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-red-accent text-primary-foreground flex items-center justify-center z-10">
                  <X size={10} />
                </button>
                {photo.desc && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{photo.desc}</p>}
              </div>
            ))}
          </div>
          {businessPhotos.length < 20 && (
            <button onClick={addBusinessPhoto} className="w-full border-2 border-dashed border-brand-blue/25 rounded-2xl h-[56px] flex items-center justify-center gap-2 hover:bg-muted/30 transition-colors">
              <Camera size={16} className="text-brand-blue" />
              <span className="text-[13px] font-bold text-brand-blue">+ Add Photos</span>
            </button>
          )}
          <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG, WebP — Max 20 photos</p>
        </div>

        {/* Keywords */}
        <div className="mb-6">
          <label className="text-[14px] font-bold text-foreground mb-2 block">{t('settings.keywords')}</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {keywords.map(k => (
              <span key={k} className="flex items-center gap-1 px-3 py-1.5 rounded-3xl bg-muted text-foreground text-[12px] font-medium">
                {k}
                <button onClick={() => setKeywords(ks => ks.filter(x => x !== k))}><X size={12} className="text-muted-foreground" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="flex-1 h-[44px] rounded-2xl bg-card border border-border px-4 text-[13px] focus:border-primary focus:outline-none" placeholder="Add keyword..." value={newKeyword} onChange={e => setNewKeyword(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKeyword()} />
            <button onClick={addKeyword} className="h-[44px] px-4 rounded-2xl bg-brand-blue text-primary-foreground text-[13px] font-bold">Add</button>
          </div>
        </div>

        {/* Sample Content */}
        <div className="mb-6">
          <label className="text-[14px] font-bold text-foreground mb-2 block">Sample Content</label>
          <textarea className="w-full min-h-[80px] rounded-2xl bg-card border border-border p-4 text-[14px] focus:border-primary focus:outline-none resize-none" placeholder="Paste an example of content that represents your brand voice" />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || isLoading || !onSave}
          className="w-full h-[56px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          Save Brand Voice
        </button>
      </div>
    </motion.div>
  );
};

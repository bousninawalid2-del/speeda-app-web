import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Camera, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export interface ProfileInitialData {
  name:          string | null;
  email:         string;
  phone:         string | null;
  isVerified:    boolean;
  businessName?: string | null;
  country?:      string | null;
  city?:         string | null;
  industry?:     string | null;
}

interface ProfileScreenProps {
  onBack:        () => void;
  onNavigate?:   (screen: string) => void;
  initialData?:  ProfileInitialData;
  isLoading?:    boolean;
  onSave?:       (data: {
    name: string;
    phone: string;
    businessName: string;
    city: string;
    industry: string;
  }) => Promise<void>;
}

export const ProfileScreen = ({ onBack, onNavigate, initialData, isLoading, onSave }: ProfileScreenProps) => {
  const { t } = useTranslation();
  type FormState = {
    businessName: string;
    ownerName: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    businessType: string;
  };
  const [form, setForm] = useState({
    businessName: initialData?.businessName ?? "Malek's Kitchen",
    ownerName:    initialData?.name         ?? 'Malek Zlitni',
    email:        initialData?.email        ?? 'malek@speeda.ai',
    phone:        initialData?.phone        ?? '+966 53 880 4665',
    country:      initialData?.country      ?? 'Saudi Arabia',
    city:         initialData?.city         ?? 'Riyadh',
    businessType: initialData?.industry     ?? 'Restaurant',
  });
  const [saving, setSaving] = useState(false);
  const [hasLogo, setHasLogo] = useState(false);

  // Sync when live data arrives
  useEffect(() => {
    if (!initialData) return;
    setForm(prev => ({
      ...prev,
      businessName: initialData.businessName ?? prev.businessName,
      ownerName:    initialData.name         ?? prev.ownerName,
      email:        initialData.email        ?? prev.email,
      phone:        initialData.phone        ?? prev.phone,
      country:      initialData.country      ?? prev.country,
      city:         initialData.city         ?? prev.city,
      businessType: initialData.industry     ?? prev.businessType,
    }));
  }, [initialData]);

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave({
        name: form.ownerName,
        phone: form.phone,
        businessName: form.businessName,
        city: form.city,
        industry: form.businessType,
      });
      toast.success('Profile saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // User status
  const accountStatus: 'active' | 'pending' | 'unverified' =
    initialData?.isVerified === false ? 'unverified' : 'active';
  const accountRole = 'Client';

  const inputClass = "w-full h-[50px] rounded-2xl bg-card border border-border px-4 text-[14px] text-foreground focus:border-primary focus:outline-none";

  const statusConfig = {
    active: { label: 'Active ✓', bg: 'bg-green-soft', text: 'text-green-accent' },
    pending: { label: 'Pending — Subscribe to activate', bg: 'bg-orange-soft', text: 'text-orange-accent' },
    unverified: { label: 'Unverified — Check your email', bg: 'bg-red-soft', text: 'text-red-accent' },
  };

  const status = statusConfig[accountStatus as keyof typeof statusConfig];

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-8">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
          <h1 className="text-[20px] font-bold text-foreground">{t('settings.profile')}</h1>
        </div>

        {/* Business Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <button onClick={() => setHasLogo(true)} className="relative">
              {hasLogo ? (
                <div className="w-20 h-20 rounded-full bg-brand-blue flex items-center justify-center overflow-hidden">
                  <span className="text-[28px] font-bold text-primary-foreground">M</span>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-brand-blue flex items-center justify-center relative group">
                  <span className="text-[28px] font-bold text-primary-foreground">M</span>
                  <div className="absolute inset-0 rounded-full bg-foreground/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload size={18} className="text-primary-foreground" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 end-0 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center">
                <Camera size={14} className="text-muted-foreground" />
              </div>
            </button>
          </div>
          <p className="text-[12px] text-muted-foreground mt-2 text-center max-w-[280px]">
            Your logo appears in AI-generated content, reports, and customer communications
          </p>
          {hasLogo && <button className="text-brand-blue text-[12px] font-semibold mt-1">Change Logo</button>}
        </div>

        {/* Account Status & Role */}
        <div className="bg-card rounded-2xl border border-border-light p-4 mb-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-foreground">Account Status</span>
            <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${status.bg} ${status.text}`}>
              {status.label}
            </span>
          </div>
          {(accountStatus as string) === 'pending' && (
            <button onClick={() => onNavigate?.('subscription')} className="text-brand-blue text-[12px] font-semibold">
              Activate your account →
            </button>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-foreground">Role</span>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-purple-soft text-purple">
              {accountRole}
            </span>
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          {[
            { label: t('settings.businessName'), key: 'businessName' },
            { label: 'Owner Name', key: 'ownerName' },
            { label: t('settings.email'), key: 'email' },
            { label: t('settings.phone'), key: 'phone' },
          ].map((field: { label: string; key: keyof FormState }) => (
            <div key={field.key}>
              <label className="text-[13px] font-semibold text-foreground mb-1.5 block">{field.label}</label>
              <input
                className={inputClass}
                value={form[field.key]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
              />
            </div>
          ))}

          <div>
            <label className="text-[13px] font-semibold text-foreground mb-1.5 block">Country</label>
            <select className={inputClass} value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}>
              {['Saudi Arabia', 'UAE', 'Bahrain', 'Kuwait', 'Qatar', 'Egypt', 'Tunisia', 'Morocco', 'France'].map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[13px] font-semibold text-foreground mb-1.5 block">City</label>
            <select className={inputClass} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}>
              {['Riyadh', 'Jeddah', 'Dammam', 'Makkah', 'Madinah'].map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[13px] font-semibold text-foreground mb-1.5 block">Business Type</label>
            <input className={inputClass} value={form.businessType} readOnly />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || isLoading || !onSave}
          className="w-full h-[56px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press mt-8 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {t('common.save')} Changes
        </button>
      </div>
    </motion.div>
  );
};

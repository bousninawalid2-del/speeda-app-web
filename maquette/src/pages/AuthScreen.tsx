import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, Lock, Eye, EyeOff, ChevronLeft, ChevronDown, Search, X } from 'lucide-react';
import { SpeedaLogo, GoogleLogo, AppleLogo } from '../components/PlatformLogos';
import { useTranslation } from 'react-i18next';

interface AuthScreenProps {
  onComplete: (mode?: string) => void;
  onForgotPassword?: () => void;
}

type AuthMode = 'signup' | 'signin' | 'forgot';

const allCountries = [
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: '+20', flag: '🇪🇬', name: 'Egypt' },
  { code: '+216', flag: '🇹🇳', name: 'Tunisia' },
  { code: '+212', flag: '🇲🇦', name: 'Morocco' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+90', flag: '🇹🇷', name: 'Turkey' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+34', flag: '🇪🇸', name: 'Spain' },
  { code: '+39', flag: '🇮🇹', name: 'Italy' },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+62', flag: '🇮🇩', name: 'Indonesia' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+82', flag: '🇰🇷', name: 'South Korea' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+64', flag: '🇳🇿', name: 'New Zealand' },
  { code: '+31', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+46', flag: '🇸🇪', name: 'Sweden' },
  { code: '+47', flag: '🇳🇴', name: 'Norway' },
  { code: '+962', flag: '🇯🇴', name: 'Jordan' },
  { code: '+961', flag: '🇱🇧', name: 'Lebanon' },
  { code: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: '+967', flag: '🇾🇪', name: 'Yemen' },
  { code: '+964', flag: '🇮🇶', name: 'Iraq' },
  { code: '+213', flag: '🇩🇿', name: 'Algeria' },
  { code: '+218', flag: '🇱🇾', name: 'Libya' },
  { code: '+249', flag: '🇸🇩', name: 'Sudan' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
];

export const AuthScreen = ({ onComplete, onForgotPassword }: AuthScreenProps) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('signup');
  const [showPass, setShowPass] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(allCountries[0]);
  const [countrySearch, setCountrySearch] = useState('');

  const filtered = allCountries.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.includes(countrySearch)
  );

  const inputClass = "w-full h-[56px] rounded-2xl bg-card border border-border pl-12 pr-4 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors";

  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleSubmit = () => {
    if (mode === 'signup') {
      onComplete('signup');
    } else if (mode === 'signin') {
      onComplete('signin');
    } else if (mode === 'forgot') {
      onForgotPassword?.();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background px-6 pt-12 pb-8"
    >
      {mode === 'forgot' && (
        <button onClick={() => setMode('signin')} className="flex items-center gap-1 text-brand-blue text-[14px] font-medium mb-4">
          <ChevronLeft size={18} /> {t('auth.backToSignIn')}
        </button>
      )}

      <div className="flex justify-center mb-6">
        <SpeedaLogo size={120} />
      </div>

      <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-center">
        {mode === 'signup' ? t('auth.createAccountTitle') : mode === 'signin' ? t('auth.welcomeBackTitle') : t('auth.resetPasswordTitle')}
      </h1>
      <p className="text-[14px] text-muted-foreground text-center mt-2">
        {mode === 'signup' ? t('auth.signupSubtitle') : mode === 'signin' ? t('auth.signinSubtitle') : t('auth.forgotSubtitle')}
      </p>

      <div className="mt-8 space-y-3">
        {mode === 'signup' && (
          <div className="relative">
            <User size={18} className="absolute left-4 top-[19px] text-muted-foreground" />
            <input className={inputClass} placeholder={t('auth.fullName')} />
          </div>
        )}
        <div className="relative">
          <Mail size={18} className="absolute left-4 top-[19px] text-muted-foreground" />
          <input className={inputClass} placeholder={t('auth.email')} type="email" />
        </div>
        {mode === 'signup' && (
          <div className="flex gap-2">
            <button onClick={() => setCountryOpen(true)} className="h-[56px] rounded-2xl bg-card border border-border px-3 flex items-center gap-1.5 flex-shrink-0 min-w-[110px]">
              <span className="text-[16px]">{selectedCountry.flag}</span>
              <span className="text-[13px] font-medium text-foreground">{selectedCountry.code}</span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>
            <div className="relative flex-1">
              <Phone size={18} className="absolute left-4 top-[19px] text-muted-foreground" />
              <input className="w-full h-[56px] rounded-2xl bg-card border border-border pl-12 pr-4 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" placeholder={t('auth.phoneNumber')} type="tel" />
            </div>
          </div>
        )}
        {mode !== 'forgot' && (
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-[19px] text-muted-foreground" />
            <input className={inputClass} placeholder={t('auth.password')} type={showPass ? 'text' : 'password'} />
            <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-[18px] text-muted-foreground">
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        )}

        {mode === 'signin' && (
          <button onClick={() => setMode('forgot')} className="block ml-auto text-brand-blue text-[13px] font-medium">
            {t('auth.forgotPassword')}
          </button>
        )}

        <button onClick={handleSubmit} className="w-full h-[56px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press mt-6">
          {mode === 'signup' ? t('auth.createAccount') : mode === 'signin' ? t('auth.signIn') : t('auth.sendResetLink')}
        </button>

        {mode !== 'forgot' && (
          <>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-muted-foreground">{t('auth.orContinueWith')}</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="flex gap-3">
              <button className="flex-1 h-[56px] rounded-2xl bg-card border border-border flex items-center justify-center card-tap">
                <GoogleLogo size={24} />
              </button>
              <button className="flex-1 h-[56px] rounded-2xl bg-card border border-border flex items-center justify-center card-tap">
                <AppleLogo size={24} className="text-foreground" />
              </button>
            </div>
            {mode === 'signup' && (
              <p className="text-center text-[11px] text-muted-foreground mt-4">
                {t('auth.byCreatingAccount')}{' '}
                <button onClick={() => setShowTerms(true)} className="text-brand-blue font-medium underline">{t('auth.termsOfService')}</button>
                {' '}{t('auth.and')}{' '}
                <button onClick={() => setShowPrivacy(true)} className="text-brand-blue font-medium underline">{t('auth.privacyPolicy')}</button>
              </p>
            )}
            <p className="text-center text-[14px] text-muted-foreground mt-4">
              {mode === 'signup' ? `${t('auth.alreadyHaveAccount')} ` : `${t('auth.dontHaveAccount')} `}
              <button onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')} className="text-brand-blue font-semibold">
                {mode === 'signup' ? t('auth.signIn') : t('auth.signUp')}
              </button>
            </p>
          </>
        )}
      </div>

      {/* Terms Modal */}
      <AnimatePresence>
        {showTerms && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTerms(false)} className="fixed inset-0 bg-foreground/30 z-40" />
            <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-xl max-w-[430px] mx-auto max-h-[70vh] flex flex-col">
              <div className="p-5 pb-3 flex items-center justify-between border-b border-border-light">
                <h3 className="text-[16px] font-bold text-foreground">{t('auth.termsOfService')}</h3>
                <button onClick={() => setShowTerms(false)}><X size={20} className="text-muted-foreground" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <p className="text-[13px] text-muted-foreground leading-relaxed">{t('auth.termsBody')}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Privacy Modal */}
      <AnimatePresence>
        {showPrivacy && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPrivacy(false)} className="fixed inset-0 bg-foreground/30 z-40" />
            <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-xl max-w-[430px] mx-auto max-h-[70vh] flex flex-col">
              <div className="p-5 pb-3 flex items-center justify-between border-b border-border-light">
                <h3 className="text-[16px] font-bold text-foreground">{t('auth.privacyPolicy')}</h3>
                <button onClick={() => setShowPrivacy(false)}><X size={20} className="text-muted-foreground" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <p className="text-[13px] text-muted-foreground leading-relaxed">{t('auth.privacyBody')}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Country Code Modal */}
      <AnimatePresence>
        {countryOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCountryOpen(false)} className="fixed inset-0 bg-foreground/30 z-40" />
            <motion.div initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }} className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-xl max-w-[430px] mx-auto max-h-[70vh] flex flex-col">
              <div className="p-5 pb-3 flex items-center justify-between border-b border-border-light">
                <h3 className="text-[16px] font-bold text-foreground">{t('auth.selectCountry')}</h3>
                <button onClick={() => setCountryOpen(false)}><X size={20} className="text-muted-foreground" /></button>
              </div>
              <div className="px-5 py-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-[13px] text-muted-foreground" />
                  <input className="w-full h-[42px] rounded-xl bg-muted border-none pl-10 pr-4 text-[14px] focus:outline-none" placeholder={t('auth.searchCountry')} value={countrySearch} onChange={e => setCountrySearch(e.target.value)} autoFocus />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-5">
                {filtered.map(c => (
                  <button key={c.code + c.name} onClick={() => { setSelectedCountry(c); setCountryOpen(false); setCountrySearch(''); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-start transition-colors ${selectedCountry.code === c.code ? 'bg-purple-soft' : 'hover:bg-muted'}`}>
                    <span className="text-[18px]">{c.flag}</span>
                    <span className="text-[14px] font-medium text-foreground flex-1">{c.name}</span>
                    <span className="text-[13px] text-muted-foreground">{c.code}</span>
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

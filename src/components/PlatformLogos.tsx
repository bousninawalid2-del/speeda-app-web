import React from 'react';
import _speedaLogoImg from '@/assets/speeda-logo.png';
import _speedaLogoWhiteImg from '@/assets/speeda-logo-white.png';
const speedaLogoImg = (typeof _speedaLogoImg === 'string' ? _speedaLogoImg : (_speedaLogoImg as { src: string }).src);
const speedaLogoWhiteImg = (typeof _speedaLogoWhiteImg === 'string' ? _speedaLogoWhiteImg : (_speedaLogoWhiteImg as { src: string }).src);

type LogoProps = { size?: number; className?: string };

export const InstagramLogo = ({ size = 20, className }: LogoProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="ig" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor="#feda75"/><stop offset="25%" stopColor="#fa7e1e"/>
        <stop offset="50%" stopColor="#d62976"/><stop offset="75%" stopColor="#962fbf"/>
        <stop offset="100%" stopColor="#4f5bd5"/>
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#ig)"/>
    <rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="#fff" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="3.5" fill="none" stroke="#fff" strokeWidth="1.5"/>
    <circle cx="17" cy="7" r="1.2" fill="#fff"/>
  </svg>
);

export const TikTokLogo = ({ size = 20, className }: LogoProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect width="24" height="24" rx="6" fill="#000"/>
    <path d="M16.5 5.5c-.7-.8-1.1-1.8-1.1-3h-2.3v12.3c0 1.5-1.2 2.7-2.7 2.7s-2.7-1.2-2.7-2.7 1.2-2.7 2.7-2.7c.3 0 .5 0 .8.1v-2.4c-.3 0-.5-.1-.8-.1-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5V9.3c1 .7 2.2 1.1 3.5 1.1v-2.3c-1.3 0-2.5-.7-3.4-1.6z" fill="#fff" transform="translate(0.5,1) scale(0.85)"/>
  </svg>
);

export const SnapchatLogo = ({ size = 20, className }: LogoProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect width="24" height="24" rx="6" fill="#FFFC00"/>
    <path d="M12 5c-1.8 0-3.2.8-3.9 2.2-.3.6-.4 1.3-.4 2.2v1.4c-.5-.1-.9-.1-1.1.1-.3.2-.3.5-.1.8.4.5 1.1.6 1.3.7-.1.5-.4 1-1 1.5-.5.4-1.1.7-1.6.8-.3.1-.5.3-.4.6.1.4.6.7 1.4.9.1 0 .2.1.2.3.1.3.1.5.1.5.1.3.3.4.7.4.3 0 .7-.1 1.3-.1.8 0 1.3.6 2.4 1.2.8.4 1.6.5 2.1.5s1.3-.1 2.1-.5c1.1-.6 1.6-1.2 2.4-1.2.6 0 1 .1 1.3.1.4 0 .6-.1.7-.4 0 0 0-.2.1-.5 0-.2.1-.3.2-.3.8-.2 1.3-.5 1.4-.9.1-.3-.1-.5-.4-.6-.5-.1-1.1-.4-1.6-.8-.6-.5-.9-1-1-1.5.2-.1.9-.2 1.3-.7.2-.3.2-.6-.1-.8-.2-.2-.6-.2-1.1-.1V9.4c0-.9-.1-1.6-.4-2.2C15.2 5.8 13.8 5 12 5z" fill="#fff"/>
  </svg>
);

export const FacebookLogo = ({ size = 20, className }: LogoProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <circle cx="12" cy="12" r="12" fill="#1877F2"/>
    <path d="M16.5 15.5l.5-3.5h-3.3V10c0-1 .5-1.9 2-1.9H17V5.3S15.8 5 14.6 5C12.1 5 10.5 6.5 10.5 9.2V12H7.5v3.5h3v8.4c.6.1 1.3.1 2 .1s1.4 0 2-.1v-8.4h2.5z" fill="#fff"/>
  </svg>
);

export const XLogo = ({ size = 20, className }: LogoProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect width="24" height="24" rx="6" fill="#000"/>
    <path d="M13.3 10.8L18.2 5h-1.2l-4.2 4.9L9.3 5H5l5.1 7.4L5 19h1.2l4.5-5.2L14.7 19H19l-5.7-8.2zm-1.6 1.8l-.5-.7L6.7 6h1.7l3.3 4.7.5.7 4.2 6H14.7l-3-4.6z" fill="#fff"/>
  </svg>
);

export const YouTubeLogo = ({ size = 20, className }: LogoProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect width="24" height="24" rx="6" fill="#FF0000"/>
    <path d="M19.6 8.3c-.2-.8-.8-1.4-1.6-1.6C16.6 6.2 12 6.2 12 6.2s-4.6 0-6 .5c-.8.2-1.4.8-1.6 1.6-.5 1.4-.5 4.3-.5 4.3s0 2.9.5 4.3c.2.8.8 1.4 1.6 1.6 1.4.5 6 .5 6 .5s4.6 0 6-.5c.8-.2 1.4-.8 1.6-1.6.5-1.4.5-4.3.5-4.3s0-2.9-.5-4.3z" fill="#FF0000"/>
    <path d="M10 15.2l4-2.6-4-2.6v5.2z" fill="#fff"/>
  </svg>
);

export const LinkedInLogo = ({ size = 20, className }: LogoProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect width="24" height="24" rx="6" fill="#0A66C2"/>
    <path d="M8.3 18H5.7V10h2.6v8zM7 9c-.8 0-1.5-.7-1.5-1.5S6.2 6 7 6s1.5.7 1.5 1.5S7.8 9 7 9zm11 9h-2.6v-3.9c0-.9 0-2.1-1.3-2.1s-1.5 1-1.5 2.1V18h-2.6V10h2.5v1.1c.4-.7 1.2-1.3 2.4-1.3 2.5 0 3 1.7 3 3.8V18z" fill="#fff"/>
  </svg>
);

export const PinterestLogo = ({ size = 20, className }: LogoProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect width="24" height="24" rx="6" fill="#E60023"/>
    <path d="M12 5.5c-3.6 0-6.5 2.9-6.5 6.5 0 2.6 1.5 4.8 3.7 5.9-.1-.5-.1-1.2 0-1.7l.7-3s-.2-.4-.2-.9c0-.8.5-1.4 1.1-1.4.5 0 .7.4.7.8 0 .5-.3 1.2-.5 1.9-.1.6.3 1.1.9 1.1 1.1 0 2-1.2 2-2.9 0-1.5-1.1-2.6-2.6-2.6-1.8 0-2.8 1.3-2.8 2.7 0 .5.2 1.1.4 1.4.1.1.1.1 0 .3l-.2.6c0 .1-.1.2-.3.1-.8-.4-1.3-1.5-1.3-2.4 0-2 1.4-3.8 4.1-3.8 2.2 0 3.8 1.6 3.8 3.6 0 2.1-1.4 3.9-3.2 3.9-.6 0-1.2-.3-1.4-.7l-.4 1.5c-.1.5-.4 1-.7 1.4.6.2 1.1.3 1.7.3 3.6 0 6.5-2.9 6.5-6.5S15.6 5.5 12 5.5z" fill="#fff"/>
  </svg>
);

export const ThreadsLogo = ({ size = 20, className }: LogoProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect width="24" height="24" rx="6" fill="#000"/>
    <path d="M16.1 11.3c-.1 0-.2-.1-.2-.1-.2-1.5-1-2.4-2.3-2.5h-.1c-.8 0-1.5.3-1.9.9l.8.6c.3-.4.7-.5 1.1-.5.5 0 .8.1 1.1.4.2.2.3.5.4.9-.5-.1-.9-.1-1.4-.1-1.6 0-2.6.8-2.6 2 0 .6.2 1.1.7 1.5.4.3.9.5 1.5.5.8 0 1.4-.4 1.8-1.1.3-.5.4-1.1.5-1.7.3.2.5.4.6.7.2.5.2 1.3-.5 2-.6.6-1.3.9-2.3.9-1.1 0-2-.4-2.6-1-.7-.7-1-1.7-1-3s.4-2.3 1-3c.7-.7 1.5-1 2.6-1 1.1 0 2 .4 2.6 1 .3.3.6.7.7 1.2l.9-.2c-.2-.6-.5-1.1-.9-1.5-.8-.8-1.8-1.3-3.3-1.3-1.3 0-2.4.4-3.2 1.3-.9.9-1.3 2.1-1.3 3.6s.4 2.7 1.3 3.6c.8.8 1.9 1.3 3.2 1.3 1.2 0 2.1-.4 2.9-1.1.9-1 1-2.2.7-3zm-2.4.5c0 .9-.2 1.5-.5 1.9-.3.4-.7.5-1.2.5-.3 0-.6-.1-.8-.3-.2-.2-.3-.5-.3-.8 0-.7.5-1.1 1.5-1.1.4 0 .8 0 1.3.1v-.3z" fill="#fff"/>
  </svg>
);

export const GoogleLogo = ({ size = 20, className }: LogoProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect width="24" height="24" rx="6" fill="#fff"/>
    <path d="M21.35 12.18c0-.57-.05-1.12-.15-1.64H12.2v3.1h5.14a4.39 4.39 0 01-1.9 2.88v2.4h3.08c1.8-1.66 2.83-4.1 2.83-6.74z" fill="#4285F4"/>
    <path d="M12.2 21.5c2.57 0 4.72-.85 6.3-2.31l-3.08-2.4c-.85.57-1.94.9-3.22.9-2.48 0-4.58-1.67-5.33-3.92H3.7v2.47A9.5 9.5 0 0012.2 21.5z" fill="#34A853"/>
    <path d="M6.87 13.77a5.7 5.7 0 010-3.63V7.67H3.7a9.5 9.5 0 000 8.57l3.17-2.47z" fill="#FBBC05"/>
    <path d="M12.2 6.22c1.4 0 2.66.48 3.65 1.42l2.74-2.74C16.91 3.35 14.77 2.5 12.2 2.5A9.5 9.5 0 003.7 7.67l3.17 2.47c.75-2.25 2.85-3.92 5.33-3.92z" fill="#EA4335"/>
  </svg>
);


export const WhatsAppLogo = ({ size = 20, className }: LogoProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect width="24" height="24" rx="6" fill="#25D366"/>
    <path d="M12 4C7.6 4 4 7.6 4 12c0 1.4.4 2.8 1 4l-.7 2.6 2.7-.7c1.2.6 2.5 1 3.9 1 4.4 0 8-3.6 8-8s-3.5-7-7.9-7zm4.4 11.2c-.2.5-1 1-1.6 1.1-.4.1-.9.2-2.9-.6-2.5-1-4.1-3.6-4.2-3.8-.2-.2-1.2-1.6-1.2-3s.8-2.1 1-2.4c.3-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.5.8 1.9.8 2 .1.1.1.3 0 .5s-.2.3-.3.5-.3.3-.4.4c-.2.2-.4.3-.2.6.2.3 1 1.6 2.1 2.6 1.4 1.2 2.6 1.6 3 1.8.3.1.5.1.7-.1.2-.3.8-.9 1-1.2.2-.3.4-.3.7-.2.3.1 1.8.8 2.1 1 .3.2.5.2.6.4.1.1.1.7-.1 1.2z" fill="#fff"/>
  </svg>
);

export const ApplePayLogo = ({ size = 20, className }: LogoProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect width="24" height="24" rx="6" fill="#000"/>
    <text x="12" y="15" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="600" fontFamily="Arial,sans-serif"> Pay</text>
  </svg>
);

export const STCPayLogo = ({ size = 20, className }: LogoProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect width="24" height="24" rx="6" fill="#6B2FA0"/>
    <text x="12" y="15" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="700" fontFamily="Arial,sans-serif">STC</text>
  </svg>
);

export const MadaLogo = ({ size = 20, className }: LogoProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect width="24" height="24" rx="6" fill="#004B87"/>
    <text x="12" y="15" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="700" fontFamily="Arial,sans-serif">mada</text>
  </svg>
);

export const VisaLogo = ({ size = 20, className }: LogoProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect width="24" height="24" rx="6" fill="#1A1F71"/>
    <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="800" fontFamily="Arial,sans-serif" fontStyle="italic">VISA</text>
  </svg>
);

export const MastercardLogo = ({ size = 20, className }: LogoProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect width="24" height="24" rx="6" fill="#f5f5f5"/>
    <circle cx="10" cy="12" r="5" fill="#EB001B"/>
    <circle cx="14" cy="12" r="5" fill="#F79E1B"/>
    <path d="M12 8.3a5 5 0 010 7.4 5 5 0 000-7.4z" fill="#FF5F00"/>
  </svg>
);

export const AppleLogo = ({ size = 20, className }: LogoProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.05 12.54c-.04-3.07 2.53-4.56 2.64-4.63-1.44-2.1-3.68-2.39-4.48-2.42-1.9-.2-3.73 1.13-4.7 1.13-.97 0-2.47-1.1-4.07-1.07-2.09.03-4.02 1.22-5.1 3.1-2.18 3.77-.56 9.37 1.56 12.43 1.04 1.5 2.28 3.18 3.9 3.12 1.56-.06 2.15-1.01 4.04-1.01 1.88 0 2.42 1.01 4.07.98 1.69-.03 2.75-1.53 3.77-3.04 1.19-1.74 1.68-3.42 1.71-3.51-.04-.02-3.28-1.26-3.34-5.01z"/>
  </svg>
);

// Speeda AI Logo — uses real uploaded logo images
export const SpeedaLogo = ({ size = 32, className, white }: LogoProps & { white?: boolean }) => (
  <img
    src={white ? speedaLogoWhiteImg : speedaLogoImg}
    width={size}
    height={size}
    alt="Speeda AI"
    className={className}
    style={{ objectFit: 'contain' }}
  />
);

export const platformLogoMap: Record<string, React.FC<LogoProps>> = {
  instagram: InstagramLogo,
  tiktok: TikTokLogo,
  snapchat: SnapchatLogo,
  facebook: FacebookLogo,
  x: XLogo,
  youtube: YouTubeLogo,
  linkedin: LinkedInLogo,
  google: GoogleLogo,
  pinterest: PinterestLogo,
  threads: ThreadsLogo,
};

import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

// Note: this app used to load Poppins via next/font/google here, but the
// generated font variable was never read anywhere — globals.css hardcodes
// --font-poppins: 'Poppins', sans-serif directly instead — so the import
// only added an unused build-time fetch to fonts.googleapis.com with no
// effect on rendering. Removed so production builds don't depend on that
// network call succeeding.

export const metadata: Metadata = {
  title: 'Speeda — AI Social Media Companion',
  description: 'AI-powered social media management and content creation platform',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
    ],
    apple: '/favicon.svg',
  },
};

// Runs before first paint so Arabic users never see an LTR flash, and keeps
// <html> in sync with the saved language (mirrors applyDir in src/i18n).
const LANG_BOOTSTRAP = `try{var l=localStorage.getItem('speeda-lang');if(l==='ar'||l==='fr'||l==='en'){var d=document.documentElement;d.lang=l;d.dir=l==='ar'?'rtl':'ltr';d.style.fontFamily=l==='ar'?"'IBM Plex Sans Arabic','Poppins',sans-serif":"'Poppins',sans-serif"}}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LANG_BOOTSTRAP }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

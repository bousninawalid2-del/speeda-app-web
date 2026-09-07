import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

// Note: this app used to load Poppins via next/font/google here, but the
// generated font variable was never attached to any element — globals.css
// (see --font-poppins there) sets the font-family directly instead — so the
// import only added an unused build-time fetch to fonts.googleapis.com with
// no effect on rendering. Removed so production builds don't depend on that
// network call succeeding.

export const metadata: Metadata = {
  title: 'Speeda — AI Social Media Companion',
  description: 'AI-powered social media management and content creation platform',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This app has no [locale] route segment — the language is a per-user
  // choice stored in localStorage, not part of the URL — so there is no
  // `params.locale` to read on the server. We render the default (English,
  // LTR) shell here; src/i18n/index.ts corrects `<html lang>`/`dir` on the
  // client immediately on mount, based on the saved language, before paint.
  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

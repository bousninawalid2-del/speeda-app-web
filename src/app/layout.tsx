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
      { url: '/favicon.svg', type: 'image/svg+xml', size: 'any' },
    ],
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

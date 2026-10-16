import type { Metadata } from 'next';
import './globals.css';

const siteUrl = 'https://zyntrazy.vercel.app';

export const metadata: Metadata = {
  title: 'Aetheris AI - Flagship Intelligence',
  description: 'Aetheris AI v2.5 Pro Neural — Next-generation intelligence workspace for developers and enterprises.',
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'Aetheris AI - Flagship Intelligence',
    description: 'Aetheris AI v2.5 Pro Neural — Next-generation intelligence workspace for developers and enterprises.',
    url: siteUrl,
    siteName: 'Aetheris AI',
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        secureUrl: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        type: 'image/jpeg',
        alt: 'Aetheris AI Flagship Intelligence Workspace Preview',
      },
    ],
    locale: 'th_TH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aetheris AI - Flagship Intelligence',
    description: 'Aetheris AI v2.5 Pro Neural — Next-generation intelligence workspace for developers and enterprises.',
    images: [`${siteUrl}/og-image.jpg`],
  },
  icons: {
    icon: '/aetheris-logo.svg',
    shortcut: '/aetheris-logo.svg',
    apple: '/aetheris-logo.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+Thai:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta property="og:image" content="https://zyntrazy.vercel.app/og-image.jpg" />
        <meta property="og:image:secure_url" content="https://zyntrazy.vercel.app/og-image.jpg" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:image" content="https://zyntrazy.vercel.app/og-image.jpg" />
      </head>
      <body className="bg-background text-on-surface font-body-md antialiased overflow-hidden selection:bg-primary-container selection:text-on-primary-container">
        {children}
      </body>
    </html>
  );
}

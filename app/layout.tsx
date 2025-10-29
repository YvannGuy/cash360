import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pacifico',
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.cash360.finance'),
  title: {
    default: "Cash360 - Analyse Financière Personnalisée & Formation",
    template: "%s | Cash360"
  },
  description: "Transformez votre relation à l'argent avec Cash360. Analyse financière personnalisée de vos relevés bancaires, formation exclusive et accompagnement pour atteindre la prospérité financière.",
  keywords: [
    "analyse financière",
    "gestion budget",
    "formation financière",
    "conseil financier",
    "épargne",
    "investissement",
    "relevé bancaire",
    "santé financière",
    "prospérité",
    "finances personnelles",
    "coach financier",
    "budget personnel"
  ],
  authors: [{ name: "Cash360" }],
  creator: "Cash360",
  publisher: "Cash360",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    alternateLocale: ['en_US', 'es_ES', 'pt_PT'],
    url: 'https://www.cash360.finance',
    siteName: 'Cash360',
    title: 'Cash360 - Analyse Financière Personnalisée & Formation',
    description: 'Transformez votre relation à l\'argent avec Cash360. Analyse financière personnalisée de vos relevés bancaires et formation exclusive pour la prospérité financière.',
    images: [
      {
        url: '/images/logo/logofinal.png',
        width: 1200,
        height: 630,
        alt: 'Cash360 - Formation Financière',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cash360 - Analyse Financière Personnalisée & Formation',
    description: 'Transformez votre relation à l\'argent avec Cash360. Analyse financière personnalisée et formation exclusive.',
    images: ['/images/logo/logofinal.png'],
    creator: '@cash360',
  },
  alternates: {
    canonical: 'https://www.cash360.finance',
    languages: {
      'fr': 'https://www.cash360.finance',
      'en': 'https://www.cash360.finance',
      'es': 'https://www.cash360.finance',
      'pt': 'https://www.cash360.finance',
    },
  },
  verification: {
    google: 'votre-code-google-search-console',
  },
  category: 'Finance',
  other: {
    'contact': 'cash@cash360.finance',
    'rating': '5.0',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning={true}>
      <head>
        {/* Viewport & Mobile Optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#EAB308" />
        
        {/* Additional SEO */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Cash360" />
        
        {/* Security */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="referrer" content="origin-when-cross-origin" />
        
        {/* Favicon & Icons */}
        <link rel="icon" href="/images/logo/logofinal.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/logo/logofinal.png" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Structured Data for Rich Results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FinancialService",
              "name": "Cash360",
              "description": "Analyse financière personnalisée et formation pour la prospérité financière",
              "url": "https://www.cash360.finance",
              "logo": "https://www.cash360.finance/images/logo/logofinal.png",
              "image": "https://www.cash360.finance/images/logo/logofinal.png",
              "telephone": "+33-XXX-XXX-XXX",
              "email": "cash@cash360.finance",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "FR",
                "addressLocality": "Paris"
              },
              "sameAs": [
                "https://www.facebook.com/cash360",
                "https://www.instagram.com/cash360",
                "https://www.linkedin.com/company/cash360"
              ],
              "priceRange": "€€",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "reviewCount": "100"
              },
              "offers": {
                "@type": "Offer",
                "name": "Analyse Financière Personnalisée",
                "description": "Analyse complète de vos relevés bancaires avec recommandations personnalisées",
                "price": "29.99",
                "priceCurrency": "EUR"
              }
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} antialiased`}
      >
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17668382284"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17668382284');
          `}
        </Script>
        
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}

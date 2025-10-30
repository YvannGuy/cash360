import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";

const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-pacifico",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.cash360.finance"),
  title: {
    default: "Cash360 – Éducation & Analyse pédagogique des finances personnelles",
    template: "%s | Cash360",
  },
  description:
    "Cash360 aide particuliers et églises à comprendre et améliorer leurs finances : diagnostic pédagogique des relevés, formation continue et accompagnement bienveillant.",
  keywords: [
    "éducation financière",
    "gestion de budget",
    "analyse de relevés",
    "formation adultes",
    "accompagnement financier",
    "finances personnelles chrétiennes",
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
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://www.cash360.finance",
    siteName: "Cash360",
    title: "Cash360 – Éducation financière & diagnostic pédagogique",
    description:
      "Diagnostic pédagogique des finances, ressources et accompagnement pour reprendre le contrôle de votre budget.",
    images: [
      {
        url: "/images/logo/logofinal.png",
        width: 1200,
        height: 630,
        alt: "Cash360 – Éducation financière",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cash360 – Éducation financière & diagnostic pédagogique",
    description:
      "Comprendre, organiser et améliorer ses finances — avec sagesse et clarté.",
    images: ["/images/logo/logofinal.png"],
  },
  alternates: {
    canonical: "https://www.cash360.finance",
  },
  verification: {
    google: "votre-code-google-search-console",
  },
  category: "Education",
  other: {
    contact: "cash@cash360.finance",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Viewport & Mobile Optimization */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
        <meta name="theme-color" content="#FEBE02" />

        {/* Additional SEO */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Cash360" />

        {/* Security */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="referrer" content="origin-when-cross-origin" />

        {/* Favicon & Icons */}
        <link rel="icon" href="/favicon/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/favicon/android-chrome-512x512.png" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Structured Data: EducationalOrganization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              name: "Cash360",
              description:
                "Plateforme d’éducation financière et d’accompagnement pédagogique pour adultes, particuliers et églises.",
              url: "https://www.cash360.finance",
              logo: "https://www.cash360.finance/images/logo/logofinal.png",
              image: "https://www.cash360.finance/images/logo/logofinal.png",
              email: "cash@cash360.finance",
              address: {
                "@type": "PostalAddress",
                addressCountry: "FR",
                addressLocality: "Paris",
              },
              offers: {
                "@type": "Offer",
                name: "Diagnostic pédagogique de vos finances",
                description:
                  "Étude de vos relevés et recommandations à visée éducative.",
                price: "39.99",
                priceCurrency: "EUR",
                availability: "https://schema.org/InStock",
                url: "https://www.cash360.finance/analyse-financiere",
              },
            }),
          }}
        />

        {/* Structured Data: FAQ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "Comment Cash360 peut m'aider ?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Cash360 vous aide à comprendre où part votre argent, à identifier des leviers d’économie et à structurer un plan d’action pédagogique et spirituel pour retrouver l’équilibre financier.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Comment fonctionne l'analyse financière Cash360 ?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Vous créez un compte, envoyez vos trois derniers relevés bancaires via un espace sécurisé, puis vous recevez sous 48–72 h un rapport clair avec recommandations et étapes concrètes.",
                  },
                },
                {
                  "@type": "Question",
                  name: "L'appel de 15 minutes est-il gratuit et confidentiel ?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Oui, l’appel de 15 minutes sert à comprendre votre situation et vos objectifs. Il est bienveillant, sans engagement et entièrement confidentiel.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Mes informations et documents sont-ils confidentiels ?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Oui. Vos données sont chiffrées, stockées de manière sécurisée et utilisées uniquement pour l’analyse pédagogique. Cash360 respecte la réglementation en vigueur (RGPD).",
                  },
                },
                {
                  "@type": "Question",
                  name: "Je suis en Afrique : puis-je bénéficier de l'accompagnement Cash360 ?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Oui. L’accompagnement à distance est accessible partout dans le monde dès lors que vous disposez d’une connexion Internet pour l’appel et l’envoi sécurisé de documents.",
                  },
                },
              ],
            }),
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

        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
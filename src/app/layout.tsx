import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import Header from "@/components/common/Header";
import {
  getSiteUrl,
  siteDescription,
  siteKeywords,
  siteName,
  siteTitle,
  siteUrl,
} from "@/lib/site";
import Providers from "./providers";
import "./globals.scss";
import localFont from "next/font/local";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: siteName,
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: siteKeywords,
  authors: [{ name: "Money Book" }],
  creator: "Money Book",
  publisher: "Money Book",
  alternates: {
    canonical: "/",
    languages: {
      "ko-KR": "/",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName,
    title: siteTitle,
    description: siteDescription,
    locale: "ko_KR",
  },
  twitter: {
    card: "summary",
    title: siteTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "finance",
};

// export const viewport: Viewport = {
//   width: "device-width",
//   initialScale: 1,
//   maximumScale: 1,
//   userScalable: false,
// };
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: getSiteUrl(),
    inLanguage: "ko-KR",
    description: siteDescription,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteName,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: getSiteUrl(),
    inLanguage: "ko-KR",
    description: siteDescription,
    featureList: [
      "수입과 지출 내역 기록",
      "월별 현금흐름 대시보드",
      "카테고리별 지출 분석",
      "저축 및 투자 기록 관리",
      "로그인 없는 데모 모드",
      "무료 가계부",
      "가계부",
    ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KRW",
    },
  },
];

const paperlogy = localFont({
  src: "../assets/fonts/Paperlogy-7Bold.ttf",
  variable: "--font-paperlogy",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={paperlogy.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:FILL,wght,GRAD,opsz@0..1,100..700,-50..200,20..48&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="app-body">
        <Providers>
          <div className="wrapper">
            <Header />
            <main className="app-main">{children}</main>
            <Analytics />
            {/* <Footer /> */}
          </div>
        </Providers>
      </body>
    </html>
  );
}

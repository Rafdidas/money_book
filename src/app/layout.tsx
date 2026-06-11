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
import { SpeedInsights } from "@vercel/speed-insights/next";
import appleTouchIcon from "@/assets/img/logo/apple-touch-icon.png";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: siteName,
  manifest: "/manifest.webmanifest",
  icons: {
    apple: [
      {
        url: appleTouchIcon.src,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: "default",
  },
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: siteKeywords,
  verification: {
    other: {
      "naver-site-verification": "9f9d6d6fe721722acddd6199cdc7cea35d2b7484",
    },
  },
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
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
      "가계부",
      "무료 가계부",
      "개인 가계부",
      "온라인 가계부",
      "웹 가계부",
      "인터넷 가계부",
      "수입 지출 관리",
      "월별 지출 관리",
      "고정지출 관리",
      "저축 관리",
      "투자 기록",
      "자산 관리",
      "가계부 프로그램",
      "가계부 추천",
      "가계부 쓰는 법",
      "머니북",
      "머니북 가계부",
      "Money Book",
      "국내 주식 종목 검색 및 매수 내역 기록",
      "최근 거래일 종가 기준 평가금액과 수익률 확인",
      "종목별, 계좌별, 시장별 포트폴리오 비중 확인",
      "일반계좌, ISA, 연금저축 계좌별 투자 관리",
      "ISA 및 연금저축 연간 투자 한도 관리",
    ],
    audience: {
      "@type": "Audience",
      audienceType: "가계부와 국내 주식 투자 내역을 함께 관리하려는 개인",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KRW",
    },
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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
            <SpeedInsights />
            {/* <Footer /> */}
          </div>
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import Header from "@/components/common/Header";
import Providers from "./providers";
import "./globals.scss";

const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || "https://money-book-one.vercel.app",
);
const siteName = "Money Book";
const siteDescription =
  "수입, 지출, 저축, 투자 기록을 월별 대시보드와 분석 차트로 관리하는 개인 가계부 서비스입니다.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: siteName,
  title: {
    default: "Money Book | 개인 가계부 대시보드",
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "가계부",
    "개인 가계부",
    "수입 지출 관리",
    "월별 지출 분석",
    "저축 관리",
    "투자 기록",
    "Money Book",
  ],
  authors: [{ name: "Money Book" }],
  creator: "Money Book",
  publisher: "Money Book",
  alternates: {
    canonical: "/",
    languages: {
      "ko-KR": "/",
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName,
    title: "Money Book | 개인 가계부 대시보드",
    description: siteDescription,
    locale: "ko_KR",
  },
  twitter: {
    card: "summary",
    title: "Money Book | 개인 가계부 대시보드",
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
  maximumScale: 1,
  userScalable: false,
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl.toString(),
    inLanguage: "ko-KR",
    description: siteDescription,
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteName,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: siteUrl.toString(),
    inLanguage: "ko-KR",
    description: siteDescription,
    featureList: [
      "수입과 지출 내역 기록",
      "월별 현금흐름 대시보드",
      "카테고리별 지출 분석",
      "저축 및 투자 기록 관리",
      "로그인 없는 데모 모드",
    ],
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
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:FILL,wght,GRAD,opsz@0..1,100..700,-50..200,20..48&display=block"
          rel="stylesheet"
        />
      </head>
      <body className="app-body">
        <Providers>
          <div className="wrapper">
            <Header />
            <main className="app-main">{children}</main>
            {/* <Footer /> */}
          </div>
        </Providers>
      </body>
    </html>
  );
}

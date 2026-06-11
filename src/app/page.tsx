import type { Metadata } from "next";
import IntroPage from "@/app/_intro/IntroPage";
import ResourcePreloads from "@/components/common/ResourcePreloads";
import {
  getSiteUrl,
  siteDescription,
  siteKeywords,
  siteName,
  siteTitle,
} from "@/lib/site";

const pageTitle = "머니북가계부 | 수입·지출·저축·투자를 관리하는 무료 온라인 가계부";
const pageDescription =
  "머니북가계부는 수입, 지출, 고정지출, 저축, 투자 기록을 한 곳에서 관리하고 월별 대시보드와 분석 차트로 소비 흐름과 자산 현황을 확인할 수 있는 무료 온라인 개인 가계부 서비스입니다.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: [
    ...siteKeywords,
    "무료 온라인 가계부",
    "월별 가계부",
    "소비 분석",
    "현금흐름 관리",
    "고정비 관리",
    "적금 관리",
    "주식 기록",
    "무료 투자 관리",
    "주식 매수 기록",
    "주식 평가금액",
    "포트폴리오 비중",
    "절세계좌 관리",
  ],
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
    title: pageTitle,
    description: pageDescription,
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
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
};

const pageJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: siteTitle,
    url: getSiteUrl(),
    inLanguage: "ko-KR",
    description: siteDescription,
    isPartOf: {
      "@type": "WebSite",
      name: siteName,
      url: getSiteUrl(),
    },
    about: [
      "무료 가계부",
      "수입 지출 관리",
      "월별 지출 분석",
      "고정지출 관리",
      "저축 관리",
      "투자 기록",
      "국내 주식 투자 관리",
      "주식 수익률 관리",
      "포트폴리오 관리",
      "ISA 및 연금저축 투자 한도 관리",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "머니북가계부는 무료로 사용할 수 있나요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "네. 머니북가계부는 수입, 지출, 저축, 고정지출, 월별 분석 등 기본 가계부 기능을 무료로 사용할 수 있습니다.",
        },
      },
      {
        "@type": "Question",
        name: "모바일에서도 사용할 수 있나요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "네. 머니북가계부는 모바일 웹과 PC 브라우저에서 사용할 수 있으며 로그인 후 데이터를 관리할 수 있습니다.",
        },
      },
      {
        "@type": "Question",
        name: "어떤 가계부 기능을 제공하나요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "월별 수입과 지출 기록, 카테고리별 소비 분석, 고정지출 관리, 저축 관리, 투자 기록 기능을 제공합니다.",
        },
      },
      {
        "@type": "Question",
        name: "주식 투자 관리에서 무엇을 확인할 수 있나요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "국내 주식 종목과 매수 내역을 기록하면 최근 거래일 종가 기준 평가금액, 평가손익, 전일 대비 수익률, 종목별·계좌별·시장별 포트폴리오 비중을 확인할 수 있습니다. 일반계좌, ISA, 연금저축 계좌도 구분해 관리할 수 있습니다.",
        },
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "머니북가계부",
        item: getSiteUrl(),
      },
    ],
  },
];

export default function Home() {
  return (
    <>
      <ResourcePreloads />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pageJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <IntroPage />
    </>
  );
}

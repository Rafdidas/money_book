import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "투자 기록",
  description:
    "주식 매수 내역과 최근 거래일 종가 기준 평가금액, 수익률을 가계부와 함께 기록하는 Money Book 투자 관리 페이지입니다.",
  keywords: [
    "주식 투자 관리",
    "주식 매수 기록",
    "주식 수익률 관리",
    "포트폴리오 관리",
    "ISA 투자 관리",
    "연금저축 투자 관리",
  ],
  alternates: {
    canonical: "/app/invest",
  },
};

export default function AppInvestLayout({ children }: { children: ReactNode }) {
  return children;
}

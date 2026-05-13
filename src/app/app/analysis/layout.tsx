import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "월별 지출 분석",
  description:
    "월별 수입, 지출, 저축 흐름과 카테고리별 소비 비중을 차트로 확인하는 Money Book 가계부 분석 페이지입니다.",
  alternates: {
    canonical: "/app/analysis",
  },
};

export default function AppAnalysisLayout({ children }: { children: ReactNode }) {
  return children;
}

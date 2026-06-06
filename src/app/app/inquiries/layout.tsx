import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "문의하기",
  description: "머니북 이용 문의와 요청사항을 남기고 답변을 확인합니다.",
};

export default function InquiriesLayout({ children }: { children: ReactNode }) {
  return children;
}

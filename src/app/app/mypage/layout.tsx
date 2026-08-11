import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "마이페이지",
  description: "머니북 계정 정보와 보안 설정을 관리합니다.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function MyPageLayout({ children }: { children: ReactNode }) {
  return children;
}

import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "로그인",
  description: "Money Book에 로그인하거나 데모 모드로 개인 가계부 기능을 체험하세요.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}

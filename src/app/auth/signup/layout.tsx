import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "회원가입",
  description: "Money Book 계정을 만들고 수입, 지출, 저축 기록을 관리하세요.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupLayout({ children }: { children: ReactNode }) {
  return children;
}

import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "비밀번호 찾기",
  description: "가입하신 이메일로 비밀번호 재설정 링크를 받으세요.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}

import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "비밀번호 재설정",
  description: "새 비밀번호를 설정하고 머니북을 계속 사용하세요.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}

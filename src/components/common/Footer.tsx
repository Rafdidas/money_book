"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith("/auth")) {
    return null;
  }

  return <footer className="app-footer">MONEY BOOK · 당신의 자산 이야기를 기록합니다</footer>;
}

"use client";

import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  if (pathname.startsWith("/auth")) {
    return null;
  }

  if (pathname.startsWith("/app")) {
    return null;
  }

  if (pathname === "/" || pathname === "/intro") {
    return null;
  }

  return null;
}

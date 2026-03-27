"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname === "/" || pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <footer
      style={{
        padding: "20px 24px",
        borderTop: "1px solid #e5e7eb",
      }}
    >
      <h2>money book</h2>
    </footer>
  );
}

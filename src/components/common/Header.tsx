"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  if (pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <header className="app-header">
      <div className="app-header--inner">
        <Link href="/" className="app-header__brand title--md">
          MONEY BOOK
        </Link>
      </div>
    </header>
  );
}

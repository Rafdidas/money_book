"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "@/assets/img/monibuk-logo.svg";
import PublicCta from "./PublicCta";

export default function Header() {
  const pathname = usePathname();

  if (pathname.startsWith("/auth")) {
    return null;
  }

  if (pathname.startsWith("/app")) {
    return null;
  }

  if (pathname === "/" || pathname === "/intro") {
    return (
      <header className="app-header app-header--intro">
        <div className="app-header--inner">
          <Link href="/" className="app-header__brand title--lg">
            <Image
              src={logo}
              width={232}
              height={52}
              loading="eager"
              alt="머니북가계부 로고"
            />
          </Link>
          <div className="hd-btn">
            <PublicCta variant="header" />
          </div>
        </div>
      </header>
    );
  }

  return null;
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "@/assets/img/monibuk-logo.svg";
import { usePublicAppSession } from "@/hooks/usePublicAppSession";

export default function Header() {
  const pathname = usePathname();
  const { hasAppSession, isSessionResolved } = usePublicAppSession();

  if (pathname.startsWith("/auth")) {
    return null;
  }

  if (pathname === "/" || pathname === "/intro") {
    return (
      <header className="app-header app-header--intro">
        <div className="app-header--inner">
          <Link href="/" className="app-header__brand title--lg">
            <Image src={logo} width={232} height={52} alt="머니북가계부 로고" priority />
          </Link>
          <div className="hd-btn">
            {isSessionResolved && hasAppSession ? (
              <Link href="/app" className="button button--sm button--primary">
                가계부로 이동
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="button button--sm button--primary app-header__login"
                >
                  로그인
                </Link>
                <Link href="/auth/login" className="button button--outline-primary button--sm ">
                  데모 버전
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="app-header">
      <div className="app-header--inner">
        <Link href="/app" className="app-header__brand title--lg">
          <Image src={logo} width={140} height={30} alt="머니북가계부 로고" priority />
        </Link>
      </div>
    </header>
  );
}

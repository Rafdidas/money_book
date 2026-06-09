"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import logo from "@/assets/img/monibuk-logo.svg";
import { useAppAlert } from "@/components/app-alert/AppAlertProvider";
import { disableDemoMode } from "@/lib/demo";
import { supabase } from "@/lib/supabase/client";

type SideMenuProps = {
  displayName: string;
  displayEmail?: string;
  isDemoMode?: boolean;
};

const navItems = [
  {
    href: "/app",
    icon: "home",
    label: "대시보드",
    isActive: (pathname: string) => pathname === "/app",
  },
  {
    href: "/app/analysis",
    icon: "analytics",
    label: "월별 분석",
    isActive: (pathname: string) => pathname.startsWith("/app/analysis"),
  },
  {
    href: "/app/invest",
    icon: "finance_mode",
    label: "투자 관리",
    isActive: (pathname: string) => pathname.startsWith("/app/invest"),
  },
  {
    href: "/app/inquiries",
    icon: "support_agent",
    label: "문의하기",
    isActive: (pathname: string) => pathname.startsWith("/app/inquiries"),
  },
];

export default function SideMenu({
  displayName,
  displayEmail = "",
  isDemoMode = false,
}: SideMenuProps) {
  const pathname = usePathname();
  const { alert, confirm } = useAppAlert();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const isMobileMenuOpen = mobileMenuPath === pathname;

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuPath(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    const shouldLogout = await confirm(
      isDemoMode ? "데모 종료 하시겠습니까?" : "로그아웃 하시겠습니까?",
      {
      title: isDemoMode ? "데모 종료" : "로그아웃",
      confirmText: "확인",
      cancelText: "취소",
      },
    );

    if (!shouldLogout) {
      return;
    }

    setIsLoggingOut(true);

    if (isDemoMode) {
      disableDemoMode();
      window.location.replace("/auth/login");
      return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      setIsLoggingOut(false);
      alert(`로그아웃 실패: ${error.message}`);
      return;
    }

    window.location.replace("/auth/login");
  };

  return (
    <>
      <aside className="side-menu">
        <div className="side-menu--inner column-group">
          <Link href="/app" className="side-menu--brand" aria-label="머니북 대시보드">
            <Image src={logo} width={140} height={30} alt="머니북가계부 로고" priority />
          </Link>
          <div className="side-menu--avatar row-group row-group--center">
            <div className="row-group row-group--center row-group--gap-8">
              <span className="material-symbols-outlined" aria-hidden="true">
                account_circle
              </span>
              <div className="column-group">
                <span className="bodyBold--sm">{displayName}</span>
                {displayEmail ? <span className="label--sm">{displayEmail}</span> : null}
              </div>
            </div>
          </div>
          <p className="side-menu--eyebrow label--xs">WORKSPACE</p>
          <div className="column-group side-menu--wrap">
            <ul className="side-menu--list app-header__nav column-group column-group--gap-4">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`side-menu--item row-group row-group--center row-group--gap-4 label--lg ${item.isActive(pathname) ? "is-active" : ""}`}
                  >
                    <span className="material-symbols-outlined icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="side-menu--list app-header__nav column-group column-group--gap-4 log-out--wrap">
              <li>
                <button
                  type="button"
                  className="side-menu--item side-menu--logout row-group row-group--center row-group--gap-4 label--lg"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <span className="material-symbols-outlined icon" aria-hidden="true">
                    logout
                  </span>
                  {isLoggingOut
                    ? isDemoMode
                      ? "종료 중..."
                      : "로그아웃 중..."
                    : isDemoMode
                      ? "데모 종료"
                      : "로그아웃"}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </aside>

      <header className="mobile-app-header">
        <Link href="/app" className="mobile-app-header--brand" aria-label="머니북 대시보드">
          <Image src={logo} width={116} height={25} alt="머니북가계부 로고" priority />
        </Link>
        <button
          type="button"
          className="mobile-app-header--menu"
          aria-label="메뉴 열기"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation-drawer"
          onClick={() => setMobileMenuPath(pathname)}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            menu
          </span>
        </button>
      </header>

      <div className={`mobile-drawer ${isMobileMenuOpen ? "is-open" : ""}`}>
        <button
          type="button"
          className="mobile-drawer--backdrop"
          aria-label="메뉴 닫기"
          onClick={() => setMobileMenuPath(null)}
        />
        <aside
          id="mobile-navigation-drawer"
          className="mobile-drawer--panel column-group"
          aria-label="모바일 메뉴"
          aria-hidden={!isMobileMenuOpen}
        >
          <div className="mobile-drawer--header row-group row-group--center row-group--between">
            <Image src={logo} width={132} height={28} alt="머니북가계부 로고" />
            <button
              type="button"
              className="mobile-drawer--close"
              aria-label="메뉴 닫기"
              onClick={() => setMobileMenuPath(null)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                close
              </span>
            </button>
          </div>
          <div className="side-menu--avatar row-group row-group--center">
            <div className="row-group row-group--center row-group--gap-8">
              <span className="material-symbols-outlined" aria-hidden="true">
                account_circle
              </span>
              <div className="column-group">
                <span className="bodyBold--sm">{displayName}</span>
                {displayEmail ? <span className="label--sm">{displayEmail}</span> : null}
              </div>
            </div>
          </div>
          <p className="side-menu--eyebrow label--xs">WORKSPACE</p>
          <nav className="mobile-drawer--nav">
            <ul className="side-menu--list column-group column-group--gap-4">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`side-menu--item row-group row-group--center row-group--gap-4 label--lg ${item.isActive(pathname) ? "is-active" : ""}`}
                >
                  <span className="material-symbols-outlined icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            ))}
            </ul>
          </nav>
          <ul className="side-menu--list log-out--wrap">
            <li>
              <button
                type="button"
                className="side-menu--item side-menu--logout row-group row-group--center row-group--gap-4 label--lg"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <span className="material-symbols-outlined icon" aria-hidden="true">
                  logout
                </span>
                {isLoggingOut
                  ? isDemoMode
                    ? "종료 중..."
                    : "로그아웃 중..."
                  : isDemoMode
                    ? "데모 종료"
                    : "로그아웃"}
              </button>
            </li>
          </ul>
        </aside>
      </div>

      <nav className="mobile-bottom-nav" aria-label="주요 메뉴">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-bottom-nav--item ${item.isActive(pathname) ? "is-active" : ""}`}
            aria-current={item.isActive(pathname) ? "page" : undefined}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

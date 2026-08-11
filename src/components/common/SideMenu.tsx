"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/img/monibuk-logo.svg";
import { useAppAlert } from "@/components/app-alert/AppAlertProvider";
import AppIcon, { type AppIconName } from "@/components/common/AppIcon";
import LegalLinks from "@/components/common/LegalLinks";
// 다크모드 토글: 로고 완성 후 주석 해제하고 배포 예정
// import { useTheme } from "@/components/common/ThemeProvider";
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
  {
    href: "/app/mypage",
    icon: "account_circle",
    label: "마이페이지",
    isActive: (pathname: string) => pathname.startsWith("/app/mypage"),
  },
] satisfies Array<{
  href: string;
  icon: AppIconName;
  label: string;
  isActive: (pathname: string) => boolean;
}>;

export default function SideMenu({
  displayName,
  displayEmail = "",
  isDemoMode = false,
}: SideMenuProps) {
  const pathname = usePathname();
  // const { theme, toggleTheme } = useTheme();
  const { alert, confirm } = useAppAlert();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const [isBottomNavCompact, setIsBottomNavCompact] = useState(false);
  const lastScrollY = useRef(0);
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

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 760px)");
    let ticking = false;

    const updateBottomNav = () => {
      const currentScrollY = Math.max(window.scrollY, 0);
      const scrollDelta = currentScrollY - lastScrollY.current;

      if (currentScrollY < 24) {
        setIsBottomNavCompact(false);
      } else if (scrollDelta > 8) {
        setIsBottomNavCompact(true);
      } else if (scrollDelta < -8) {
        setIsBottomNavCompact(false);
      }

      lastScrollY.current = currentScrollY;
      ticking = false;
    };

    const handleScroll = () => {
      if (!mediaQuery.matches || ticking) return;

      ticking = true;
      window.requestAnimationFrame(updateBottomNav);
    };

    lastScrollY.current = Math.max(window.scrollY, 0);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // 다크모드 토글: 로고 완성 후 주석 해제하고 배포 예정
  // const themeToggleItem = (
  //   <li>
  //     <button
  //       type="button"
  //       className="side-menu--item row-group row-group--center row-group--gap-4 label--lg"
  //       onClick={toggleTheme}
  //       aria-pressed={theme === "dark"}
  //     >
  //       <AppIcon name={theme === "dark" ? "light_mode" : "dark_mode"} />
  //       {theme === "dark" ? "라이트 모드" : "다크 모드"}
  //     </button>
  //   </li>
  // );

  return (
    <>
      <aside className="side-menu">
        <div className="side-menu--inner column-group">
          <Link href="/app" className="side-menu--brand" aria-label="머니북 대시보드">
            <Image src={logo} width={140} height={30} alt="머니북가계부 로고" priority />
          </Link>
          <div className="side-menu--avatar row-group row-group--center">
            <div className="row-group row-group--center row-group--gap-8">
              <AppIcon name="account_circle" />
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
                    <AppIcon name={item.icon} />
                    {item.label}
                  </Link>
                </li>
              ))}
              {/* {themeToggleItem} */}
            </ul>
            <ul className="side-menu--list app-header__nav column-group column-group--gap-4 log-out--wrap">
              <li>
                <button
                  type="button"
                  className="side-menu--item side-menu--logout row-group row-group--center row-group--gap-4 label--lg"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <AppIcon name="logout" />
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
          <LegalLinks className="side-menu--legal" />
        </div>
      </aside>

      <header className="mobile-app-header">
        <Link
          href="/app"
          className="mobile-app-header--brand"
          aria-label="머니북 대시보드"
        >
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
          <AppIcon name="menu" />
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
              <AppIcon name="close" />
            </button>
          </div>
          <div className="side-menu--avatar row-group row-group--center">
            <div className="row-group row-group--center row-group--gap-8">
              <AppIcon name="account_circle" />
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
                    <AppIcon name={item.icon} />
                    {item.label}
                  </Link>
                </li>
              ))}
              {/* {themeToggleItem} */}
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
                <AppIcon name="logout" />
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
          <LegalLinks className="mobile-drawer--legal" />
        </aside>
      </div>

      <nav
        className={`mobile-bottom-nav ${isBottomNavCompact ? "is-compact" : ""}`}
        aria-label="주요 메뉴"
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-bottom-nav--item ${item.isActive(pathname) ? "is-active" : ""}`}
            aria-current={item.isActive(pathname) ? "page" : undefined}
          >
            <AppIcon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

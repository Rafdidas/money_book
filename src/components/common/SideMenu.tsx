"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  );
}

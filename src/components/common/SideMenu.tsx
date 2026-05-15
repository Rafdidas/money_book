"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
];

export default function SideMenu({
  displayName,
  displayEmail = "",
  isDemoMode = false,
}: SideMenuProps) {
  const pathname = usePathname();
  const { alert, confirm } = useAppAlert();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: globalThis.MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };
  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
  };
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

    handleMenuClose();
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
        <div
          ref={menuRef}
          className="side-menu--avatar row-group row-group--center row-group--between"
        >
          <div className="row-group row-group--center row-group--gap-8">
            <span className="material-symbols-outlined" aria-hidden="true">
              account_circle
            </span>
            <div className="column-group">
              <span className="bodyBold--sm">{displayName}</span>
              {displayEmail ? <span className="label--sm">{displayEmail}</span> : null}
            </div>
          </div>
          <button
            type="button"
            aria-label="Open menu"
            aria-controls="side-menu-actions"
            aria-expanded={isMenuOpen ? "true" : "false"}
            aria-haspopup="menu"
            className="button button--icon-only button--md button--subtle side-menu--more"
            onClick={handleMenuToggle}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              more_vert
            </span>
          </button>
          {isMenuOpen ? (
            <div
              className="side-menu--dropdown column-group"
              id="side-menu-actions"
              role="menu"
            >
              <ul>
                <li>
                  <button
                    type="button"
                    className="side-menu--dropdown-item"
                    role="menuitem"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
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
          ) : null}
        </div>
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
            <li
              className="side-menu--item row-group row-group--center row-group--gap-4 label--lg"
              onClick={handleLogout}
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
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}

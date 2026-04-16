"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isMounted) {
        setIsLoggedIn(Boolean(session));
      }
    };

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setIsLoggedIn(Boolean(session));
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (pathname.startsWith("/auth")) {
    return null;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/auth/login");
  };

  const dashboardActive = pathname === "/";
  const analysisActive = pathname.startsWith("/analysis");

  return (
    <header className="app-header">
      <Link href="/" className="app-header__brand title--md">
        MONEY BOOK
      </Link>

      <nav className="app-header__nav">
        <Link
          href="/"
          className={`app-header__link bodyBold--sm ${dashboardActive ? "is-active" : ""}`}
        >
          대시보드
        </Link>
        <Link
          href="/analysis"
          className={`app-header__link bodyBold--sm ${analysisActive ? "is-active" : ""}`}
        >
          월별 분석
        </Link>
      </nav>

      <div className="app-header__actions">
        {isLoggedIn ? (
          <button type="button" onClick={handleLogout} className="app-header__button bodyBold--sm">
            로그아웃
          </button>
        ) : (
          <div className="app-header__guest-links bodyBold--sm">
            <Link href="/auth/login">로그인</Link>
            <Link href="/auth/signup">회원가입</Link>
          </div>
        )}
      </div>
    </header>
  );
}

"use client";

import { setWasmUrl } from "@lottiefiles/dotlottie-react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import AppAlertProvider from "@/components/app-alert/AppAlertProvider";
import ThemeProvider from "@/components/common/ThemeProvider";
import { getCurrentUserLegalConsent } from "@/lib/api/legalConsent";
import { isDemoModeEnabled } from "@/lib/demo";
import { isLegalConsentGateEnabled } from "@/lib/legal/consentGate";
import { needsCurrentLegalConsent } from "@/lib/legal/consentStatus";
import { consumeAuthHashSession } from "@/lib/supabase/auth-url";
import { supabase } from "@/lib/supabase/client";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

setWasmUrl("/dotlottie-player.wasm");

type AppDataContextValue = {
  displayName: string;
  displayEmail: string;
  isDemoMode: boolean;
  isAuthResolved: boolean;
  hasAppSession: boolean;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export type AuthenticatedDestination = "/app" | "/auth/consent" | "/auth/login";

// 로그인 응답 또는 getUser()로 방금 검증한 사용자만 전달한다.
export const getAuthenticatedDestination = async (
  authenticatedUser?: Pick<User, "id"> | null,
): Promise<AuthenticatedDestination> => {
  if (isDemoModeEnabled()) {
    return "/app";
  }

  const user = authenticatedUser === undefined
    ? (await supabase.auth.getUser()).data.user
    : authenticatedUser;

  if (!user) {
    return "/auth/login";
  }

  if (!isLegalConsentGateEnabled()) {
    return "/app";
  }

  try {
    const profile = await getCurrentUserLegalConsent(user.id);
    return needsCurrentLegalConsent(profile) ? "/auth/consent" : "/app";
  } catch {
    // 동의 조회 실패로 이미 인증된 사용자의 접근을 막지 않는다.
    // 동의 게이트는 보안 경계가 아니라 기록 장치이므로 실패 시 통과시킨다.
    return "/app";
  }
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within Providers.");
  }
  return context;
};

export default function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAppRoute = pathname === "/app" || pathname.startsWith("/app/");
  const isPublicRoute = pathname === "/" || pathname === "/intro";
  const [displayName, setDisplayName] = useState("게스트");
  const [displayEmail, setDisplayEmail] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [hasPublicAppSession, setHasPublicAppSession] = useState(false);

  useEffect(() => {
    if (!isPublicRoute) {
      return;
    }

    let isCancelled = false;

    const resolvePublicSession = async () => {
      if (isDemoModeEnabled()) {
        if (!isCancelled) {
          setHasPublicAppSession(true);
        }
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isCancelled) {
        setHasPublicAppSession(Boolean(session?.user));
      }
    };

    resolvePublicSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasPublicAppSession(Boolean(session?.user) || isDemoModeEnabled());
    });

    return () => {
      isCancelled = true;
      subscription.unsubscribe();
    };
  }, [isPublicRoute]);

  useEffect(() => {
    if (!isAppRoute) {
      return;
    }

    let isCancelled = false;

    const fetchAppData = async () => {
      setIsAuthResolved(false);

      try {
        await consumeAuthHashSession();
      } catch {
        router.replace("/auth/login");
        return;
      }

      if (isDemoModeEnabled()) {
        if (isCancelled) return;

        setDisplayName("데모 사용자");
        setDisplayEmail("demo@moneybook.local");
        setIsDemoMode(true);
        setIsAuthResolved(true);
        return;
      }

      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;

        if (isCancelled) return;

        const destination = await getAuthenticatedDestination(user);

        if (isCancelled) return;

        if (destination !== "/app") {
          router.replace(destination);
          return;
        }

        if (!user) {
          router.replace("/auth/login");
          return;
        }

        const metadataName =
          typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "";

        setDisplayName(metadataName || user.email?.split("@")[0] || "게스트");
        setDisplayEmail(user.email || "");
        setIsDemoMode(false);
        setIsAuthResolved(true);
      } catch {
        if (!isCancelled) {
          router.replace("/auth/login");
        }
      }
    };

    fetchAppData();

    return () => {
      isCancelled = true;
    };
  }, [isAppRoute, router]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      displayName,
      displayEmail,
      isDemoMode,
      isAuthResolved: !isAppRoute || isAuthResolved,
      hasAppSession: isAppRoute ? isDemoMode || isAuthResolved : hasPublicAppSession,
    }),
    [
      displayEmail,
      displayName,
      isAuthResolved,
      isDemoMode,
      isAppRoute,
      hasPublicAppSession,
    ],
  );

  return (
    <AppDataContext.Provider value={value}>
      <ThemeProvider>
        <AppAlertProvider>{children}</AppAlertProvider>
      </ThemeProvider>
    </AppDataContext.Provider>
  );
}

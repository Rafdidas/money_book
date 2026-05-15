"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import AppAlertProvider from "@/components/app-alert/AppAlertProvider";
import { isDemoModeEnabled } from "@/lib/demo";
import { consumeAuthHashSession } from "@/lib/supabase/auth-url";
import { supabase } from "@/lib/supabase/client";
import type { ReactNode } from "react";

type AppDataContextValue = {
  displayName: string;
  displayEmail: string;
  isDemoMode: boolean;
  isAuthResolved: boolean;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

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
  const [displayName, setDisplayName] = useState("게스트");
  const [displayEmail, setDisplayEmail] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isAuthResolved, setIsAuthResolved] = useState(false);

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

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      if (isCancelled) return;

      const metadataName =
        typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "";

      setDisplayName(metadataName || user.email?.split("@")[0] || "게스트");
      setDisplayEmail(user.email || "");
      setIsDemoMode(false);
      setIsAuthResolved(true);
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
    }),
    [
      displayEmail,
      displayName,
      isAuthResolved,
      isDemoMode,
      isAppRoute,
    ],
  );

  return (
    <AppDataContext.Provider value={value}>
      <AppAlertProvider>{children}</AppAlertProvider>
    </AppDataContext.Provider>
  );
}

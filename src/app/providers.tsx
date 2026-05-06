"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { getExpenses } from "@/lib/api/expense";
import { DEMO_USER_ID, isDemoModeEnabled, readDemoExpenses } from "@/lib/demo";
import { consumeAuthHashSession } from "@/lib/supabase/auth-url";
import { supabase } from "@/lib/supabase/client";
import type { Expense } from "@/types/expense";
import type { Dispatch, ReactNode, SetStateAction } from "react";

type AppDataContextValue = {
  expenses: Expense[];
  setExpenses: Dispatch<SetStateAction<Expense[]>>;
  displayName: string;
  displayEmail: string;
  isDemoMode: boolean;
  isAuthResolved: boolean;
  refreshExpenses: () => Promise<void>;
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
  const [userId, setUserId] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [displayName, setDisplayName] = useState("게스트");
  const [displayEmail, setDisplayEmail] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const hasFetchedRef = useRef(false);

  const refreshExpenses = useCallback(async () => {
    if (!userId) return;
    if (userId === DEMO_USER_ID) {
      setExpenses(readDemoExpenses());
      return;
    }
    const data = await getExpenses(userId);
    setExpenses(data || []);
  }, [userId]);

  useEffect(() => {
    if (pathname.startsWith("/auth")) {
      return;
    }

    if (hasFetchedRef.current && userId) {
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

        setUserId(DEMO_USER_ID);
        setExpenses(readDemoExpenses());
        setDisplayName("데모 사용자");
        setDisplayEmail("demo@moneybook.local");
        setIsDemoMode(true);
        setIsAuthResolved(true);
        hasFetchedRef.current = true;
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const data = await getExpenses(user.id);
      if (isCancelled) return;

      const metadataName =
        typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "";

      setUserId(user.id);
      setExpenses(data || []);
      setDisplayName(metadataName || user.email?.split("@")[0] || "게스트");
      setDisplayEmail(user.email || "");
      setIsDemoMode(false);
      setIsAuthResolved(true);
      hasFetchedRef.current = true;
    };

    fetchAppData();

    return () => {
      isCancelled = true;
    };
  }, [pathname, router, userId]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      expenses,
      setExpenses,
      displayName,
      displayEmail,
      isDemoMode,
      isAuthResolved: pathname.startsWith("/auth") || isAuthResolved,
      refreshExpenses,
    }),
    [
      displayEmail,
      displayName,
      expenses,
      isAuthResolved,
      isDemoMode,
      pathname,
      refreshExpenses,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "mb-theme";

const isIntroPath = (pathname: string) =>
  pathname === "/" || pathname === "/intro";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }
  return context;
};

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>("light");
  // 초기 data-theme는 layout의 인라인 스크립트가 이미 설정했으므로
  // 첫 apply는 건너뛰어 깜빡임을 막는다.
  const isFirstApply = useRef(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") {
      // localStorage는 SSR에서 읽을 수 없어 마운트 후 한 번만 동기화한다.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    if (isFirstApply.current) {
      isFirstApply.current = false;
      return;
    }
    const effective = isIntroPath(pathname) ? "light" : theme;
    document.documentElement.setAttribute("data-theme", effective);
  }, [theme, pathname]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

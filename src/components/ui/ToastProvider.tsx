"use client";

import { AnimatePresence, motion } from "motion/react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

import { PANEL_TRANSITION } from "@/lib/motion/tokens";
import { useReducedMotionPreference } from "@/lib/motion/useReducedMotion";

export type ToastTone = "neutral" | "info" | "success" | "danger";

type ToastOptions = {
  tone?: ToastTone;
};

type ToastItem = Required<ToastOptions> & {
  id: number;
  message: string;
};

type ToastContextValue = {
  toast: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);
const maximumVisibleToasts = 3;

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotionPreference();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((message: string, options: ToastOptions = {}) => {
    const id = nextIdRef.current;
    nextIdRef.current += 1;
    setToasts((current) => [
      ...current.slice(-(maximumVisibleToasts - 1)),
      { id, message, tone: options.tone ?? "neutral" },
    ]);
  }, []);

  const contextValue = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <aside className="ui-toast-stack" aria-label="알림">
        <AnimatePresence initial={false}>
          {toasts.map((item) => (
            <motion.div
              key={item.id}
              className={`ui-toast ui-toast--${item.tone}`}
              role="status"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              transition={PANEL_TRANSITION}
            >
              <span>{item.message}</span>
              <button type="button" className="ui-toast__close" onClick={() => dismiss(item.id)} aria-label="알림 닫기">
                닫기
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </aside>
    </ToastContext.Provider>
  );
}

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
import { createPortal, flushSync } from "react-dom";
import type { PointerEvent, ReactNode } from "react";

type DialogType = "alert" | "confirm";

type DialogOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
};

type DialogRequest = Required<Pick<DialogOptions, "confirmText">> &
  Omit<DialogOptions, "confirmText"> & {
    id: number;
    message: string;
    type: DialogType;
    resolve?: (value: boolean) => void;
  };

type AppAlertContextValue = {
  alert: (message: string, options?: DialogOptions) => void;
  confirm: (message: string, options?: DialogOptions) => Promise<boolean>;
};

const AppAlertContext = createContext<AppAlertContextValue | null>(null);

export const useAppAlert = () => {
  const context = useContext(AppAlertContext);
  if (!context) {
    throw new Error("useAppAlert must be used within AppAlertProvider.");
  }
  return context;
};

export default function AppAlertProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogRequest | null>(null);
  const queueRef = useRef<DialogRequest[]>([]);
  const idRef = useRef(0);
  const scrollYRef = useRef(0);

  const openNextDialog = useCallback(() => {
    setDialog((current) => current ?? queueRef.current.shift() ?? null);
  }, []);

  const enqueue = useCallback(
    (request: Omit<DialogRequest, "id">) => {
      queueRef.current.push({
        ...request,
        id: idRef.current + 1,
      });
      idRef.current += 1;
      openNextDialog();
    },
    [openNextDialog],
  );

  const alert = useCallback<AppAlertContextValue["alert"]>(
    (message, options) => {
      enqueue({
        type: "alert",
        title: options?.title ?? "알림",
        message: String(message),
        description: options?.description,
        confirmText: options?.confirmText ?? "확인",
      });
    },
    [enqueue],
  );

  const confirm = useCallback<AppAlertContextValue["confirm"]>(
    (message, options) =>
      new Promise<boolean>((resolve) => {
        enqueue({
          type: "confirm",
          title: options?.title ?? "확인",
          message: String(message),
          description: options?.description,
          confirmText: options?.confirmText ?? "확인",
          cancelText: options?.cancelText ?? "취소",
          resolve,
        });
      }),
    [enqueue],
  );

  const closeDialog = useCallback(
    (result: boolean) => {
      dialog?.resolve?.(result);
      flushSync(() => {
        setDialog(queueRef.current.shift() ?? null);
      });
    },
    [dialog],
  );

  const handleDialogButtonPointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>, result: boolean) => {
      if (event.pointerType === "mouse" || event.pointerType === "touch") {
        event.preventDefault();
        closeDialog(result);
      }
    },
    [closeDialog],
  );

  useEffect(() => {
    if (!dialog) return;

    const body = document.body;
    scrollYRef.current = window.scrollY;
    body.style.setProperty("--scroll-y", `-${scrollYRef.current}px`);
    body.classList.add("overflow");

    return () => {
      body.classList.remove("overflow");
      body.style.removeProperty("--scroll-y");
      window.scrollTo(0, scrollYRef.current);
    };
  }, [dialog]);

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message?: unknown) => {
      alert(String(message ?? ""));
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [alert]);

  useEffect(() => {
    if (!dialog) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDialog(dialog.type === "alert");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeDialog, dialog]);

  const value = useMemo(
    () => ({
      alert,
      confirm,
    }),
    [alert, confirm],
  );

  return (
    <AppAlertContext.Provider value={value}>
      {children}
      {typeof document !== "undefined" && dialog
        ? createPortal(
            <div
              className="app-alert-overlay"
              role="presentation"
            >
              <section
                className="app-alert"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={`app-alert-title-${dialog.id}`}
                aria-describedby={`app-alert-message-${dialog.id}`}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="app-alert__wrap">
                  <h2
                    id={`app-alert-title-${dialog.id}`}
                    className="app-alert__title"
                  >
                    {dialog.title}
                  </h2>
                  <div className="app-alert__body">
                    <p
                      id={`app-alert-message-${dialog.id}`}
                      className="app-alert__message"
                    >
                      {dialog.message}
                    </p>
                    {dialog.description ? (
                      <p className="app-alert__description">{dialog.description}</p>
                    ) : null}
                  </div>
                  <div
                    className={`app-alert__actions ${
                      dialog.type === "alert" ? "app-alert__actions--single" : ""
                    }`}
                  >
                    {dialog.type === "confirm" ? (
                      <button
                        type="button"
                        className="button button--md button--outline app-alert__button"
                        onPointerDown={(event) => handleDialogButtonPointerDown(event, false)}
                        onClick={() => closeDialog(false)}
                      >
                        {dialog.cancelText}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="button button--md button--primary app-alert__button"
                      onPointerDown={(event) => handleDialogButtonPointerDown(event, true)}
                      onClick={() => closeDialog(true)}
                      autoFocus
                    >
                      {dialog.confirmText}
                    </button>
                  </div>
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
    </AppAlertContext.Provider>
  );
}

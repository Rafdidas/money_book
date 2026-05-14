import type { SupportedStorage } from "@supabase/supabase-js";

const REMEMBER_LOGIN_KEY = "money-book-remember-login";
const AUTH_STORAGE_KEY = "money-book-auth-token";

const getBrowserStorage = (kind: "local" | "session") => {
  if (typeof window === "undefined") {
    return null;
  }

  return kind === "local" ? window.localStorage : window.sessionStorage;
};

const getLegacySupabaseStorageKey = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return "";
  }

  try {
    const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
    return projectRef ? `sb-${projectRef}-auth-token` : "";
  } catch {
    return "";
  }
};

export const setRememberLogin = (remember: boolean) => {
  const localStorage = getBrowserStorage("local");

  if (!localStorage) {
    return;
  }

  if (remember) {
    localStorage.setItem(REMEMBER_LOGIN_KEY, "true");
    return;
  }

  localStorage.removeItem(REMEMBER_LOGIN_KEY);
};

const shouldRememberLogin = () =>
  getBrowserStorage("local")?.getItem(REMEMBER_LOGIN_KEY) === "true";

export const clearLegacyAuthStorage = () => {
  const legacyKey = getLegacySupabaseStorageKey();

  if (!legacyKey || legacyKey === AUTH_STORAGE_KEY) {
    return;
  }

  getBrowserStorage("local")?.removeItem(legacyKey);
  getBrowserStorage("session")?.removeItem(legacyKey);
};

export const authStorage: SupportedStorage = {
  getItem: (key) => {
    if (key !== AUTH_STORAGE_KEY) {
      return (
        getBrowserStorage("local")?.getItem(key) ??
        getBrowserStorage("session")?.getItem(key) ??
        null
      );
    }

    return (
      getBrowserStorage("local")?.getItem(AUTH_STORAGE_KEY) ??
      getBrowserStorage("session")?.getItem(AUTH_STORAGE_KEY) ??
      null
    );
  },
  setItem: (key, value) => {
    const persistentStorage = getBrowserStorage("local");
    const sessionStorage = getBrowserStorage("session");

    if (shouldRememberLogin()) {
      sessionStorage?.removeItem(key);
      persistentStorage?.setItem(key, value);
      return;
    }

    persistentStorage?.removeItem(key);
    sessionStorage?.setItem(key, value);
  },
  removeItem: (key) => {
    getBrowserStorage("local")?.removeItem(key);
    getBrowserStorage("session")?.removeItem(key);
  },
};

export { AUTH_STORAGE_KEY };

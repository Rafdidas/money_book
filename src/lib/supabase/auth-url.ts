import { supabase } from "@/lib/supabase/client";

const getAuthParamsFromHash = () => {
  if (typeof window === "undefined" || !window.location.hash) {
    return null;
  }

  const params = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
  };
};

export const clearAuthHash = () => {
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`,
  );
};

export const consumeAuthHashSession = async () => {
  const authParams = getAuthParamsFromHash();

  if (!authParams) {
    return false;
  }

  const { error } = await supabase.auth.setSession({
    access_token: authParams.accessToken,
    refresh_token: authParams.refreshToken,
  });

  clearAuthHash();

  if (error) {
    throw error;
  }

  return true;
};

export const getAuthCallbackUrl = () => {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  return new URL("/auth/callback", origin).toString();
};

export const getResetPasswordUrl = () => {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  return new URL("/auth/reset-password", origin).toString();
};

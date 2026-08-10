import { supabase } from "@/lib/supabase/client";

export type AccountOverview = {
  name: string;
  email: string;
  createdAt: string;
  termsVersion: string | null;
  termsAgreedAt: string | null;
  privacyVersion: string | null;
  privacyAgreedAt: string | null;
  ageConfirmedAt: string | null;
};

const requireUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  return user;
};

export const getAccountOverview = async (): Promise<AccountOverview> => {
  const user = await requireUser();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("terms_version, terms_agreed_at, privacy_version, privacy_agreed_at, age_confirmed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    name: typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "",
    email: user.email ?? "",
    createdAt: user.created_at,
    termsVersion: profile?.terms_version ?? null,
    termsAgreedAt: profile?.terms_agreed_at ?? null,
    privacyVersion: profile?.privacy_version ?? null,
    privacyAgreedAt: profile?.privacy_agreed_at ?? null,
    ageConfirmedAt: profile?.age_confirmed_at ?? null,
  };
};

export const updateDisplayName = async (name: string) => {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error("이름을 입력해주세요.");
  }

  // 이름은 profiles가 아니라 auth.users의 메타데이터에 있다.
  // src/app/providers.tsx가 user_metadata.name을 읽어 화면에 쓴다.
  const { error } = await supabase.auth.updateUser({ data: { name: trimmed } });

  if (error) {
    throw new Error("이름을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.");
  }

  return trimmed;
};

const reauthenticate = async (email: string, password: string, message: string) => {
  // Supabase에는 현재 비밀번호만 검증하는 API가 없어 재로그인으로 확인한다.
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(message);
  }
};

export const changePassword = async ({
  email,
  currentPassword,
  newPassword,
}: {
  email: string;
  currentPassword: string;
  newPassword: string;
}) => {
  await reauthenticate(email, currentPassword, "현재 비밀번호가 올바르지 않습니다.");

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    throw new Error("비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.");
  }

  // 유출을 의심해 바꾸는 경우 다른 기기 세션이 남으면 의미가 없다.
  // 다만 이 호출이 실패해도 변경 자체는 이미 성공했으므로 실패로 알리지 않는다.
  try {
    const { error: signOutError } = await supabase.auth.signOut({ scope: "others" });

    return { otherSessionsRevoked: !signOutError };
  } catch {
    return { otherSessionsRevoked: false };
  }
};

export const deleteAccount = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  await reauthenticate(email, password, "비밀번호가 올바르지 않습니다.");

  // 클라이언트는 자기 계정을 지울 수 없다. 삭제 대상 id는 서버가 세션에서
  // 직접 확인하므로 본문을 보내지 않는다.
  const response = await fetch("/api/account/delete", { method: "POST" });

  if (!response.ok) {
    throw new Error("탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해주세요.");
  }

  await supabase.auth.signOut();
};

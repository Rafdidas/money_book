import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, updateUser, signInWithPassword, signOut, from } = vi.hoisted(() => ({
  getUser: vi.fn(),
  updateUser: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: { auth: { getUser, updateUser, signInWithPassword, signOut }, from },
}));

import {
  changePassword,
  deleteAccount,
  getAccountOverview,
  updateDisplayName,
} from "@/lib/api/account";

const profileRow = {
  terms_version: "1.0",
  terms_agreed_at: "2026-08-01T00:00:00.000Z",
  privacy_version: "1.0",
  privacy_agreed_at: "2026-08-01T00:00:00.000Z",
  age_confirmed_at: "2026-08-01T00:00:00.000Z",
};

const mockProfile = (data: unknown, error: unknown = null) => {
  from.mockReturnValue({
    select: () => ({
      eq: () => ({
        maybeSingle: () => Promise.resolve({ data, error }),
      }),
    }),
  });
};

describe("account api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "hong@example.com",
          created_at: "2026-07-01T00:00:00.000Z",
          user_metadata: { name: "홍길동" },
        },
      },
      error: null,
    });
    mockProfile(profileRow);
    updateUser.mockResolvedValue({ error: null });
    signInWithPassword.mockResolvedValue({ error: null });
    signOut.mockResolvedValue({ error: null });
  });

  it("maps the auth user and profile row into one overview", async () => {
    const overview = await getAccountOverview();

    expect(overview).toEqual({
      name: "홍길동",
      email: "hong@example.com",
      createdAt: "2026-07-01T00:00:00.000Z",
      termsVersion: "1.0",
      termsAgreedAt: "2026-08-01T00:00:00.000Z",
      privacyVersion: "1.0",
      privacyAgreedAt: "2026-08-01T00:00:00.000Z",
      ageConfirmedAt: "2026-08-01T00:00:00.000Z",
    });
  });

  it("returns nulls when the profile has no consent record", async () => {
    // 동의 이력을 남기기 전에 가입한 계정은 값이 비어 있다. 오류가 아니다.
    mockProfile(null);

    const overview = await getAccountOverview();

    expect(overview.termsVersion).toBeNull();
    expect(overview.ageConfirmedAt).toBeNull();
    expect(overview.name).toBe("홍길동");
  });

  it("rejects a blank display name without calling supabase", async () => {
    await expect(updateDisplayName("   ")).rejects.toThrow("이름을 입력해주세요.");
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("saves the trimmed display name", async () => {
    const saved = await updateDisplayName("  홍길동  ");

    expect(updateUser).toHaveBeenCalledWith({ data: { name: "홍길동" } });
    expect(saved).toBe("홍길동");
  });

  it("does not change the password when reauthentication fails", async () => {
    signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });

    await expect(
      changePassword({
        email: "hong@example.com",
        currentPassword: "wrongpass1",
        newPassword: "password123",
      }),
    ).rejects.toThrow("현재 비밀번호가 올바르지 않습니다.");
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("changes the password and revokes other sessions", async () => {
    const result = await changePassword({
      email: "hong@example.com",
      currentPassword: "password123",
      newPassword: "newpass123",
    });

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "hong@example.com",
      password: "password123",
    });
    expect(updateUser).toHaveBeenCalledWith({ password: "newpass123" });
    expect(signOut).toHaveBeenCalledWith({ scope: "others" });
    expect(result).toEqual({ otherSessionsRevoked: true });
  });

  it("still reports success when revoking other sessions fails", async () => {
    signOut.mockResolvedValue({ error: { message: "network" } });

    const result = await changePassword({
      email: "hong@example.com",
      currentPassword: "password123",
      newPassword: "newpass123",
    });

    expect(result).toEqual({ otherSessionsRevoked: false });
  });

  it("does not call the delete route when the password is wrong", async () => {
    signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      deleteAccount({ email: "hong@example.com", password: "wrongpass1" }),
    ).rejects.toThrow("비밀번호가 올바르지 않습니다.");
    expect(fetchMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("posts to the delete route and signs out", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await deleteAccount({ email: "hong@example.com", password: "password123" });

    expect(fetchMock).toHaveBeenCalledWith("/api/account/delete", { method: "POST" });
    expect(signOut).toHaveBeenCalledWith();

    vi.unstubAllGlobals();
  });

  it("throws when the delete route rejects", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      deleteAccount({ email: "hong@example.com", password: "password123" }),
    ).rejects.toThrow("탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해주세요.");

    vi.unstubAllGlobals();
  });
});

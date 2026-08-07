import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { replace, getSession, updateUser, signOut, exchangeCodeForSession, consumeAuthHashSession } =
  vi.hoisted(() => ({
    replace: vi.fn(),
    getSession: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn(),
    exchangeCodeForSession: vi.fn(),
    consumeAuthHashSession: vi.fn(),
  }));

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(""),
}));
vi.mock("@/lib/supabase/auth-url", () => ({ consumeAuthHashSession }));
vi.mock("@/lib/supabase/client", () => ({
  supabase: { auth: { getSession, updateUser, signOut, exchangeCodeForSession } },
}));

import ResetPasswordPage from "./page";

const withSession = () => {
  getSession.mockResolvedValue({ data: { session: { user: { id: "user-1" } } } });
};

const withoutSession = () => {
  getSession.mockResolvedValue({ data: { session: null } });
};

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consumeAuthHashSession.mockResolvedValue(false);
    updateUser.mockResolvedValue({ error: null });
    signOut.mockResolvedValue({ error: null });
  });

  it("shows the expired notice with a retry link when no session exists", async () => {
    withoutSession();
    render(<ResetPasswordPage />);

    expect(await screen.findByText("링크가 만료되었어요")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "다시 요청하기" })).toHaveAttribute(
      "href",
      "/auth/forgot-password",
    );
  });

  it("shows the expired notice when consuming the hash throws", async () => {
    // 이미 사용된 링크는 setSession이 예외를 던진다.
    consumeAuthHashSession.mockRejectedValue(new Error("invalid token"));
    withoutSession();
    render(<ResetPasswordPage />);

    expect(await screen.findByText("링크가 만료되었어요")).toBeInTheDocument();
  });

  it("shows the form when the SDK already consumed the link", async () => {
    // detectSessionInUrl이 먼저 처리하면 해시 소비는 false를 반환하지만
    // 세션은 이미 존재한다. 이 경우를 만료로 오판하면 안 된다.
    withSession();
    render(<ResetPasswordPage />);

    expect(await screen.findByLabelText("새 비밀번호")).toBeInTheDocument();
  });

  it("rejects a password that breaks the rule", async () => {
    withSession();
    render(<ResetPasswordPage />);

    fireEvent.change(await screen.findByLabelText("새 비밀번호"), {
      target: { value: "abcdefgh" },
    });
    fireEvent.change(screen.getByLabelText("새 비밀번호 확인"), {
      target: { value: "abcdefgh" },
    });
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경" }));

    expect(
      screen.getByText("비밀번호는 8자 이상이며 영문과 숫자를 모두 포함해야 합니다."),
    ).toBeInTheDocument();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords", async () => {
    withSession();
    render(<ResetPasswordPage />);

    fireEvent.change(await screen.findByLabelText("새 비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("새 비밀번호 확인"), {
      target: { value: "password124" },
    });
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경" }));

    expect(screen.getByText("비밀번호가 일치하지 않습니다.")).toBeInTheDocument();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("updates the password and revokes other sessions", async () => {
    withSession();
    render(<ResetPasswordPage />);

    fireEvent.change(await screen.findByLabelText("새 비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("새 비밀번호 확인"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경" }));

    await waitFor(() => {
      expect(updateUser).toHaveBeenCalledWith({ password: "password123" });
    });
    // 유출을 의심해 재설정하는 경우 다른 기기 세션이 남으면 의미가 없다.
    expect(signOut).toHaveBeenCalledWith({ scope: "others" });
    expect(await screen.findByText("비밀번호가 변경되었습니다")).toBeInTheDocument();
  });
});

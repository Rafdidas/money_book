import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  replace,
  getSession,
  updateUser,
  signOut,
  exchangeCodeForSession,
  consumeAuthHashSession,
  mockSearchParams,
} = vi.hoisted(() => ({
  replace: vi.fn(),
  getSession: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  consumeAuthHashSession: vi.fn(),
  mockSearchParams: { current: new URLSearchParams("") },
}));

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => mockSearchParams.current,
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
    mockSearchParams.current = new URLSearchParams("");
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

  it("shows the form when consuming the hash throws but a session already exists", async () => {
    // 해시 소비 호출의 성공 여부가 아니라 최종 세션 존재 여부로 판단해야 한다.
    // consumeAuthHashSession이 실패해도 세션이 있으면 만료로 오판하면 안 된다.
    consumeAuthHashSession.mockRejectedValue(new Error("invalid token"));
    withSession();
    render(<ResetPasswordPage />);

    expect(await screen.findByLabelText("새 비밀번호")).toBeInTheDocument();
    expect(screen.queryByText("링크가 만료되었어요")).not.toBeInTheDocument();
  });

  it("exchanges the code param for a session when arriving via ?code=", async () => {
    mockSearchParams.current = new URLSearchParams("code=abc123");
    withSession();
    exchangeCodeForSession.mockResolvedValue({ data: {}, error: null });
    render(<ResetPasswordPage />);

    expect(await screen.findByLabelText("새 비밀번호")).toBeInTheDocument();
    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(consumeAuthHashSession).not.toHaveBeenCalled();
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

  it("shows a calmer notice when revoking other sessions fails after the password change", async () => {
    withSession();
    signOut.mockResolvedValue({ error: new Error("revoke failed") });
    render(<ResetPasswordPage />);

    fireEvent.change(await screen.findByLabelText("새 비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("새 비밀번호 확인"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경" }));

    // 비밀번호 변경은 이미 성공했으므로 실패로 보고해서는 안 된다.
    expect(await screen.findByText("비밀번호가 변경되었습니다")).toBeInTheDocument();
    expect(
      screen.getByText("다른 기기에 남아 있던 로그인이 아직 해제되지 않았을 수 있습니다."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해주세요."),
    ).not.toBeInTheDocument();
  });

  it("consumes the recovery link exactly once even though the effect could rerun", async () => {
    // 이 테스트가 실제로 검증하는 것: 마운트 이펙트는 링크 진입 시 세션을
    // 딱 한 번만 확인한다(getSession 1회 호출). initialCode가 useState
    // 초기값으로 고정되어 있어 이펙트는 재실행되지 않으므로, 이 테스트는
    // setStatus의 함수형 업데이트 가드 자체를 검증하지는 못한다(그 가드가
    // 평범한 setStatus(...)로 바뀌어도 이 어서션들은 여전히 통과한다).
    // 가드에 대한 근거는 page.tsx의 주석을 참고.
    withSession();
    render(<ResetPasswordPage />);

    fireEvent.change(await screen.findByLabelText("새 비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("새 비밀번호 확인"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경" }));

    expect(await screen.findByText("비밀번호가 변경되었습니다")).toBeInTheDocument();

    // 세션 확인(getSession)이 정확히 한 번만 일어났는지 확인한다.
    expect(getSession).toHaveBeenCalledTimes(1);
  });
});

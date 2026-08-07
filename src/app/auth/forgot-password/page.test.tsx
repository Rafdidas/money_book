import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { resetPasswordForEmail } = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn(),
}));

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/lib/supabase/auth-url", () => ({
  getResetPasswordUrl: () => "http://localhost/auth/reset-password",
}));
vi.mock("@/lib/supabase/client", () => ({
  supabase: { auth: { resetPasswordForEmail } },
}));

import ForgotPasswordPage from "./page";

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetPasswordForEmail.mockResolvedValue({ error: null });
  });

  it("does not send a mail when the email field is empty", () => {
    render(<ForgotPasswordPage />);

    fireEvent.click(screen.getByRole("button", { name: "재설정 링크 받기" }));

    expect(screen.getByText("이메일을 입력해주세요.")).toBeInTheDocument();
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("sends the trimmed email with the reset password redirect", async () => {
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText("이메일"), {
      target: { value: "  hong@example.com  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "재설정 링크 받기" }));

    await waitFor(() => {
      expect(resetPasswordForEmail).toHaveBeenCalledWith("hong@example.com", {
        redirectTo: "http://localhost/auth/reset-password",
      });
    });
  });

  it("shows the same completion screen when the request fails", async () => {
    // 가입 여부가 새어나가지 않도록 오류와 성공을 구분해 보여주지 않는다.
    resetPasswordForEmail.mockResolvedValue({ error: { message: "User not found" } });
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText("이메일"), {
      target: { value: "nobody@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "재설정 링크 받기" }));

    expect(await screen.findByText("메일을 보냈습니다")).toBeInTheDocument();
    expect(screen.getByText(/nobody@example.com/)).toBeInTheDocument();
    expect(screen.queryByText(/User not found/)).not.toBeInTheDocument();
  });

  it("keeps the resend button disabled during the cooldown", async () => {
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText("이메일"), {
      target: { value: "hong@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "재설정 링크 받기" }));

    expect(await screen.findByRole("button", { name: /다시 보내기/ })).toBeDisabled();
  });
});

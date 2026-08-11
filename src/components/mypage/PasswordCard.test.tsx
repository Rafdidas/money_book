import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { changePassword } = vi.hoisted(() => ({ changePassword: vi.fn() }));

vi.mock("@/lib/api/account", () => ({ changePassword }));

import PasswordCard from "./PasswordCard";

const fill = (current: string, next: string, confirm: string) => {
  fireEvent.change(screen.getByLabelText("현재 비밀번호"), { target: { value: current } });
  fireEvent.change(screen.getByLabelText("새 비밀번호"), { target: { value: next } });
  fireEvent.change(screen.getByLabelText("새 비밀번호 확인"), { target: { value: confirm } });
};

describe("PasswordCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    changePassword.mockResolvedValue({ otherSessionsRevoked: true });
  });

  it("rejects a new password that breaks the rule before calling the api", () => {
    render(<PasswordCard email="hong@example.com" />);

    fill("password123", "abcdefgh", "abcdefgh");
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경" }));

    expect(
      screen.getByText("비밀번호는 8자 이상이며 영문과 숫자를 모두 포함해야 합니다."),
    ).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();

    const newPasswordInput = screen.getByLabelText("새 비밀번호");
    expect(newPasswordInput).toHaveAttribute("aria-invalid", "true");
    expect(newPasswordInput).toHaveAttribute("aria-describedby", "mypage-password-error");
    expect(screen.getByLabelText("현재 비밀번호")).toHaveAttribute("aria-invalid", "false");
    expect(screen.getByLabelText("새 비밀번호 확인")).toHaveAttribute("aria-invalid", "false");
  });

  it("rejects mismatched confirmation", () => {
    render(<PasswordCard email="hong@example.com" />);

    fill("password123", "newpass123", "newpass124");
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경" }));

    expect(screen.getByText("비밀번호가 일치하지 않습니다.")).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();

    const confirmInput = screen.getByLabelText("새 비밀번호 확인");
    expect(confirmInput).toHaveAttribute("aria-invalid", "true");
    expect(confirmInput).toHaveAttribute("aria-describedby", "mypage-password-error");
    expect(screen.getByLabelText("현재 비밀번호")).toHaveAttribute("aria-invalid", "false");
    expect(screen.getByLabelText("새 비밀번호")).toHaveAttribute("aria-invalid", "false");
  });

  it("requires the current password", () => {
    render(<PasswordCard email="hong@example.com" />);

    fill("", "newpass123", "newpass123");
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경" }));

    expect(screen.getByText("현재 비밀번호를 입력해주세요.")).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();

    const currentInput = screen.getByLabelText("현재 비밀번호");
    expect(currentInput).toHaveAttribute("aria-invalid", "true");
    expect(currentInput).toHaveAttribute("aria-describedby", "mypage-password-error");
  });

  it("surfaces a wrong current password", async () => {
    changePassword.mockRejectedValue(new Error("현재 비밀번호가 올바르지 않습니다."));
    render(<PasswordCard email="hong@example.com" />);

    fill("wrongpass1", "newpass123", "newpass123");
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경" }));

    expect(await screen.findByText("현재 비밀번호가 올바르지 않습니다.")).toBeInTheDocument();
    expect(screen.getByLabelText("현재 비밀번호")).toHaveAttribute("aria-invalid", "true");
  });

  it("changes the password and reports other devices were signed out", async () => {
    render(<PasswordCard email="hong@example.com" />);

    fill("password123", "newpass123", "newpass123");
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경" }));

    await waitFor(() => {
      expect(changePassword).toHaveBeenCalledWith({
        email: "hong@example.com",
        currentPassword: "password123",
        newPassword: "newpass123",
      });
    });
    expect(
      await screen.findByText("비밀번호를 변경했습니다. 다른 기기의 로그인은 모두 해제했습니다."),
    ).toBeInTheDocument();
  });

  it("warns when other devices could not be signed out", async () => {
    changePassword.mockResolvedValue({ otherSessionsRevoked: false });
    render(<PasswordCard email="hong@example.com" />);

    fill("password123", "newpass123", "newpass123");
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경" }));

    expect(
      await screen.findByText(
        "비밀번호를 변경했습니다. 다른 기기의 로그인이 아직 해제되지 않았을 수 있습니다.",
      ),
    ).toBeInTheDocument();
  });
});

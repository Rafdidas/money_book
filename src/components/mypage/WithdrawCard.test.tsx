import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { deleteAccount, replace } = vi.hoisted(() => ({
  deleteAccount: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@/lib/api/account", () => ({ deleteAccount }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

import WithdrawCard from "./WithdrawCard";

describe("WithdrawCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteAccount.mockResolvedValue(undefined);
  });

  it("keeps the confirmation form hidden until the card is opened", () => {
    render(<WithdrawCard email="hong@example.com" />);

    expect(screen.queryByLabelText("비밀번호")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "회원 탈퇴" })).toBeInTheDocument();
  });

  it("lists what will be deleted once opened", () => {
    render(<WithdrawCard email="hong@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "회원 탈퇴" }));

    expect(screen.getByText(/가계부 기록/)).toBeInTheDocument();
    expect(screen.getByText(/복구할 수 없습니다/)).toBeInTheDocument();
    expect(screen.getByLabelText("비밀번호")).toBeInTheDocument();
  });

  it("does not delete without a password", () => {
    render(<WithdrawCard email="hong@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "회원 탈퇴" }));
    fireEvent.click(screen.getByRole("button", { name: "탈퇴하기" }));

    expect(screen.getByText("비밀번호를 입력해주세요.")).toBeInTheDocument();
    expect(deleteAccount).not.toHaveBeenCalled();
  });

  it("surfaces a wrong password", async () => {
    deleteAccount.mockRejectedValue(new Error("비밀번호가 올바르지 않습니다."));
    render(<WithdrawCard email="hong@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "회원 탈퇴" }));
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "wrongpass1" } });
    fireEvent.click(screen.getByRole("button", { name: "탈퇴하기" }));

    expect(await screen.findByText("비밀번호가 올바르지 않습니다.")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("deletes the account and leaves for the landing page", async () => {
    render(<WithdrawCard email="hong@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "회원 탈퇴" }));
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "탈퇴하기" }));

    await waitFor(() => {
      expect(deleteAccount).toHaveBeenCalledWith({
        email: "hong@example.com",
        password: "password123",
      });
    });
    expect(replace).toHaveBeenCalledWith("/");
  });
});

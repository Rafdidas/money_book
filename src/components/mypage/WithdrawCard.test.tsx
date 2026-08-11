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

  it("keeps the submit button disabled after a successful delete instead of re-enabling it", async () => {
    // 성공 이후 router.replace가 실제로 반영되기 전에 버튼이 다시 활성화되면,
    // 이미 삭제된 계정으로 중복 제출이 발생할 수 있다.
    render(<WithdrawCard email="hong@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "회원 탈퇴" }));
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "탈퇴하기" }));

    await waitFor(() => {
      expect(deleteAccount).toHaveBeenCalled();
    });

    expect(screen.getByRole("button", { name: "처리 중..." })).toBeDisabled();
  });

  it("shows only a plain toggle when collapsed, and the card heading once opened", () => {
    // 접힌 상태에서는 카드 제목까지 보이면 비밀번호 변경과 같은 무게로 읽힌다.
    // 평생 한 번 쓸까 말까 한 기능이라 접힌 동안에는 버튼 하나만 남긴다.
    render(<WithdrawCard email="hong@example.com" />);

    expect(screen.queryByRole("heading", { name: "회원 탈퇴" })).not.toBeInTheDocument();
    expect(screen.queryByText("계정과 기록을 모두 삭제합니다.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "회원 탈퇴" }));

    expect(screen.getByRole("heading", { name: "회원 탈퇴" })).toBeInTheDocument();
    expect(screen.getByText("계정과 기록을 모두 삭제합니다.")).toBeInTheDocument();
  });
});

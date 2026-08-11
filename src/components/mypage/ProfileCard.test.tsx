import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateDisplayName } = vi.hoisted(() => ({ updateDisplayName: vi.fn() }));

vi.mock("@/lib/api/account", () => ({ updateDisplayName }));

import ProfileCard from "./ProfileCard";

const overview = {
  name: "홍길동",
  email: "hong@example.com",
  createdAt: "2026-07-01T00:00:00.000Z",
  termsVersion: null,
  termsAgreedAt: null,
  privacyVersion: null,
  privacyAgreedAt: null,
  ageConfirmedAt: null,
};

describe("ProfileCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateDisplayName.mockResolvedValue("홍길동");
  });

  it("shows the email as read-only with the login id hint", () => {
    render(<ProfileCard overview={overview} onNameSaved={vi.fn()} />);

    expect(screen.getByText("hong@example.com")).toBeInTheDocument();
    expect(screen.getByText("로그인 아이디입니다.")).toBeInTheDocument();
    expect(screen.queryByLabelText("이메일")).not.toBeInTheDocument();
  });

  it("does not save a blank name", () => {
    render(<ProfileCard overview={overview} onNameSaved={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("이름"), { target: { value: "  " } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(screen.getByText("이름을 입력해주세요.")).toBeInTheDocument();
    expect(updateDisplayName).not.toHaveBeenCalled();
  });

  it("saves the name and reports it upward", async () => {
    const onNameSaved = vi.fn();
    updateDisplayName.mockResolvedValue("김철수");
    render(<ProfileCard overview={overview} onNameSaved={onNameSaved} />);

    fireEvent.change(screen.getByLabelText("이름"), { target: { value: "김철수" } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => {
      expect(updateDisplayName).toHaveBeenCalledWith("김철수");
    });
    expect(onNameSaved).toHaveBeenCalledWith("김철수");
    expect(await screen.findByText("이름을 저장했습니다.")).toBeInTheDocument();
  });

  it("shows the failure message when saving fails", async () => {
    updateDisplayName.mockRejectedValue(new Error("이름을 저장하지 못했습니다."));
    render(<ProfileCard overview={overview} onNameSaved={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("이름"), { target: { value: "김철수" } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(await screen.findByText("이름을 저장하지 못했습니다.")).toBeInTheDocument();
  });
});

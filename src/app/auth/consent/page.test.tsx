import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { replace, recordCurrentLegalConsent, getAuthenticatedDestination, signOut } = vi.hoisted(() => ({
  replace: vi.fn(),
  recordCurrentLegalConsent: vi.fn(),
  getAuthenticatedDestination: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/lib/api/legalConsent", () => ({ recordCurrentLegalConsent }));
vi.mock("@/app/providers", () => ({ getAuthenticatedDestination }));
vi.mock("@/lib/supabase/client", () => ({ supabase: { auth: { signOut } } }));

import ConsentPage from "./page";

const selectAllRequiredChecks = () => {
  fireEvent.click(screen.getByRole("checkbox", { name: /이용약관/ }));
  fireEvent.click(screen.getByRole("checkbox", { name: /개인정보 처리방침/ }));
  fireEvent.click(screen.getByRole("checkbox", { name: /만 14세 이상/ }));
};

describe("ConsentPage", () => {
  afterEach(cleanup);

  beforeEach(() => {
    recordCurrentLegalConsent.mockResolvedValue(undefined);
    getAuthenticatedDestination.mockResolvedValue("/app");
    signOut.mockResolvedValue({ error: null });
  });

  it("keeps a user on the page until all required choices are selected and consent recording succeeds", async () => {
    let resolveConsent: () => void = () => undefined;
    recordCurrentLegalConsent.mockImplementation(() => new Promise<void>((resolve) => {
      resolveConsent = resolve;
    }));
    render(<ConsentPage />);

    expect(screen.getByRole("heading", { name: "약관 재동의" })).toBeInTheDocument();
    const continueButton = screen.getByRole("button", { name: "동의하고 계속하기" });
    fireEvent.click(continueButton);
    expect(recordCurrentLegalConsent).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();

    selectAllRequiredChecks();
    fireEvent.click(continueButton);
    await waitFor(() => expect(recordCurrentLegalConsent).toHaveBeenCalledTimes(1));
    expect(replace).not.toHaveBeenCalled();

    resolveConsent();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/app"));
  });

  it("shows a Korean error and keeps focus on the first missing choice", () => {
    render(<ConsentPage />);

    fireEvent.click(screen.getByRole("checkbox", { name: /개인정보 처리방침/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /만 14세 이상/ }));
    fireEvent.click(screen.getByRole("button", { name: "동의하고 계속하기" }));

    expect(screen.getByRole("alert")).toHaveTextContent("모든 필수 약관에 동의해주세요.");
    expect(screen.getByRole("checkbox", { name: /이용약관/ })).toHaveFocus();
  });

  it("shows a Korean error instead of navigating when consent recording fails", async () => {
    recordCurrentLegalConsent.mockRejectedValue(new Error("동의 기록을 저장하지 못했습니다."));
    render(<ConsentPage />);

    selectAllRequiredChecks();
    fireEvent.click(screen.getByRole("button", { name: "동의하고 계속하기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("동의 기록을 저장하지 못했습니다.");
    expect(replace).not.toHaveBeenCalled();
  });

  it("signs out and returns to login", async () => {
    render(<ConsentPage />);

    fireEvent.click(screen.getByRole("button", { name: "로그아웃" }));

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
    expect(replace).toHaveBeenCalledWith("/auth/login");
  });
});

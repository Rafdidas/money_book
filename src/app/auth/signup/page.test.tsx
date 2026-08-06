import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { replace, refresh, signUp } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));
vi.mock("@/lib/demo", () => ({ disableDemoMode: vi.fn() }));
vi.mock("@/lib/supabase/auth-url", () => ({ getAuthCallbackUrl: () => "http://localhost/auth/callback" }));
vi.mock("@/lib/supabase/client", () => ({ supabase: { auth: { signUp } } }));

import {
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
} from "@/lib/legal/legalDocuments";
import SignupPage from "./page";

describe("SignupPage legal consent validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the Korean consent error and focuses the first unchecked checkbox", () => {
    render(<SignupPage />);

    fireEvent.change(screen.getByLabelText("이름"), { target: { value: "홍길동" } });
    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "hong@example.com" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText("비밀번호 확인"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "회원가입" }));

    expect(screen.getByRole("alert")).toHaveTextContent("회원가입을 위해 모든 필수 약관에 동의해주세요.");
    expect(screen.getByRole("checkbox", { name: /이용약관/ })).toHaveFocus();
    expect(signUp).not.toHaveBeenCalled();
  });

  it("checks every required consent when 전체 동의 is selected", () => {
    render(<SignupPage />);

    fireEvent.click(screen.getByRole("checkbox", { name: "전체 동의" }));

    expect(screen.getByRole("checkbox", { name: /이용약관/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /개인정보 처리방침/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /만 14세/ })).toBeChecked();
  });

  it("marks 전체 동의 indeterminate while only some consents are checked", () => {
    render(<SignupPage />);

    const selectAll = screen.getByRole("checkbox", { name: "전체 동의" }) as HTMLInputElement;
    expect(selectAll.indeterminate).toBe(false);

    fireEvent.click(screen.getByRole("checkbox", { name: /이용약관/ }));

    expect(selectAll.indeterminate).toBe(true);
    expect(selectAll).not.toBeChecked();
  });

  it("clears every consent when 전체 동의 is unselected", () => {
    render(<SignupPage />);

    const selectAll = screen.getByRole("checkbox", { name: "전체 동의" });
    fireEvent.click(selectAll);
    fireEvent.click(selectAll);

    expect(screen.getByRole("checkbox", { name: /이용약관/ })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /만 14세/ })).not.toBeChecked();
  });

  it("sends the consent flags under the keys the database trigger reads", async () => {
    signUp.mockResolvedValue({ error: null });
    render(<SignupPage />);

    fireEvent.change(screen.getByLabelText("이름"), { target: { value: "홍길동" } });
    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "hong@example.com" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText("비밀번호 확인"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /이용약관/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /개인정보 처리방침/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /만 14세/ }));
    fireEvent.click(screen.getByRole("button", { name: "회원가입" }));

    // handle_new_user_profile 트리거가 읽는 키와 어긋나면 모든 신규 가입이 거부된다.
    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          data: expect.objectContaining({
            terms_agreed: true,
            privacy_agreed: true,
            age_confirmed: true,
            terms_version: CURRENT_TERMS_VERSION,
            privacy_version: CURRENT_PRIVACY_VERSION,
          }),
        }),
      }),
    );
  });
});
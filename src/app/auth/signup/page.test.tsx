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
});
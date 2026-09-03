import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { signInWithPassword, getAuthenticatedDestination, replace, refresh, disableDemoMode } = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  getAuthenticatedDestination: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  disableDemoMode: vi.fn(),
}));
const router = { replace, refresh };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/app/providers", () => ({ getAuthenticatedDestination }));
vi.mock("@/lib/supabase/client", () => ({ supabase: { auth: { signInWithPassword } } }));
vi.mock("@/lib/demo", () => ({ disableDemoMode, enableDemoMode: vi.fn() }));
vi.mock("@/lib/supabase/auth-storage", () => ({ setRememberLogin: vi.fn() }));

import LoginPage from "./page";

const user = { id: "user-1", email: "hong@example.com" };
const submitLogin = () => {
  fireEvent.change(screen.getByLabelText("이메일"), { target: { value: user.email } });
  fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "test-password" } });
  fireEvent.click(screen.getByRole("button", { name: "로그인", exact: true }));
};

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthenticatedDestination.mockResolvedValue("/auth/login");
    signInWithPassword.mockResolvedValue({ data: { user }, error: null });
  });
  afterEach(() => vi.useRealTimers());

  it("keeps feedback and controls locked from authentication through navigation", async () => {
    let finishLogin!: (value: unknown) => void;
    signInWithPassword.mockReturnValue(new Promise((resolve) => { finishLogin = resolve; }));
    render(<LoginPage />);
    await act(async () => {});
    getAuthenticatedDestination.mockResolvedValue("/app");
    submitLogin();
    expect(screen.getByRole("status")).toHaveTextContent("로그인 정보를 확인하고 있어요.");
    expect(screen.getByRole("button", { name: "로그인 중..." })).toBeDisabled();
    fireEvent.submit(screen.getByLabelText("이메일").closest("form")!);
    expect(signInWithPassword).toHaveBeenCalledTimes(1);

    await act(async () => finishLogin({ data: { user }, error: null }));
    expect(replace).toHaveBeenCalledWith("/app");
    expect(getAuthenticatedDestination).toHaveBeenLastCalledWith(user);
    expect(screen.getByRole("button", { name: "화면 이동 중..." })).toBeDisabled();
    expect(screen.getByLabelText("이메일")).toHaveValue(user.email);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("preserves credentials and permits retry after a rejected login", async () => {
    signInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: "Invalid login credentials" } });
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<LoginPage />);
    submitLogin();
    expect(await screen.findByRole("alert")).toHaveTextContent("이메일 또는 비밀번호를 확인해주세요.");
    expect(screen.getByLabelText("이메일")).toHaveValue(user.email);
    expect(screen.getByRole("button", { name: "로그인", exact: true })).toBeEnabled();
    expect(alert).not.toHaveBeenCalled();
  });

  it("unlocks the form after a network failure", async () => {
    signInWithPassword.mockRejectedValue(new Error("offline"));
    render(<LoginPage />);
    submitLogin();
    expect(await screen.findByRole("alert")).toHaveTextContent("연결 상태를 확인한 뒤 다시 시도해주세요.");
    expect(screen.getByRole("button", { name: "로그인", exact: true })).toBeEnabled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("explains a slow request without sending a second login", async () => {
    vi.useFakeTimers();
    signInWithPassword.mockReturnValue(new Promise(() => {}));
    render(<LoginPage />);
    await act(async () => {});
    submitLogin();
    await act(async () => vi.advanceTimersByTime(8000));
    expect(screen.getByRole("status")).toHaveTextContent("평소보다 시간이 걸리고 있어요. 잠시만 기다려주세요.");
    expect(signInWithPassword).toHaveBeenCalledTimes(1);
  });

  it("ignores an old initial session check once the user submits", async () => {
    let finishCheck!: (destination: string) => void;
    getAuthenticatedDestination.mockReturnValueOnce(new Promise((resolve) => { finishCheck = resolve; }));
    signInWithPassword.mockReturnValue(new Promise(() => {}));
    render(<LoginPage />);
    submitLogin();
    await act(async () => finishCheck("/app"));
    await waitFor(() => expect(signInWithPassword).toHaveBeenCalledTimes(1));
    expect(replace).not.toHaveBeenCalled();
  });
});

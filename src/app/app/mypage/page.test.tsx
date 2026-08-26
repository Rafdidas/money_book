import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useAppData, useCustomCategories } = vi.hoisted(() => ({ useAppData: vi.fn(), useCustomCategories: vi.fn() }));

vi.mock("@/app/providers", () => ({ useAppData }));
vi.mock("@/components/common/SideMenu", () => ({ default: () => null }));
vi.mock("@/lib/api/account", () => ({
  getAccountOverview: () => Promise.reject(new Error("not needed in shell tests")),
}));
vi.mock("@/lib/hooks/useCustomCategories", () => ({ useCustomCategories }));

import MyPage from "./page";

describe("MyPage shell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCustomCategories.mockReturnValue({ categories: [], isLoading: false, loadError: "", mutationError: "", busyKey: "", reload: vi.fn() });
  });

  it("shows the demo notice instead of account controls", () => {
    useAppData.mockReturnValue({
      displayName: "데모 사용자",
      displayEmail: "",
      isDemoMode: true,
      isAuthResolved: true,
    });

    render(<MyPage />);

    expect(
      screen.getByText("마이페이지는 로그인 후 이용할 수 있습니다."),
    ).toBeInTheDocument();
  });

  it("renders the page heading for a signed-in user", () => {
    useAppData.mockReturnValue({
      displayName: "홍길동",
      displayEmail: "hong@example.com",
      isDemoMode: false,
      isAuthResolved: true,
    });

    render(<MyPage />);

    expect(screen.getByRole("heading", { name: "마이페이지" })).toBeInTheDocument();
    expect(
      screen.queryByText("마이페이지는 로그인 후 이용할 수 있습니다."),
    ).not.toBeInTheDocument();
  });

  it("renders nothing while auth state has not resolved yet", () => {
    useAppData.mockReturnValue({
      displayName: "홍길동",
      displayEmail: "hong@example.com",
      isDemoMode: false,
      isAuthResolved: false,
    });

    render(<MyPage />);

    expect(
      screen.queryByRole("heading", { name: "마이페이지" }),
    ).not.toBeInTheDocument();
  });
});

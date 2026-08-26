import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import AppAlertProvider from "@/components/app-alert/AppAlertProvider";
import type { CustomCategory, CustomCategoryType } from "@/lib/api/customCategories";
import CategoryManager from "./CategoryManager";

const category = (
  id: string,
  type: CustomCategoryType,
  name: string,
  isFavorite = false,
): CustomCategory => ({
  id,
  type,
  name,
  isFavorite,
  lastUsedAt: "2026-08-25T00:00:00.000Z",
});

const expenseFavorite = category("favorite", "expense", "반려동물", true);
const expenseNormal = category("normal", "expense", "운동");

const callbacks = () => ({
  onTypeChange: vi.fn(),
  onRetry: vi.fn(),
  onAdd: vi.fn().mockResolvedValue(true),
  onRename: vi.fn().mockResolvedValue(true),
  onDelete: vi.fn().mockResolvedValue(true),
  onToggleFavorite: vi.fn().mockResolvedValue(true),
  onUse: vi.fn(),
});

const renderManager = (
  overrides: Partial<React.ComponentProps<typeof CategoryManager>> = {},
) => {
  const actions = callbacks();
  render(
    <AppAlertProvider>
      <CategoryManager
        headingId="category-manager-title"
        categories={[expenseFavorite, expenseNormal]}
        selectedType="expense"
        isLoading={false}
        loadError=""
        mutationError=""
        busyKey=""
        {...actions}
        {...overrides}
      />
    </AppAlertProvider>,
  );
  return { ...actions, ...overrides };
};

describe("CategoryManager", () => {
  afterEach(cleanup);
  beforeEach(() => vi.clearAllMocks());

  it("shows the supplied heading and changes the selected type through tabs", () => {
    const { onTypeChange } = renderManager();

    expect(screen.getByRole("heading", { name: "카테고리 관리" })).toHaveAttribute(
      "id",
      "category-manager-title",
    );
    fireEvent.click(screen.getByRole("button", { name: "수입 카테고리" }));
    expect(onTypeChange).toHaveBeenCalledWith("income");
  });

  it("validates an empty new category name before adding", () => {
    const { onAdd } = renderManager();

    fireEvent.click(screen.getByRole("button", { name: "카테고리 추가" }));

    expect(screen.getByText("카테고리 이름을 입력해주세요.")).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("adds a trimmed category name for the selected type", async () => {
    const { onAdd } = renderManager();

    fireEvent.change(screen.getByLabelText("새 카테고리 이름"), { target: { value: "  반려동물 병원  " } });
    fireEvent.click(screen.getByRole("button", { name: "카테고리 추가" }));

    await waitFor(() => expect(onAdd).toHaveBeenCalledWith("expense", "반려동물 병원"));
  });

  it("renames a category inline and can cancel without saving", async () => {
    const { onRename } = renderManager();

    fireEvent.click(screen.getByRole("button", { name: "운동 카테고리 이름 수정" }));
    fireEvent.change(screen.getByLabelText("운동 카테고리 이름"), { target: { value: "헬스" } });
    fireEvent.click(screen.getByRole("button", { name: "이름 저장" }));
    await waitFor(() => expect(onRename).toHaveBeenCalledWith(expenseNormal, "헬스"));

    fireEvent.click(screen.getByRole("button", { name: "운동 카테고리 이름 수정" }));
    fireEvent.click(screen.getByRole("button", { name: "수정 취소" }));
    expect(onRename).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText("운동 카테고리 이름")).not.toBeInTheDocument();
  });

  it("confirms deletion with the historical-entry notice", async () => {
    const { onDelete } = renderManager();

    fireEvent.click(screen.getByRole("button", { name: "운동 카테고리 삭제" }));
    expect(screen.getByText("기존 거래 내역은 변경되지 않습니다.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "삭제" }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(expenseNormal));
  });

  it("only disables adding a sixth favorite while allowing a current favorite to be cleared", () => {
    const fiveFavorites = [0, 1, 2, 3, 4].map((index) => category(`${index}`, "expense", `즐겨찾기 ${index}`, true));
    renderManager({ categories: [...fiveFavorites, expenseNormal] });

    expect(screen.getByRole("button", { name: "운동 자주 쓰기 지정" })).toBeDisabled();
    expect(screen.getByText("자주 쓰는 카테고리는 유형별 최대 5개까지 지정할 수 있어요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "즐겨찾기 0 자주 쓰기 해제" })).toBeEnabled();
  });

  it("uses a category when the optional callback is supplied and hides use actions otherwise", () => {
    const { onUse } = renderManager();
    fireEvent.click(screen.getByRole("button", { name: "운동 카테고리 사용" }));
    expect(onUse).toHaveBeenCalledWith(expenseNormal);

    cleanup();
    renderManager({ onUse: undefined });
    expect(screen.queryByRole("button", { name: "운동 카테고리 사용" })).not.toBeInTheDocument();
  });

  it("offers retry for load failures and displays mutation errors", () => {
    const { onRetry } = renderManager({ loadError: "목록을 불러오지 못했습니다.", mutationError: "이미 있는 카테고리입니다." });

    expect(screen.getByText("목록을 불러오지 못했습니다.")).toBeInTheDocument();
    expect(screen.getByText("이미 있는 카테고리입니다.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

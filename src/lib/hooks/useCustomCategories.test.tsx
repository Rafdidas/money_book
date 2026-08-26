import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  createCustomCategory: vi.fn(),
  deleteCustomCategory: vi.fn(),
  getCustomCategories: vi.fn(),
  renameCustomCategory: vi.fn(),
  setCustomCategoryFavorite: vi.fn(),
  touchCustomCategory: vi.fn(),
}));

const demo = vi.hoisted(() => ({
  readDemoCustomCategories: vi.fn(),
  writeDemoCustomCategories: vi.fn(),
}));

vi.mock("@/lib/api/customCategories", () => api);
vi.mock("@/lib/demo", () => demo);

import { useCustomCategories } from "./useCustomCategories";
import type { CustomCategory, CustomCategoryType } from "@/lib/api/customCategories";

const defaultOptionsByType: Record<CustomCategoryType, string[]> = {
  expense: ["🍚식비"],
  income: ["💵월급"],
  savings: ["📩저축"],
  investment: ["📈주식"],
};

const category = (overrides: Partial<CustomCategory> = {}): CustomCategory => ({
  id: "category-1",
  type: "expense",
  name: "반려동물",
  lastUsedAt: "2026-08-25T00:00:00.000Z",
  isFavorite: false,
  ...overrides,
});

const renderCategories = (options = {}) => renderHook(() => useCustomCategories({
  enabled: true,
  isDemoMode: false,
  defaultOptionsByType,
  ...options,
}));

describe("useCustomCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getCustomCategories.mockResolvedValue([]);
    demo.readDemoCustomCategories.mockReturnValue([]);
  });

  it("loads the authenticated user's saved categories", async () => {
    const saved = category();
    api.getCustomCategories.mockResolvedValue([saved]);

    const { result } = renderCategories();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.categories).toEqual([saved]);
    expect(result.current.loadError).toBe("");
  });

  it("does not read a store while disabled", async () => {
    const { result } = renderCategories({ enabled: false });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(api.getCustomCategories).not.toHaveBeenCalled();
    expect(demo.readDemoCustomCategories).not.toHaveBeenCalled();
  });

  it("keeps the page usable when loading categories fails", async () => {
    api.getCustomCategories.mockRejectedValue(new Error("connection lost"));
    const { result } = renderCategories();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.categories).toEqual([]);
    expect(result.current.loadError).toBe("카테고리를 불러오지 못했습니다.");
  });

  it("waits for persistence before adding a category to state", async () => {
    let resolveCreate: (value: CustomCategory) => void = () => undefined;
    api.createCustomCategory.mockImplementation(() => new Promise<CustomCategory>((resolve) => {
      resolveCreate = resolve;
    }));
    const { result } = renderCategories();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let action!: Promise<boolean>;
    act(() => { action = result.current.addCategory("expense", " 반려동물 "); });
    expect(result.current.categories).toEqual([]);
    expect(result.current.busyKey).toBe("add:expense");

    await act(async () => { resolveCreate(category()); await action; });
    expect(result.current.categories).toEqual([category()]);
    expect(result.current.busyKey).toBe("");
  });

  it("rejects blank and default category names without persisting", async () => {
    const { result } = renderCategories();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { expect(await result.current.addCategory("expense", " ")).toBe(false); });
    expect(result.current.mutationError).toBe("카테고리 이름을 입력해주세요.");
    await act(async () => { expect(await result.current.addCategory("expense", " 🍚식비 ")).toBe(false); });
    expect(result.current.mutationError).toBe("기본 카테고리와 같은 이름은 사용할 수 없습니다.");
    expect(api.createCustomCategory).not.toHaveBeenCalled();
  });

  it("blocks a sixth favorite locally before calling the API", async () => {
    const favorites = Array.from({ length: 5 }, (_, index) => category({
      id: `favorite-${index}`,
      isFavorite: true,
    }));
    const target = category({ id: "target" });
    api.getCustomCategories.mockResolvedValue([...favorites, target]);
    const { result } = renderCategories();
    await waitFor(() => expect(result.current.categories).toHaveLength(6));

    await act(async () => { expect(await result.current.toggleFavorite(target)).toBe(false); });
    expect(api.setCustomCategoryFavorite).not.toHaveBeenCalled();
    expect(result.current.mutationError).toBe("자주 쓰는 카테고리는 유형별로 5개까지 지정할 수 있습니다.");
  });

  it("reloads server state after a favorite-limit failure", async () => {
    const target = category();
    const reloaded = category({ id: "from-server", isFavorite: true });
    api.getCustomCategories.mockResolvedValueOnce([target]).mockResolvedValueOnce([reloaded]);
    api.setCustomCategoryFavorite.mockRejectedValue(new Error("favorite limit exceeded"));
    const { result } = renderCategories();
    await waitFor(() => expect(result.current.categories).toEqual([target]));

    await act(async () => { expect(await result.current.toggleFavorite(target)).toBe(false); });
    await waitFor(() => expect(result.current.categories).toEqual([reloaded]));
    expect(result.current.mutationError).toBe("자주 쓰는 카테고리는 유형별로 5개까지 지정할 수 있습니다.");
  });

  it("preserves an existing favorite when recording a used category", async () => {
    const favorite = category({ isFavorite: true });
    api.getCustomCategories.mockResolvedValue([favorite]);
    api.touchCustomCategory.mockResolvedValue(category({ lastUsedAt: "2026-08-26T00:00:00.000Z", isFavorite: false }));
    const { result } = renderCategories();
    await waitFor(() => expect(result.current.categories).toEqual([favorite]));

    await act(async () => {
      await expect(result.current.recordUsedCategory("expense", "반려동물")).resolves.toMatchObject({ id: favorite.id });
    });
    expect(result.current.categories).toEqual([category({ isFavorite: true, lastUsedAt: "2026-08-26T00:00:00.000Z" })]);
  });
});

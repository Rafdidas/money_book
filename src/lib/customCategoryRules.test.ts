import { describe, expect, it } from "vitest";
import type { CustomCategory } from "@/lib/api/customCategories";
import {
  getCategoriesForType,
  getCustomCategoryNameError,
  getFavoriteCategoriesForType,
  removeCustomCategory,
  replaceCustomCategory,
} from "./customCategoryRules";

const category = (overrides: Partial<CustomCategory> = {}): CustomCategory => ({
  id: "expense-1",
  type: "expense",
  name: "반려동물",
  lastUsedAt: "2026-08-20T00:00:00.000Z",
  isFavorite: false,
  ...overrides,
});

describe("custom category rules", () => {
  it("sorts one type with favorites before more recently used regular categories", () => {
    const categories = [
      category({ id: "regular-new", lastUsedAt: "2026-08-22T00:00:00.000Z" }),
      category({ id: "favorite-old", isFavorite: true, lastUsedAt: "2026-08-19T00:00:00.000Z" }),
      category({ id: "income", type: "income", isFavorite: true, lastUsedAt: "2026-08-23T00:00:00.000Z" }),
      category({ id: "favorite-new", isFavorite: true, lastUsedAt: "2026-08-21T00:00:00.000Z" }),
    ];

    expect(getCategoriesForType(categories, "expense").map(({ id }) => id)).toEqual([
      "favorite-new",
      "favorite-old",
      "regular-new",
    ]);
  });

  it("returns only the five most recently used favorites for one type", () => {
    const categories = Array.from({ length: 6 }, (_, index) => category({
      id: `expense-${index}`,
      name: `분류 ${index}`,
      lastUsedAt: `2026-08-${String(index + 10).padStart(2, "0")}T00:00:00.000Z`,
      isFavorite: true,
    }));

    expect(getFavoriteCategoriesForType(categories, "expense").map(({ id }) => id)).toEqual([
      "expense-5", "expense-4", "expense-3", "expense-2", "expense-1",
    ]);
  });

  it("rejects empty, duplicate, and default names while allowing valid renames and other types", () => {
    const categories = [category(), category({ id: "income-1", type: "income" })];

    expect(getCustomCategoryNameError({ categories, type: "expense", name: "   ", defaultNames: [] })).toBe("카테고리 이름을 입력해주세요.");
    expect(getCustomCategoryNameError({ categories, type: "expense", name: " 반려동물 ", defaultNames: ["🍚식비"] })).toBe("이미 등록된 카테고리입니다.");
    expect(getCustomCategoryNameError({ categories, type: "expense", name: "🍚식비", defaultNames: ["🍚식비"] })).toBe("기본 카테고리와 같은 이름은 사용할 수 없습니다.");
    expect(getCustomCategoryNameError({ categories, type: "expense", name: "반려동물", defaultNames: [], excludeId: "expense-1" })).toBe("");
    expect(getCustomCategoryNameError({ categories, type: "savings", name: "반려동물", defaultNames: [] })).toBe("");
  });

  it("replaces and removes only the matching id without mutating input", () => {
    const original = [category({ id: "one", name: "병원" }), category({ id: "two", name: "반려동물" })];
    const updated = category({ id: "two", name: "동물병원" });

    expect(replaceCustomCategory(original, updated)).toEqual([original[0], updated]);
    expect(removeCustomCategory(original, "one")).toEqual([original[1]]);
    expect(original).toEqual([category({ id: "one", name: "병원" }), category({ id: "two", name: "반려동물" })]);
  });
});

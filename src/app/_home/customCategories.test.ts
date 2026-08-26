import { describe, expect, it } from "vitest";
import type { CustomCategory } from "@/lib/api/customCategories";
import {
  getRecentCategoriesForType,
  loadRecentCustomCategories,
  removeCustomCategory,
  upsertRecentCategory,
} from "./customCategories";

const category = (
  id: string,
  type: CustomCategory["type"],
  name: string,
  lastUsedAt: string,
): CustomCategory => ({ id, type, name, lastUsedAt, isFavorite: false });

describe("custom category list helpers", () => {
  it("keeps five newest categories for one type without affecting another type", () => {
    const incomeCategory = category("income", "income", "급여", "2026-07-20T10:00:00.000Z");
    const categories = [
      incomeCategory,
      category("expense-1", "expense", "식비", "2026-07-20T01:00:00.000Z"),
      category("expense-2", "expense", "교통", "2026-07-20T02:00:00.000Z"),
      category("expense-3", "expense", "주거", "2026-07-20T03:00:00.000Z"),
      category("expense-4", "expense", "의료", "2026-07-20T04:00:00.000Z"),
      category("expense-5", "expense", "취미", "2026-07-20T05:00:00.000Z"),
      category("expense-6", "expense", "쇼핑", "2026-07-20T06:00:00.000Z"),
    ];

    expect(getRecentCategoriesForType(categories, "expense")).toEqual([
      categories[6],
      categories[5],
      categories[4],
      categories[3],
      categories[2],
    ]);
    expect(getRecentCategoriesForType(categories, "income")).toEqual([incomeCategory]);
  });

  it("moves a reused normalized category to the front without duplicating it", () => {
    const categories = [
      category("income", "income", "급여", "2026-07-20T10:00:00.000Z"),
      category("old-expense", "expense", " 병원 ", "2026-07-18T10:00:00.000Z"),
      category("new-expense", "expense", "식비", "2026-07-19T10:00:00.000Z"),
    ];
    const reusedCategory = category("updated-expense", "expense", "병원", "2026-07-20T10:00:00.000Z");

    const result = upsertRecentCategory(categories, reusedCategory);

    expect(result).toHaveLength(categories.length);
    expect(result).toEqual([reusedCategory, categories[0], categories[2]]);
    expect(result).not.toBe(categories);
    expect(categories).toHaveLength(3);
  });

  it("removes only the requested suggestion while leaving other categories intact", () => {
    const categories = [
      category("category-1", "expense", "식비", "2026-07-20T10:00:00.000Z"),
      category("category-2", "expense", "교통", "2026-07-19T10:00:00.000Z"),
      category("category-3", "income", "급여", "2026-07-18T10:00:00.000Z"),
    ];

    const result = removeCustomCategory(categories, "category-2");

    expect(result).toEqual([categories[0], categories[2]]);
    expect(result).not.toBe(categories);
    expect(categories).toHaveLength(3);
  });

  it("isolates a recent-category query failure from dashboard data loading", async () => {
    const expenses = [{ id: "existing-expense" }];
    const accounts = [{ id: "existing-account" }];
    const rules = [{ id: "existing-rule" }];

    const [loadedExpenses, loadedAccounts, loadedRules, loadedCategories] =
      await Promise.all([
        Promise.resolve(expenses),
        Promise.resolve(accounts),
        Promise.resolve(rules),
        loadRecentCustomCategories(() => Promise.reject(new Error("조회 실패"))),
      ]);

    expect(loadedExpenses).toBe(expenses);
    expect(loadedAccounts).toBe(accounts);
    expect(loadedRules).toBe(rules);
    expect(loadedCategories).toEqual([]);
  });
});

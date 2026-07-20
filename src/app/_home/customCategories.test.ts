import { describe, expect, it } from "vitest";
import type { CustomCategory } from "@/lib/api/customCategories";
import {
  getRecentCategoriesForType,
  upsertRecentCategory,
} from "./customCategories";

const category = (
  id: string,
  type: CustomCategory["type"],
  name: string,
  lastUsedAt: string,
): CustomCategory => ({ id, type, name, lastUsedAt });

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
});

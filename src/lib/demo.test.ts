import { beforeEach, describe, expect, it } from "vitest";
import {
  clearDemoMode,
  DEMO_CUSTOM_CATEGORIES_STORAGE_KEY,
  readDemoExpenses,
  readDemoCustomCategories,
  writeDemoExpenses,
  writeDemoCustomCategories,
} from "./demo";
import type { Expense } from "@/types/expense";

const category = {
  id: "expense",
  type: "expense" as const,
  name: "병원",
  lastUsedAt: "2026-07-20T10:00:00.000Z",
};

describe("demo custom category storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("reads only valid custom category records from versioned demo storage", () => {
    window.localStorage.setItem(
      DEMO_CUSTOM_CATEGORIES_STORAGE_KEY,
      JSON.stringify([
        category,
        { ...category, id: 1 },
        { ...category, id: "   " },
        { ...category, type: "invalid" },
        { ...category, name: "" },
        { ...category, lastUsedAt: "not-a-timestamp" },
        null,
      ]),
    );

    expect(readDemoCustomCategories()).toEqual([{ ...category, isFavorite: false }]);
  });

  it("migrates legacy categories with a non-favorite default", () => {
    window.localStorage.setItem("mb-demo-custom-categories:v1", JSON.stringify([category]));

    expect(readDemoCustomCategories()).toEqual([{ ...category, isFavorite: false }]);
  });

  it("writes categories and clears them with demo reset", () => {
    writeDemoCustomCategories([category]);

    expect(JSON.parse(window.localStorage.getItem(DEMO_CUSTOM_CATEGORIES_STORAGE_KEY) ?? "null")).toEqual([
      category,
    ]);

    clearDemoMode();

    expect(window.localStorage.getItem(DEMO_CUSTOM_CATEGORIES_STORAGE_KEY)).toBeNull();
  });
});

describe("demo expense durable subtype storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("preserves custom savings and investment subtypes across a storage reload", () => {
    const entries = (["savings", "investment"] as const).map((entryType) => ({
      id: `custom-${entryType}`,
      user_id: "demo-user",
      amount: 10000,
      type: "expense" as const,
      entry_type: entryType,
      category: "직접 만든 분류",
      memo: "",
      date: "2026-07-20",
      created_at: "2026-07-20T00:00:00.000Z",
    })) as Expense[];

    writeDemoExpenses(entries);

    const reloaded = readDemoExpenses();
    expect(reloaded.find((entry) => entry.id === "custom-savings")?.entry_type).toBe("savings");
    expect(reloaded.find((entry) => entry.id === "custom-investment")?.entry_type).toBe(
      "investment",
    );
  });
});

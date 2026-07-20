import { beforeEach, describe, expect, it } from "vitest";
import {
  clearDemoMode,
  DEMO_CUSTOM_CATEGORIES_STORAGE_KEY,
  readDemoCustomCategories,
  writeDemoCustomCategories,
} from "./demo";

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
        { ...category, type: "invalid" },
        { ...category, name: "" },
        null,
      ]),
    );

    expect(readDemoCustomCategories()).toEqual([category]);
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

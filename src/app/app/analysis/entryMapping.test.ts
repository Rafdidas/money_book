import { describe, expect, it } from "vitest";
import type { Expense } from "@/types/expense";
import { mapExpenseToAnalysisEntry } from "./entryMapping";

const expense = (overrides: Partial<Expense>): Expense => ({
  id: "entry",
  user_id: "demo-user",
  amount: 100_000,
  type: "expense",
  entry_type: null,
  category: "일반 분류",
  memo: "",
  date: "2026-07-20",
  created_at: "2026-07-20T00:00:00.000Z",
  ...overrides,
});

describe("mapExpenseToAnalysisEntry", () => {
  it.each([
    ["savings", "여행 준비금", "saving"],
    ["investment", "미래 자산", "investment"],
  ] as const)(
    "maps arbitrary-name durable %s entries to the correct analysis type",
    (entryType, category, expectedType) => {
      expect(
        mapExpenseToAnalysisEntry(
          expense({ entry_type: entryType, category }),
        ).type,
      ).toBe(expectedType);
    },
  );

  it("prefers a durable expense subtype over a legacy-looking category", () => {
    expect(
      mapExpenseToAnalysisEntry(
        expense({ entry_type: "expense", category: "저축 모임 회비" }),
      ).type,
    ).toBe("expense");
  });

  it.each([
    ["비상금 저축", "saving"],
    ["해외 주식", "investment"],
  ] as const)("keeps null-subtype legacy inference for %s", (category, expectedType) => {
    expect(
      mapExpenseToAnalysisEntry(expense({ entry_type: null, category })).type,
    ).toBe(expectedType);
  });
});

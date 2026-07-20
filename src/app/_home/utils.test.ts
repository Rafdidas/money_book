import { describe, expect, it } from "vitest";
import type { Expense } from "@/types/expense";
import { isFixedExpenseItem, isInvestmentItem, isSavingsItem } from "./utils";

const expense = (overrides: Partial<Expense> & { entry_type?: string }) =>
  ({
    id: "entry",
    user_id: "user-1",
    amount: 10000,
    type: "expense",
    category: "직접 만든 분류",
    memo: "",
    date: "2026-07-20",
    created_at: "2026-07-20T00:00:00.000Z",
    ...overrides,
  }) as Expense;

describe("durable expense entry classification", () => {
  it("classifies a reloaded custom savings entry by its durable subtype", () => {
    expect(isSavingsItem(expense({ entry_type: "savings" }))).toBe(true);
  });

  it("classifies a reloaded custom investment entry by its durable subtype", () => {
    expect(isInvestmentItem(expense({ entry_type: "investment" }))).toBe(true);
  });

  it("keeps legacy null-subtype category inference", () => {
    expect(isSavingsItem(expense({ entry_type: null as never, category: "비상금 저축" }))).toBe(true);
    expect(isInvestmentItem(expense({ entry_type: null as never, category: "📈주식" }))).toBe(true);
  });

  it("does not let legacy fixed-expense metadata override a durable savings subtype", () => {
    const fixedMeta = encodeURIComponent(
      JSON.stringify({
        id: "fixed-1",
        name: "고정 항목",
        paymentDay: 1,
        endDate: "2026-12-31",
      }),
    );

    expect(
      isFixedExpenseItem(
        expense({
          entry_type: "savings",
          memo: `고정 항목 [[fixed-expense:${fixedMeta}]]`,
        }),
      ),
    ).toBe(false);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Expense } from "@/types/expense";

const {
  getExpensesByRange,
  getSavingsAccounts,
  getSavingsPaymentsByRange,
  getFixedExpenseRules,
  getFixedExpensePaymentsByRange,
} = vi.hoisted(() => ({
  getExpensesByRange: vi.fn(),
  getSavingsAccounts: vi.fn(),
  getSavingsPaymentsByRange: vi.fn(),
  getFixedExpenseRules: vi.fn(),
  getFixedExpensePaymentsByRange: vi.fn(),
}));

vi.mock("./expense", () => ({ getExpensesByRange, getExpensesByYear: vi.fn() }));
vi.mock("./savings", () => ({ getSavingsAccounts, getSavingsPaymentsByRange }));
vi.mock("./fixedExpense", () => ({ getFixedExpenseRules, getFixedExpensePaymentsByRange }));

import { getMoneyBookEntriesByRange } from "./moneyBookEntries";

const reloadedExpense = (id: string, entryType: "savings" | "investment"): Expense =>
  ({
    id,
    user_id: "user-1",
    amount: 10000,
    type: "expense",
    entry_type: entryType,
    category: "문자열로 추론할 수 없는 직접 분류",
    memo: "",
    date: "2026-07-20",
    created_at: "2026-07-20T00:00:00.000Z",
  }) as Expense;

describe("money-book durable expense entry mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSavingsAccounts.mockResolvedValue([]);
    getSavingsPaymentsByRange.mockResolvedValue([]);
    getFixedExpenseRules.mockResolvedValue([]);
    getFixedExpensePaymentsByRange.mockResolvedValue([]);
  });

  it("keeps custom savings and investments in distinct analysis buckets after reload", async () => {
    getExpensesByRange.mockResolvedValue([
      reloadedExpense("custom-saving", "savings"),
      reloadedExpense("custom-investment", "investment"),
      {
        ...reloadedExpense("durable-expense", "savings"),
        type: "income",
        entry_type: "expense",
      },
    ]);

    const entries = await getMoneyBookEntriesByRange("2026-07-01", "2026-07-31");

    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "custom-saving", type: "saving" }),
        expect.objectContaining({ id: "custom-investment", type: "investment" }),
        expect.objectContaining({ id: "durable-expense", type: "expense" }),
      ]),
    );
  });
});

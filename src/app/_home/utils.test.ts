import { describe, expect, it } from "vitest";
import type { Expense } from "@/types/expense";
import {
  isFixedExpenseItem,
  isInvestmentItem,
  isSavingsItem,
  isSavingsMaturityEditable,
  partitionSavingsItemsForMaturity,
} from "./utils";

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

describe("적금 만기 납입 처리", () => {
  const items = [
    expense({ id: "july-payment", date: "2026-07-06" }),
    expense({ id: "august-payment", date: "2026-08-06" }),
    expense({ id: "september-payment", date: "2026-09-06" }),
  ];

  it("만기 월 납입을 제외하면 해당 월과 이후 예정 납입을 제거한다", () => {
    const result = partitionSavingsItemsForMaturity(
      items,
      "2026-08-01",
      "2026-08-31",
      false,
    );

    expect(result.keptItems.map((item) => item.id)).toEqual(["july-payment"]);
    expect(result.removedItems.map((item) => item.id)).toEqual([
      "august-payment",
      "september-payment",
    ]);
  });

  it("만기 월 납입을 포함하면 그 달 납입은 유지하고 이후 예정 납입만 제거한다", () => {
    const result = partitionSavingsItemsForMaturity(
      items,
      "2026-08-01",
      "2026-08-31",
      true,
    );

    expect(result.keptItems.map((item) => item.id)).toEqual([
      "july-payment",
      "august-payment",
    ]);
    expect(result.removedItems.map((item) => item.id)).toEqual(["september-payment"]);
  });
});

describe("완료된 적금의 만기 월 납입 수정", () => {
  it("완료 상태인 저장형 적금도 만기 월 납입 선택을 다시 열 수 있다", () => {
    expect(
      isSavingsMaturityEditable({
        source: "new",
        status: "completed",
        hasNoMaturity: false,
        maturityDate: "2026-08-06",
      }),
    ).toBe(true);
  });
});

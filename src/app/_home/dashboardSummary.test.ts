import { describe, expect, it } from "vitest";
import type { DashboardEntry } from "@/app/_home/dashboardSummary";
import {
  filterDetailItemsByCategories,
  getDashboardMonthlySummary,
  getDetailFilterCategories,
  getDetailFilterSummary,
  getDashboardScheduleSummary,
} from "@/app/_home/dashboardSummary";

const entry = (
  overrides: Partial<DashboardEntry> &
    Pick<DashboardEntry, "id" | "amount" | "type" | "category" | "date">,
): DashboardEntry => ({
  user_id: "user-1",
  memo: "",
  entry_type: null,
  created_at: "2026-07-01T00:00:00.000Z",
  ...overrides,
});

describe("getDashboardMonthlySummary", () => {
  it("완료된 수입·일반지출·저축·투자를 분리하고 예정·취소 내역은 제외한다", () => {
    const entries: DashboardEntry[] = [
      entry({ id: "income", amount: 3_000_000, type: "income", category: "급여", date: "2026-07-01" }),
      entry({ id: "expense", amount: 500_000, type: "expense", category: "생활비", date: "2026-07-02" }),
      entry({ id: "saving", amount: 400_000, type: "expense", category: "📩저축", date: "2026-07-03" }),
      entry({ id: "investment", amount: 300_000, type: "expense", category: "📈주식", date: "2026-07-04" }),
      entry({ id: "scheduled", amount: 200_000, type: "expense", category: "고정지출", date: "2026-07-05", status: "scheduled" }),
      entry({ id: "cancelled", amount: 100_000, type: "expense", category: "생활비", date: "2026-07-06", status: "cancelled" }),
      entry({ id: "other-month", amount: 9_999_999, type: "income", category: "급여", date: "2026-06-30" }),
    ];

    expect(getDashboardMonthlySummary(entries, 2026, 6)).toEqual({
      actualIncome: 3_000_000,
      actualExpense: 500_000,
      actualSavings: 400_000,
      actualInvestment: 300_000,
      actualRemaining: 1_800_000,
      incomeCount: 1,
      expenseCount: 1,
      incomeAverage: 3_000_000,
      expenseAverage: 500_000,
    });
  });

  it("durable subtype으로 임의 이름 저축·투자를 지출과 분리한다", () => {
    const entries: DashboardEntry[] = [
      entry({
        id: "durable-saving",
        amount: 400_000,
        type: "expense",
        entry_type: "savings",
        category: "여행 준비금",
        date: "2026-07-03",
      }),
      entry({
        id: "durable-investment",
        amount: 300_000,
        type: "expense",
        entry_type: "investment",
        category: "미래 자산",
        date: "2026-07-04",
      }),
      entry({
        id: "durable-expense",
        amount: 50_000,
        type: "expense",
        entry_type: "expense",
        category: "저축 모임 회비",
        date: "2026-07-05",
      }),
    ];

    expect(getDashboardMonthlySummary(entries, 2026, 6)).toMatchObject({
      actualExpense: 50_000,
      actualSavings: 400_000,
      actualInvestment: 300_000,
      expenseCount: 1,
    });
  });

  it("null subtype인 기존 행은 category 기반 분류를 유지한다", () => {
    const entries: DashboardEntry[] = [
      entry({
        id: "legacy-saving",
        amount: 200_000,
        type: "expense",
        entry_type: null,
        category: "비상금 저축",
        date: "2026-07-03",
      }),
      entry({
        id: "legacy-investment",
        amount: 100_000,
        type: "expense",
        entry_type: null,
        category: "해외 주식",
        date: "2026-07-04",
      }),
    ];

    expect(getDashboardMonthlySummary(entries, 2026, 6)).toMatchObject({
      actualExpense: 0,
      actualSavings: 200_000,
      actualInvestment: 100_000,
      expenseCount: 0,
    });
  });
});

describe("getDashboardScheduleSummary", () => {
  it("연체·예정·완료·건너뜀 순으로 정렬하고 활성 예정 금액만 차감한다", () => {
    const entries: DashboardEntry[] = [
      entry({ id: "paid", amount: 50_000, type: "expense", category: "고정지출", memo: "완료", date: "2026-07-01", status: "paid" }),
      entry({ id: "future", amount: 100_000, type: "expense", category: "고정지출", memo: "예정", date: "2026-07-20", status: "scheduled" }),
      entry({ id: "overdue", amount: 200_000, type: "expense", category: "📩저축", memo: "연체", date: "2026-07-05", status: "scheduled" }),
      entry({ id: "skipped", amount: 300_000, type: "expense", category: "고정지출", memo: "건너뜀", date: "2026-07-02", status: "cancelled" }),
    ];

    const summary = getDashboardScheduleSummary(
      entries,
      2026,
      6,
      new Date(2026, 6, 10),
      1_000_000,
    );

    expect(summary.items.map(({ id, status }) => ({ id, status }))).toEqual([
      { id: "overdue", status: "overdue" },
      { id: "future", status: "scheduled" },
      { id: "paid", status: "paid" },
      { id: "skipped", status: "skipped" },
    ]);
    expect(summary.scheduledExpense).toBe(100_000);
    expect(summary.scheduledSavingsInvestment).toBe(200_000);
    expect(summary.expectedRemaining).toBe(700_000);
  });
});

describe("상세내용 카테고리 필터", () => {
  const items: DashboardEntry[] = [
    entry({ id: "food-1", amount: 12_000, type: "expense", category: "🍚식비", date: "2026-07-02" }),
    entry({ id: "salary", amount: 3_000_000, type: "income", category: "급여", date: "2026-07-01" }),
    entry({ id: "food-2", amount: 8_000, type: "expense", category: "🍚식비", date: "2026-07-03" }),
    entry({ id: "saving", amount: 400_000, type: "expense", category: "적금", entry_type: "savings", date: "2026-07-04" }),
    entry({ id: "stock", amount: 100_000, type: "expense", category: "📈주식", entry_type: "investment", date: "2026-07-05" }),
    entry({ id: "paused", amount: 50_000, type: "expense", category: "🍚식비", date: "2026-07-06", status: "cancelled" }),
  ];

  it("내역에 있는 카테고리만 중복 없이 앞쪽 이모지를 빼고 가나다순으로 돌려준다", () => {
    expect(getDetailFilterCategories(items)).toEqual(["급여", "🍚식비", "적금", "📈주식"]);
  });

  it("선택이 없으면 전체를, 있으면 선택한 카테고리의 합집합을 돌려준다", () => {
    expect(filterDetailItemsByCategories(items, [])).toBe(items);
    expect(filterDetailItemsByCategories(items, ["🍚식비", "급여"]).map((item) => item.id)).toEqual([
      "food-1",
      "salary",
      "food-2",
      "paused",
    ]);
  });

  it("건수는 보이는 행 기준, 금액은 실제 반영된 내역만 수입·지출·저축으로 나눠 합산한다", () => {
    expect(getDetailFilterSummary(items)).toEqual({
      count: 6,
      income: 3_000_000,
      expense: 20_000,
      savings: 500_000,
    });
    expect(getDetailFilterSummary(filterDetailItemsByCategories(items, ["🍚식비"]))).toEqual({
      count: 3,
      income: 0,
      expense: 20_000,
      savings: 0,
    });
  });
});

import { describe, expect, it } from "vitest";
import type { DashboardEntry } from "@/app/_home/dashboardSummary";
import {
  getDashboardMonthlySummary,
  getDashboardScheduleSummary,
} from "@/app/_home/dashboardSummary";

const entry = (
  overrides: Partial<DashboardEntry> &
    Pick<DashboardEntry, "id" | "amount" | "type" | "category" | "date">,
): DashboardEntry => ({
  user_id: "user-1",
  memo: "",
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

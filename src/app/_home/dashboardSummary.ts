import type { Expense } from "@/types/expense";
import type { PaymentStatus } from "@/types/recurring";

export type DashboardEntry = Expense & {
  status?: PaymentStatus;
};

export type DashboardMonthlySummary = {
  actualIncome: number;
  actualExpense: number;
  actualSavings: number;
  actualInvestment: number;
  actualRemaining: number;
  incomeCount: number;
  expenseCount: number;
  incomeAverage: number;
  expenseAverage: number;
};

export type DashboardScheduleItem = {
  id: string;
  kind: "fixedExpense" | "saving";
  label: string;
  amount: number;
  date: string;
  status: "scheduled" | "paid" | "overdue" | "skipped";
  daysOverdue: number;
};

export type DashboardScheduleSummary = {
  scheduledExpense: number;
  scheduledSavingsInvestment: number;
  expectedRemaining: number;
  items: DashboardScheduleItem[];
};

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const isSameMonth = (dateKey: string, year: number, month: number) => {
  const date = new Date(dateKey);
  return date.getFullYear() === year && date.getMonth() === month;
};

const isActualEntry = (item: DashboardEntry) =>
  item.status !== "scheduled" &&
  item.status !== "skipped" &&
  item.status !== "cancelled";

export const isDashboardSavingsItem = (item: { category: string }) =>
  item.category.includes("적금") || item.category.includes("저축");

export const isDashboardInvestmentItem = (item: { category: string }) =>
  item.category.includes("주식");

export const getDashboardMonthlySummary = (
  entries: DashboardEntry[],
  year: number,
  month: number,
): DashboardMonthlySummary => {
  const actualEntries = entries.filter(
    (item) => isSameMonth(item.date, year, month) && isActualEntry(item),
  );
  const incomeItems = actualEntries.filter((item) => item.type === "income");
  const expenseItems = actualEntries.filter(
    (item) =>
      item.type === "expense" &&
      !isDashboardSavingsItem(item) &&
      !isDashboardInvestmentItem(item),
  );
  const savingsItems = actualEntries.filter(isDashboardSavingsItem);
  const investmentItems = actualEntries.filter(isDashboardInvestmentItem);
  const actualIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
  const actualExpense = expenseItems.reduce((sum, item) => sum + item.amount, 0);
  const actualSavings = savingsItems.reduce((sum, item) => sum + item.amount, 0);
  const actualInvestment = investmentItems.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const incomeCount = incomeItems.length;
  const expenseCount = expenseItems.length;

  return {
    actualIncome,
    actualExpense,
    actualSavings,
    actualInvestment,
    actualRemaining:
      actualIncome - actualExpense - actualSavings - actualInvestment,
    incomeCount,
    expenseCount,
    incomeAverage: incomeCount ? actualIncome / incomeCount : 0,
    expenseAverage: expenseCount ? actualExpense / expenseCount : 0,
  };
};

export const getDashboardScheduleSummary = (
  entries: DashboardEntry[],
  year: number,
  month: number,
  today: Date,
  actualRemaining: number,
): DashboardScheduleSummary => {
  const todayKey = toDateKey(today);
  const items = entries
    .filter((item) => isSameMonth(item.date, year, month))
    .filter(
      (item) =>
        item.status === "scheduled" ||
        item.status === "paid" ||
        item.status === "skipped" ||
        item.status === "cancelled",
    )
    .map<DashboardScheduleItem>((item) => {
      const dueDate = new Date(item.date);
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const dueStart = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate(),
      );
      const daysOverdue = Math.max(
        0,
        Math.floor((todayStart.getTime() - dueStart.getTime()) / 86400000),
      );
      const status =
        item.status === "paid"
          ? "paid"
          : item.status === "skipped" || item.status === "cancelled"
            ? "skipped"
            : item.date < todayKey
              ? "overdue"
              : "scheduled";

      return {
        id: item.id,
        kind:
          isDashboardSavingsItem(item) || isDashboardInvestmentItem(item)
            ? "saving"
            : "fixedExpense",
        label: item.memo || item.category,
        amount: item.amount,
        date: item.date,
        status,
        daysOverdue,
      };
    })
    .sort((left, right) => {
      const priority = { overdue: 0, scheduled: 1, paid: 2, skipped: 3 };
      return (
        priority[left.status] - priority[right.status] ||
        left.date.localeCompare(right.date)
      );
    });

  const activeScheduledItems = items.filter(
    (item) => item.status === "scheduled" || item.status === "overdue",
  );
  const scheduledExpense = activeScheduledItems
    .filter((item) => item.kind === "fixedExpense")
    .reduce((sum, item) => sum + item.amount, 0);
  const scheduledSavingsInvestment = activeScheduledItems
    .filter((item) => item.kind === "saving")
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    scheduledExpense,
    scheduledSavingsInvestment,
    expectedRemaining:
      actualRemaining - scheduledExpense - scheduledSavingsInvestment,
    items,
  };
};

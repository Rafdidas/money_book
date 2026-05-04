import type { Expense } from "@/types/expense";

export const DEMO_MODE_STORAGE_KEY = "money-book:demo-mode";
export const DEMO_EXPENSES_STORAGE_KEY = "money-book:demo-expenses";
export const DEMO_USER_ID = "demo-user";

const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const createDemoExpense = (
  id: string,
  date: Date,
  type: Expense["type"],
  category: string,
  amount: number,
  memo: string,
): Expense => ({
  id,
  user_id: DEMO_USER_ID,
  amount,
  type,
  category,
  memo,
  date: formatDateKey(date),
  created_at: `${formatDateKey(date)}T09:00:00.000Z`,
});

export const createDemoExpenses = (referenceDate = new Date()): Expense[] => {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();

  const dateInMonth = (monthOffset: number, day: number) =>
    new Date(currentYear, currentMonth + monthOffset, day);

  return [
    createDemoExpense(
      "demo-income-salary-current",
      dateInMonth(0, 1),
      "income",
      "급여",
      3200000,
      "월급",
    ),
    createDemoExpense(
      "demo-expense-grocery-current",
      dateInMonth(0, 3),
      "expense",
      "식비",
      78000,
      "장보기",
    ),
    createDemoExpense(
      "demo-expense-transport-current",
      dateInMonth(0, 6),
      "expense",
      "교통",
      52000,
      "교통카드 충전",
    ),
    createDemoExpense(
      "demo-expense-culture-current",
      dateInMonth(0, 10),
      "expense",
      "문화생활",
      45000,
      "영화와 커피",
    ),
    createDemoExpense(
      "demo-expense-shopping-current",
      dateInMonth(0, 14),
      "expense",
      "쇼핑",
      132000,
      "셔츠 구입",
    ),
    createDemoExpense(
      "demo-income-side-current",
      dateInMonth(0, 18),
      "income",
      "기타",
      280000,
      "프리랜스 작업",
    ),
    createDemoExpense(
      "demo-expense-dining-current",
      dateInMonth(0, 22),
      "expense",
      "식비",
      36000,
      "점심 약속",
    ),
    createDemoExpense(
      "demo-income-salary-prev",
      dateInMonth(-1, 1),
      "income",
      "급여",
      3200000,
      "월급",
    ),
    createDemoExpense(
      "demo-expense-rent-prev",
      dateInMonth(-1, 4),
      "expense",
      "기타",
      650000,
      "월세",
    ),
    createDemoExpense(
      "demo-expense-food-prev",
      dateInMonth(-1, 12),
      "expense",
      "식비",
      94000,
      "외식",
    ),
    createDemoExpense(
      "demo-income-salary-jan",
      new Date(currentYear, 0, 1),
      "income",
      "급여",
      3000000,
      "월급",
    ),
    createDemoExpense(
      "demo-expense-jan",
      new Date(currentYear, 0, 16),
      "expense",
      "쇼핑",
      210000,
      "겨울 의류",
    ),
    createDemoExpense(
      "demo-income-salary-feb",
      new Date(currentYear, 1, 1),
      "income",
      "급여",
      3100000,
      "월급",
    ),
    createDemoExpense(
      "demo-expense-feb",
      new Date(currentYear, 1, 20),
      "expense",
      "문화생활",
      88000,
      "전시 관람",
    ),
  ].sort((left, right) => right.date.localeCompare(left.date));
};

export const readDemoExpenses = () => {
  if (typeof window === "undefined") {
    return createDemoExpenses();
  }

  const storedExpenses = window.localStorage.getItem(DEMO_EXPENSES_STORAGE_KEY);

  if (!storedExpenses) {
    const demoExpenses = createDemoExpenses();
    writeDemoExpenses(demoExpenses);
    return demoExpenses;
  }

  try {
    return JSON.parse(storedExpenses) as Expense[];
  } catch {
    const demoExpenses = createDemoExpenses();
    writeDemoExpenses(demoExpenses);
    return demoExpenses;
  }
};

export const writeDemoExpenses = (expenses: Expense[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
};

export const enableDemoMode = () => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, "true");
  writeDemoExpenses(readDemoExpenses());
};

export const disableDemoMode = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_MODE_STORAGE_KEY);
  window.localStorage.removeItem(DEMO_EXPENSES_STORAGE_KEY);
};

export const isDemoModeEnabled = () => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DEMO_MODE_STORAGE_KEY) === "true";
};

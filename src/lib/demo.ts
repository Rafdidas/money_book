import type { CustomCategory, CustomCategoryType } from "@/lib/api/customCategories";
import type { Expense } from "@/types/expense";

export const DEMO_MODE_STORAGE_KEY = "money-book:demo-mode";
export const DEMO_EXPENSES_STORAGE_KEY = "money-book:demo-expenses";
export const DEMO_DATA_VERSION_STORAGE_KEY = "money-book:demo-data-version";
export const DEMO_INVESTMENT_OWNER_KEY = "demo";
export const DEMO_STOCK_HOLDINGS_STORAGE_KEY = "money-book:stock-holdings:demo";
export const DEMO_STOCK_HOLDINGS_VERSION_STORAGE_KEY = "money-book:demo-stock-holdings-version";
export const DEMO_CUSTOM_CATEGORIES_STORAGE_KEY = "mb-demo-custom-categories:v2";
const LEGACY_DEMO_CUSTOM_CATEGORIES_STORAGE_KEY = "mb-demo-custom-categories:v1";
export const DEMO_MODE_COOKIE_KEY = "money-book-demo-mode";
export const DEMO_USER_ID = "demo-user";

const currentDemoDataVersion = "3";
const demoSavingsId = "demo-savings-emergency";
const demoFixedExpenseId = "demo-fixed-expense-phone";
const savingsCategory = "📩저축";
const investmentCategory = "📈주식";
const customCategoryTypes: CustomCategoryType[] = [
  "expense",
  "income",
  "savings",
  "investment",
];

const isParseableIsoTimestamp = (value: string) =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
  !Number.isNaN(Date.parse(value));

const isDemoCustomCategory = (value: unknown): value is CustomCategory => {
  if (!value || typeof value !== "object") return false;

  const category = value as Record<string, unknown>;
  return (
    typeof category.id === "string" &&
    category.id.trim().length > 0 &&
    customCategoryTypes.includes(category.type as CustomCategoryType) &&
    typeof category.name === "string" &&
    category.name.trim().length > 0 &&
    typeof category.lastUsedAt === "string" &&
    isParseableIsoTimestamp(category.lastUsedAt) &&
    (category.isFavorite === undefined || typeof category.isFavorite === "boolean")
  );
};

const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const encodeSavingsMemo = (meta: {
  id: string;
  name: string;
  paymentDay: number;
  maturityDate: string;
  initialAmount: number;
  hasNoMaturity: boolean;
}) => `${meta.name} [[savings:${encodeURIComponent(JSON.stringify(meta))}]]`;

const encodeFixedExpenseMemo = (meta: {
  id: string;
  name: string;
  paymentDay: number;
  endDate: string;
  hasNoEndDate: boolean;
}) => `${meta.name} [[fixed-expense:${encodeURIComponent(JSON.stringify(meta))}]]`;

const createDemoExpense = (
  id: string,
  date: Date,
  type: Expense["type"],
  category: string,
  amount: number,
  memo: string,
  entryType: Expense["entry_type"] = type,
): Expense => ({
  id,
  user_id: DEMO_USER_ID,
  amount,
  type,
  entry_type: entryType,
  category,
  memo,
  date: formatDateKey(date),
  created_at: `${formatDateKey(date)}T09:00:00.000Z`,
});

const createDemoSavingsExpenses = (referenceDate = new Date()): Expense[] => {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();
  const paymentDay = 15;
  const maturityDate = formatDateKey(new Date(currentYear, currentMonth + 6, paymentDay));
  const memo = encodeSavingsMemo({
    id: demoSavingsId,
    name: "비상금 적금",
    paymentDay,
    maturityDate,
    initialAmount: 0,
    hasNoMaturity: false,
  });

  return [-1, 0, 1].map((monthOffset) =>
    createDemoExpense(
      `demo-savings-emergency-${monthOffset}`,
      new Date(currentYear, currentMonth + monthOffset, paymentDay),
      "expense",
      savingsCategory,
      500000,
      memo,
      "savings",
    ),
  );
};

const createDemoFixedExpenseExpenses = (referenceDate = new Date()): Expense[] => {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();
  const paymentDay = 25;
  const memo = encodeFixedExpenseMemo({
    id: demoFixedExpenseId,
    name: "휴대폰 요금",
    paymentDay,
    endDate: formatDateKey(new Date(currentYear, currentMonth + 5, paymentDay)),
    hasNoEndDate: false,
  });

  return [-1, 0, 1].map((monthOffset) =>
    createDemoExpense(
      `demo-fixed-expense-phone-${monthOffset}`,
      new Date(currentYear, currentMonth + monthOffset, paymentDay),
      "expense",
      "휴대폰 요금",
      59000,
      memo,
    ),
  );
};

const createDemoInvestmentExpenses = (referenceDate = new Date()): Expense[] => {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();

  return [
    createDemoExpense(
      "demo-investment-stock-current",
      new Date(currentYear, currentMonth, 8),
      "expense",
      investmentCategory,
      420000,
      "국내 주식 정기 매수",
      "investment",
    ),
    createDemoExpense(
      "demo-investment-stock-prev",
      new Date(currentYear, currentMonth - 1, 8),
      "expense",
      investmentCategory,
      350000,
      "국내 주식 정기 매수",
      "investment",
    ),
  ];
};

const hasDemoSavings = (expenses: Expense[]) =>
  expenses.some(
    (item) =>
      item.memo.includes(demoSavingsId) ||
      item.category.includes("적금") ||
      item.category.includes("저축"),
  );

const ensureDemoSavings = (expenses: Expense[], referenceDate = new Date()) =>
  hasDemoSavings(expenses)
    ? expenses
    : [...createDemoSavingsExpenses(referenceDate), ...expenses].sort((left, right) =>
        right.date.localeCompare(left.date),
      );

const ensureCurrentDemoFeatures = (expenses: Expense[], referenceDate = new Date()) => {
  const additions = [
    ...(expenses.some((item) => item.memo.includes("[[fixed-expense:"))
      ? []
      : createDemoFixedExpenseExpenses(referenceDate)),
    ...(expenses.some((item) => item.category.includes("주식"))
      ? []
      : createDemoInvestmentExpenses(referenceDate)),
  ];

  if (!additions.length) return expenses;

  return [...additions, ...expenses].sort((left, right) => right.date.localeCompare(left.date));
};

const ensureDemoExpenseEntryTypes = (expenses: Expense[]) => {
  let changed = false;
  const nextExpenses = expenses.map((expense) => {
    if (customCategoryTypes.includes(expense.entry_type as CustomCategoryType)) {
      return expense;
    }

    changed = true;
    const entryType: CustomCategoryType =
      expense.type === "income"
        ? "income"
        : expense.category.includes("적금") || expense.category.includes("저축")
          ? "savings"
          : expense.category.includes("주식")
            ? "investment"
            : "expense";
    return { ...expense, entry_type: entryType };
  });

  return changed ? nextExpenses : expenses;
};

export const createDemoExpenses = (referenceDate = new Date()): Expense[] => {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();

  const dateInMonth = (monthOffset: number, day: number) =>
    new Date(currentYear, currentMonth + monthOffset, day);

  return [
    ...createDemoSavingsExpenses(referenceDate),
    ...createDemoFixedExpenseExpenses(referenceDate),
    ...createDemoInvestmentExpenses(referenceDate),
    createDemoExpense(
      "demo-income-salary-current",
      dateInMonth(0, 1),
      "income",
      "💵월급",
      3200000,
      "월급",
    ),
    createDemoExpense(
      "demo-expense-grocery-current",
      dateInMonth(0, 3),
      "expense",
      "🍚식비",
      78000,
      "장보기",
    ),
    createDemoExpense(
      "demo-expense-transport-current",
      dateInMonth(0, 6),
      "expense",
      "🚗교통비",
      52000,
      "교통카드 충전",
    ),
    createDemoExpense(
      "demo-expense-culture-current",
      dateInMonth(0, 10),
      "expense",
      "🎨문화생활",
      45000,
      "영화와 커피",
    ),
    createDemoExpense(
      "demo-expense-shopping-current",
      dateInMonth(0, 14),
      "expense",
      "🍱생필품",
      132000,
      "셔츠 구입",
    ),
    createDemoExpense(
      "demo-income-side-current",
      dateInMonth(0, 18),
      "income",
      "🪙부수입",
      280000,
      "프리랜스 작업",
    ),
    createDemoExpense(
      "demo-expense-dining-current",
      dateInMonth(0, 22),
      "expense",
      "🍚식비",
      36000,
      "점심 약속",
    ),
    createDemoExpense(
      "demo-income-salary-prev",
      dateInMonth(-1, 1),
      "income",
      "💵월급",
      3200000,
      "월급",
    ),
    createDemoExpense(
      "demo-expense-rent-prev",
      dateInMonth(-1, 4),
      "expense",
      "월세",
      650000,
      "월세",
    ),
    createDemoExpense(
      "demo-expense-food-prev",
      dateInMonth(-1, 12),
      "expense",
      "🍚식비",
      94000,
      "외식",
    ),
    createDemoExpense(
      "demo-income-salary-jan",
      new Date(currentYear, 0, 1),
      "income",
      "💵월급",
      3000000,
      "월급",
    ),
    createDemoExpense(
      "demo-expense-jan",
      new Date(currentYear, 0, 16),
      "expense",
      "🍱생필품",
      210000,
      "겨울 의류",
    ),
    createDemoExpense(
      "demo-income-salary-feb",
      new Date(currentYear, 1, 1),
      "income",
      "💵월급",
      3100000,
      "월급",
    ),
    createDemoExpense(
      "demo-expense-feb",
      new Date(currentYear, 1, 20),
      "expense",
      "🎨문화생활",
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
    window.localStorage.setItem(DEMO_DATA_VERSION_STORAGE_KEY, currentDemoDataVersion);
    return demoExpenses;
  }

  try {
    const parsedExpenses = JSON.parse(storedExpenses) as Expense[];
    let demoExpenses = ensureDemoExpenseEntryTypes(parsedExpenses);
    demoExpenses = ensureDemoSavings(demoExpenses);
    if (window.localStorage.getItem(DEMO_DATA_VERSION_STORAGE_KEY) !== currentDemoDataVersion) {
      demoExpenses = ensureCurrentDemoFeatures(demoExpenses);
      window.localStorage.setItem(DEMO_DATA_VERSION_STORAGE_KEY, currentDemoDataVersion);
    }
    if (demoExpenses !== parsedExpenses) {
      writeDemoExpenses(demoExpenses);
    }
    return demoExpenses;
  } catch {
    const demoExpenses = createDemoExpenses();
    writeDemoExpenses(demoExpenses);
    window.localStorage.setItem(DEMO_DATA_VERSION_STORAGE_KEY, currentDemoDataVersion);
    return demoExpenses;
  }
};

export const writeDemoExpenses = (expenses: Expense[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
};

export const readDemoCustomCategories = (): CustomCategory[] => {
  if (typeof window === "undefined") return [];

  const storedCategories = window.localStorage.getItem(DEMO_CUSTOM_CATEGORIES_STORAGE_KEY)
    ?? window.localStorage.getItem(LEGACY_DEMO_CUSTOM_CATEGORIES_STORAGE_KEY);
  if (!storedCategories) return [];

  try {
    const parsedCategories: unknown = JSON.parse(storedCategories);
    if (!Array.isArray(parsedCategories)) return [];

    const categories = parsedCategories.filter(isDemoCustomCategory)
      .map((category) => ({ ...category, isFavorite: category.isFavorite ?? false }));
    window.localStorage.setItem(DEMO_CUSTOM_CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    window.localStorage.removeItem(LEGACY_DEMO_CUSTOM_CATEGORIES_STORAGE_KEY);
    return categories;
  } catch {
    return [];
  }
};

export const writeDemoCustomCategories = (categories: CustomCategory[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_CUSTOM_CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
};

export const enableDemoMode = () => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, "true");
  window.document.cookie = `${DEMO_MODE_COOKIE_KEY}=true; Path=/; SameSite=Lax`;
  writeDemoExpenses(readDemoExpenses());
};

export const clearDemoMode = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_MODE_STORAGE_KEY);
  window.localStorage.removeItem(DEMO_EXPENSES_STORAGE_KEY);
  window.localStorage.removeItem(DEMO_DATA_VERSION_STORAGE_KEY);
  window.localStorage.removeItem(DEMO_STOCK_HOLDINGS_STORAGE_KEY);
  window.localStorage.removeItem(DEMO_STOCK_HOLDINGS_VERSION_STORAGE_KEY);
  window.localStorage.removeItem(DEMO_CUSTOM_CATEGORIES_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_DEMO_CUSTOM_CATEGORIES_STORAGE_KEY);
  window.document.cookie = `${DEMO_MODE_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
};

export const disableDemoMode = clearDemoMode;

export const isDemoModeEnabled = () => {
  if (typeof window === "undefined") return false;
  return (
    window.localStorage.getItem(DEMO_MODE_STORAGE_KEY) === "true" ||
    window.document.cookie
      .split("; ")
      .some((cookie) => cookie === `${DEMO_MODE_COOKIE_KEY}=true`)
  );
};

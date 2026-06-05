"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Calendar from "react-calendar";
import type { Value } from "react-calendar/dist/shared/types.js";
import Modal from "@/components/common/Modal";
import SideMenu from "@/components/common/SideMenu";
import Loading from "@/components/loading/Loading";
import { useAppData } from "@/app/providers";
import { useAppAlert } from "@/components/app-alert/AppAlertProvider";
import { DEMO_USER_ID, readDemoExpenses, writeDemoExpenses } from "@/lib/demo";
import "@/lib/chart";
import {
  createExpense,
  createExpenses,
  deleteExpense,
  deleteExpenses,
  getExpensesByRange,
  updateExpense,
} from "@/lib/api/expense";
import {
  cancelFutureFixedExpensePayments,
  createFixedExpensePayments,
  createFixedExpenseRule,
  deleteFixedExpenseRule,
  getFixedExpensePaymentsByRange,
  getFixedExpenseRules,
  updateFixedExpenseRule,
  updateFixedExpensePayments,
} from "@/lib/api/fixedExpense";
import {
  cancelFutureSavingsPayments,
  createSavingsAccount,
  createSavingsPayments,
  deleteSavingsAccount,
  getSavingsAccounts,
  getSavingsPaymentsByRange,
  updateSavingsAccount,
  updateSavingsPayments,
} from "@/lib/api/savings";
import type { Expense } from "@/types/expense";
import type {
  FixedExpensePayment,
  FixedExpenseRule,
  PaymentStatus,
  SavingsAccount as StoredSavingsAccount,
  SavingsPayment,
} from "@/types/recurring";
import { formatDate } from "@/utils/date";
import { formatIntegerInput, parseFormattedNumber } from "@/utils/numberInput";
import CategoryPieChart from "./charts/CategoryPieChart";
import OverviewLineChart from "./charts/OverviewLineChart";
import {
  categoryChartColors,
  categoryOptions,
  customCategoryValue,
  fixedExpenseMetaPattern,
  incomeCategoryOptions,
  investmentCategoryOptions,
  recurringPauseMarker,
  recurringPausePattern,
  savingsCategory,
  savingsCategoryOptions,
  savingsMetaPattern,
  weekdayLabels,
} from "./constants";
import type {
  ExpenseFormData,
  FixedExpenseAccount,
  FixedExpenseMeta,
  InlineEntryType,
  InlineFormMode,
  SavingsAccount,
  SavingsMeta,
} from "./types";
import {
  encodeFixedExpenseMemo,
  encodeSavingsMemo,
  formatCompactWon,
  formatCurrency,
  formatDetailDate,
  formatHeaderDate,
  formatWon,
  getCalendarDays,
  getDailySeries,
  getFallbackSavingsMeta,
  getMemoWithPreservedMeta,
  getNextMonthPaymentChangeMessage,
  getOpenEndedSavingsDate,
  getSavingsPaymentDates,
  getVisibleMemo,
  isInvestmentItem,
  isSavingsItem,
  parseFixedExpenseMemo,
  parseSavingsMemo,
} from "./utils";

const getInlineCategoryOptions = (type: InlineEntryType) => {
  if (type === "income") return incomeCategoryOptions;
  if (type === "savings") return savingsCategoryOptions;
  if (type === "investment") return investmentCategoryOptions;
  return categoryOptions;
};

const getInlineEntryType = (expense: Expense): InlineEntryType => {
  if (expense.type === "income") return "income";
  if (isSavingsItem(expense)) return "savings";
  if (isInvestmentItem(expense)) return "investment";
  return "expense";
};

const getDetailTypeLabel = (expense: Expense) => {
  const type = getInlineEntryType(expense);
  if (type === "income") return "수입";
  if (type === "savings") return "저축";
  if (type === "investment") return "투자";
  return "지출";
};

type RecurringPaymentRecord = {
  id: string;
  payment_date: string;
  status: PaymentStatus;
  created_at: string;
};

type DashboardExpense = Expense & {
  status?: PaymentStatus;
};

type DetailSortKey = "category" | "type" | "amount" | "memo" | "date";
type DetailSort = {
  key: DetailSortKey;
  direction: "asc" | "desc";
} | null;

const getLatestPayment = <T extends RecurringPaymentRecord>(payments: T[]) =>
  [...payments].sort((left, right) => {
    const createdDiff = right.created_at.localeCompare(left.created_at);
    if (createdDiff !== 0) return createdDiff;
    return right.id.localeCompare(left.id);
  })[0];

const getEffectiveActivePayments = <T extends RecurringPaymentRecord>(
  payments: T[],
  getOwnerId: (payment: T) => string,
) => {
  const grouped = new Map<string, T[]>();

  payments
    .filter((payment) => payment.status !== "cancelled")
    .forEach((payment) => {
      const key = `${getOwnerId(payment)}:${payment.payment_date}`;
      const group = grouped.get(key) ?? [];
      group.push(payment);
      grouped.set(key, group);
    });

  return Array.from(grouped.values())
    .map((group) => getLatestPayment(group))
    .filter((payment): payment is T => Boolean(payment));
};

const getEffectivePausedPayments = <T extends RecurringPaymentRecord>(
  payments: T[],
  getOwnerId: (payment: T) => string,
) => {
  const grouped = new Map<string, T[]>();

  payments.forEach((payment) => {
    const key = `${getOwnerId(payment)}:${payment.payment_date}`;
    const group = grouped.get(key) ?? [];
    group.push(payment);
    grouped.set(key, group);
  });

  return Array.from(grouped.values())
    .filter((group) => !hasActivePayment(group))
    .map((group) => getLatestPayment(group.filter((payment) => payment.status === "cancelled")))
    .filter((payment): payment is T => Boolean(payment));
};

const getPaymentsByDate = <T extends RecurringPaymentRecord>(payments: T[]) => {
  const grouped = new Map<string, T[]>();

  payments.forEach((payment) => {
    const group = grouped.get(payment.payment_date) ?? [];
    group.push(payment);
    grouped.set(payment.payment_date, group);
  });

  return Array.from(grouped.values());
};

const hasActivePayment = (payments: RecurringPaymentRecord[]) =>
  payments.some((payment) => payment.status !== "cancelled");

const getRestorablePaymentIds = (payments: RecurringPaymentRecord[]) =>
  getPaymentsByDate(payments)
    .filter((group) => !hasActivePayment(group))
    .map((group) => getLatestPayment(group.filter((payment) => payment.status === "cancelled")))
    .filter((payment): payment is RecurringPaymentRecord => Boolean(payment))
    .map((payment) => payment.id);

const isLegacyRecurringPaused = (item: Expense) =>
  Boolean(item.memo.match(recurringPausePattern));

const getMemoWithPauseState = (memo: string, isPaused: boolean) => {
  const cleanMemo = memo.replace(recurringPausePattern, "").trim();
  if (!isPaused) return cleanMemo;

  const savingsMatch = cleanMemo.match(savingsMetaPattern)?.[0];
  const fixedExpenseMatch = cleanMemo.match(fixedExpenseMetaPattern)?.[0];
  const metaMatch = savingsMatch ?? fixedExpenseMatch;

  if (!metaMatch) return `${cleanMemo} ${recurringPauseMarker}`.trim();

  const visibleMemo = cleanMemo.replace(metaMatch, "").trim();
  return `${visibleMemo} ${recurringPauseMarker} ${metaMatch.trim()}`.trim();
};

const mapLegacyPausedExpense = (item: Expense): DashboardExpense => ({
  ...item,
  status: "cancelled",
});

export default function HomeClient() {
  const today = useMemo(() => new Date(), []);
  const {
    displayName,
    displayEmail,
    isDemoMode,
    isAuthResolved,
  } = useAppData();
  const { alert, confirm } = useAppAlert();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [storedSavingsAccounts, setStoredSavingsAccounts] = useState<StoredSavingsAccount[]>([]);
  const [storedSavingsPayments, setStoredSavingsPayments] = useState<SavingsPayment[]>([]);
  const [storedFixedExpenseRules, setStoredFixedExpenseRules] = useState<FixedExpenseRule[]>([]);
  const [storedFixedExpensePayments, setStoredFixedExpensePayments] = useState<FixedExpensePayment[]>([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(today);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [inlineFormMode, setInlineFormMode] = useState<InlineFormMode>("create");
  const [inlineEditingId, setInlineEditingId] = useState("");
  const [inlineAmount, setInlineAmount] = useState("");
  const [inlineCategory, setInlineCategory] = useState(categoryOptions[0]);
  const [inlineCustomCategory, setInlineCustomCategory] = useState("");
  const [inlineMemo, setInlineMemo] = useState("");
  const [inlineDate, setInlineDate] = useState(formatDate(today));
  const [inlineType, setInlineType] = useState<InlineEntryType>("expense");
  const [inlineEditListType, setInlineEditListType] = useState<InlineEntryType>("expense");
  const [isInlineSubmitting, setIsInlineSubmitting] = useState(false);
  const [isInlineDeleting, setIsInlineDeleting] = useState(false);
  const [savingsFormMode, setSavingsFormMode] = useState<InlineFormMode>("create");
  const [savingsEditingId, setSavingsEditingId] = useState("");
  const [savingsPaymentAmount, setSavingsPaymentAmount] = useState("");
  const [savingsPaymentDay, setSavingsPaymentDay] = useState("1");
  const [savingsMaturityDate, setSavingsMaturityDate] = useState(formatDate(today));
  const [savingsHasNoMaturity, setSavingsHasNoMaturity] = useState(false);
  const [savingsStartsThisMonth, setSavingsStartsThisMonth] = useState(true);
  const [savingsCurrentAmount, setSavingsCurrentAmount] = useState("");
  const [savingsName, setSavingsName] = useState("");
  const [isSavingsSubmitting, setIsSavingsSubmitting] = useState(false);
  const [isSavingsDeleting, setIsSavingsDeleting] = useState(false);
  const [isSavingsSkipping, setIsSavingsSkipping] = useState(false);
  const [openSavingsPauseMenuId, setOpenSavingsPauseMenuId] = useState("");
  const [fixedExpenseFormMode, setFixedExpenseFormMode] = useState<InlineFormMode>("create");
  const [fixedExpenseEditingId, setFixedExpenseEditingId] = useState("");
  const [fixedExpenseAmount, setFixedExpenseAmount] = useState("");
  const [fixedExpensePaymentDay, setFixedExpensePaymentDay] = useState("1");
  const [fixedExpenseEndDate, setFixedExpenseEndDate] = useState(formatDate(today));
  const [fixedExpenseHasNoEndDate, setFixedExpenseHasNoEndDate] = useState(false);
  const [fixedExpenseStartsThisMonth, setFixedExpenseStartsThisMonth] = useState(true);
  const [fixedExpenseName, setFixedExpenseName] = useState("");
  const [isFixedExpenseSubmitting, setIsFixedExpenseSubmitting] = useState(false);
  const [isFixedExpenseDeleting, setIsFixedExpenseDeleting] = useState(false);
  const [isFixedExpenseSkipping, setIsFixedExpenseSkipping] = useState(false);
  const [openFixedExpensePauseMenuId, setOpenFixedExpensePauseMenuId] = useState("");
  const [detailSort, setDetailSort] = useState<DetailSort>(null);

  const selectedDateKey = formatDate(selectedDate);
  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();
  const selectedMonthStartKey = formatDate(new Date(currentYear, currentMonth, 1));
  const selectedMonthEndKey = formatDate(new Date(currentYear, currentMonth + 1, 0));
  const dashboardRange = useMemo(
    () => ({
      from: formatDate(new Date(currentYear, currentMonth - 12, 1)),
      to: formatDate(new Date(currentYear, currentMonth + 13, 0)),
    }),
    [currentMonth, currentYear],
  );

  const refreshStoredSavings = useCallback(async () => {
    if (!isAuthResolved || isDemoMode) {
      setStoredSavingsAccounts([]);
      setStoredSavingsPayments([]);
      return;
    }

    const [accounts, payments] = await Promise.all([
      getSavingsAccounts(),
      getSavingsPaymentsByRange(dashboardRange.from, dashboardRange.to, {
        includeCancelled: true,
      }),
    ]);

    setStoredSavingsAccounts(accounts);
    setStoredSavingsPayments(payments);
  }, [dashboardRange.from, dashboardRange.to, isAuthResolved, isDemoMode]);

  const refreshStoredFixedExpenses = useCallback(async () => {
    if (!isAuthResolved || isDemoMode) {
      setStoredFixedExpenseRules([]);
      setStoredFixedExpensePayments([]);
      return;
    }

    const [rules, payments] = await Promise.all([
      getFixedExpenseRules(),
      getFixedExpensePaymentsByRange(dashboardRange.from, dashboardRange.to, {
        includeCancelled: true,
      }),
    ]);

    setStoredFixedExpenseRules(rules);
    setStoredFixedExpensePayments(payments);
  }, [dashboardRange.from, dashboardRange.to, isAuthResolved, isDemoMode]);

  useEffect(() => {
    if (!isAuthResolved) {
      setIsDashboardLoading(true);
      return;
    }

    if (isDemoMode) {
      window.queueMicrotask(() => {
        setExpenses(readDemoExpenses());
        setStoredSavingsAccounts([]);
        setStoredSavingsPayments([]);
        setStoredFixedExpenseRules([]);
        setStoredFixedExpensePayments([]);
        setIsDashboardLoading(false);
      });
      return;
    }

    let isCancelled = false;

    const fetchDashboardExpenses = async () => {
      setIsDashboardLoading(true);
      try {
        const [
          data,
          accounts,
          payments,
          fixedRules,
          fixedPayments,
        ] = await Promise.all([
          getExpensesByRange(dashboardRange.from, dashboardRange.to),
          getSavingsAccounts(),
          getSavingsPaymentsByRange(dashboardRange.from, dashboardRange.to, {
            includeCancelled: true,
          }),
          getFixedExpenseRules(),
          getFixedExpensePaymentsByRange(dashboardRange.from, dashboardRange.to, {
            includeCancelled: true,
          }),
        ]);
        if (!isCancelled) {
          setExpenses(data || []);
          setStoredSavingsAccounts(accounts);
          setStoredSavingsPayments(payments);
          setStoredFixedExpenseRules(fixedRules);
          setStoredFixedExpensePayments(fixedPayments);
        }
      } catch {
        if (!isCancelled) {
          setExpenses([]);
          setStoredSavingsAccounts([]);
          setStoredSavingsPayments([]);
          setStoredFixedExpenseRules([]);
          setStoredFixedExpensePayments([]);
        }
      } finally {
        if (!isCancelled) {
          setIsDashboardLoading(false);
        }
      }
    };

    fetchDashboardExpenses();

    return () => {
      isCancelled = true;
    };
  }, [
    dashboardRange.from,
    dashboardRange.to,
    isAuthResolved,
    isDemoMode,
  ]);

  const storedSavingsAccountMap = useMemo(
    () => new Map(storedSavingsAccounts.map((account) => [account.id, account])),
    [storedSavingsAccounts],
  );
  const activeStoredSavingsPayments = useMemo(
    () =>
      getEffectiveActivePayments(
        storedSavingsPayments,
        (payment) => payment.savings_account_id,
      ),
    [storedSavingsPayments],
  );
  const pausedStoredSavingsPayments = useMemo(
    () =>
      getEffectivePausedPayments(
        storedSavingsPayments,
        (payment) => payment.savings_account_id,
      ),
    [storedSavingsPayments],
  );
  const storedSavingsPaymentsForListByAccount = useMemo(() => {
    const grouped = new Map<string, SavingsPayment[]>();

    storedSavingsPayments.forEach((payment) => {
      const payments = grouped.get(payment.savings_account_id) ?? [];
      payments.push(payment);
      grouped.set(payment.savings_account_id, payments);
    });

    grouped.forEach((payments) => {
      payments.sort((left, right) =>
        left.payment_date.localeCompare(right.payment_date),
      );
    });

    return grouped;
  }, [storedSavingsPayments]);
  const storedSavingsPaymentsByAccount = useMemo(() => {
    const grouped = new Map<string, SavingsPayment[]>();

    activeStoredSavingsPayments.forEach((payment) => {
      const payments = grouped.get(payment.savings_account_id) ?? [];
      payments.push(payment);
      grouped.set(payment.savings_account_id, payments);
    });

    grouped.forEach((payments) => {
      payments.sort((left, right) =>
        left.payment_date.localeCompare(right.payment_date),
      );
    });

    return grouped;
  }, [activeStoredSavingsPayments]);
  const storedFixedExpenseRuleMap = useMemo(
    () => new Map(storedFixedExpenseRules.map((rule) => [rule.id, rule])),
    [storedFixedExpenseRules],
  );
  const activeStoredFixedExpensePayments = useMemo(
    () =>
      getEffectiveActivePayments(
        storedFixedExpensePayments,
        (payment) => payment.fixed_expense_rule_id,
      ),
    [storedFixedExpensePayments],
  );
  const pausedStoredFixedExpensePayments = useMemo(
    () =>
      getEffectivePausedPayments(
        storedFixedExpensePayments,
        (payment) => payment.fixed_expense_rule_id,
      ),
    [storedFixedExpensePayments],
  );
  const storedFixedExpensePaymentsForListByRule = useMemo(() => {
    const grouped = new Map<string, FixedExpensePayment[]>();

    storedFixedExpensePayments.forEach((payment) => {
      const payments = grouped.get(payment.fixed_expense_rule_id) ?? [];
      payments.push(payment);
      grouped.set(payment.fixed_expense_rule_id, payments);
    });

    grouped.forEach((payments) => {
      payments.sort((left, right) =>
        left.payment_date.localeCompare(right.payment_date),
      );
    });

    return grouped;
  }, [storedFixedExpensePayments]);
  const storedFixedExpensePaymentsByRule = useMemo(() => {
    const grouped = new Map<string, FixedExpensePayment[]>();

    activeStoredFixedExpensePayments.forEach((payment) => {
      const payments = grouped.get(payment.fixed_expense_rule_id) ?? [];
      payments.push(payment);
      grouped.set(payment.fixed_expense_rule_id, payments);
    });

    grouped.forEach((payments) => {
      payments.sort((left, right) =>
        left.payment_date.localeCompare(right.payment_date),
      );
    });

    return grouped;
  }, [activeStoredFixedExpensePayments]);
  const storedSavingsExpenseItems = useMemo<DashboardExpense[]>(
    () =>
      activeStoredSavingsPayments.map((payment) => {
        const account = storedSavingsAccountMap.get(payment.savings_account_id);

        return {
          id: payment.id,
          user_id: payment.user_id,
          amount: payment.amount,
          type: "expense",
          category: savingsCategory,
          memo: account?.name ?? "적금",
          date: payment.payment_date,
          status: payment.status,
          created_at: payment.created_at,
        };
      }),
    [activeStoredSavingsPayments, storedSavingsAccountMap],
  );
  const pausedStoredSavingsExpenseItems = useMemo<DashboardExpense[]>(
    () =>
      pausedStoredSavingsPayments.map((payment) => {
        const account = storedSavingsAccountMap.get(payment.savings_account_id);

        return {
          id: payment.id,
          user_id: payment.user_id,
          amount: payment.amount,
          type: "expense",
          category: savingsCategory,
          memo: account?.name ?? "적금",
          date: payment.payment_date,
          status: payment.status,
          created_at: payment.created_at,
        };
      }),
    [pausedStoredSavingsPayments, storedSavingsAccountMap],
  );
  const storedFixedExpenseItems = useMemo<DashboardExpense[]>(
    () =>
      activeStoredFixedExpensePayments.map((payment) => {
        const rule = storedFixedExpenseRuleMap.get(payment.fixed_expense_rule_id);

        return {
          id: payment.id,
          user_id: payment.user_id,
          amount: payment.amount,
          type: "expense",
          category: rule?.category || rule?.name || "고정지출",
          memo: rule?.name ?? "고정지출",
          date: payment.payment_date,
          status: payment.status,
          created_at: payment.created_at,
        };
      }),
    [activeStoredFixedExpensePayments, storedFixedExpenseRuleMap],
  );
  const pausedStoredFixedExpenseItems = useMemo<DashboardExpense[]>(
    () =>
      pausedStoredFixedExpensePayments.map((payment) => {
        const rule = storedFixedExpenseRuleMap.get(payment.fixed_expense_rule_id);

        return {
          id: payment.id,
          user_id: payment.user_id,
          amount: payment.amount,
          type: "expense",
          category: rule?.category || rule?.name || "고정지출",
          memo: rule?.name ?? "고정지출",
          date: payment.payment_date,
          status: payment.status,
          created_at: payment.created_at,
        };
      }),
    [pausedStoredFixedExpensePayments, storedFixedExpenseRuleMap],
  );
  const storedPaymentIds = useMemo(
    () =>
      new Set([
        ...storedSavingsPayments.map((payment) => payment.id),
        ...storedFixedExpensePayments.map((payment) => payment.id),
      ]),
    [storedFixedExpensePayments, storedSavingsPayments],
  );
  const activeExpenses = useMemo(
    () => expenses.filter((item) => !isLegacyRecurringPaused(item)),
    [expenses],
  );
  const pausedLegacyExpenseItems = useMemo<DashboardExpense[]>(
    () => expenses.filter(isLegacyRecurringPaused).map(mapLegacyPausedExpense),
    [expenses],
  );
  const dashboardExpenses = useMemo(
    () => [...activeExpenses, ...storedSavingsExpenseItems, ...storedFixedExpenseItems],
    [activeExpenses, storedFixedExpenseItems, storedSavingsExpenseItems],
  );
  const displayDashboardExpenses = useMemo<DashboardExpense[]>(
    () => [
      ...dashboardExpenses,
      ...pausedLegacyExpenseItems,
      ...pausedStoredSavingsExpenseItems,
      ...pausedStoredFixedExpenseItems,
    ],
    [
      dashboardExpenses,
      pausedLegacyExpenseItems,
      pausedStoredFixedExpenseItems,
      pausedStoredSavingsExpenseItems,
    ],
  );

  const monthlyExpenses = useMemo(
    () =>
      dashboardExpenses.filter((item) => {
        const date = new Date(item.date);
        return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
      }),
    [currentMonth, currentYear, dashboardExpenses],
  );
  const displayMonthlyExpenses = useMemo<DashboardExpense[]>(
    () =>
      displayDashboardExpenses.filter((item) => {
        const date = new Date(item.date);
        return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
      }),
    [currentMonth, currentYear, displayDashboardExpenses],
  );
  const monthlyEditableExpenses = useMemo(
    () =>
      monthlyExpenses.filter(
        (item) =>
          !storedPaymentIds.has(item.id) &&
          !parseSavingsMemo(item.memo) &&
          !parseFixedExpenseMemo(item.memo),
      ),
    [monthlyExpenses, storedPaymentIds],
  );
  const monthlyExpenseItems = monthlyExpenses.filter(
    (item) => item.type === "expense" && !isSavingsItem(item) && !isInvestmentItem(item),
  );
  const monthlySavingsItems = monthlyExpenses.filter(isSavingsItem);
  const monthlyInvestmentItems = monthlyExpenses.filter(isInvestmentItem);
  const monthlyExpenseTotal = monthlyExpenseItems
    .reduce((sum, item) => sum + item.amount, 0);
  const monthlySavingsTotal = monthlySavingsItems
    .reduce((sum, item) => sum + item.amount, 0);
  const monthlyInvestmentTotal = monthlyInvestmentItems
    .reduce((sum, item) => sum + item.amount, 0);
  const monthlyIncomeTotal = monthlyExpenses
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const monthlyIncomeCount = monthlyExpenses.filter((item) => item.type === "income").length;
  const monthlyExpenseCount = monthlyExpenseItems.length;
  const monthlySavingsCount = monthlySavingsItems.length;
  const monthlyInvestmentCount = monthlyInvestmentItems.length;
  const monthlyIncomeAverage = monthlyIncomeCount
    ? monthlyIncomeTotal / monthlyIncomeCount
    : 0;
  const monthlyExpenseAverage = monthlyExpenseCount
    ? monthlyExpenseTotal / monthlyExpenseCount
    : 0;
  const monthlyTotal =
    monthlyIncomeTotal - monthlyExpenseTotal - monthlySavingsTotal - monthlyInvestmentTotal;
  const cashflowSeries = getDailySeries(dashboardExpenses, currentYear, currentMonth);
  const incomeSeries = getDailySeries(dashboardExpenses, currentYear, currentMonth, "income");
  const expenseSeries = getDailySeries(dashboardExpenses, currentYear, currentMonth, "expense");
  const savingsSeries = getDailySeries(dashboardExpenses, currentYear, currentMonth, "savings");
  const selectedCalendarItems = useMemo(
    () => displayMonthlyExpenses.filter((item) => item.date === selectedDateKey),
    [displayMonthlyExpenses, selectedDateKey],
  );
  const selectedDayItems = useMemo(
    () =>
      monthlyEditableExpenses.filter(
        (item) =>
          item.date === selectedDateKey && getInlineEntryType(item) === inlineEditListType,
      ),
    [inlineEditListType, monthlyEditableExpenses, selectedDateKey],
  );
  const categoryExpenseItems = useMemo(() => {
    const categoryTotals = monthlyExpenses
      .filter(
        (item) => item.type === "expense" && !isSavingsItem(item) && !isInvestmentItem(item),
      )
      .reduce<Record<string, number>>((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.amount;
        return acc;
      }, {});
    const totalAmount = Object.values(categoryTotals).reduce(
      (sum, amount) => sum + amount,
      0,
    );

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalAmount ? (amount / totalAmount) * 100 : 0,
      }))
      .sort((left, right) => right.amount - left.amount);
  }, [monthlyExpenses]);
  const inlineEditItems = useMemo(
    () =>
      monthlyEditableExpenses
        .filter((item) => getInlineEntryType(item) === inlineEditListType)
        .sort((left, right) => {
          const dateDiff = new Date(right.date).getTime() - new Date(left.date).getTime();
          if (dateDiff !== 0) return dateDiff;
          return right.created_at.localeCompare(left.created_at);
        }),
    [inlineEditListType, monthlyEditableExpenses],
  );
  const detailItems = useMemo(
    () => {
      const items = [...displayMonthlyExpenses];

      return items.sort((left, right) => {
        if (detailSort) {
          const multiplier = detailSort.direction === "asc" ? 1 : -1;

          if (detailSort.key === "amount") {
            const amountDiff = (left.amount - right.amount) * multiplier;
            if (amountDiff !== 0) return amountDiff;
          } else {
            const leftValue =
              detailSort.key === "type"
                ? getDetailTypeLabel(left)
                : detailSort.key === "memo"
                  ? getVisibleMemo(left.memo)
                  : left[detailSort.key];
            const rightValue =
              detailSort.key === "type"
                ? getDetailTypeLabel(right)
                : detailSort.key === "memo"
                  ? getVisibleMemo(right.memo)
                  : right[detailSort.key];
            const valueDiff = leftValue.localeCompare(rightValue, "ko") * multiplier;
            if (valueDiff !== 0) return valueDiff;
          }
        }

        const dateDiff = new Date(right.date).getTime() - new Date(left.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return right.created_at.localeCompare(left.created_at);
      });
    },
    [detailSort, displayMonthlyExpenses],
  );
  const handleDetailSort = (key: DetailSortKey) => {
    setDetailSort((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };
  const selectedInlineExpense =
    inlineEditItems.find((item) => item.id === inlineEditingId) ?? null;
  const dayMap = displayMonthlyExpenses.reduce<Record<string, number>>((acc, item) => {
    acc[item.date] = (acc[item.date] || 0) + 1;
    return acc;
  }, {});
  const calendarDays = getCalendarDays(selectedDate);
  const activeCategoryOptions = getInlineCategoryOptions(inlineType);
  const activeInlineTabType =
    inlineFormMode === "edit" ? inlineEditListType : inlineType;
  const savingsAccounts = useMemo<SavingsAccount[]>(() => {
    const todayKey = formatDate(today);
    const selectedMonthStartKey = formatDate(new Date(currentYear, currentMonth, 1));
    const grouped = expenses.reduce<Record<string, SavingsAccount>>((acc, item) => {
      const parsedMeta = parseSavingsMemo(item.memo);
      if (
        item.type !== "expense" ||
        (!parsedMeta && !item.category.includes("적금"))
      ) {
        return acc;
      }
      const meta = parsedMeta ?? getFallbackSavingsMeta(item);

      if (!acc[meta.id]) {
        acc[meta.id] = {
          ...meta,
          source: "legacy",
          items: [],
          currentAmount: meta.initialAmount,
          monthlyPayment: item.amount,
          nextPaymentDate: item.date,
        };
      }
      acc[meta.id].items.push(item);
      acc[meta.id].monthlyPayment = item.amount;
      if (item.date > acc[meta.id].maturityDate) {
        acc[meta.id].maturityDate = item.date;
      }
      return acc;
    }, {});

    const legacyAccountItems = Object.values(grouped)
      .map((account) => {
        const sortedItems = [...account.items].sort((left, right) =>
          left.date.localeCompare(right.date),
        );
        const paidAmount = sortedItems
          .filter((item) => item.date <= todayKey && !isLegacyRecurringPaused(item))
          .reduce((sum, item) => sum + item.amount, 0);
        const nextPayment =
          sortedItems.find((item) => item.date >= todayKey) ?? sortedItems.at(-1);
        const selectedMonthPayment =
          sortedItems.find((item) => item.date >= selectedMonthStartKey) ?? sortedItems.at(-1);
        return {
          ...account,
          items: sortedItems,
          currentAmount: account.initialAmount + paidAmount,
          monthlyPayment: selectedMonthPayment?.amount ?? account.monthlyPayment,
          nextPaymentDate: nextPayment?.date ?? account.maturityDate,
        };
      });

    const storedAccountItems = storedSavingsAccounts.map<SavingsAccount>((account) => {
      const activePayments = storedSavingsPaymentsByAccount.get(account.id) ?? [];
      const items: Expense[] = activePayments.map((payment) => ({
        id: payment.id,
        user_id: payment.user_id,
        amount: payment.amount,
        type: "expense",
        category: savingsCategory,
        memo: account.name,
        date: payment.payment_date,
        created_at: payment.created_at,
      }));
      const paidAmount = activePayments
        .filter((payment) => payment.payment_date <= todayKey)
        .reduce((sum, payment) => sum + payment.amount, 0);
      const nextPayment =
        activePayments.find((payment) => payment.payment_date >= todayKey) ??
        activePayments.at(-1);
      const selectedMonthPayment =
        activePayments.find((payment) => payment.payment_date >= selectedMonthStartKey) ??
        activePayments.at(-1);
      const maturityDate =
        account.maturity_date ?? activePayments.at(-1)?.payment_date ?? account.start_date;

      return {
        id: account.id,
        name: account.name,
        paymentDay: account.payment_day,
        maturityDate,
        initialAmount: account.initial_amount,
        hasNoMaturity: account.has_no_maturity,
        source: "new",
        items,
        currentAmount: account.initial_amount + paidAmount,
        monthlyPayment: selectedMonthPayment?.amount ?? account.monthly_amount,
        nextPaymentDate: nextPayment?.payment_date ?? maturityDate,
      };
    });

    return [...legacyAccountItems, ...storedAccountItems].sort((left, right) =>
      left.maturityDate.localeCompare(right.maturityDate),
    );
  }, [
    currentMonth,
    currentYear,
    expenses,
    storedSavingsAccounts,
    storedSavingsPaymentsByAccount,
    today,
  ]);
  const selectedSavingsAccount =
    savingsAccounts.find((account) => account.id === savingsEditingId) ?? null;
  const visibleSavingsAccounts = useMemo(() => {
    return savingsAccounts.filter((account) =>
      account.source === "new"
        ? (storedSavingsPaymentsForListByAccount.get(account.id) ?? []).some(
            (payment) =>
              payment.payment_date >= selectedMonthStartKey &&
              payment.payment_date <= selectedMonthEndKey,
          )
        : account.items.some(
            (item) => item.date >= selectedMonthStartKey && item.date <= selectedMonthEndKey,
          ),
    );
  }, [
    savingsAccounts,
    selectedMonthEndKey,
    selectedMonthStartKey,
    storedSavingsPaymentsForListByAccount,
  ]);
  const fixedExpenseAccounts = useMemo<FixedExpenseAccount[]>(() => {
    const todayKey = formatDate(today);
    const selectedMonthStartKey = formatDate(new Date(currentYear, currentMonth, 1));
    const grouped = expenses.reduce<Record<string, FixedExpenseAccount>>((acc, item) => {
      const meta = parseFixedExpenseMemo(item.memo);
      if (!meta) return acc;

      if (!acc[meta.id]) {
        acc[meta.id] = {
          ...meta,
          source: "legacy",
          items: [],
          monthlyAmount: item.amount,
          nextPaymentDate: item.date,
        };
      }
      acc[meta.id].items.push(item);
      if (item.date > acc[meta.id].endDate) {
        acc[meta.id].endDate = item.date;
      }
      return acc;
    }, {});

    const legacyRuleItems = Object.values(grouped)
      .map((account) => {
        const sortedItems = [...account.items].sort((left, right) =>
          left.date.localeCompare(right.date),
        );
        const nextPayment =
          sortedItems.find((item) => item.date >= todayKey) ?? sortedItems.at(-1);
        const selectedMonthPayment =
          sortedItems.find((item) => item.date >= selectedMonthStartKey) ?? sortedItems.at(-1);
        return {
          ...account,
          items: sortedItems,
          monthlyAmount: selectedMonthPayment?.amount ?? account.monthlyAmount,
          nextPaymentDate: nextPayment?.date ?? account.endDate,
        };
      });

    const storedRuleItems = storedFixedExpenseRules.map<FixedExpenseAccount>((rule) => {
      const activePayments = storedFixedExpensePaymentsByRule.get(rule.id) ?? [];
      const items: Expense[] = activePayments.map((payment) => ({
        id: payment.id,
        user_id: payment.user_id,
        amount: payment.amount,
        type: "expense",
        category: rule.category || rule.name,
        memo: rule.name,
        date: payment.payment_date,
        created_at: payment.created_at,
      }));
      const nextPayment =
        activePayments.find((payment) => payment.payment_date >= todayKey) ??
        activePayments.at(-1);
      const selectedMonthPayment =
        activePayments.find((payment) => payment.payment_date >= selectedMonthStartKey) ??
        activePayments.at(-1);
      const endDate =
        rule.end_date ?? activePayments.at(-1)?.payment_date ?? rule.start_date;

      return {
        id: rule.id,
        name: rule.name,
        paymentDay: rule.payment_day,
        endDate,
        hasNoEndDate: rule.has_no_end_date,
        source: "new",
        items,
        monthlyAmount: selectedMonthPayment?.amount ?? rule.amount,
        nextPaymentDate: nextPayment?.payment_date ?? endDate,
      };
    });

    return [...legacyRuleItems, ...storedRuleItems].sort(
      (left, right) =>
        left.paymentDay - right.paymentDay || left.name.localeCompare(right.name, "ko"),
    );
  }, [
    currentMonth,
    currentYear,
    expenses,
    storedFixedExpensePaymentsByRule,
    storedFixedExpenseRules,
    today,
  ]);
  const selectedFixedExpenseAccount =
    fixedExpenseAccounts.find((account) => account.id === fixedExpenseEditingId) ?? null;
  const visibleFixedExpenseAccounts = useMemo(() => {
    return fixedExpenseAccounts.filter((account) =>
      account.source === "new"
        ? (storedFixedExpensePaymentsForListByRule.get(account.id) ?? []).some(
            (payment) =>
              payment.payment_date >= selectedMonthStartKey &&
              payment.payment_date <= selectedMonthEndKey,
          )
        : account.items.some(
            (item) => item.date >= selectedMonthStartKey && item.date <= selectedMonthEndKey,
          ),
    );
  }, [
    fixedExpenseAccounts,
    selectedMonthEndKey,
    selectedMonthStartKey,
    storedFixedExpensePaymentsForListByRule,
  ]);

  const resetInlineCreateForm = useCallback((date = selectedDateKey) => {
    setInlineAmount("");
    setInlineCategory(categoryOptions[0]);
    setInlineCustomCategory("");
    setInlineMemo("");
    setInlineDate(date);
    setInlineType("expense");
  }, [selectedDateKey]);

  const fillInlineEditForm = useCallback((expense: Expense) => {
    const type = getInlineEntryType(expense);
    const categoryList = getInlineCategoryOptions(type);

    setInlineAmount(expense.amount.toLocaleString());
    setInlineCategory(
      categoryList.includes(expense.category) ? expense.category : customCategoryValue,
    );
    setInlineCustomCategory(
      categoryList.includes(expense.category) ? "" : expense.category,
    );
    setInlineMemo(getVisibleMemo(expense.memo));
    setInlineDate(expense.date);
    setInlineType(type);
  }, []);

  const resetSavingsCreateForm = useCallback(() => {
    setSavingsPaymentAmount("");
    setSavingsPaymentDay("1");
    setSavingsMaturityDate(formatDate(selectedDate));
    setSavingsHasNoMaturity(false);
    setSavingsStartsThisMonth(true);
    setSavingsCurrentAmount("");
    setSavingsName("");
  }, [selectedDate]);

  const resetFixedExpenseCreateForm = useCallback(() => {
    setFixedExpenseAmount("");
    setFixedExpensePaymentDay("1");
    setFixedExpenseEndDate(formatDate(selectedDate));
    setFixedExpenseHasNoEndDate(false);
    setFixedExpenseStartsThisMonth(true);
    setFixedExpenseName("");
  }, [selectedDate]);

  const fillSavingsEditForm = useCallback((account: SavingsAccount) => {
    setSavingsPaymentAmount(account.monthlyPayment.toLocaleString());
    setSavingsPaymentDay(String(account.paymentDay));
    setSavingsMaturityDate(account.maturityDate);
    setSavingsHasNoMaturity(account.hasNoMaturity);
    setSavingsStartsThisMonth(true);
    setSavingsCurrentAmount(account.initialAmount.toLocaleString());
    setSavingsName(account.name);
  }, []);

  const fillFixedExpenseEditForm = useCallback((account: FixedExpenseAccount) => {
    setFixedExpenseAmount(account.monthlyAmount.toLocaleString());
    setFixedExpensePaymentDay(String(account.paymentDay));
    setFixedExpenseEndDate(account.endDate);
    setFixedExpenseHasNoEndDate(account.hasNoEndDate);
    setFixedExpenseStartsThisMonth(true);
    setFixedExpenseName(account.name);
  }, []);

  useEffect(() => {
    if (inlineFormMode === "create") {
      setInlineDate(selectedDateKey);
      return;
    }

    const nextExpense =
      inlineEditItems.find((item) => item.id === inlineEditingId) ??
      selectedDayItems[0] ??
      inlineEditItems[0];

    if (!nextExpense) {
      setInlineEditingId("");
      resetInlineCreateForm(selectedDateKey);
      return;
    }

    if (nextExpense.id !== inlineEditingId) {
      setInlineEditingId(nextExpense.id);
    }
    fillInlineEditForm(nextExpense);
  }, [
    fillInlineEditForm,
    inlineEditingId,
    inlineEditItems,
    inlineFormMode,
    resetInlineCreateForm,
    selectedDateKey,
    selectedDayItems,
  ]);

  useEffect(() => {
    if (savingsFormMode === "edit" && savingsAccounts.length === 0) {
      setSavingsEditingId("");
      setSavingsFormMode("create");
      resetSavingsCreateForm();
      return;
    }

    if (savingsFormMode === "create") return;

    const nextAccount = selectedSavingsAccount ?? savingsAccounts[0];
    if (!nextAccount) {
      setSavingsEditingId("");
      setSavingsFormMode("create");
      resetSavingsCreateForm();
      return;
    }

    if (nextAccount.id !== savingsEditingId) {
      setSavingsEditingId(nextAccount.id);
    }
    fillSavingsEditForm(nextAccount);
  }, [
    fillSavingsEditForm,
    resetSavingsCreateForm,
    savingsAccounts,
    savingsEditingId,
    savingsFormMode,
    selectedSavingsAccount,
  ]);

  useEffect(() => {
    if (fixedExpenseFormMode === "edit" && fixedExpenseAccounts.length === 0) {
      setFixedExpenseEditingId("");
      setFixedExpenseFormMode("create");
      resetFixedExpenseCreateForm();
      return;
    }

    if (fixedExpenseFormMode === "create") return;

    const nextAccount = selectedFixedExpenseAccount ?? fixedExpenseAccounts[0];
    if (!nextAccount) {
      setFixedExpenseEditingId("");
      setFixedExpenseFormMode("create");
      resetFixedExpenseCreateForm();
      return;
    }

    if (nextAccount.id !== fixedExpenseEditingId) {
      setFixedExpenseEditingId(nextAccount.id);
    }
    fillFixedExpenseEditForm(nextAccount);
  }, [
    fillFixedExpenseEditForm,
    fixedExpenseAccounts,
    fixedExpenseEditingId,
    fixedExpenseFormMode,
    resetFixedExpenseCreateForm,
    selectedFixedExpenseAccount,
  ]);

  const handleDelete = async (id: string) => {
    if (isDemoMode) {
      setExpenses((prev) => {
        const next = prev.filter((item) => item.id !== id);
        writeDemoExpenses(next);
        return next;
      });
      if (inlineEditingId === id) {
        setInlineEditingId("");
        setInlineFormMode("create");
        resetInlineCreateForm();
      }
      return;
    }

    await deleteExpense(id);
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    if (inlineEditingId === id) {
      setInlineEditingId("");
      setInlineFormMode("create");
      resetInlineCreateForm();
    }
  };
  const handleOverviewMonthChange = (offset: number) => {
    setSelectedDate(new Date(currentYear, currentMonth + offset, 1));
  };
  const handleInlineModeChange = (mode: InlineFormMode) => {
    setInlineFormMode(mode);
    if (mode === "create") {
      resetInlineCreateForm();
    } else {
      setInlineEditListType(inlineType);
    }
  };
  const handleInlineTypeChange = (type: InlineEntryType) => {
    if (inlineFormMode === "edit") {
      if (!monthlyEditableExpenses.some((item) => getInlineEntryType(item) === type)) {
        alert("수정할 내역이 없습니다.");
        return;
      }

      setInlineEditListType(type);
      return;
    }

    const nextCategoryOptions = getInlineCategoryOptions(type);

    setInlineType(type);
    setInlineCategory(nextCategoryOptions[0]);
    setInlineCustomCategory("");
  };
  const handleInlineClassificationChange = (type: InlineEntryType) => {
    const nextCategoryOptions = getInlineCategoryOptions(type);

    setInlineType(type);
    setInlineCategory(nextCategoryOptions[0]);
    setInlineCustomCategory("");
  };
  const handleSavingsModeChange = (mode: InlineFormMode) => {
    setSavingsFormMode(mode);
    setSavingsStartsThisMonth(true);
    if (mode === "create") {
      setSavingsEditingId("");
      resetSavingsCreateForm();
    } else if (!savingsEditingId && savingsAccounts[0]) {
      setSavingsEditingId(savingsAccounts[0].id);
    }
  };
  const handleSavingsStartMonthChange = (checked: boolean) => {
    setSavingsStartsThisMonth(checked);
    if (!checked) {
      alert(getNextMonthPaymentChangeMessage(selectedDate));
    }
  };
  const handleFixedExpenseModeChange = (mode: InlineFormMode) => {
    setFixedExpenseFormMode(mode);
    setFixedExpenseStartsThisMonth(true);
    if (mode === "create") {
      setFixedExpenseEditingId("");
      resetFixedExpenseCreateForm();
    } else if (!fixedExpenseEditingId && fixedExpenseAccounts[0]) {
      setFixedExpenseEditingId(fixedExpenseAccounts[0].id);
    }
  };
  const handleFixedExpenseStartMonthChange = (checked: boolean) => {
    setFixedExpenseStartsThisMonth(checked);
    if (!checked) {
      alert(getNextMonthPaymentChangeMessage(selectedDate));
    }
  };
  const persistSavingsDeletion = async (account: SavingsAccount) => {
    const ids = account.items.map((item) => item.id);
    if (isDemoMode) {
      setExpenses((prev) => {
        const next = prev.filter((item) => !ids.includes(item.id));
        writeDemoExpenses(next);
        return next;
      });
      return;
    }

    if (account.source === "new") {
      await deleteSavingsAccount(account.id);
      await refreshStoredSavings();
      return;
    }

    await deleteExpenses(ids);
    setExpenses((prev) => prev.filter((item) => !ids.includes(item.id)));
  };
  const persistSavingsReplacement = async (
    account: SavingsAccount,
    changeStartDateKey: string,
    nextMemo: string,
  ) => {
    const keptItems = account.items.filter((item) => item.date < changeStartDateKey);
    const replacedItems = account.items.filter((item) => item.date >= changeStartDateKey);
    const keptIds = new Set(keptItems.map((item) => item.id));
    const replacedIds = new Set(replacedItems.map((item) => item.id));

    if (isDemoMode) {
      setExpenses((prev) => {
        const next = prev
          .filter((item) => !replacedIds.has(item.id))
          .map((item) => (keptIds.has(item.id) ? { ...item, memo: nextMemo } : item));
        writeDemoExpenses(next);
        return next;
      });
      return;
    }

    await deleteExpenses(replacedItems.map((item) => item.id));
    await Promise.all(
      keptItems.map((item) =>
        updateExpense(item.id, {
          amount: item.amount,
          category: item.category,
          memo: nextMemo,
          date: item.date,
          type: item.type,
        }),
      ),
    );
    setExpenses((prev) =>
      prev
        .filter((item) => !replacedIds.has(item.id))
        .map((item) => (keptIds.has(item.id) ? { ...item, memo: nextMemo } : item)),
    );
  };
  const persistFixedExpenseDeletion = async (account: FixedExpenseAccount) => {
    const ids = account.items.map((item) => item.id);
    if (isDemoMode) {
      setExpenses((prev) => {
        const next = prev.filter((item) => !ids.includes(item.id));
        writeDemoExpenses(next);
        return next;
      });
      return;
    }

    if (account.source === "new") {
      await deleteFixedExpenseRule(account.id);
      await refreshStoredFixedExpenses();
      return;
    }

    await deleteExpenses(ids);
    setExpenses((prev) => prev.filter((item) => !ids.includes(item.id)));
  };
  const persistFixedExpenseReplacement = async (
    account: FixedExpenseAccount,
    changeStartDateKey: string,
    nextMemo: string,
    nextCategory: string,
  ) => {
    const keptItems = account.items.filter((item) => item.date < changeStartDateKey);
    const replacedItems = account.items.filter((item) => item.date >= changeStartDateKey);
    const keptIds = new Set(keptItems.map((item) => item.id));
    const replacedIds = new Set(replacedItems.map((item) => item.id));

    if (isDemoMode) {
      setExpenses((prev) => {
        const next = prev
          .filter((item) => !replacedIds.has(item.id))
          .map((item) =>
            keptIds.has(item.id) ? { ...item, category: nextCategory, memo: nextMemo } : item,
          );
        writeDemoExpenses(next);
        return next;
      });
      return;
    }

    await deleteExpenses(replacedItems.map((item) => item.id));
    await Promise.all(
      keptItems.map((item) =>
        updateExpense(item.id, {
          amount: item.amount,
          category: nextCategory,
          memo: nextMemo,
          date: item.date,
          type: item.type,
        }),
      ),
    );
    setExpenses((prev) =>
      prev
        .filter((item) => !replacedIds.has(item.id))
        .map((item) =>
          keptIds.has(item.id) ? { ...item, category: nextCategory, memo: nextMemo } : item,
        ),
    );
  };
  const getSelectedMonthItems = (items: Expense[]) =>
    items
      .filter((item) => item.date >= selectedMonthStartKey && item.date <= selectedMonthEndKey);

  const getSelectedMonthItemIds = (items: Expense[]) =>
    getSelectedMonthItems(items).map((item) => item.id);

  const getSelectedMonthSavingsPayments = (account: SavingsAccount) => {
    if (account.source !== "new") return [];

    return (storedSavingsPaymentsForListByAccount.get(account.id) ?? []).filter(
      (payment) =>
        payment.payment_date >= selectedMonthStartKey &&
        payment.payment_date <= selectedMonthEndKey,
    );
  };

  const getSelectedMonthFixedExpensePayments = (account: FixedExpenseAccount) => {
    if (account.source !== "new") return [];

    return (storedFixedExpensePaymentsForListByRule.get(account.id) ?? []).filter(
      (payment) =>
        payment.payment_date >= selectedMonthStartKey &&
        payment.payment_date <= selectedMonthEndKey,
    );
  };

  const isSavingsPausedForSelectedMonth = (account: SavingsAccount) =>
    account.source === "new"
      ? getSelectedMonthSavingsPayments(account).length > 0 &&
        !hasActivePayment(getSelectedMonthSavingsPayments(account))
      : getSelectedMonthItems(account.items).length > 0 &&
        getSelectedMonthItems(account.items).every(isLegacyRecurringPaused);

  const isFixedExpensePausedForSelectedMonth = (account: FixedExpenseAccount) =>
    account.source === "new"
      ? getSelectedMonthFixedExpensePayments(account).length > 0 &&
        !hasActivePayment(getSelectedMonthFixedExpensePayments(account))
      : getSelectedMonthItems(account.items).length > 0 &&
        getSelectedMonthItems(account.items).every(isLegacyRecurringPaused);

  const handleSavingsPauseToggle = async (account: SavingsAccount) => {
    const selectedPayments = getSelectedMonthSavingsPayments(account);
    const isPaused = selectedPayments.length > 0 && !hasActivePayment(selectedPayments);
    const itemIds =
      account.source === "new"
        ? isPaused
          ? getRestorablePaymentIds(selectedPayments)
          : selectedPayments
              .filter((payment) => payment.status !== "cancelled")
              .map((payment) => payment.id)
        : getSelectedMonthItemIds(account.items);

    if (!itemIds.length) {
      alert(
        isPaused
          ? "이번 달 일시정지를 취소할 적금 납입 내역이 없습니다."
          : "이번 달 일시정지할 적금 납입 내역이 없습니다.",
      );
      return;
    }

    const confirmed = await confirm(
      isPaused
        ? "이번 달 적금 납입 일시정지를 취소할까요?"
        : "이번 달 적금 납입을 일시정지할까요?",
    );
    if (!confirmed) return;

    setIsSavingsSkipping(true);
    setOpenSavingsPauseMenuId("");

    try {
      if (account.source === "new" && !isDemoMode) {
        await updateSavingsPayments(itemIds, {
          status: isPaused ? "scheduled" : "cancelled",
          paid_at: null,
        });
        await refreshStoredSavings();
      } else {
        const targetIds = new Set(itemIds);
        if (isDemoMode) {
          setExpenses((prev) => {
            const next = prev.map((item) =>
              targetIds.has(item.id)
                ? { ...item, memo: getMemoWithPauseState(item.memo, !isPaused) }
                : item,
            );
            writeDemoExpenses(next);
            return next;
          });
        } else {
          await Promise.all(
            getSelectedMonthItems(account.items).map((item) =>
              updateExpense(item.id, {
                amount: item.amount,
                category: item.category,
                memo: getMemoWithPauseState(item.memo, !isPaused),
                date: item.date,
                type: item.type,
              }),
            ),
          );
          setExpenses((prev) =>
            prev.map((item) =>
              targetIds.has(item.id)
                ? { ...item, memo: getMemoWithPauseState(item.memo, !isPaused) }
                : item,
            ),
          );
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "적금 일시정지 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setIsSavingsSkipping(false);
    }
  };

  const handleFixedExpensePauseToggle = async (account: FixedExpenseAccount) => {
    const selectedPayments = getSelectedMonthFixedExpensePayments(account);
    const isPaused = selectedPayments.length > 0 && !hasActivePayment(selectedPayments);
    const itemIds =
      account.source === "new"
        ? isPaused
          ? getRestorablePaymentIds(selectedPayments)
          : selectedPayments
              .filter((payment) => payment.status !== "cancelled")
              .map((payment) => payment.id)
        : getSelectedMonthItemIds(account.items);

    if (!itemIds.length) {
      alert(
        isPaused
          ? "이번 달 일시정지를 취소할 고정지출 내역이 없습니다."
          : "이번 달 일시정지할 고정지출 내역이 없습니다.",
      );
      return;
    }

    const confirmed = await confirm(
      isPaused
        ? "이번 달 고정지출 일시정지를 취소할까요?"
        : "이번 달 고정지출을 일시정지할까요?",
    );
    if (!confirmed) return;

    setIsFixedExpenseSkipping(true);
    setOpenFixedExpensePauseMenuId("");

    try {
      if (account.source === "new" && !isDemoMode) {
        await updateFixedExpensePayments(itemIds, {
          status: isPaused ? "scheduled" : "cancelled",
          paid_at: null,
        });
        await refreshStoredFixedExpenses();
      } else {
        const targetIds = new Set(itemIds);
        if (isDemoMode) {
          setExpenses((prev) => {
            const next = prev.map((item) =>
              targetIds.has(item.id)
                ? { ...item, memo: getMemoWithPauseState(item.memo, !isPaused) }
                : item,
            );
            writeDemoExpenses(next);
            return next;
          });
        } else {
          await Promise.all(
            getSelectedMonthItems(account.items).map((item) =>
              updateExpense(item.id, {
                amount: item.amount,
                category: item.category,
                memo: getMemoWithPauseState(item.memo, !isPaused),
                date: item.date,
                type: item.type,
              }),
            ),
          );
          setExpenses((prev) =>
            prev.map((item) =>
              targetIds.has(item.id)
                ? { ...item, memo: getMemoWithPauseState(item.memo, !isPaused) }
                : item,
            ),
          );
        }
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "고정지출 일시정지 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setIsFixedExpenseSkipping(false);
    }
  };

  const handleSavingsSubmit = async () => {
    const paymentAmount = parseFormattedNumber(savingsPaymentAmount);
    const paymentDay = Number(savingsPaymentDay);
    const initialAmount = parseFormattedNumber(savingsCurrentAmount) || 0;
    const name = savingsName.trim();
    const maturityDate = new Date(`${savingsMaturityDate}T00:00:00`);

    if (!paymentAmount || paymentAmount <= 0) {
      alert("납입 금액을 입력해주세요.");
      return;
    }
    if (!paymentDay || paymentDay < 1 || paymentDay > 31) {
      alert("납입일을 1일부터 31일 중에서 선택해주세요.");
      return;
    }
    if (!savingsHasNoMaturity && (!savingsMaturityDate || Number.isNaN(maturityDate.getTime()))) {
      alert("만기일을 선택해주세요.");
      return;
    }
    if (!name) {
      alert("적금 이름을 입력해주세요.");
      return;
    }

    const savingsOriginalStartDate =
      savingsFormMode === "edit" && selectedSavingsAccount?.items[0]
        ? new Date(`${selectedSavingsAccount.items[0].date}T00:00:00`)
        : selectedDate;
    const savingsChangeStartDate =
      savingsFormMode === "edit"
        ? new Date(currentYear, currentMonth + (savingsStartsThisMonth ? 0 : 1), 1)
        : savingsOriginalStartDate;
    if (!savingsHasNoMaturity && maturityDate < new Date(formatDate(savingsChangeStartDate))) {
      alert("만기일은 첫 납입월 이후로 선택해주세요.");
      return;
    }
    const savingsEndDate = savingsHasNoMaturity
      ? getOpenEndedSavingsDate(savingsOriginalStartDate)
      : savingsMaturityDate;

    const meta: SavingsMeta = {
      id:
        savingsFormMode === "edit" && selectedSavingsAccount
          ? selectedSavingsAccount.id
          : `savings-${Date.now()}`,
      name,
      paymentDay,
      maturityDate: savingsEndDate,
      initialAmount,
      hasNoMaturity: savingsHasNoMaturity,
    };
    const paymentDates = getSavingsPaymentDates(savingsChangeStartDate, paymentDay, savingsEndDate);
    if (!paymentDates.length) {
      alert("추가할 납입 내역이 없습니다.");
      return;
    }

    const payloads: ExpenseFormData[] = paymentDates.map((date) => ({
      amount: paymentAmount,
      category: savingsCategory,
      memo: encodeSavingsMemo(meta),
      date,
      type: "expense",
    }));

    try {
      setIsSavingsSubmitting(true);
      if (savingsFormMode === "edit") {
        if (!selectedSavingsAccount) {
          alert("수정할 적금을 선택해주세요.");
          return;
        }
        if (selectedSavingsAccount.source === "new") {
          await updateSavingsAccount(selectedSavingsAccount.id, {
            name,
            monthly_amount: paymentAmount,
            payment_day: paymentDay,
            start_date: formatDate(savingsOriginalStartDate),
            maturity_date: savingsHasNoMaturity ? null : savingsMaturityDate,
            has_no_maturity: savingsHasNoMaturity,
            initial_amount: initialAmount,
            status: "active",
          });
          await cancelFutureSavingsPayments(
            selectedSavingsAccount.id,
            formatDate(savingsChangeStartDate),
          );
          await createSavingsPayments(
            paymentDates.map((date) => ({
              savings_account_id: selectedSavingsAccount.id,
              amount: paymentAmount,
              payment_date: date,
            })),
          );
          await refreshStoredSavings();
        } else {
          await persistSavingsReplacement(
            selectedSavingsAccount,
            formatDate(savingsChangeStartDate),
            encodeSavingsMemo(meta),
          );
        }
      }

      if (isDemoMode) {
        const createdAt = new Date().toISOString();
        const demoItems: Expense[] = payloads.map((payload, index) => ({
          id: `demo-${meta.id}-${index}-${Date.now()}`,
          user_id: DEMO_USER_ID,
          created_at: createdAt,
          ...payload,
        }));
        setExpenses((prev) => {
          const next = [...demoItems, ...prev];
          writeDemoExpenses(next);
          return next;
        });
      } else if (savingsFormMode === "create") {
        const account = await createSavingsAccount({
          name,
          monthly_amount: paymentAmount,
          payment_day: paymentDay,
          start_date: formatDate(savingsOriginalStartDate),
          maturity_date: savingsHasNoMaturity ? null : savingsMaturityDate,
          has_no_maturity: savingsHasNoMaturity,
          initial_amount: initialAmount,
        });
        await createSavingsPayments(
          paymentDates.map((date) => ({
            savings_account_id: account.id,
            amount: paymentAmount,
            payment_date: date,
          })),
        );
        await refreshStoredSavings();
      } else if (selectedSavingsAccount?.source === "legacy") {
        const saved = await createExpenses(payloads);
        setExpenses((prev) => [...prev, ...(saved || [])]);
      }

      setSelectedDate(new Date(`${paymentDates[0]}T00:00:00`));
      setSavingsFormMode("create");
      setSavingsEditingId("");
      resetSavingsCreateForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "적금 저장 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setIsSavingsSubmitting(false);
    }
  };
  const handleSavingsDelete = async () => {
    if (!selectedSavingsAccount) {
      alert("삭제할 적금을 선택해주세요.");
      return;
    }

    const confirmed = await confirm("선택한 적금과 예정 납입 내역을 모두 삭제할까요?");
    if (!confirmed) return;

    try {
      setIsSavingsDeleting(true);
      await persistSavingsDeletion(selectedSavingsAccount);
      setSavingsEditingId("");
      setSavingsFormMode("create");
      resetSavingsCreateForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "적금 삭제 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setIsSavingsDeleting(false);
    }
  };
  const handleFixedExpenseSubmit = async () => {
    const amount = parseFormattedNumber(fixedExpenseAmount);
    const paymentDay = Number(fixedExpensePaymentDay);
    const name = fixedExpenseName.trim();
    const endDate = new Date(`${fixedExpenseEndDate}T00:00:00`);

    if (!amount || amount <= 0) {
      alert("지출 금액을 입력해주세요.");
      return;
    }
    if (!paymentDay || paymentDay < 1 || paymentDay > 31) {
      alert("지출일을 1일부터 31일 중에서 선택해주세요.");
      return;
    }
    if (!fixedExpenseHasNoEndDate && (!fixedExpenseEndDate || Number.isNaN(endDate.getTime()))) {
      alert("지출기한을 선택해주세요.");
      return;
    }
    if (!name) {
      alert("지출 이름을 입력해주세요.");
      return;
    }

    const originalStartDate =
      fixedExpenseFormMode === "edit" && selectedFixedExpenseAccount?.items[0]
        ? new Date(`${selectedFixedExpenseAccount.items[0].date}T00:00:00`)
        : selectedDate;
    const changeStartDate =
      fixedExpenseFormMode === "edit"
        ? new Date(currentYear, currentMonth + (fixedExpenseStartsThisMonth ? 0 : 1), 1)
        : originalStartDate;
    if (!fixedExpenseHasNoEndDate && endDate < new Date(formatDate(changeStartDate))) {
      alert("지출기한은 첫 지출월 이후로 선택해주세요.");
      return;
    }

    const fixedEndDate = fixedExpenseHasNoEndDate
      ? getOpenEndedSavingsDate(originalStartDate)
      : fixedExpenseEndDate;
    const meta: FixedExpenseMeta = {
      id:
        fixedExpenseFormMode === "edit" && selectedFixedExpenseAccount
          ? selectedFixedExpenseAccount.id
          : `fixed-expense-${Date.now()}`,
      name,
      paymentDay,
      endDate: fixedEndDate,
      hasNoEndDate: fixedExpenseHasNoEndDate,
    };
    const paymentDates = getSavingsPaymentDates(changeStartDate, paymentDay, fixedEndDate);
    if (!paymentDates.length) {
      alert("추가할 고정지출 내역이 없습니다.");
      return;
    }

    const memo = encodeFixedExpenseMemo(meta);
    const payloads: ExpenseFormData[] = paymentDates.map((date) => ({
      amount,
      category: name,
      memo,
      date,
      type: "expense",
    }));

    try {
      setIsFixedExpenseSubmitting(true);
      if (fixedExpenseFormMode === "edit") {
        if (!selectedFixedExpenseAccount) {
          alert("수정할 고정지출을 선택해주세요.");
          return;
        }
        if (selectedFixedExpenseAccount.source === "new") {
          await updateFixedExpenseRule(selectedFixedExpenseAccount.id, {
            name,
            amount,
            category: name,
            payment_day: paymentDay,
            start_date: formatDate(originalStartDate),
            end_date: fixedExpenseHasNoEndDate ? null : fixedExpenseEndDate,
            has_no_end_date: fixedExpenseHasNoEndDate,
            status: "active",
          });
          await cancelFutureFixedExpensePayments(
            selectedFixedExpenseAccount.id,
            formatDate(changeStartDate),
          );
          await createFixedExpensePayments(
            paymentDates.map((date) => ({
              fixed_expense_rule_id: selectedFixedExpenseAccount.id,
              amount,
              payment_date: date,
            })),
          );
          await refreshStoredFixedExpenses();
        } else {
          await persistFixedExpenseReplacement(
            selectedFixedExpenseAccount,
            formatDate(changeStartDate),
            memo,
            name,
          );
        }
      }

      if (isDemoMode) {
        const createdAt = new Date().toISOString();
        const demoItems: Expense[] = payloads.map((payload, index) => ({
          id: `demo-${meta.id}-${index}-${Date.now()}`,
          user_id: DEMO_USER_ID,
          created_at: createdAt,
          ...payload,
        }));
        setExpenses((prev) => {
          const next = [...demoItems, ...prev];
          writeDemoExpenses(next);
          return next;
        });
      } else if (fixedExpenseFormMode === "create") {
        const rule = await createFixedExpenseRule({
          name,
          amount,
          category: name,
          payment_day: paymentDay,
          start_date: formatDate(originalStartDate),
          end_date: fixedExpenseHasNoEndDate ? null : fixedExpenseEndDate,
          has_no_end_date: fixedExpenseHasNoEndDate,
        });
        await createFixedExpensePayments(
          paymentDates.map((date) => ({
            fixed_expense_rule_id: rule.id,
            amount,
            payment_date: date,
          })),
        );
        await refreshStoredFixedExpenses();
      } else if (selectedFixedExpenseAccount?.source === "legacy") {
        const saved = await createExpenses(payloads);
        setExpenses((prev) => [...prev, ...(saved || [])]);
      }

      setSelectedDate(new Date(`${paymentDates[0]}T00:00:00`));
      setFixedExpenseFormMode("create");
      setFixedExpenseEditingId("");
      resetFixedExpenseCreateForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "고정지출 저장 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setIsFixedExpenseSubmitting(false);
    }
  };
  const handleFixedExpenseDelete = async () => {
    if (!selectedFixedExpenseAccount) {
      alert("삭제할 고정지출을 선택해주세요.");
      return;
    }

    const confirmed = await confirm("선택한 고정지출과 예정 지출 내역을 모두 삭제할까요?");
    if (!confirmed) return;

    try {
      setIsFixedExpenseDeleting(true);
      await persistFixedExpenseDeletion(selectedFixedExpenseAccount);
      setFixedExpenseEditingId("");
      setFixedExpenseFormMode("create");
      resetFixedExpenseCreateForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "고정지출 삭제 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setIsFixedExpenseDeleting(false);
    }
  };
  const handleFixedExpenseEnd = async (account: FixedExpenseAccount) => {
    const confirmed = await confirm("고정지출을 종료하시겠습니까?");
    if (!confirmed) return;

    const cutoffDate = selectedMonthEndKey;
    const keptItems = account.items.filter((item) => item.date <= cutoffDate);
    const deletedItems = account.items.filter((item) => item.date > cutoffDate);
    const endDate = keptItems.at(-1)?.date;

    if (!endDate) {
      alert("남길 고정지출 내역이 없습니다.");
      return;
    }

    const nextMeta: FixedExpenseMeta = {
      id: account.id,
      name: account.name,
      paymentDay: account.paymentDay,
      endDate,
      hasNoEndDate: false,
    };
    const nextMemo = encodeFixedExpenseMemo(nextMeta);
    const keptIds = new Set(keptItems.map((item) => item.id));
    const deletedIds = new Set(deletedItems.map((item) => item.id));

    try {
      setIsFixedExpenseDeleting(true);
      if (!isDemoMode && account.source === "new") {
        const futureStartDate = formatDate(new Date(currentYear, currentMonth + 1, 1));
        await updateFixedExpenseRule(account.id, {
          end_date: endDate,
          has_no_end_date: false,
          status: "ended",
        });
        await cancelFutureFixedExpensePayments(account.id, futureStartDate);
        await refreshStoredFixedExpenses();
      } else if (isDemoMode) {
        setExpenses((prev) => {
          const next = prev
            .filter((item) => !deletedIds.has(item.id))
            .map((item) => (keptIds.has(item.id) ? { ...item, memo: nextMemo } : item));
          writeDemoExpenses(next);
          return next;
        });
      } else {
        await deleteExpenses(deletedItems.map((item) => item.id));
        await Promise.all(
          keptItems.map((item) =>
            updateExpense(item.id, {
              amount: item.amount,
              category: item.category,
              memo: nextMemo,
              date: item.date,
              type: item.type,
            }),
          ),
        );
        setExpenses((prev) =>
          prev
            .filter((item) => !deletedIds.has(item.id))
            .map((item) => (keptIds.has(item.id) ? { ...item, memo: nextMemo } : item)),
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "고정지출 종료 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setIsFixedExpenseDeleting(false);
    }
  };
  const handleSavingsMaturity = async (account: SavingsAccount) => {
    const confirmed = await confirm("만기 처리 하시겠습니까?");
    if (!confirmed) return;

    const cutoffDate = selectedMonthEndKey;
    const keptItems = account.items.filter((item) => item.date <= cutoffDate);
    const deletedItems = account.items.filter((item) => item.date > cutoffDate);
    const maturityDate = keptItems.at(-1)?.date;

    if (!maturityDate) {
      alert("남길 납입 내역이 없습니다.");
      return;
    }

    const nextMeta: SavingsMeta = {
      id: account.id,
      name: account.name,
      paymentDay: account.paymentDay,
      maturityDate,
      initialAmount: account.initialAmount,
      hasNoMaturity: false,
    };
    const nextMemo = encodeSavingsMemo(nextMeta);
    const keptIds = new Set(keptItems.map((item) => item.id));
    const deletedIds = new Set(deletedItems.map((item) => item.id));

    try {
      setIsSavingsDeleting(true);
      if (!isDemoMode && account.source === "new") {
        const futureStartDate = formatDate(new Date(currentYear, currentMonth + 1, 1));
        await updateSavingsAccount(account.id, {
          maturity_date: maturityDate,
          has_no_maturity: false,
          status: "completed",
        });
        await cancelFutureSavingsPayments(account.id, futureStartDate);
        await refreshStoredSavings();
      } else if (isDemoMode) {
        setExpenses((prev) => {
          const next = prev
            .filter((item) => !deletedIds.has(item.id))
            .map((item) => (keptIds.has(item.id) ? { ...item, memo: nextMemo } : item));
          writeDemoExpenses(next);
          return next;
        });
      } else {
        await deleteExpenses(deletedItems.map((item) => item.id));
        await Promise.all(
          keptItems.map((item) =>
            updateExpense(item.id, {
              amount: item.amount,
              category: item.category,
              memo: nextMemo,
              date: item.date,
              type: item.type,
            }),
          ),
        );
        setExpenses((prev) =>
          prev
            .filter((item) => !deletedIds.has(item.id))
            .map((item) => (keptIds.has(item.id) ? { ...item, memo: nextMemo } : item)),
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "만기 처리 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setIsSavingsDeleting(false);
    }
  };
  const handleInlineSubmit = async () => {
    const amount = parseFormattedNumber(inlineAmount);
    const category =
      inlineCategory === customCategoryValue
        ? inlineCustomCategory.trim()
        : inlineCategory;

    if (!amount || amount <= 0) {
      alert("금액을 입력해주세요.");
      return;
    }
    if (!category) {
      alert("카테고리를 선택하거나 입력해주세요.");
      return;
    }

    const trimmedMemo = inlineMemo.trim();
    const memo =
      inlineFormMode === "edit" && selectedInlineExpense
        ? getMemoWithPreservedMeta(trimmedMemo, selectedInlineExpense.memo)
        : trimmedMemo;

    const payload: ExpenseFormData = {
      amount,
      category,
      memo,
      date: inlineDate,
      type: inlineType === "income" ? "income" : "expense",
    };

    try {
      setIsInlineSubmitting(true);
      if (inlineFormMode === "edit") {
        if (!selectedInlineExpense) {
          alert("수정할 내역을 선택해주세요.");
          return;
        }
        if (isDemoMode) {
          setExpenses((prev) => {
            const next = prev.map((item) =>
              item.id === selectedInlineExpense.id ? { ...item, ...payload } : item,
            );
            writeDemoExpenses(next);
            return next;
          });
        } else {
          await updateExpense(selectedInlineExpense.id, payload);
          setExpenses((prev) =>
            prev.map((item) =>
              item.id === selectedInlineExpense.id ? { ...item, ...payload } : item,
            ),
          );
        }
        if (getInlineEntryType(selectedInlineExpense) !== inlineType) {
          setInlineEditListType(inlineType);
        }
      } else {
        if (isDemoMode) {
          const demoExpense: Expense = {
            id: `demo-${Date.now()}`,
            user_id: DEMO_USER_ID,
            created_at: new Date().toISOString(),
            ...payload,
          };
          setExpenses((prev) => {
            const next = [demoExpense, ...prev];
            writeDemoExpenses(next);
            return next;
          });
        } else {
          const saved = await createExpense(payload);
          setExpenses((prev) => [...prev, ...(saved || [])]);
        }
        resetInlineCreateForm(payload.date);
      }
      setSelectedDate(new Date(`${payload.date}T00:00:00`));
    } catch (error) {
      const message = error instanceof Error ? error.message : "저장 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setIsInlineSubmitting(false);
    }
  };
  const handleInlineDelete = async () => {
    if (!selectedInlineExpense) {
      alert("삭제할 내역을 선택해주세요.");
      return;
    }

    const confirmed = await confirm("선택한 내역을 삭제할까요?");
    if (!confirmed) return;

    try {
      setIsInlineDeleting(true);
      await handleDelete(selectedInlineExpense.id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setIsInlineDeleting(false);
    }
  };
  const openCalendarModal = () => {
    setShowCalendarModal(true);
  };
  const closeCalendarModal = () => {
    setShowCalendarModal(false);
  };
  const handleCalendarSelect = (value: Value) => {
    if (!(value instanceof Date)) return;
    setSelectedDate(value);
    setShowCalendarModal(false);
  };
  return (
    <div className="home-page">
      <SideMenu
        displayName={displayName}
        displayEmail={displayEmail}
        isDemoMode={isDemoMode}
      />
      <main className="main column-group">
        <section className="main-header row-group row-group--center row-group--between">
          <h2 className="main-header--title headline--sm">대시보드</h2>
          <button
            type="button"
            className="button button--sm button--icon-left button--outline main-header--calendar-button"
            aria-haspopup="dialog"
            onClick={openCalendarModal}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              calendar_month
            </span>
            {formatHeaderDate(selectedDate)}
          </button>
        </section>
        <section className="column-group column-group--gap-16">
          <div className="main-overview column-group column-group--gap-16">
            <h3 className="main-common-title title--md">개요</h3>
            <div className="main-overview-card row-group row-group--stretch row-group--gap-16">
              {/* 이번 달 현금흐름 */}
              <div className="card overview-card column-group column-group--center column-group--gap-8">
                <h4 className="main-overview--title title--sm">이번 달 현금흐름</h4>
                <div className="row-group row-group--center row-group--between">
                  <p className="main-overview--num title--lg">
                    {formatWon(monthlyTotal)}
                  </p>
                </div>
                <div className="column-group column-group--gap-4">
                  <p className="main-overview--last label--md">
                    수입 {formatWon(monthlyIncomeTotal)} · 지출{" "}
                    {formatWon(monthlyExpenseTotal)}
                  </p>
                  <p className="main-overview--last label--md">
                    저축 {formatWon(monthlySavingsTotal)} · 투자원금{" "}
                    {formatWon(monthlyInvestmentTotal)}
                  </p>
                </div>

                <OverviewLineChart
                  lines={[{ values: cashflowSeries, color: "teal", label: "현금흐름" }]}
                />
              </div>
              {/* 수입 */}
              <div className="card overview-card column-group column-group--center column-group--gap-8">
                <h4 className="main-overview--title title--sm">이번 달 수입</h4>
                <div className="row-group row-group--center row-group--between">
                  <p className="main-overview--num title--lg">
                    {formatWon(monthlyIncomeTotal)}
                  </p>
                </div>
                <p className="main-overview--last label--md">
                  총 {monthlyIncomeCount}건 · 평균 {formatWon(monthlyIncomeAverage)}
                </p>
                <OverviewLineChart
                  lines={[{ values: incomeSeries, color: "blue", label: "수입" }]}
                />
              </div>
              {/* 지출 */}
              <div className="card overview-card column-group column-group--center column-group--gap-8">
                <h4 className="main-overview--title title--sm">이번 달 지출</h4>
                <div className="row-group row-group--center row-group--between">
                  <p className="main-overview--num title--lg">
                    {formatWon(monthlyExpenseTotal)}
                  </p>
                </div>
                <p className="main-overview--last label--md">
                  총 {monthlyExpenseCount}건 · 평균 {formatWon(monthlyExpenseAverage)}
                </p>
                <OverviewLineChart
                  lines={[{ values: expenseSeries, color: "red", label: "지출" }]}
                />
              </div>
              {/* 저축 */}
              <div className="card overview-card column-group column-group--center column-group--gap-8">
                <h4 className="main-overview--title title--sm">
                  이번 달 저축 및 투자원금
                </h4>
                <div className="row-group row-group--center row-group--gap-12">
                  <p className="main-overview--num title--lg">
                    {formatWon(monthlySavingsTotal + monthlyInvestmentTotal)}
                  </p>
                </div>
                <div className="row-group row-group--center row-group--gap-4">
                  <p className="main-overview--last label--md">
                    저축: {formatWon(monthlySavingsTotal)}
                  </p>
                  <p className="main-overview--last label--md">
                     · 투자원금: {formatWon(monthlyInvestmentTotal)}
                  </p>
                  <p className="main-overview--last label--md">
                     · 총 {monthlySavingsCount + monthlyInvestmentCount}건
                  </p>
                </div>
                <OverviewLineChart
                  lines={[{ values: savingsSeries, color: "blue", label: "저축" }]}
                />
              </div>
            </div>
            <h3 className="main-common-title title--md">등록 / 수정</h3>
            <div className="row-group row-group--stretch row-group--gap-16">
              {/* 달력 */}
              <div className="card overview-card main-overview--calendar-card column-group--center ">
                <div className="column-group column-group--gap-16">
                  <div className="main-overview--section-header row-group row-group--center row-group--between">
                    <h4 className="main-overview--title title--sm">
                      {selectedDateKey.replaceAll("-", ".")} 현황
                    </h4>
                    <div className="main-overview--calendar-nav row-group row-group--center">
                      <button
                        type="button"
                        className="button button--icon-only button--sm button--subtle"
                        aria-label="이전 달"
                        onClick={() => handleOverviewMonthChange(-1)}
                      >
                        <span className="material-symbols-outlined" aria-hidden="true">
                          chevron_left
                        </span>
                      </button>
                      <span className="label--lg">
                        {currentYear}.{String(currentMonth + 1).padStart(2, "0")}
                      </span>
                      <button
                        type="button"
                        className="button button--icon-only button--sm button--subtle"
                        aria-label="다음 달"
                        onClick={() => handleOverviewMonthChange(1)}
                      >
                        <span className="material-symbols-outlined" aria-hidden="true">
                          chevron_right
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="main-overview--calendar">
                    <div className="main-overview--weekday-row">
                      {weekdayLabels.map((label) => (
                        <span key={label} className="label--sm">
                          {label}
                        </span>
                      ))}
                    </div>
                    <div className="main-overview--calendar-grid">
                      {calendarDays.map((date) => {
                        const key = formatDate(date);
                        const isCurrentMonth = date.getMonth() === currentMonth;
                        const isToday = key === formatDate(today);
                        const isSelected = key === selectedDateKey;
                        const hasEntries = Boolean(dayMap[key]);
                        return (
                          <button
                            key={key}
                            type="button"
                            className={`main-overview--day body--sm ${!isCurrentMonth ? "is-muted" : ""} ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""}`}
                            onClick={() => setSelectedDate(date)}
                          >
                            <span className="day-unit body--lg">{date.getDate()}</span>
                            {hasEntries ? (
                              <span className="main-overview--day-dot" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="main-overview--calendar-footer column-group column-group--gap-8">
                    <div className="row-group row-group--center row-group--between">
                      <span className="bodyBold--md">선택일</span>
                      <strong className="bodyBold--md">
                        {selectedCalendarItems.length}건
                      </strong>
                    </div>
                    <ul className="calendar-content column-group column-group--gap-4">
                      {selectedCalendarItems.map((item) => {
                        const isIncome = item.type === "income";
                        const isSavings = isSavingsItem(item);
                        const isInvestment = isInvestmentItem(item);
                        const isPaused = item.status === "cancelled";
                        return (
                          <li
                            key={item.id}
                            className="calendar-content--item row-group row-group--center row-group--gap-16"
                          >
                            <p className="calendar-content--sort">
                              <span
                                className={`badge ${
                                  isInvestment
                                    ? "badge--violet"
                                    : isSavings
                                      ? "badge--blue"
                                      : isIncome
                                        ? "badge--green"
                                        : "badge--red"
                                }`}
                              >
                                {isInvestment
                                  ? "투자"
                                  : isSavings
                                    ? "저축"
                                    : isIncome
                                      ? "수입"
                                      : "지출"}
                              </span>
                              {isPaused ? <span className="badge">일시정지</span> : null}
                            </p>
                            <div className="row-group row-group--center row-group--gap-8">
                              <p className="calendar-content--num label--lg">
                                {item.category}
                              </p>
                              <p className="calendar-content--num label--lg">
                                {formatCurrency(item.amount)}
                              </p>
                            </div>
                            <p className="calendar-content--num label--lg">
                              {getVisibleMemo(item.memo) || "-"}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
              {/* 입력, 수정 */}
              <div className="card overview-card main-overview--form-card column-group--center ">
                <div className="column-group column-group--gap-16">
                  <div className="main-overview--section-header row-group row-group--center row-group--between">
                    <h4 className="main-overview--title title--sm">내역 추가/수정</h4>
                    <div
                      className="main-overview--tabs"
                      role="tablist"
                      aria-label="내역 입력 모드"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={inlineFormMode === "create"}
                        className={`main-overview--tab bodyBold--sm ${inlineFormMode === "create" ? "is-active" : ""}`}
                        onClick={() => handleInlineModeChange("create")}
                      >
                        추가
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={inlineFormMode === "edit"}
                        className={`main-overview--tab bodyBold--sm ${inlineFormMode === "edit" ? "is-active" : ""}`}
                        onClick={() => handleInlineModeChange("edit")}
                      >
                        수정
                      </button>
                    </div>
                  </div>
                  <div className="main-overview--form">
                    {inlineFormMode === "edit" ? (
                      <label className="main-overview--field">
                        <span className="label--md">수정할 내역</span>
                        <select
                          className="main-overview--control body--sm"
                          value={inlineEditingId}
                          onChange={(event) => setInlineEditingId(event.target.value)}
                          disabled={inlineEditItems.length === 0}
                        >
                          {inlineEditItems.length === 0 ? (
                            <option value="">이번 달 내역 없음</option>
                          ) : (
                            inlineEditItems.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.date} · {getVisibleMemo(item.memo) || item.category}{" "}
                                · {item.amount.toLocaleString()}원
                              </option>
                            ))
                          )}
                        </select>
                      </label>
                    ) : null}
                    <div className="main-overview--type-toggle main-overview--type-toggle__grid">
                      <button
                        type="button"
                        className={`main-overview--type bodyBold--sm ${activeInlineTabType === "expense" ? "is-active" : ""}`}
                        onClick={() => handleInlineTypeChange("expense")}
                      >
                        지출
                      </button>
                      <button
                        type="button"
                        className={`main-overview--type bodyBold--sm ${activeInlineTabType === "income" ? "is-active" : ""}`}
                        onClick={() => handleInlineTypeChange("income")}
                      >
                        수입
                      </button>
                      <button
                        type="button"
                        className={`main-overview--type bodyBold--sm ${activeInlineTabType === "savings" ? "is-active" : ""}`}
                        onClick={() => handleInlineTypeChange("savings")}
                      >
                        저축
                      </button>
                      <button
                        type="button"
                        className={`main-overview--type bodyBold--sm ${activeInlineTabType === "investment" ? "is-active" : ""}`}
                        onClick={() => handleInlineTypeChange("investment")}
                      >
                        투자
                      </button>
                    </div>
                    {inlineType === "investment" ? (
                      <p className="label--md invest-noti">
                        투자금은 현재 주가와 무관하게, 투자한 금액을 기록하기 위한
                        내역입니다.
                      </p>
                    ) : null}
                    {inlineFormMode === "edit" ? (
                      <label className="main-overview--field">
                        <span className="label--md">대카테고리 변경</span>
                        <select
                          className="main-overview--control body--sm"
                          value={inlineType}
                          onChange={(event) =>
                            handleInlineClassificationChange(
                              event.target.value as InlineEntryType,
                            )
                          }
                        >
                          <option value="expense">지출</option>
                          <option value="income">수입</option>
                          <option value="savings">저축</option>
                          <option value="investment">투자</option>
                        </select>
                      </label>
                    ) : null}
                    <div className="main-overview--form-grid">
                      <label className="main-overview--field">
                        <span className="label--md">카테고리</span>
                        <select
                          className="main-overview--control body--sm"
                          value={inlineCategory}
                          onChange={(event) => setInlineCategory(event.target.value)}
                        >
                          {activeCategoryOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                          <option value={customCategoryValue}>직접 입력</option>
                        </select>
                      </label>
                      <label className="main-overview--field">
                        <span className="label--md">날짜</span>
                        <input
                          className="main-overview--control body--sm"
                          type="date"
                          value={inlineDate}
                          onChange={(event) => setInlineDate(event.target.value)}
                        />
                      </label>
                    </div>
                    {inlineCategory === customCategoryValue ? (
                      <label className="main-overview--field">
                        <span className="label--md">임시 카테고리</span>
                        <input
                          className="main-overview--control body--sm"
                          type="text"
                          placeholder="예: 병원, 선물"
                          value={inlineCustomCategory}
                          onChange={(event) =>
                            setInlineCustomCategory(event.target.value)
                          }
                        />
                      </label>
                    ) : null}
                    <div className="main-overview--form-grid">
                      <label className="main-overview--field">
                        <span className="label--md">금액</span>
                        <input
                          className="main-overview--control body--sm"
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={inlineAmount}
                          onChange={(event) =>
                            setInlineAmount(formatIntegerInput(event.target.value))
                          }
                        />
                      </label>
                      <label className="main-overview--field">
                        <span className="label--md">메모</span>
                        <input
                          className="main-overview--control body--sm"
                          type="text"
                          placeholder="간단한 메모"
                          value={inlineMemo}
                          onChange={(event) => setInlineMemo(event.target.value)}
                        />
                      </label>
                    </div>
                    <div className="main-overview--actions row-group row-group--center row-group--gap-8">
                      {inlineFormMode === "edit" ? (
                        <button
                          type="button"
                          className="button button--outline button--md main-overview--delete"
                          onClick={handleInlineDelete}
                          disabled={
                            isInlineSubmitting ||
                            isInlineDeleting ||
                            !selectedInlineExpense
                          }
                        >
                          {isInlineDeleting ? "삭제 중..." : "삭제"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="button button--primary button--md button--full main-overview--submit"
                        onClick={handleInlineSubmit}
                        disabled={
                          isInlineSubmitting ||
                          isInlineDeleting ||
                          (inlineFormMode === "edit" && !selectedInlineExpense)
                        }
                      >
                        {isInlineSubmitting
                          ? "저장 중..."
                          : inlineFormMode === "edit"
                            ? "수정 저장"
                            : "내역 추가"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* 카테고리 지출 비율 */}
              <div className="card overview-card main-overview--category-rate-card column-group column-group--gap-16">
                <div className="column-group column-group--gap-16">
                  <h4 className="main-overview--title title--sm">카테고리 지출 비율</h4>
                  <div className="graph-section">
                    <CategoryPieChart items={categoryExpenseItems} />
                  </div>
                </div>
                <div className="column-group column-group--gap-16">
                  <ul className="content-rate column-group column-group--gap-16">
                    {categoryExpenseItems.length ? (
                      categoryExpenseItems.map((item, index) => (
                        <li
                          key={item.category}
                          className="column-group column-group--gap-8"
                          style={
                            {
                              "--content-rate": `${item.percentage}%`,
                              "--content-rate-color":
                                categoryChartColors[index % categoryChartColors.length],
                            } as CSSProperties
                          }
                        >
                          <div className="row-group row-group--center row-group--between">
                            <span className="label--lg">{item.category}</span>
                            <span className="bodyBold--md">
                              {item.percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div
                            className="content-rate--percentage"
                            aria-label={`${item.category} ${item.percentage.toFixed(1)}%`}
                          />
                        </li>
                      ))
                    ) : (
                      <li className="content-rate--empty label--md">
                        이번 달 지출 내역이 없습니다.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
            <h3 className="main-common-title title--md">특수지출</h3>
            <div className="row-group row-group--stretch row-group--gap-16">
              {/* 적금 */}
              <div className="main-overview--savings card overview-card column-group column-group--gap-8">
                <div className="column-group column-group--gap-16">
                  <div className="main-overview--section-header row-group row-group--center row-group--between">
                    <h4 className="main-overview--title title--sm">적금 추가/수정</h4>
                    <div
                      className="main-overview--tabs"
                      role="tablist"
                      aria-label="내역 입력 모드"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={savingsFormMode === "create"}
                        className={`main-overview--tab bodyBold--sm ${savingsFormMode === "create" ? "is-active" : ""}`}
                        onClick={() => handleSavingsModeChange("create")}
                      >
                        추가
                      </button>
                      {savingsAccounts.length ? (
                        <button
                          type="button"
                          role="tab"
                          aria-selected={savingsFormMode === "edit"}
                          className={`main-overview--tab bodyBold--sm ${savingsFormMode === "edit" ? "is-active" : ""}`}
                          onClick={() => handleSavingsModeChange("edit")}
                        >
                          수정
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="main-overview--form">
                    {savingsFormMode === "edit" ? (
                      <label className="main-overview--field">
                        <span className="form-label label--md">수정할 적금</span>
                        <select
                          className="main-overview--control body--sm"
                          value={savingsEditingId}
                          onChange={(event) => setSavingsEditingId(event.target.value)}
                          disabled={savingsAccounts.length === 0}
                        >
                          {savingsAccounts.length === 0 ? (
                            <option value="">등록된 적금 없음</option>
                          ) : (
                            savingsAccounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.name} · 매월 {account.paymentDay}일 ·{" "}
                                {account.monthlyPayment.toLocaleString()}원
                              </option>
                            ))
                          )}
                        </select>
                      </label>
                    ) : null}
                    <div className="grid-col-3">
                      <label className="main-overview--field flex-fill">
                        <div className="row-group row-group--center row-group--between">
                          <span className="form-label label--md">납입 금액</span>
                          {savingsFormMode === "edit" ? (
                            <label className="row-group row-group--center row-group--gap-4">
                              <input
                                type="checkbox"
                                checked={savingsStartsThisMonth}
                                onChange={(event) =>
                                  handleSavingsStartMonthChange(event.target.checked)
                                }
                              />
                              <span className="caption--md">이번 달 부터 변경</span>
                            </label>
                          ) : null}
                        </div>
                        <input
                          className="main-overview--control body--sm"
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={savingsPaymentAmount}
                          onChange={(event) =>
                            setSavingsPaymentAmount(formatIntegerInput(event.target.value))
                          }
                        />
                      </label>
                      <label className="main-overview--field flex-fill">
                        <span className="form-label label--md">납입일</span>
                        <select
                          className="main-overview--control body--sm"
                          value={savingsPaymentDay}
                          onChange={(event) => setSavingsPaymentDay(event.target.value)}
                        >
                          {Array.from({ length: 31 }, (_, index) => {
                            const day = index + 1;
                            return (
                              <option key={day} value={day}>
                                {day}
                              </option>
                            );
                          })}
                        </select>
                      </label>
                      <label className="main-overview--field  flex-fill">
                        <div className="row-group row-group--center row-group--between">
                          <span className="form-label label--md">만기일</span>
                          <label className="row-group row-group--center row-group--gap-4">
                            <input
                              type="checkbox"
                              checked={savingsHasNoMaturity}
                              onChange={(event) =>
                                setSavingsHasNoMaturity(event.target.checked)
                              }
                            />
                            <span className="caption--md">만기일 없음</span>
                          </label>
                        </div>
                        <input
                          className="main-overview--control body--sm"
                          type="date"
                          value={savingsMaturityDate}
                          onChange={(event) => setSavingsMaturityDate(event.target.value)}
                          disabled={savingsHasNoMaturity}
                        />
                      </label>
                    </div>
                    <div className="row-group row-group--center row-group--gap-8">
                      <label className="main-overview--field  flex-fill">
                        <span className="form-label label--md">현재 금액</span>
                        <input
                          className="main-overview--control body--sm"
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={savingsCurrentAmount}
                          onChange={(event) =>
                            setSavingsCurrentAmount(formatIntegerInput(event.target.value))
                          }
                        />
                      </label>
                      <label className="main-overview--field  flex-fill">
                        <span className="form-label label--md">적금 이름</span>
                        <input
                          className="main-overview--control body--sm"
                          type="text"
                          placeholder="카테고리로 사용 될 이름"
                          value={savingsName}
                          onChange={(event) => setSavingsName(event.target.value)}
                        />
                      </label>
                    </div>
                    <div className="main-overview--actions row-group row-group--center row-group--gap-8">
                      {savingsFormMode === "edit" ? (
                        <button
                          type="button"
                          className="button button--outline button--md main-overview--delete"
                          onClick={handleSavingsDelete}
                          disabled={
                            isSavingsSubmitting ||
                            isSavingsDeleting ||
                            !selectedSavingsAccount
                          }
                        >
                          {isSavingsDeleting ? "삭제 중..." : "삭제"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="button button--primary button--md button--full main-overview--submit"
                        onClick={handleSavingsSubmit}
                        disabled={
                          isSavingsSubmitting ||
                          isSavingsDeleting ||
                          (savingsFormMode === "edit" && !selectedSavingsAccount)
                        }
                      >
                        {isSavingsSubmitting
                          ? "저장 중..."
                          : savingsFormMode === "edit"
                            ? "수정 저장"
                            : "적금 추가"}
                      </button>
                    </div>
                    <div className="savings--list table--wrap table--wrap__invest">
                      <table className="table table--invest savings--table">
                        <thead>
                          <tr>
                            <th>분류</th>
                            <th>이름</th>
                            <th>납입액</th>
                            <th>누적 납입액</th>
                            <th>납입일</th>
                            <th>만기일</th>
                            <th>만기처리</th>
                            <th>메뉴</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleSavingsAccounts.length ? (
                            visibleSavingsAccounts.map((account) => {
                              const isMatured =
                                !account.hasNoMaturity &&
                                account.maturityDate >= selectedMonthStartKey &&
                                account.maturityDate <= selectedMonthEndKey;
                              const isPaused = isSavingsPausedForSelectedMonth(account);

                              return (
                                <tr key={account.id}>
                                  <td>
                                    <span className="badge badge--blue">적금</span>
                                  </td>
                                  <td>{account.name}</td>
                                  <td>{formatCompactWon(account.monthlyPayment)}</td>
                                  <td>{formatCompactWon(account.currentAmount)}</td>
                                  <td>매월 {account.paymentDay}일</td>
                                  <td>
                                    {account.hasNoMaturity
                                      ? "만기일 없음"
                                      : formatDetailDate(account.maturityDate)}
                                  </td>
                                  <td>
                                    <div className="row-group row-group--center row-group--gap-4">
                                      <button
                                        type="button"
                                        className="button button--xs button--secondary"
                                        onClick={() => handleSavingsMaturity(account)}
                                        disabled={isSavingsDeleting || isMatured}
                                      >
                                        {isMatured ? "만기됨" : "만기 처리"}
                                      </button>
                                      {isPaused ? (
                                        <span className="recurring-status badge">일시정지</span>
                                      ) : null}
                                    </div>
                                  </td>
                                  <td className="recurring-actions-cell">
                                    <span className="recurring-actions">
                                      <button
                                        type="button"
                                        aria-label="적금 메뉴 열기"
                                        aria-controls={`savings-actions-${account.id}`}
                                        aria-expanded={
                                          openSavingsPauseMenuId === account.id
                                            ? "true"
                                            : "false"
                                        }
                                        aria-haspopup="menu"
                                        className="button button--icon-only button--sm button--subtle side-menu--more"
                                        onClick={() =>
                                          setOpenSavingsPauseMenuId((current) =>
                                            current === account.id ? "" : account.id,
                                          )
                                        }
                                        disabled={isSavingsSkipping}
                                      >
                                        <span
                                          className="material-symbols-outlined"
                                          aria-hidden="true"
                                        >
                                          more_vert
                                        </span>
                                      </button>
                                      {openSavingsPauseMenuId === account.id ? (
                                        <div
                                          className="side-menu--dropdown column-group"
                                          id={`savings-actions-${account.id}`}
                                          role="menu"
                                        >
                                          <ul>
                                            <li>
                                              <button
                                                type="button"
                                                className="side-menu--dropdown-item"
                                                role="menuitem"
                                                onClick={() =>
                                                  handleSavingsPauseToggle(account)
                                                }
                                                disabled={isSavingsSkipping}
                                              >
                                                {isSavingsSkipping
                                                  ? "처리 중..."
                                                  : isPaused
                                                    ? "이번 달 일시정지 취소"
                                                    : "이번 달 일시정지"}
                                              </button>
                                            </li>
                                          </ul>
                                        </div>
                                      ) : null}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={8}>등록된 적금이 없습니다.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              {/* 고정지출 */}
              <div className="main-overview--fix card overview-card column-group column-group--top column-group--gap-8">
                <div className="column-group column-group--gap-16">
                  <div className="main-overview--section-header row-group row-group--center row-group--between">
                    <h4 className="main-overview--title title--sm">고정지출</h4>
                    <div
                      className="main-overview--tabs"
                      role="tablist"
                      aria-label="고정지출 입력 모드"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={fixedExpenseFormMode === "create"}
                        className={`main-overview--tab bodyBold--sm ${fixedExpenseFormMode === "create" ? "is-active" : ""}`}
                        onClick={() => handleFixedExpenseModeChange("create")}
                      >
                        추가
                      </button>
                      {fixedExpenseAccounts.length ? (
                        <button
                          type="button"
                          role="tab"
                          aria-selected={fixedExpenseFormMode === "edit"}
                          className={`main-overview--tab bodyBold--sm ${fixedExpenseFormMode === "edit" ? "is-active" : ""}`}
                          onClick={() => handleFixedExpenseModeChange("edit")}
                        >
                          수정
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="main-overview--form">
                    {fixedExpenseFormMode === "edit" ? (
                      <label className="main-overview--field">
                        <span className="form-label label--md">수정할 고정지출</span>
                        <select
                          className="main-overview--control body--sm"
                          value={fixedExpenseEditingId}
                          onChange={(event) =>
                            setFixedExpenseEditingId(event.target.value)
                          }
                          disabled={fixedExpenseAccounts.length === 0}
                        >
                          {fixedExpenseAccounts.length === 0 ? (
                            <option value="">등록된 고정지출 없음</option>
                          ) : (
                            fixedExpenseAccounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.name} · 매월 {account.paymentDay}일 ·{" "}
                                {account.monthlyAmount.toLocaleString()}원
                              </option>
                            ))
                          )}
                        </select>
                      </label>
                    ) : null}
                    <div className="grid-col-2">
                      <label className="main-overview--field  flex-fill">
                        <div className="row-group row-group--center row-group--between">
                          <span className="form-label label--md">지출 금액</span>
                          {fixedExpenseFormMode === "edit" ? (
                            <label className="row-group row-group--center row-group--gap-4">
                              <input
                                type="checkbox"
                                checked={fixedExpenseStartsThisMonth}
                                onChange={(event) =>
                                  handleFixedExpenseStartMonthChange(event.target.checked)
                                }
                              />
                              <span className="caption--md">이번 달 부터 변경</span>
                            </label>
                          ) : null}
                        </div>
                        <input
                          className="main-overview--control body--sm"
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={fixedExpenseAmount}
                          onChange={(event) =>
                            setFixedExpenseAmount(formatIntegerInput(event.target.value))
                          }
                        />
                      </label>
                      <label className="main-overview--field  flex-fill">
                        <div className="row-group row-group--center row-group--between">
                          <span className="form-label label--md">종료일</span>
                          <label className="row-group row-group--center row-group--gap-4">
                            <input
                              type="checkbox"
                              checked={fixedExpenseHasNoEndDate}
                              onChange={(event) =>
                                setFixedExpenseHasNoEndDate(event.target.checked)
                              }
                            />
                            <span className="caption--md">종료일 설정 안함</span>
                          </label>
                        </div>
                        <input
                          className="main-overview--control body--sm"
                          type="date"
                          value={fixedExpenseEndDate}
                          onChange={(event) => setFixedExpenseEndDate(event.target.value)}
                          disabled={fixedExpenseHasNoEndDate}
                        />
                      </label>
                    </div>
                    <div className="grid-col-2">
                      <label className="main-overview--field flex-fill">
                        <span className="form-label label--md">지출일</span>
                        <select
                          className="main-overview--control body--sm"
                          value={fixedExpensePaymentDay}
                          onChange={(event) =>
                            setFixedExpensePaymentDay(event.target.value)
                          }
                        >
                          {Array.from({ length: 31 }, (_, index) => {
                            const day = index + 1;
                            return (
                              <option key={day} value={day}>
                                {day}
                              </option>
                            );
                          })}
                        </select>
                      </label>
                      <label className="main-overview--field  flex-fill">
                        <span className="form-label label--md">지출명</span>
                        <input
                          className="main-overview--control body--sm"
                          type="text"
                          placeholder="지출명"
                          value={fixedExpenseName}
                          onChange={(event) => setFixedExpenseName(event.target.value)}
                        />
                      </label>
                    </div>
                    <div className="main-overview--actions row-group row-group--center row-group--gap-8">
                      {fixedExpenseFormMode === "edit" ? (
                        <button
                          type="button"
                          className="button button--outline button--md main-overview--delete"
                          onClick={handleFixedExpenseDelete}
                          disabled={
                            isFixedExpenseSubmitting ||
                            isFixedExpenseDeleting ||
                            !selectedFixedExpenseAccount
                          }
                        >
                          {isFixedExpenseDeleting ? "삭제 중..." : "삭제"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="button button--primary button--md button--full main-overview--submit"
                        onClick={handleFixedExpenseSubmit}
                        disabled={
                          isFixedExpenseSubmitting ||
                          isFixedExpenseDeleting ||
                          (fixedExpenseFormMode === "edit" &&
                            !selectedFixedExpenseAccount)
                        }
                      >
                        {isFixedExpenseSubmitting
                          ? "저장 중..."
                          : fixedExpenseFormMode === "edit"
                            ? "수정 저장"
                            : "고정지출 추가"}
                      </button>
                    </div>
                  </div>

                  <div className="table--wrap table--wrap__invest">
                    <table className="table table--invest">
                      <thead>
                        <tr>
                          <th>지출명</th>
                          <th>지출일</th>
                          <th>지출금액</th>
                          <th>다음 지출</th>
                          <th>종료일</th>
                          <th>종료처리</th>
                          <th>메뉴</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleFixedExpenseAccounts.length ? (
                          visibleFixedExpenseAccounts.map((account) => {
                            const isEnded =
                              !account.hasNoEndDate &&
                              account.endDate >= selectedMonthStartKey &&
                              account.endDate <= selectedMonthEndKey;
                            const isPaused = isFixedExpensePausedForSelectedMonth(account);

                            return (
                              <tr key={account.id}>
                                <td>{account.name}</td>
                                <td>매월 {account.paymentDay}일</td>
                                <td>{formatWon(account.monthlyAmount)}</td>
                                <td>{formatDetailDate(account.nextPaymentDate)}</td>
                                <td>
                                  {account.hasNoEndDate
                                    ? "기한 없음"
                                    : formatDetailDate(account.endDate)}
                                  {isPaused ? (
                                    <span className="recurring-status badge">일시정지</span>
                                  ) : null}
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="button button--xs button--secondary"
                                    onClick={() => handleFixedExpenseEnd(account)}
                                    disabled={isFixedExpenseDeleting || isEnded}
                                  >
                                    {isEnded ? "종료됨" : "종료"}
                                  </button>
                                </td>
                                <td className="recurring-actions-cell">
                                  <span className="recurring-actions">
                                    <button
                                      type="button"
                                      aria-label="고정지출 메뉴 열기"
                                      aria-controls={`fixed-expense-actions-${account.id}`}
                                      aria-expanded={
                                        openFixedExpensePauseMenuId === account.id
                                          ? "true"
                                          : "false"
                                      }
                                      aria-haspopup="menu"
                                      className="button button--icon-only button--sm button--subtle side-menu--more"
                                      onClick={() =>
                                        setOpenFixedExpensePauseMenuId((current) =>
                                          current === account.id ? "" : account.id,
                                        )
                                      }
                                      disabled={isFixedExpenseSkipping}
                                    >
                                      <span
                                        className="material-symbols-outlined"
                                        aria-hidden="true"
                                      >
                                        more_vert
                                      </span>
                                    </button>
                                    {openFixedExpensePauseMenuId === account.id ? (
                                      <div
                                        className="side-menu--dropdown column-group"
                                        id={`fixed-expense-actions-${account.id}`}
                                        role="menu"
                                      >
                                        <ul>
                                          <li>
                                            <button
                                              type="button"
                                              className="side-menu--dropdown-item"
                                              role="menuitem"
                                              onClick={() =>
                                                handleFixedExpensePauseToggle(account)
                                              }
                                              disabled={isFixedExpenseSkipping}
                                            >
                                              {isFixedExpenseSkipping
                                                ? "처리 중..."
                                                : isPaused
                                                  ? "이번 달 일시정지 취소"
                                                  : "이번 달 일시정지"}
                                            </button>
                                          </li>
                                        </ul>
                                      </div>
                                    ) : null}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={7}>등록된 고정지출이 없습니다.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* 전체 정보 */}
          <h3 className="main-common-title title--md">상세내용</h3>
          <div className="main-detail">
            <div className="row-group row-group--flex row-group--top row-group--gap-16">
              <div className="table--wrap">
                <table className="table detail-table">
                  <colgroup>
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "20%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>
                        <div className="row-group row-group--center row-group--gap-4">
                          카테고리
                          <button
                            type="button"
                            className="material-symbols-outlined sort-btn"
                            aria-label="카테고리 정렬"
                            onClick={() => handleDetailSort("category")}
                          >
                            unfold_more
                          </button>
                        </div>
                      </th>
                      <th>
                        <div className="row-group row-group--center row-group--gap-4">
                          종류
                          <button
                            type="button"
                            className="material-symbols-outlined sort-btn"
                            aria-label="종류 정렬"
                            onClick={() => handleDetailSort("type")}
                          >
                            unfold_more
                          </button>
                        </div>
                      </th>
                      <th>
                        <div className="row-group row-group--center row-group--gap-4">
                          금액
                          <button
                            type="button"
                            className="material-symbols-outlined sort-btn"
                            aria-label="금액 정렬"
                            onClick={() => handleDetailSort("amount")}
                          >
                            unfold_more
                          </button>
                        </div>
                      </th>
                      <th>
                        <div className="row-group row-group--center row-group--gap-4">
                          내용
                          <button
                            type="button"
                            className="material-symbols-outlined sort-btn"
                            aria-label="내용 정렬"
                            onClick={() => handleDetailSort("memo")}
                          >
                            unfold_more
                          </button>
                        </div>
                      </th>
                      <th>
                        <div className="row-group row-group--center row-group--gap-4">
                          날짜
                          <button
                            type="button"
                            className="material-symbols-outlined sort-btn"
                            aria-label="날짜 정렬"
                            onClick={() => handleDetailSort("date")}
                          >
                            unfold_more
                          </button>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailItems.length ? (
                      detailItems.map((item) => {
                        const isIncome = item.type === "income";
                        const isSavings = isSavingsItem(item);
                        const isInvestment = isInvestmentItem(item);
                        const isPaused = item.status === "cancelled";
                        return (
                          <tr key={item.id}>
                            <td>{item.category}</td>
                            <td>
                              <span
                                className={`badge ${
                                  isInvestment
                                    ? "badge--violet"
                                    : isSavings
                                      ? "badge--blue"
                                      : isIncome
                                        ? "badge--green"
                                        : "badge--red"
                                }`}
                              >
                                {isInvestment
                                  ? "투자"
                                  : isSavings
                                    ? "저축"
                                    : isIncome
                                      ? "수입"
                                      : "지출"}
                              </span>
                              {isPaused ? (
                                <span className="recurring-status badge">일시정지</span>
                              ) : null}
                            </td>
                            <td>{formatCurrency(item.amount)}</td>
                            <td>{getVisibleMemo(item.memo) || "-"}</td>
                            <td>{formatDetailDate(item.date)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5}>이번 달 내역이 없습니다.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* <div className="card">
                <div className="empty title--lg">데이터 추가 예정</div>
              </div> */}
            </div>
          </div>
        </section>
      </main>

      {showCalendarModal ? (
        <Modal onClose={closeCalendarModal}>
          <div className="calendar-picker">
            <div className="calendar-picker__header">
              <div>
                <p className="calendar-picker__eyebrow label--md">SELECT DATE</p>
                <h2 className="calendar-picker__title title--sm">
                  {formatHeaderDate(selectedDate)}
                </h2>
              </div>
              <button
                type="button"
                className="button button--icon-only button--sm button--subtle"
                aria-label="Close calendar"
                onClick={closeCalendarModal}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  close
                </span>
              </button>
            </div>
            <Calendar
              value={selectedDate}
              onChange={handleCalendarSelect}
              calendarType="gregory"
              formatDay={(_, date) => String(date.getDate())}
              locale="ko-KR"
              next2Label={null}
              prev2Label={null}
              showNeighboringMonth
              tileClassName={({ date }) =>
                dayMap[formatDate(date)] ? "react-calendar__tile--has-entry" : null
              }
            />
            <div className="calendar-picker__footer">
              <button
                type="button"
                className="button button--sm button--outline"
                onClick={() => handleCalendarSelect(today)}
              >
                오늘
              </button>
              <span className="body--sm">{selectedDateKey}</span>
            </div>
          </div>
        </Modal>
      ) : null}
      {!isAuthResolved || isDashboardLoading ? (
        <Loading message="대시보드를 불러오는 중입니다" variant="overlay" />
      ) : null}
    </div>
  );
}

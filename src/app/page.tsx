"use client";

import { type CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import type { Value } from "react-calendar/dist/shared/types.js";
import type { ChartOptions } from "chart.js";
import { Line, Pie } from "react-chartjs-2";
import Modal from "@/components/common/Modal";
import SideMenu from "@/components/common/SideMenu";
import { useAppData } from "@/app/providers";
import { DEMO_USER_ID, writeDemoExpenses } from "@/lib/demo";
import "@/lib/chart";
import {
  createExpense,
  createExpenses,
  deleteExpense,
  deleteExpenses,
  updateExpense,
} from "@/lib/api/expense";
import type { Expense } from "@/types/expense";
import type { StockPurchaseMeta, StockQuote, StockSearchItem } from "@/types/stock";
import { formatDate } from "@/utils/date";

const formatCurrency = (value: number) =>
  `${value < 0 ? "-" : ""}₩ ${Math.abs(value).toLocaleString()}`;
const formatWon = (value: number) =>
  `${value < 0 ? "-" : ""}${Math.round(Math.abs(value)).toLocaleString()}원`;
const formatHeaderDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
const formatDetailDate = (dateValue: string) => {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return `${String(date.getFullYear()).slice(2)}.${date.getMonth() + 1}.${date.getDate()}`;
};
const categoryOptions = ["🍚식비", "🚗교통비", "🎨문화생활", "🍱생필품", "🧴미용", "💊병원/약", "🎓교육", "📩공과금", "📱통신비", "🎠회비", "📅경조사", "💳카드대금", "🎁선물", "🏢대출이자", "📈주식"];
const incomeCategoryOptions = ["💵월급", "💸보너스", "📩용돈", "🪙부수입", "👷아르바이트"];
const savingsCategory = "📩적금";
const savingsMetaPrefix = "[[savings:";
const savingsMetaPattern = /\s*\[\[savings:([^\]]+)\]\]\s*$/;
const stockCategory = "📈주식";
const stockMetaPrefix = "[[stock:";
const stockMetaPattern = /\s*\[\[stock:([^\]]+)\]\]\s*$/;
const stockAutoRefreshKey = "money-book-stock-last-refresh";
const customCategoryValue = "__custom__";
const weekdayLabels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const getCalendarDays = (selectedDate: Date) => {
  const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());
  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
};
const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();
const getDailySeries = (
  items: Expense[],
  year: number,
  month: number,
  type?: Expense["type"] | "savings",
) => {
  const dailyTotals = Array.from({ length: getDaysInMonth(year, month) }, () => 0);

  items.forEach((item) => {
    if (type === "savings" && !isSavingsItem(item)) return;
    if (type && type !== "savings" && item.type !== type) return;
    if (type === "expense" && isSavingsItem(item)) return;
    const date = new Date(item.date);
    if (date.getFullYear() !== year || date.getMonth() !== month) return;
    const amount = type
      ? item.amount
      : item.type === "income"
        ? item.amount
        : -item.amount;
    dailyTotals[date.getDate() - 1] += amount;
  });

  let runningTotal = 0;
  return dailyTotals.map((amount) => {
    runningTotal += amount;
    return runningTotal;
  });
};

type OverviewLine = {
  values: number[];
  color: "green" | "red" | "teal" | "blue";
  label: string;
};

type ExpenseFormData = Pick<Expense, "amount" | "category" | "memo" | "date" | "type">;
type InlineFormMode = "create" | "edit";
type SavingsMeta = {
  id: string;
  name: string;
  paymentDay: number;
  maturityDate: string;
  initialAmount: number;
  hasNoMaturity: boolean;
};

type SavingsAccount = SavingsMeta & {
  items: Expense[];
  currentAmount: number;
  monthlyPayment: number;
  nextPaymentDate: string;
};

type StockSortKey = "name" | "totalProfit" | "averagePrice" | "totalCost" | "dailyProfit";
type SortDirection = "asc" | "desc";
type StockSort = {
  key: StockSortKey;
  direction: SortDirection;
} | null;

type InvestmentStock = StockPurchaseMeta & {
  id: string;
  createdAt: string;
};

type InvestmentSummary = {
  symbol: string;
  name: string;
  market: string;
  quantity: number;
  totalCost: number;
  averagePrice: number;
  currentPrice: number;
  currentValue: number;
  totalProfit: number;
  totalProfitRate: number;
  dailyProfit: number;
  dailyProfitRate: number;
};

const overviewChartColors: Record<OverviewLine["color"], string> = {
  green: "#A2E2B5",
  red: "#FF334B",
  blue: "#4270ED",
  teal: "#33D2CB",
};
const categoryChartColors = [
  "#FDD9A7",
  "#FFA9B3",
  "#FFF0A1",
  "#A2E2B5",
  "#8AE5E1",
  "#9AE2F9",
  "#B0C3F7",
  "#D4B8FF",
  "#F3B5E5",
];
const openEndedSavingsYears = 10;

const encodeSavingsMemo = (meta: SavingsMeta) =>
  `${meta.name} ${savingsMetaPrefix}${encodeURIComponent(JSON.stringify(meta))}]]`;

const encodeStockMemo = (meta: StockPurchaseMeta) =>
  `${meta.name} ${stockMetaPrefix}${encodeURIComponent(JSON.stringify(meta))}]]`;

const parseSavingsMemo = (memo: string): SavingsMeta | null => {
  const match = memo.match(savingsMetaPattern);
  if (!match) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(match[1])) as Partial<SavingsMeta>;
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.paymentDay !== "number" ||
      typeof parsed.maturityDate !== "string" ||
      typeof parsed.initialAmount !== "number"
    ) {
      return null;
    }
    return {
      id: parsed.id,
      name: parsed.name,
      paymentDay: parsed.paymentDay,
      maturityDate: parsed.maturityDate,
      initialAmount: parsed.initialAmount,
      hasNoMaturity: parsed.hasNoMaturity === true,
    };
  } catch {
    return null;
  }
};

const parseStockMemo = (memo: string): StockPurchaseMeta | null => {
  const match = memo.match(stockMetaPattern);
  if (!match) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(match[1])) as Partial<StockPurchaseMeta>;
    if (
      typeof parsed.symbol !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.market !== "string" ||
      typeof parsed.quantity !== "number" ||
      typeof parsed.unitPrice !== "number" ||
      typeof parsed.purchaseDate !== "string"
    ) {
      return null;
    }
    return {
      symbol: parsed.symbol,
      name: parsed.name,
      market: parsed.market,
      quantity: parsed.quantity,
      unitPrice: parsed.unitPrice,
      purchaseDate: parsed.purchaseDate,
    };
  } catch {
    return null;
  }
};

const getVisibleMemo = (memo: string) =>
  memo.replace(savingsMetaPattern, "").replace(stockMetaPattern, "").trim();
const isSavingsCategory = (category: string) => category.includes("적금");
const isSavingsItem = (item: Expense) =>
  item.type === "expense" && isSavingsCategory(item.category);
const isStockItem = (item: Expense) =>
  item.type === "expense" && item.category === stockCategory && Boolean(parseStockMemo(item.memo));
const getChangeClassName = (value: number) =>
  value > 0 ? "color-red" : value < 0 ? "color-blue" : "color-gray";
const formatSignedPercent = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
const formatSignedWon = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "-" : ""}${Math.round(Math.abs(value)).toLocaleString()}원`;
const shouldRefreshStockQuotes = () => {
  if (typeof window === "undefined") return false;
  const lastRefresh = Number(window.localStorage.getItem(stockAutoRefreshKey) || 0);
  if (!lastRefresh) return true;
  return Date.now() - lastRefresh >= 1000 * 60 * 60 * 12;
};
const getFallbackSavingsMeta = (item: Expense): SavingsMeta => {
  const date = new Date(`${item.date}T00:00:00`);
  const paymentDay = Number.isNaN(date.getTime()) ? 1 : date.getDate();
  const name = getVisibleMemo(item.memo) || "적금";
  const fallbackKey = encodeURIComponent(`${name}-${paymentDay}-${item.amount}`);

  return {
    id: `savings-fallback-${fallbackKey}`,
    name,
    paymentDay,
    maturityDate: item.date,
    initialAmount: 0,
    hasNoMaturity: false,
  };
};

const getOpenEndedSavingsDate = (startDate: Date) => {
  const date = new Date(startDate);
  date.setFullYear(date.getFullYear() + openEndedSavingsYears);
  return formatDate(date);
};

const getSavingsPaymentDates = (
  startDate: Date,
  paymentDay: number,
  maturityDateValue: string,
) => {
  const maturityDate = new Date(`${maturityDateValue}T00:00:00`);
  if (Number.isNaN(maturityDate.getTime())) return [];

  const dates: string[] = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const endMonth = new Date(maturityDate.getFullYear(), maturityDate.getMonth(), 1);

  while (cursor <= endMonth) {
    const day = Math.min(paymentDay, getDaysInMonth(cursor.getFullYear(), cursor.getMonth()));
    const paymentDate = new Date(cursor.getFullYear(), cursor.getMonth(), day);
    if (paymentDate <= maturityDate) {
      dates.push(formatDate(paymentDate));
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return dates;
};

type CategoryExpenseSlice = {
  category: string;
  amount: number;
  percentage: number;
};

function OverviewLineChart({ lines }: { lines: OverviewLine[] }) {
  const maxLength = Math.max(1, ...lines.map((line) => line.values.length));
  const chartData = useMemo(
    () => ({
      labels: Array.from({ length: maxLength }, (_, index) => String(index + 1)),
      datasets: lines.map((line) => ({
        label: line.label,
        data: line.values.length ? line.values : [0],
        borderColor: overviewChartColors[line.color],
        backgroundColor: overviewChartColors[line.color],
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0.35,
      })),
    }),
    [lines, maxLength],
  );
  const options = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: {
        intersect: true,
        mode: "index",
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
      },
      scales: {
        x: {
          display: false,
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
        },
        y: {
          display: false,
          beginAtZero: true,
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
        },
      },
    }),
    [],
  );

  return (
    <div className="main-overview--graph" aria-hidden="true">
      <Line data={chartData} options={options} />
    </div>
  );
}

function CategoryPieChart({ items }: { items: CategoryExpenseSlice[] }) {
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const chartData = useMemo(
    () => ({
      labels: items.map((item) => item.category),
      datasets: [
        {
          data: items.map((item) => item.amount),
          backgroundColor: items.map(
            (_, index) => categoryChartColors[index % categoryChartColors.length],
          ),
          borderColor: "transparent",
          borderWidth: 0,
        },
      ],
    }),
    [items],
  );
  const options = useMemo<ChartOptions<"pie">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = Number(context.parsed) || 0;
              const ratio = totalAmount ? (value / totalAmount) * 100 : 0;
              return `${context.label}: ${formatWon(value)} (${ratio.toFixed(1)}%)`;
            },
          },
        },
      },
    }),
    [totalAmount],
  );

  if (!items.length) {
    return <p className="title--md empty-state">이번 달 지출 내역이 없습니다.</p>;
  }

  return <Pie data={chartData} options={options} />;
}

export default function Home() {
  const today = useMemo(() => new Date(), []);
  const {
    expenses,
    setExpenses,
    displayName,
    displayEmail,
    isDemoMode,
    isAuthResolved,
  } = useAppData();
  const [selectedDate, setSelectedDate] = useState(today);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [inlineFormMode, setInlineFormMode] = useState<InlineFormMode>("create");
  const [inlineEditingId, setInlineEditingId] = useState("");
  const [inlineAmount, setInlineAmount] = useState("");
  const [inlineCategory, setInlineCategory] = useState(categoryOptions[0]);
  const [inlineCustomCategory, setInlineCustomCategory] = useState("");
  const [inlineMemo, setInlineMemo] = useState("");
  const [inlineDate, setInlineDate] = useState(formatDate(today));
  const [inlineType, setInlineType] = useState<Expense["type"]>("expense");
  const [isInlineSubmitting, setIsInlineSubmitting] = useState(false);
  const [isInlineDeleting, setIsInlineDeleting] = useState(false);
  const [savingsFormMode, setSavingsFormMode] = useState<InlineFormMode>("create");
  const [savingsEditingId, setSavingsEditingId] = useState("");
  const [savingsPaymentAmount, setSavingsPaymentAmount] = useState("");
  const [savingsPaymentDay, setSavingsPaymentDay] = useState("1");
  const [savingsMaturityDate, setSavingsMaturityDate] = useState(formatDate(today));
  const [savingsHasNoMaturity, setSavingsHasNoMaturity] = useState(false);
  const [savingsCurrentAmount, setSavingsCurrentAmount] = useState("");
  const [savingsName, setSavingsName] = useState("");
  const [isSavingsSubmitting, setIsSavingsSubmitting] = useState(false);
  const [isSavingsDeleting, setIsSavingsDeleting] = useState(false);
  const [stockQuery, setStockQuery] = useState("");
  const [stockSearchItems, setStockSearchItems] = useState<StockSearchItem[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockSearchItem | null>(null);
  const [stockPurchaseDate, setStockPurchaseDate] = useState(formatDate(today));
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockUnitPrice, setStockUnitPrice] = useState("");
  const [stockQuotes, setStockQuotes] = useState<Record<string, StockQuote>>({});
  const [stockSort, setStockSort] = useState<StockSort>(null);
  const [isStockSearching, setIsStockSearching] = useState(false);
  const [isStockSubmitting, setIsStockSubmitting] = useState(false);
  const [isStockRefreshing, setIsStockRefreshing] = useState(false);

  const selectedDateKey = formatDate(selectedDate);
  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();
  const monthlyExpenses = useMemo(
    () =>
      expenses.filter((item) => {
        const date = new Date(item.date);
        return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
      }),
    [currentMonth, currentYear, expenses],
  );
  const monthlyExpenseItems = monthlyExpenses.filter(
    (item) => item.type === "expense" && !isSavingsItem(item),
  );
  const monthlySavingsItems = monthlyExpenses.filter(isSavingsItem);
  const monthlyExpenseTotal = monthlyExpenseItems
    .reduce((sum, item) => sum + item.amount, 0);
  const monthlySavingsTotal = monthlySavingsItems
    .reduce((sum, item) => sum + item.amount, 0);
  const monthlyIncomeTotal = monthlyExpenses
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const monthlyIncomeCount = monthlyExpenses.filter((item) => item.type === "income").length;
  const monthlyExpenseCount = monthlyExpenseItems.length;
  const monthlySavingsCount = monthlySavingsItems.length;
  const monthlyIncomeAverage = monthlyIncomeCount
    ? monthlyIncomeTotal / monthlyIncomeCount
    : 0;
  const monthlyExpenseAverage = monthlyExpenseCount
    ? monthlyExpenseTotal / monthlyExpenseCount
    : 0;
  const monthlyTotal = monthlyIncomeTotal - monthlyExpenseTotal - monthlySavingsTotal;
  const cashflowSeries = getDailySeries(expenses, currentYear, currentMonth);
  const incomeSeries = getDailySeries(expenses, currentYear, currentMonth, "income");
  const expenseSeries = getDailySeries(expenses, currentYear, currentMonth, "expense");
  const savingsSeries = getDailySeries(expenses, currentYear, currentMonth, "savings");
  const selectedDayItems = useMemo(
    () => monthlyExpenses.filter((item) => item.date === selectedDateKey),
    [monthlyExpenses, selectedDateKey],
  );
  const categoryExpenseItems = useMemo(() => {
    const categoryTotals = monthlyExpenses
      .filter((item) => item.type === "expense" && !isSavingsItem(item))
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
      [...monthlyExpenses].sort((left, right) => {
        const dateDiff = new Date(right.date).getTime() - new Date(left.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return right.created_at.localeCompare(left.created_at);
      }),
    [monthlyExpenses],
  );
  const selectedInlineExpense =
    inlineEditItems.find((item) => item.id === inlineEditingId) ?? null;
  const dayMap = monthlyExpenses.reduce<Record<string, number>>((acc, item) => {
    acc[item.date] = (acc[item.date] || 0) + 1;
    return acc;
  }, {});
  const calendarDays = getCalendarDays(selectedDate);
  const activeCategoryOptions =
    inlineType === "income" ? incomeCategoryOptions : categoryOptions;
  const savingsAccounts = useMemo<SavingsAccount[]>(() => {
    const todayKey = formatDate(today);
    const grouped = expenses.reduce<Record<string, SavingsAccount>>((acc, item) => {
      if (item.type !== "expense" || !isSavingsCategory(item.category)) return acc;
      const meta = parseSavingsMemo(item.memo) ?? getFallbackSavingsMeta(item);

      if (!acc[meta.id]) {
        acc[meta.id] = {
          ...meta,
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

    return Object.values(grouped)
      .map((account) => {
        const sortedItems = [...account.items].sort((left, right) =>
          left.date.localeCompare(right.date),
        );
        const paidAmount = sortedItems
          .filter((item) => item.date <= todayKey)
          .reduce((sum, item) => sum + item.amount, 0);
        const nextPayment =
          sortedItems.find((item) => item.date >= todayKey) ?? sortedItems.at(-1);
        return {
          ...account,
          items: sortedItems,
          currentAmount: account.initialAmount + paidAmount,
          monthlyPayment: sortedItems[0]?.amount ?? account.monthlyPayment,
          nextPaymentDate: nextPayment?.date ?? account.maturityDate,
        };
      })
      .sort((left, right) => left.maturityDate.localeCompare(right.maturityDate));
  }, [expenses, today]);
  const selectedSavingsAccount =
    savingsAccounts.find((account) => account.id === savingsEditingId) ?? null;
  const visibleSavingsAccounts = useMemo(() => {
    const monthStart = formatDate(new Date(currentYear, currentMonth, 1));
    const monthEnd = formatDate(new Date(currentYear, currentMonth + 1, 0));

    return savingsAccounts.filter((account) =>
      account.items.some((item) => item.date >= monthStart && item.date <= monthEnd),
    );
  }, [currentMonth, currentYear, savingsAccounts]);
  const investmentStocks = useMemo<InvestmentStock[]>(
    () =>
      expenses
        .map((item) => {
          if (!isStockItem(item)) return null;
          const meta = parseStockMemo(item.memo);
          if (!meta) return null;
          return {
            ...meta,
            id: item.id,
            createdAt: item.created_at,
          };
        })
        .filter((item): item is InvestmentStock => Boolean(item)),
    [expenses],
  );
  const investmentSummaries = useMemo<InvestmentSummary[]>(() => {
    const grouped = investmentStocks.reduce<Record<string, InvestmentSummary>>((acc, stock) => {
      const quote = stockQuotes[stock.symbol];
      const totalCost = stock.quantity * stock.unitPrice;

      if (!acc[stock.symbol]) {
        acc[stock.symbol] = {
          symbol: stock.symbol,
          name: stock.name,
          market: stock.market,
          quantity: 0,
          totalCost: 0,
          averagePrice: 0,
          currentPrice: quote?.currentPrice ?? 0,
          currentValue: 0,
          totalProfit: 0,
          totalProfitRate: 0,
          dailyProfit: 0,
          dailyProfitRate: 0,
        };
      }

      acc[stock.symbol].quantity += stock.quantity;
      acc[stock.symbol].totalCost += totalCost;
      acc[stock.symbol].currentPrice = quote?.currentPrice ?? acc[stock.symbol].currentPrice;
      acc[stock.symbol].dailyProfitRate = quote?.dailyChangeRate ?? acc[stock.symbol].dailyProfitRate;
      acc[stock.symbol].dailyProfit += (quote?.dailyChange ?? 0) * stock.quantity;

      return acc;
    }, {});

    const summaries = Object.values(grouped).map((summary) => {
      const averagePrice = summary.quantity ? summary.totalCost / summary.quantity : 0;
      const currentValue = summary.currentPrice * summary.quantity;
      const totalProfit = summary.currentPrice ? currentValue - summary.totalCost : 0;

      return {
        ...summary,
        averagePrice,
        currentValue,
        totalProfit,
        totalProfitRate: summary.totalCost ? (totalProfit / summary.totalCost) * 100 : 0,
      };
    });

    if (!stockSort) return summaries;

    return [...summaries].sort((left, right) => {
      const multiplier = stockSort.direction === "asc" ? 1 : -1;
      if (stockSort.key === "name") {
        return left.name.localeCompare(right.name, "ko") * multiplier;
      }
      return (left[stockSort.key] - right[stockSort.key]) * multiplier;
    });
  }, [investmentStocks, stockQuotes, stockSort]);
  const stockSymbols = useMemo(
    () => [...new Set(investmentStocks.map((stock) => stock.symbol))],
    [investmentStocks],
  );

  const resetInlineCreateForm = useCallback((date = selectedDateKey) => {
    setInlineAmount("");
    setInlineCategory(categoryOptions[0]);
    setInlineCustomCategory("");
    setInlineMemo("");
    setInlineDate(date);
    setInlineType("expense");
  }, [selectedDateKey]);

  const fillInlineEditForm = useCallback((expense: Expense) => {
    const categoryList =
      expense.type === "income" ? incomeCategoryOptions : categoryOptions;

    setInlineAmount(String(expense.amount));
    setInlineCategory(
      categoryList.includes(expense.category) ? expense.category : customCategoryValue,
    );
    setInlineCustomCategory(
      categoryList.includes(expense.category) ? "" : expense.category,
    );
    setInlineMemo(expense.memo);
    setInlineDate(expense.date);
    setInlineType(expense.type);
  }, []);

  const resetSavingsCreateForm = useCallback(() => {
    setSavingsPaymentAmount("");
    setSavingsPaymentDay("1");
    setSavingsMaturityDate(formatDate(selectedDate));
    setSavingsHasNoMaturity(false);
    setSavingsCurrentAmount("");
    setSavingsName("");
  }, [selectedDate]);

  const resetStockForm = useCallback(() => {
    setStockQuery("");
    setStockSearchItems([]);
    setSelectedStock(null);
    setStockPurchaseDate(formatDate(selectedDate));
    setStockQuantity("");
    setStockUnitPrice("");
  }, [selectedDate]);

  const fillSavingsEditForm = useCallback((account: SavingsAccount) => {
    setSavingsPaymentAmount(String(account.monthlyPayment));
    setSavingsPaymentDay(String(account.paymentDay));
    setSavingsMaturityDate(account.maturityDate);
    setSavingsHasNoMaturity(account.hasNoMaturity);
    setSavingsCurrentAmount(String(account.initialAmount));
    setSavingsName(account.name);
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
    }
  };
  const handleInlineTypeChange = (type: Expense["type"]) => {
    const nextCategoryOptions =
      type === "income" ? incomeCategoryOptions : categoryOptions;

    setInlineType(type);
    setInlineCategory(nextCategoryOptions[0]);
    setInlineCustomCategory("");
  };
  const handleSavingsModeChange = (mode: InlineFormMode) => {
    setSavingsFormMode(mode);
    if (mode === "create") {
      setSavingsEditingId("");
      resetSavingsCreateForm();
    } else if (!savingsEditingId && savingsAccounts[0]) {
      setSavingsEditingId(savingsAccounts[0].id);
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

    await deleteExpenses(ids);
    setExpenses((prev) => prev.filter((item) => !ids.includes(item.id)));
  };
  const handleSavingsSubmit = async () => {
    const paymentAmount = Number(savingsPaymentAmount);
    const paymentDay = Number(savingsPaymentDay);
    const initialAmount = Number(savingsCurrentAmount) || 0;
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

    const savingsStartDate =
      savingsFormMode === "edit" && selectedSavingsAccount?.items[0]
        ? new Date(`${selectedSavingsAccount.items[0].date}T00:00:00`)
        : selectedDate;
    if (!savingsHasNoMaturity && maturityDate < new Date(formatDate(savingsStartDate))) {
      alert("만기일은 첫 납입월 이후로 선택해주세요.");
      return;
    }
    const savingsEndDate = savingsHasNoMaturity
      ? getOpenEndedSavingsDate(savingsStartDate)
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
    const paymentDates = getSavingsPaymentDates(savingsStartDate, paymentDay, savingsEndDate);
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
        await persistSavingsDeletion(selectedSavingsAccount);
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
      } else {
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

    const confirmed = window.confirm("선택한 적금과 예정 납입 내역을 모두 삭제할까요?");
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
  const handleSavingsMaturity = async (account: SavingsAccount) => {
    const confirmed = window.confirm("만기 처리 하시겠습니까?");
    if (!confirmed) return;

    const cutoffDate = formatDate(new Date(currentYear, currentMonth + 1, 0));
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
      if (isDemoMode) {
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
  const refreshStockQuotes = useCallback(async (symbols = stockSymbols) => {
    if (!symbols.length || isDemoMode || !displayEmail) return;

    try {
      setIsStockRefreshing(true);
      const response = await fetch("/api/stocks/quotes", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ symbols }),
      });
      const data = (await response.json()) as {
        quotes?: StockQuote[];
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message || "현재가 업데이트에 실패했습니다.");
      }

      setStockQuotes((prev) => ({
        ...prev,
        ...(data.quotes || []).reduce<Record<string, StockQuote>>((acc, quote) => {
          acc[quote.symbol] = quote;
          return acc;
        }, {}),
      }));
      window.localStorage.setItem(stockAutoRefreshKey, String(Date.now()));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "현재가 업데이트 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setIsStockRefreshing(false);
    }
  }, [displayEmail, isDemoMode, stockSymbols]);

  const handleStockSort = (key: StockSortKey) => {
    setStockSort((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  const handleStockSubmit = async () => {
    const quantity = Number(stockQuantity);
    const unitPrice = Number(stockUnitPrice);
    const purchaseDate = new Date(`${stockPurchaseDate}T00:00:00`);

    if (!selectedStock) {
      alert("종목을 선택해주세요.");
      return;
    }
    if (!stockPurchaseDate || Number.isNaN(purchaseDate.getTime())) {
      alert("구매일을 선택해주세요.");
      return;
    }
    if (!quantity || quantity <= 0) {
      alert("수량을 입력해주세요.");
      return;
    }
    if (!unitPrice || unitPrice <= 0) {
      alert("매입단가를 입력해주세요.");
      return;
    }

    const meta: StockPurchaseMeta = {
      ...selectedStock,
      quantity,
      unitPrice,
      purchaseDate: stockPurchaseDate,
    };
    const payload: ExpenseFormData = {
      amount: quantity * unitPrice,
      category: stockCategory,
      memo: encodeStockMemo(meta),
      date: stockPurchaseDate,
      type: "expense",
    };

    try {
      setIsStockSubmitting(true);

      if (isDemoMode) {
        const demoExpense: Expense = {
          id: `demo-stock-${selectedStock.symbol}-${Date.now()}`,
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
        await refreshStockQuotes([selectedStock.symbol]);
      }

      setSelectedDate(new Date(`${stockPurchaseDate}T00:00:00`));
      resetStockForm();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "주식 저장 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setIsStockSubmitting(false);
    }
  };

  useEffect(() => {
    const query = stockQuery.trim();
    if (query.length < 2 || selectedStock?.name === query || selectedStock?.symbol === query) {
      setStockSearchItems([]);
      setIsStockSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsStockSearching(true);
        const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as {
          items?: StockSearchItem[];
          message?: string;
        };

        if (!response.ok) {
          throw new Error(data.message || "종목 검색에 실패했습니다.");
        }
        setStockSearchItems(data.items || []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStockSearchItems([]);
      } finally {
        setIsStockSearching(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [selectedStock, stockQuery]);

  useEffect(() => {
    if (!isAuthResolved || isDemoMode || !displayEmail || !stockSymbols.length) return;
    if (!shouldRefreshStockQuotes()) return;
    refreshStockQuotes();
  }, [displayEmail, isAuthResolved, isDemoMode, refreshStockQuotes, stockSymbols.length]);

  const handleInlineSubmit = async () => {
    const amount = Number(inlineAmount);
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

    const payload: ExpenseFormData = {
      amount,
      category,
      memo: inlineMemo.trim(),
      date: inlineDate,
      type: inlineType,
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

    const confirmed = window.confirm("선택한 내역을 삭제할까요?");
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
  if (!isAuthResolved) {
    return null;
  }

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
                <p className="main-overview--last label--md">
                  수입 {formatWon(monthlyIncomeTotal)} · 지출{" "}
                  {formatWon(monthlyExpenseTotal)} · 저축 {formatWon(monthlySavingsTotal)}
                </p>
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
                <h4 className="main-overview--title title--sm">이번 달 저축</h4>
                <div className="row-group row-group--center row-group--between">
                  <p className="main-overview--num title--lg">
                    {formatWon(monthlySavingsTotal)}
                  </p>
                </div>
                <p className="main-overview--last label--md">
                  총 {monthlySavingsCount}건
                </p>
                <OverviewLineChart
                  lines={[{ values: savingsSeries, color: "blue", label: "저축" }]}
                />
              </div>
            </div>
            <h3 className="main-common-title title--md">특수 지출</h3>
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
                        <span className="label--md">수정할 적금</span>
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
                        <span className="label--md">납입 금액</span>
                        <input
                          className="main-overview--control body--sm"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={savingsPaymentAmount}
                          onChange={(event) =>
                            setSavingsPaymentAmount(event.target.value)
                          }
                        />
                      </label>
                      <label className="main-overview--field flex-fill">
                        <span className="label--md">납입일</span>
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
                          <span className="label--md">만기일</span>
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
                        <span className="label--md">현재 금액</span>
                        <input
                          className="main-overview--control body--sm"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={savingsCurrentAmount}
                          onChange={(event) =>
                            setSavingsCurrentAmount(event.target.value)
                          }
                        />
                      </label>
                      <label className="main-overview--field  flex-fill">
                        <span className="label--md">적금 이름</span>
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
                    <ul className="savings--list column-group column-group--gap-8">
                      {visibleSavingsAccounts.length ? (
                        visibleSavingsAccounts.map((account) => (
                          <li
                            key={account.id}
                            className="savings--items row-group row-group--center row-group--gap-16"
                          >
                            <span className="badge badge--blue">적금</span>
                            <p className="savings--name label--md">{account.name}</p>
                            <p className="savings--num bodyBold--sm">
                              {formatWon(account.currentAmount)}
                            </p>
                            <p className="savings--dates row-group row-group--center row-group--gap-8">
                              <span className="label--sm">납입일</span>
                              <span className="label--sm">
                                매월 {account.paymentDay}일
                              </span>
                              <span className="label--sm">-</span>
                              <span className="label--sm">만기일</span>
                              <span className="label--sm">
                                {account.hasNoMaturity
                                  ? "만기일 없음"
                                  : formatDetailDate(account.maturityDate)}
                              </span>
                              <button
                                type="button"
                                className="button button--xs button--secondary"
                                onClick={() => handleSavingsMaturity(account)}
                                disabled={isSavingsDeleting}
                              >
                                만기 처리
                              </button>
                            </p>
                          </li>
                        ))
                      ) : (
                        <li className="savings--items savings--empty label--md">
                          등록된 적금이 없습니다.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
              {/* 주식 */}
              <div className="main-overview--invest card overview-card column-group column-group--top column-group--gap-8">
                {/* <div className="column-group column-group--gap-16">
                  <div className="main-overview--section-header row-group row-group--center row-group--between">
                    <h4 className="main-overview--title title--sm">주식</h4>
                    <div className="row-group row-group-center row-group--gap-4">
                      <button
                        type="button"
                        className="button refresh-btn"
                        aria-label="주식 현재가 새로고침"
                        onClick={() => refreshStockQuotes()}
                        disabled={isStockRefreshing || !stockSymbols.length || isDemoMode}
                      >
                        <span className="material-symbols-outlined " aria-hidden="true">
                          refresh
                        </span>
                        정보 업데이트
                      </button>
                      <div
                        className="main-overview--tabs"
                        role="tablist"
                        aria-label="내역 입력 모드"
                      >
                        <button
                          type="button"
                          role="tab"
                          aria-selected="true"
                          className="main-overview--tab bodyBold--sm is-active"
                        >
                          추가
                        </button>
                        <button
                          type="button"
                          role="tab"
                          aria-selected="false"
                          className="main-overview--tab bodyBold--sm"
                          disabled
                        >
                          수정
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="main-overview--form">
                    <div className="grid-col-2">
                      <label className="main-overview--field">
                        <span className="label--md">종목 검색</span>
                        <div className="autocomplete" data-node-id="20805:11748">
                          <div className="autocomplete__control">
                            <input
                              className="autocomplete__input"
                              type="text"
                              placeholder="종목명 또는 코드"
                              aria-label="종목 검색"
                              value={stockQuery}
                              onChange={(event) => {
                                setStockQuery(event.target.value);
                                setSelectedStock(null);
                              }}
                            />
                            <span
                              className="material-symbols-outlined autocomplete__icon"
                              aria-hidden="true"
                            >
                              arrow_drop_down
                            </span>
                          </div>
                          {stockSearchItems.length || isStockSearching ? (
                            <ul className="autocomplete__list">
                              {isStockSearching ? (
                                <li className="autocomplete__item label--md">
                                  검색 중...
                                </li>
                              ) : (
                                stockSearchItems.map((stock) => (
                                  <li key={`${stock.market}-${stock.symbol}`}>
                                    <button
                                      type="button"
                                      className="autocomplete__item"
                                      onClick={() => {
                                        setSelectedStock(stock);
                                        setStockQuery(`${stock.name} (${stock.symbol})`);
                                        setStockSearchItems([]);
                                      }}
                                    >
                                      <span className="label--md">{stock.name}</span>
                                      <span className="caption--md color-gray">
                                        {stock.symbol} · {stock.market}
                                      </span>
                                    </button>
                                  </li>
                                ))
                              )}
                            </ul>
                          ) : null}
                        </div>
                      </label>
                      <label className="main-overview--field">
                        <span className="label--md">구매일</span>
                        <input
                          className="main-overview--control body--sm"
                          type="date"
                          value={stockPurchaseDate}
                          onChange={(event) => setStockPurchaseDate(event.target.value)}
                        />
                      </label>
                    </div>
                    <div className="grid-col-2">
                      <label className="main-overview--field">
                        <span className="label--md">수량</span>
                        <input
                          className="main-overview--control body--sm"
                          type="number"
                          min="0"
                          step="0.000001"
                          placeholder="0"
                          value={stockQuantity}
                          onChange={(event) => setStockQuantity(event.target.value)}
                        />
                      </label>
                      <label className="main-overview--field">
                        <span className="label--md">평균 매입단가</span>
                        <input
                          className="main-overview--control body--sm"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="1주 평균 매입단가"
                          value={stockUnitPrice}
                          onChange={(event) => setStockUnitPrice(event.target.value)}
                        />
                      </label>
                    </div>
                    <div className="main-overview--actions row-group row-group--center row-group--gap-8">
                      <button
                        type="button"
                        className="button button--primary button--md button--full main-overview--submit"
                        onClick={handleStockSubmit}
                        disabled={isStockSubmitting}
                      >
                        {isStockSubmitting ? "저장 중..." : "주식 추가"}
                      </button>
                    </div>
                  </div>

                  <div className="table--wrap table--wrap__invest">
                    <table className="table table--invest">
                      <thead>
                        <tr>
                          <th>
                            <div className="row-group row-group--center row-group--gap-4 first-th">
                              종목명
                              <button
                                type="button"
                                className="material-symbols-outlined sort-btn"
                                aria-label="종목명 정렬"
                                onClick={() => handleStockSort("name")}
                              >
                                unfold_more
                              </button>
                            </div>
                          </th>
                          <th>
                            <div className="row-group row-group--center row-group--gap-4">
                              총 수익
                              <button
                                type="button"
                                className="material-symbols-outlined sort-btn"
                                aria-label="총 수익 정렬"
                                onClick={() => handleStockSort("totalProfit")}
                              >
                                unfold_more
                              </button>
                            </div>
                          </th>
                          <th>
                            <div className="row-group row-group--center row-group--gap-4">
                              1주 평균 금액
                              <button
                                type="button"
                                className="material-symbols-outlined sort-btn"
                                aria-label="1주 평균 금액 정렬"
                                onClick={() => handleStockSort("averagePrice")}
                              >
                                unfold_more
                              </button>
                            </div>
                          </th>
                          <th>
                            <div className="row-group row-group--center row-group--gap-4">
                              총 금액
                              <button
                                type="button"
                                className="material-symbols-outlined sort-btn"
                                aria-label="총 금액 정렬"
                                onClick={() => handleStockSort("totalCost")}
                              >
                                unfold_more
                              </button>
                            </div>
                          </th>
                          <th>
                            <div className="row-group row-group--center row-group--gap-4">
                              일간 수익
                              <button
                                type="button"
                                className="material-symbols-outlined sort-btn"
                                aria-label="일간 수익 정렬"
                                onClick={() => handleStockSort("dailyProfit")}
                              >
                                unfold_more
                              </button>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {investmentSummaries.length ? (
                          investmentSummaries.map((stock) => {
                            const totalProfitClassName = getChangeClassName(
                              stock.totalProfit,
                            );
                            const dailyProfitClassName = getChangeClassName(
                              stock.dailyProfit,
                            );

                            return (
                              <tr key={stock.symbol}>
                                <td className="tl">
                                  <div className="column-group column-group--gap-4">
                                    <p className="label--lg">{stock.name}</p>
                                    <span className="caption--md color-gray">
                                      {stock.quantity.toLocaleString()}주 · {stock.symbol}
                                    </span>
                                  </div>
                                </td>
                                <td className="tr">
                                  <div className="column-group column-group--gap-4">
                                    <p className={`label--lg ${totalProfitClassName}`}>
                                      {formatSignedPercent(stock.totalProfitRate)}
                                    </p>
                                    <span
                                      className={`caption--md ${totalProfitClassName}`}
                                    >
                                      {formatSignedWon(stock.totalProfit)}
                                    </span>
                                  </div>
                                </td>
                                <td className="tr">
                                  <div className="column-group column-group--gap-4">
                                    <p className="label--lg">
                                      {formatWon(stock.averagePrice)}
                                    </p>
                                    <span className="caption--md color-gray">
                                      현재가 {formatWon(stock.currentPrice)}
                                    </span>
                                  </div>
                                </td>
                                <td className="tr">
                                  <div className="column-group column-group--gap-4">
                                    <p className="label--lg">
                                      {formatWon(stock.totalCost)}
                                    </p>
                                    <span className="caption--md color-gray">
                                      평가 {formatWon(stock.currentValue)}
                                    </span>
                                  </div>
                                </td>
                                <td className="tr">
                                  <div className="column-group column-group--gap-4">
                                    <p className={`label--lg ${dailyProfitClassName}`}>
                                      {formatSignedPercent(stock.dailyProfitRate)}
                                    </p>
                                    <span
                                      className={`caption--md ${dailyProfitClassName}`}
                                    >
                                      {formatSignedWon(stock.dailyProfit)}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5}>등록된 주식이 없습니다.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div> */}
                <div className="empty title--md">업데이트 예정</div>
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
                        {selectedDayItems.length}건
                      </strong>
                    </div>
                    <ul className="calendar-content column-group column-group--gap-4">
                      {selectedDayItems.map((item) => {
                        const isIncome = item.type === "income";
                        const isSavings = isSavingsItem(item);
                        return (
                          <li
                            key={item.id}
                            className="calendar-content--item row-group row-group--center row-group--gap-16"
                          >
                            <p className="calendar-content--sort">
                              <span
                                className={`badge ${
                                  isSavings
                                    ? "badge--blue"
                                    : isIncome
                                      ? "badge--green"
                                      : "badge--red"
                                }`}
                              >
                                {isSavings ? "저축" : isIncome ? "수입" : "지출"}
                              </span>
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
                    <div className="main-overview--type-toggle">
                      <button
                        type="button"
                        className={`main-overview--type bodyBold--sm ${inlineType === "expense" ? "is-active" : ""}`}
                        onClick={() => handleInlineTypeChange("expense")}
                      >
                        지출
                      </button>
                      <button
                        type="button"
                        className={`main-overview--type bodyBold--sm ${inlineType === "income" ? "is-active" : ""}`}
                        onClick={() => handleInlineTypeChange("income")}
                      >
                        수입
                      </button>
                    </div>
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
                          type="number"
                          min="0"
                          placeholder="0"
                          value={inlineAmount}
                          onChange={(event) => setInlineAmount(event.target.value)}
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
                      <th>카테고리</th>
                      <th>종류</th>
                      <th>금액</th>
                      <th>내용</th>
                      <th>날짜</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inlineEditItems.length ? (
                      inlineEditItems.map((item) => {
                        const isIncome = item.type === "income";
                        const isSavings = isSavingsItem(item);
                        return (
                          <tr key={item.id}>
                            <td>{item.category}</td>
                            <td>
                              <span
                                className={`badge ${
                                  isSavings
                                    ? "badge--blue"
                                    : isIncome
                                      ? "badge--green"
                                      : "badge--red"
                                }`}
                              >
                                {isSavings ? "저축" : isIncome ? "수입" : "지출"}
                              </span>
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
    </div>
  );
}

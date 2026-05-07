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
const savingsCategory = "적금";
const savingsMetaPrefix = "[[savings:";
const savingsMetaPattern = /\s*\[\[savings:([^\]]+)\]\]\s*$/;
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
};

type SavingsAccount = SavingsMeta & {
  items: Expense[];
  currentAmount: number;
  monthlyPayment: number;
  nextPaymentDate: string;
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

const encodeSavingsMemo = (meta: SavingsMeta) =>
  `${meta.name} ${savingsMetaPrefix}${encodeURIComponent(JSON.stringify(meta))}]]`;

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
    };
  } catch {
    return null;
  }
};

const getVisibleMemo = (memo: string) => memo.replace(savingsMetaPattern, "").trim();
const isSavingsItem = (item: Expense) =>
  item.type === "expense" && item.category === savingsCategory;

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
  const [savingsCurrentAmount, setSavingsCurrentAmount] = useState("");
  const [savingsName, setSavingsName] = useState("");
  const [isSavingsSubmitting, setIsSavingsSubmitting] = useState(false);
  const [isSavingsDeleting, setIsSavingsDeleting] = useState(false);

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
      if (item.type !== "expense" || item.category !== savingsCategory) return acc;
      const meta = parseSavingsMemo(item.memo);
      if (!meta) return acc;

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
      .filter((account) => account.maturityDate >= todayKey)
      .sort((left, right) => left.maturityDate.localeCompare(right.maturityDate));
  }, [expenses, today]);
  const selectedSavingsAccount =
    savingsAccounts.find((account) => account.id === savingsEditingId) ?? null;

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
    setSavingsCurrentAmount("");
    setSavingsName("");
  }, [selectedDate]);

  const fillSavingsEditForm = useCallback((account: SavingsAccount) => {
    setSavingsPaymentAmount(String(account.monthlyPayment));
    setSavingsPaymentDay(String(account.paymentDay));
    setSavingsMaturityDate(account.maturityDate);
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
    if (!savingsMaturityDate || Number.isNaN(maturityDate.getTime())) {
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
    if (maturityDate < new Date(formatDate(savingsStartDate))) {
      alert("만기일은 첫 납입월 이후로 선택해주세요.");
      return;
    }

    const meta: SavingsMeta = {
      id:
        savingsFormMode === "edit" && selectedSavingsAccount
          ? selectedSavingsAccount.id
          : `savings-${Date.now()}`,
      name,
      paymentDay,
      maturityDate: savingsMaturityDate,
      initialAmount,
    };
    const paymentDates = getSavingsPaymentDates(savingsStartDate, paymentDay, savingsMaturityDate);
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
            <div className="main-overview--savings row-group row-group--stretch row-group--gap-16">
              {/* 적금 */}
              <div className="card overview-card column-group column-group--center column-group--gap-8">
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
                <div className="row-group row-group--center row-group--gap-8">
                  <label className="main-overview--field flex-fill">
                    <span className="label--md">납입 금액</span>
                    <input
                      className="main-overview--control body--sm"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={savingsPaymentAmount}
                      onChange={(event) => setSavingsPaymentAmount(event.target.value)}
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
                    <span className="label--md">만기일</span>
                    <input
                      className="main-overview--control body--sm"
                      type="date"
                      value={savingsMaturityDate}
                      onChange={(event) => setSavingsMaturityDate(event.target.value)}
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
                      onChange={(event) => setSavingsCurrentAmount(event.target.value)}
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
                  {savingsAccounts.length ? (
                    savingsAccounts.map((account) => (
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
                          <span className="label--sm">매월 {account.paymentDay}일</span>
                          <span className="label--sm">-</span>
                          <span className="label--sm">만기일</span>
                          <span className="label--sm">
                            {formatDetailDate(account.maturityDate)}
                          </span>
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
              {/* 주식 */}
              <div className="card overview-card column-group column-group--top column-group--gap-8">
                {/* <h4 className="main-overview--title title--sm">주식</h4> */}
                <p className="title--lg empty">업데이트 예정</p>
              </div>
            </div>
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

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Calendar from "react-calendar";
import type { Value } from "react-calendar/dist/shared/types.js";
import type { ChartOptions } from "chart.js";
import { Line, Pie } from "react-chartjs-2";
import Modal from "@/components/common/Modal";
import "@/lib/chart";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "@/lib/api/expense";
import { supabase } from "@/lib/supabase/client";
import type { Expense } from "@/types/expense";
import { formatDate } from "@/utils/date";

const formatCurrency = (value: number) =>
  `${value < 0 ? "-" : ""}₩ ${Math.abs(value).toLocaleString()}`;
const formatWon = (value: number) =>
  `${value < 0 ? "-" : ""}${Math.round(Math.abs(value)).toLocaleString()}원`;
const formatTrendLabel = (value: number) => `${value >= 0 ? "+" : "-"}${Math.abs(value).toFixed(1)}%`;
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
const categoryOptions = ["식비", "교통", "쇼핑", "문화생활", "급여", "기타"];
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
const getTrend = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
};
const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();
const getDailySeries = (
  items: Expense[],
  year: number,
  month: number,
  type?: Expense["type"],
) => {
  const dailyTotals = Array.from({ length: getDaysInMonth(year, month) }, () => 0);

  items.forEach((item) => {
    if (type && item.type !== type) return;
    const date = new Date(item.date);
    if (date.getFullYear() !== year || date.getMonth() !== month) return;
    const amount = type ? item.amount : item.type === "income" ? item.amount : -item.amount;
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
    return <p className="label--md">이번 달 지출 내역이 없습니다.</p>;
  }

  return <Pie data={chartData} options={options} />;
}

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [displayName, setDisplayName] = useState("게스트");
  const [displayEmail, setDisplayEmail] = useState("");
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
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const data = await getExpenses();
      setExpenses(data || []);
      const metadataName =
        typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "";
      setDisplayName(metadataName || user.email?.split("@")[0] || "게스트");
      setDisplayEmail(user.email || "");
      setIsAuthResolved(true);
    };
    fetchData();
  }, [router]);

  useEffect(() => {
    const handlePointerDown = (event: globalThis.MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
  const previousMonthlyExpenses = useMemo(() => {
    const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
    return expenses.filter((item) => {
      const date = new Date(item.date);
      return (
        date.getFullYear() === previousMonthDate.getFullYear() &&
        date.getMonth() === previousMonthDate.getMonth()
      );
    });
  }, [currentMonth, currentYear, expenses]);

  const monthlyExpenseTotal = monthlyExpenses
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const monthlyIncomeTotal = monthlyExpenses
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const monthlyIncomeCount = monthlyExpenses.filter((item) => item.type === "income").length;
  const monthlyExpenseCount = monthlyExpenses.filter((item) => item.type === "expense").length;
  const monthlyIncomeAverage = monthlyIncomeCount
    ? monthlyIncomeTotal / monthlyIncomeCount
    : 0;
  const monthlyExpenseAverage = monthlyExpenseCount
    ? monthlyExpenseTotal / monthlyExpenseCount
    : 0;
  const monthlyTotal = monthlyIncomeTotal - monthlyExpenseTotal;
  const previousExpenseTotal = previousMonthlyExpenses
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const changeAmount = monthlyExpenseTotal - previousExpenseTotal;
  const changeRate = getTrend(monthlyExpenseTotal, previousExpenseTotal);
  const expenseChangeDirection =
    changeAmount > 0
      ? "지난달보다 지출 증가"
      : changeAmount < 0
        ? "지난달보다 지출 감소"
        : "지난달과 지출 동일";
  const incomeSeries = getDailySeries(expenses, currentYear, currentMonth, "income");
  const expenseSeries = getDailySeries(expenses, currentYear, currentMonth, "expense");
  const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const previousExpenseSeries = getDailySeries(
    expenses,
    previousMonthDate.getFullYear(),
    previousMonthDate.getMonth(),
    "expense",
  );
  const comparisonSeries = expenseSeries.map(
    (value, index) => value - (previousExpenseSeries[index] ?? previousExpenseSeries.at(-1) ?? 0),
  );
  const selectedDayItems = useMemo(
    () => monthlyExpenses.filter((item) => item.date === selectedDateKey),
    [monthlyExpenses, selectedDateKey],
  );
  const categoryExpenseItems = useMemo(() => {
    const categoryTotals = monthlyExpenses
      .filter((item) => item.type === "expense")
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

  const resetInlineCreateForm = useCallback((date = selectedDateKey) => {
    setInlineAmount("");
    setInlineCategory(categoryOptions[0]);
    setInlineCustomCategory("");
    setInlineMemo("");
    setInlineDate(date);
    setInlineType("expense");
  }, [selectedDateKey]);

  const fillInlineEditForm = useCallback((expense: Expense) => {
    setInlineAmount(String(expense.amount));
    setInlineCategory(
      categoryOptions.includes(expense.category) ? expense.category : customCategoryValue,
    );
    setInlineCustomCategory(
      categoryOptions.includes(expense.category) ? "" : expense.category,
    );
    setInlineMemo(expense.memo);
    setInlineDate(expense.date);
    setInlineType(expense.type);
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

  const handleDelete = async (id: string) => {
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
        await updateExpense(selectedInlineExpense.id, payload);
        setExpenses((prev) =>
          prev.map((item) =>
            item.id === selectedInlineExpense.id ? { ...item, ...payload } : item,
          ),
        );
      } else {
        const saved = await createExpense(payload);
        setExpenses((prev) => [...prev, ...(saved || [])]);
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
  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };
  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
  };
  const handleLogout = async () => {
    if (isLoggingOut) return;

    handleMenuClose();
    setIsLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setIsLoggingOut(false);
      alert(`로그아웃 실패: ${error.message}`);
      return;
    }

    window.location.replace("/auth/login");
  };
  const dashboardActive = pathname === "/";
  const analysisActive = pathname.startsWith("/analysis");

  if (!isAuthResolved) {
    return null;
  }

  return (
    <div className="home-page">
      <div className="side-menu">
        <div className="side-menu--inner column-group">
          <div
            ref={menuRef}
            className="side-menu--avatar row-group row-group--center row-group--between"
          >
            <div className="row-group row-group--center row-group--gap-8">
              <span className="material-symbols-outlined" aria-hidden="true">
                account_circle
              </span>
              <div className="column-group">
                <span className="bodyBold--sm">{displayName}</span>
                <span className="label--sm">{displayEmail}</span>
              </div>
            </div>
            <button
              type="button"
              aria-label="Open menu"
              aria-controls="side-menu-actions"
              aria-expanded={isMenuOpen ? "true" : "false"}
              aria-haspopup="menu"
              className="button button--icon-only button--md button--subtle side-menu--more"
              onClick={handleMenuToggle}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                more_vert
              </span>
            </button>
            {isMenuOpen ? (
              <div
                className="side-menu--dropdown column-group"
                id="side-menu-actions"
                role="menu"
              >
                <ul>
                  <li>
                    <button
                      type="button"
                      className="side-menu--dropdown-item"
                      role="menuitem"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
                    </button>
                  </li>
                </ul>
              </div>
            ) : null}
          </div>
          <ul className="side-menu--list app-header__nav column-group column-group--gap-4">
            <li>
              <Link
                href="/"
                className={`side-menu--item row-group row-group--center row-group--gap-4 label--lg ${dashboardActive ? "is-active" : ""}`}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  home
                </span>
                대시보드
              </Link>
            </li>
            <li>
              <Link
                href="/analysis"
                className={`side-menu--item row-group row-group--gap-4 label--lg ${analysisActive ? "is-active" : ""}`}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  analytics
                </span>
                월별 분석
              </Link>
            </li>
          </ul>
        </div>
      </div>
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
            <h3 className="main-common-title title--md">Overview</h3>
            <div className="row-group row-group--stretch row-group--gap-16">
              {/* 이번 달 상황 */}
              <div className="card overview-card column-group column-group--center column-group--gap-8">
                <h4 className="main-overview--title title--sm">이번 달 잔액</h4>
                <div className="row-group row-group--center row-group--between">
                  <p className="main-overview--num title--lg">
                    {formatWon(monthlyTotal)}
                  </p>
                </div>
                <p className="main-overview--last label--md">
                  수입 {formatWon(monthlyIncomeTotal)} · 지출{" "}
                  {formatWon(monthlyExpenseTotal)}
                </p>
                <OverviewLineChart
                  lines={[
                    { values: incomeSeries, color: "green", label: "수입" },
                    { values: expenseSeries, color: "red", label: "지출" },
                  ]}
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
              {/* 전월 대비 */}
              <div className="card overview-card column-group column-group--center column-group--gap-8">
                <h4 className="main-overview--title title--sm">전월 대비</h4>
                <div className="row-group row-group--center row-group--between">
                  <p className="main-overview--num title--lg">
                    {formatWon(changeAmount)}
                  </p>
                  <span className="badge badge--teal">
                    {formatTrendLabel(changeRate)}
                  </span>
                </div>
                <p className="main-overview--last label--md">{expenseChangeDirection}</p>
                <OverviewLineChart
                  lines={[
                    { values: comparisonSeries, color: "teal", label: "전월 대비" },
                  ]}
                />
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
                        return (
                          <li
                            key={item.id}
                            className="calendar-content--item row-group row-group--center row-group--gap-16"
                          >
                            <p className="calendar-content--sort">
                              <span
                                className={`badge ${isIncome ? "badge--green" : "badge--red"}`}
                              >
                                {isIncome ? "수입" : "지출"}
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
                              {item.memo || "-"}
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
                                {item.date} · {item.memo || item.category} ·{" "}
                                {item.amount.toLocaleString()}원
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
                        onClick={() => setInlineType("expense")}
                      >
                        지출
                      </button>
                      <button
                        type="button"
                        className={`main-overview--type bodyBold--sm ${inlineType === "income" ? "is-active" : ""}`}
                        onClick={() => setInlineType("income")}
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
                          {categoryOptions.map((option) => (
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
          <h3 className="main-common-title title--md">Details</h3>
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
                        return (
                          <tr key={item.id}>
                            <td>{item.category}</td>
                            <td>
                              <span
                                className={`badge ${isIncome ? "badge--green" : "badge--red"}`}
                              >
                                {isIncome ? "수입" : "지출"}
                              </span>
                            </td>
                            <td>{formatCurrency(item.amount)}</td>
                            <td>{item.memo || "-"}</td>
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

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import ExpenseForm from "@/components/expense/ExpenseForm";
import Modal from "@/components/common/Modal";
import MonthlyFlowChart from "@/components/chart/MonthlyFlowChart";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "@/lib/api/expense";
import { supabase } from "@/lib/supabase/client";
import type { Expense } from "@/types/expense";
import { formatDate } from "@/utils/date";

const formatCurrency = (value: number) => `₩ ${value.toLocaleString()}`;
const categoryBudgets: Record<string, number> = {
  식비: 600000,
  쇼핑: 300000,
  교통: 150000,
  문화: 100000,
  문화생활: 100000,
  급여: 4000000,
  기타: 250000,
};
const monthNames = Array.from({ length: 12 }, (_, index) => `${index + 1}월`);
const weekdayLabels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const toMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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

export default function Home() {
  const router = useRouter();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [displayName, setDisplayName] = useState("게스트");
  const [displayEmail, setDisplayEmail] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
  const monthlyBreakdown = useMemo(
    () =>
      monthNames.map((label, index) => {
        const items = expenses.filter((item) => {
          const date = new Date(item.date);
          return date.getFullYear() === currentYear && date.getMonth() === index;
        });
        const expenseTotal = items
          .filter((item) => item.type === "expense")
          .reduce((sum, item) => sum + item.amount, 0);
        const incomeTotal = items
          .filter((item) => item.type === "income")
          .reduce((sum, item) => sum + item.amount, 0);
        return { label, month: index, expenseTotal, incomeTotal };
      }),
    [currentYear, expenses],
  );

  const monthlyExpenseTotal = monthlyExpenses
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const monthlyIncomeTotal = monthlyExpenses
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const previousExpenseTotal = previousMonthlyExpenses
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const changeAmount = monthlyExpenseTotal - previousExpenseTotal;
  const changeRate = getTrend(monthlyExpenseTotal, previousExpenseTotal);
  const selectedDayItems = monthlyExpenses.filter(
    (item) => item.date === selectedDateKey,
  );
  const dayMap = monthlyExpenses.reduce<Record<string, number>>((acc, item) => {
    acc[item.date] = (acc[item.date] || 0) + 1;
    return acc;
  }, {});
  const categoryRows = Object.entries(
    monthlyExpenses
      .filter((item) => item.type === "expense")
      .reduce<Record<string, number>>((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.amount;
        return acc;
      }, {}),
  )
    .sort(([, left], [, right]) => right - left)
    .slice(0, 4);
  const detailItems = [...monthlyExpenses]
    .sort((left, right) => {
      const dateDiff = new Date(right.date).getTime() - new Date(left.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return right.created_at.localeCompare(left.created_at);
    })
    .slice(0, 5);
  const calendarDays = getCalendarDays(selectedDate);

  const handleAdd = async (
    newData: Pick<Expense, "amount" | "category" | "memo" | "date" | "type">,
  ) => {
    const saved = await createExpense(newData);
    setExpenses((prev) => [...prev, ...(saved || [])]);
    closeModal();
  };
  const handleEdit = async (
    updatedData: Pick<Expense, "amount" | "category" | "memo" | "date" | "type">,
  ) => {
    if (!editingExpense) return;
    await updateExpense(editingExpense.id, updatedData);
    setExpenses((prev) =>
      prev.map((item) =>
        item.id === editingExpense.id ? { ...item, ...updatedData } : item,
      ),
    );
    closeModal();
  };
  const handleDelete = async (id: string) => {
    await deleteExpense(id);
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    if (editingExpense?.id === id) closeModal();
  };
  const openCreateModal = () => {
    setEditingExpense(null);
    setShowModal(true);
  };
  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditingExpense(null);
  };
  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };
  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
  };
  const handleLogout = async () => {
    handleMenuClose();
    await supabase.auth.signOut();
    router.replace("/auth/login");
  };

  if (!isAuthResolved) {
    return null;
  }

  return (
    <div className="home-page">
      <div className="side-menu">
        <div className="side-menu--inner">
          <div className="side-menu--avatar row-group row-group--center row-group--gap-8">
            <span className="material-symbols-outlined" aria-hidden="true">
              account_circle
            </span>
            <div className="column-group">
              <span className="bodyBold--sm">{displayName}</span>
              <span className="label--sm">{displayEmail}</span>
            </div>
            <div className="side-menu--menu" ref={menuRef}>
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
                  <ul className="side-menu--dropdown-item" role="menuitem">
                    <li className="side-menu--dropdown__text" onClick={handleLogout}>
                      로그아웃
                    </li>
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <main className="main">
        <section className="hero">
          <div>
            <p className="hero-eyebrow label--lg">MONTHLY OVERVIEW</p>
            <h1 className="hero-title headline--md">
              {currentYear}년 {currentMonth + 1}월
            </h1>
            <p className="hero-meta body--md">
              {displayName} 님의 이번 달 자산 흐름입니다.
            </p>
          </div>
          <button
            type="button"
            className="add-button bodyBold--md"
            onClick={openCreateModal}
          >
            <span className="add-button__icon">+</span>
            내역 추가
          </button>
        </section>

        <section className="summary-grid">
          <article className="summary-card">
            <span className="summary-label label--md">이번 달 지출</span>
            <strong className="summary-value summary-value-expense bodyBold--xl">
              {formatCurrency(monthlyExpenseTotal)}
            </strong>
          </article>
          <article className="summary-card">
            <span className="summary-label label--md">이번 달 수입</span>
            <strong className="summary-value bodyBold--xl">
              {formatCurrency(monthlyIncomeTotal)}
            </strong>
          </article>
          <article className="summary-card">
            <span className="summary-label label--md">지난달 대비 증감</span>
            <div className="summary-inline">
              <strong className="summary-value bodyBold--xl">
                {formatCurrency(Math.abs(changeAmount))}
              </strong>
              <span
                className={`change-rate label--md ${changeAmount >= 0 ? "change-rate-up" : "change-rate-down"}`}
              >
                {changeAmount >= 0 ? "▲" : "▼"} {Math.abs(changeRate).toFixed(1)}%
              </span>
            </div>
          </article>
        </section>

        <section className="content-grid">
          <article className="panel">
            <div className="panel-header">
              <h2 className="panel-title title--sm">수입/지출 달력</h2>
              <div className="calendar-nav">
                <button
                  type="button"
                  className="calendar-nav__button bodyBold--md"
                  onClick={() =>
                    setSelectedDate(
                      new Date(currentYear, currentMonth - 1, selectedDate.getDate()),
                    )
                  }
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="calendar-nav__button bodyBold--md"
                  onClick={() =>
                    setSelectedDate(
                      new Date(currentYear, currentMonth + 1, selectedDate.getDate()),
                    )
                  }
                >
                  ›
                </button>
              </div>
            </div>
            <div className="calendar-labels">
              {weekdayLabels.map((label) => (
                <span key={label} className="label--sm">
                  {label}
                </span>
              ))}
            </div>
            <div className="calendar-grid">
              {calendarDays.map((date) => {
                const key = formatDate(date);
                const isCurrentMonth = date.getMonth() === currentMonth;
                const isSelected = key === selectedDateKey;
                const hasEntries = Boolean(dayMap[key]);
                return (
                  <button
                    key={key}
                    type="button"
                    className={`day-cell body--sm ${!isCurrentMonth ? "day-cell-muted" : ""} ${isSelected ? "day-cell-selected" : ""}`}
                    onClick={() => setSelectedDate(date)}
                  >
                    <span>{date.getDate()}</span>
                    {hasEntries ? <span className="day-dot" /> : null}
                  </button>
                );
              })}
            </div>
            <div className="calendar-footer">
              <span className="body--sm">{selectedDateKey}</span>
              <strong className="bodyBold--sm">{selectedDayItems.length}건 기록됨</strong>
            </div>
          </article>
          <article className="panel">
            <div className="panel-header">
              <h2 className="panel-title title--sm">카테고리별 지출</h2>
            </div>
            <div className="category-list">
              {categoryRows.length === 0 ? (
                <p className="empty-text body--sm">
                  이번 달 지출 데이터가 아직 없습니다.
                </p>
              ) : (
                categoryRows.map(([label, amount]) => {
                  const budget = categoryBudgets[label] ?? Math.max(amount, 1);
                  const ratio = Math.min((amount / budget) * 100, 100);
                  return (
                    <div key={label} className="category-row">
                      <div className="category-meta">
                        <span className="category-label bodyBold--sm">{label}</span>
                        <span className="category-amount body--xs">
                          {amount.toLocaleString()} / {budget.toLocaleString()}
                        </span>
                      </div>
                      <div className="category-track">
                        <div className="category-fill" style={{ width: `${ratio}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </article>
          <article className="panel">
            <div className="panel-header">
              <h2 className="panel-title title--sm">상세 내역</h2>
            </div>
            <div className="detail-list">
              {detailItems.length === 0 ? (
                <p className="empty-text body--sm">
                  이번 달 등록된 내역이 아직 없습니다.
                </p>
              ) : (
                detailItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="detail-item"
                    onClick={() => openEditModal(item)}
                  >
                    <div>
                      <strong className="detail-name bodyBold--md">
                        {item.memo || item.category}
                      </strong>
                      <p className="detail-meta body--xs">
                        {new Date(item.date).getMonth() + 1}월{" "}
                        {new Date(item.date).getDate()}일 · {item.category}
                      </p>
                    </div>
                    <span
                      className={`detail-amount bodyBold--md ${item.type === "expense" ? "detail-amount-expense" : "detail-amount-income"}`}
                    >
                      {item.type === "expense" ? "- " : "+ "}
                      {formatCurrency(item.amount)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="flow-panel">
          <div className="flow-header">
            <div>
              <h2 className="panel-title title--sm">월별 분석 그래프</h2>
              <p className="flow-meta body--sm">
                {currentYear}년 1월부터 12월까지 수입과 지출을 비교합니다.
              </p>
            </div>
            <div className="flow-legend">
              <span className="body--sm">
                <i className="legend-dot legend-dot-income" />
                수입
              </span>
              <span className="body--sm">
                <i className="legend-dot legend-dot-expense" />
                지출
              </span>
            </div>
          </div>
          <div className="flow-chart-wrap">
            <MonthlyFlowChart data={monthlyBreakdown} currentMonth={currentMonth} />
          </div>
        </section>
      </main>

      {showModal ? (
        <Modal onClose={closeModal}>
          <ExpenseForm
            key={editingExpense?.id ?? `${toMonthKey(selectedDate)}-${selectedDateKey}`}
            selectedDate={selectedDateKey}
            initialData={editingExpense}
            onCancel={closeModal}
            onDelete={handleDelete}
            onSubmit={editingExpense ? handleEdit : handleAdd}
          />
        </Modal>
      ) : null}
    </div>
  );
}

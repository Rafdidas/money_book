"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import CalendarView from "../components/calendar/CalendarView";
import ExpenseList from "../components/expense/ExpenseList";
import ExpenseForm from "../components/expense/ExpenseForm";
import ExpensePieChart from "@/components/chart/ExpensePieChart";
import Modal from "../components/common/Modal";
import { createExpense, deleteExpense, getExpenses, updateExpense } from "../lib/api/expense";
import { supabase } from "../lib/supabase/client";
import type { Expense } from "../types/expense";
import { formatDate } from "../utils/date";

const formatCurrency = (value: number) => `₩ ${value.toLocaleString()}`;

const monthTitle = (date: Date) => `${date.getFullYear()}년 ${date.getMonth() + 1}월`;

const chartLabels = ["1일", "5일", "10일", "15일", "20일", "25일", "31일"];

const buildChartPoints = (expenses: Expense[], selectedDate: Date) => {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totals = Array.from({ length: daysInMonth }, () => 0);

  expenses.forEach((expense) => {
    const date = new Date(expense.date);

    if (
      expense.type === "expense" &&
      date.getFullYear() === year &&
      date.getMonth() === month
    ) {
      totals[date.getDate() - 1] += expense.amount;
    }
  });

  const max = Math.max(...totals, 1);
  const points = totals.map((value, index) => {
    const x = (index / Math.max(daysInMonth - 1, 1)) * 100;
    const y = 100 - (value / max) * 100;
    return `${x},${y}`;
  });

  const areaPoints = [`0,100`, ...points, `100,100`].join(" ");

  return {
    max,
    linePoints: points.join(" "),
    areaPoints,
  };
};

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [displayName, setDisplayName] = useState("게스트");

  useEffect(() => {
    const fetchData = async () => {
      const [data, userResult] = await Promise.all([
        getExpenses(),
        supabase.auth.getUser(),
      ]);

      setExpenses(data || []);

      const user = userResult.data.user;
      if (user) {
        const metadataName = typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "";
        setDisplayName(metadataName || user.email?.split("@")[0] || "게스트");
      }
    };

    fetchData();
  }, []);

  const formattedSelectedDate = formatDate(selectedDate);
  const monthlyExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const date = new Date(item.date);
      return (
        date.getFullYear() === selectedDate.getFullYear() &&
        date.getMonth() === selectedDate.getMonth()
      );
    });
  }, [expenses, selectedDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => item.date === formattedSelectedDate);
  }, [expenses, formattedSelectedDate]);

  const incomeTotal = monthlyExpenses
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const expenseTotal = monthlyExpenses
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const netWorth = incomeTotal - expenseTotal;
  const savingsDelta = Math.max(netWorth * 0.12, 0);
  const goalAmount = 5_000_000;
  const goalCurrent = Math.min(Math.max(netWorth, 0), goalAmount);
  const goalRatio = goalAmount === 0 ? 0 : Math.round((goalCurrent / goalAmount) * 100);
  const { max, linePoints, areaPoints } = buildChartPoints(monthlyExpenses, selectedDate);

  const handleAdd = async (newData: Pick<Expense, "amount" | "category" | "memo" | "date" | "type">) => {
    const saved = await createExpense(newData);
    setExpenses((prev) => [...prev, ...(saved || [])]);
    closeModal();
  };

  const handleEdit = async (updatedData: Pick<Expense, "amount" | "category" | "memo" | "date" | "type">) => {
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
    if (editingExpense?.id === id) {
      closeModal();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
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

  return (
    <div className={styles.dashboard}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarBrand}>Money Book</div>
          <div className={styles.profileCard}>
            <div className={styles.profileAvatar}>{displayName.slice(0, 1).toUpperCase()}</div>
            <div className={styles.profileName}>{displayName} 님</div>
          </div>

          <nav className={styles.sidebarNav}>
            <div className={`${styles.navItem} ${styles.navItemActive}`}>대시보드</div>
          </nav>

          <div className={styles.sidebarFooter}>
            <div className={styles.navItem}>설정</div>
            <button type="button" className={styles.navButton} onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </aside>

        <main className={styles.main}>
          <div className={styles.headerRow}>
            <div className={styles.pageTitle}>
              <span>Selected Day</span>
              <h1>{monthTitle(selectedDate)}</h1>
            </div>
            <button type="button" className={styles.addButton} onClick={openCreateModal}>
              새 거래 추가
            </button>
          </div>

          <section className={styles.summaryGrid}>
            <article className={styles.heroCard}>
              <p className={styles.heroLabel}>이번 달 순 자산</p>
              <h2 className={styles.heroValue}>{formatCurrency(netWorth)}</h2>
              <div className={styles.heroStats}>
                <div className={styles.heroStat}>
                  <span>수입</span>
                  <strong>{formatCurrency(incomeTotal)}</strong>
                </div>
                <div className={styles.heroDivider} />
                <div className={styles.heroStat}>
                  <span>지출</span>
                  <strong>{formatCurrency(expenseTotal)}</strong>
                </div>
              </div>
            </article>

            <article className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiBadge}>↗</div>
                <span className={styles.kpiTrend}>+12.5%</span>
              </div>
              <div>
                <p className={styles.kpiLabel}>지난달 대비 저축액</p>
                <strong className={styles.kpiValue}>{formatCurrency(savingsDelta)}</strong>
              </div>
            </article>
          </section>

          <section className={styles.workspace}>
            <CalendarView
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              expenses={monthlyExpenses}
            />

            <div className={styles.feedColumn}>
              <ExpenseList
                items={filteredExpenses}
                selectedDateLabel={formattedSelectedDate}
                onDelete={handleDelete}
                onEdit={openEditModal}
              />
            </div>

            <div className={styles.feedColumn}>
              <ExpensePieChart expenses={monthlyExpenses} />
              <article className={styles.goalCard}>
                <div>
                  <p className={styles.goalLabel}>저축 목표</p>
                  <p className={styles.goalMeta}>여름 휴가 준비 (유럽 여행)</p>
                </div>
                <div>
                  <strong className={styles.goalValue}>{formatCurrency(goalCurrent)}</strong>
                  <p className={styles.goalMeta}>목표액: {formatCurrency(goalAmount)}</p>
                </div>
                <div className={styles.goalTrack}>
                  <div className={styles.goalFill} style={{ width: `${goalRatio}%` }} />
                </div>
                <p className={styles.goalHint}>
                  현재 {goalRatio}% 달성 • {formatCurrency(goalAmount - goalCurrent)} 남음
                </p>
              </article>
            </div>
          </section>

          <section className={styles.lineCard}>
            <div className={styles.lineHeader}>
              <h3 className={styles.lineTitle}>일별 지출 현황</h3>
              <div className={styles.lineLegend}>
                <span className={styles.lineLegendDot} /> 지출 금액
              </div>
            </div>
            <div className={styles.lineChart}>
              <div className={styles.lineYLabels}>
                <span>{formatCurrency(max)}</span>
                <span>{formatCurrency(Math.round(max / 2))}</span>
                <span>0</span>
              </div>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.lineSvg}>
                <defs>
                  <linearGradient id="expenseArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(0,80,72,0.22)" />
                    <stop offset="100%" stopColor="rgba(0,80,72,0.02)" />
                  </linearGradient>
                </defs>
                <polyline
                  fill="url(#expenseArea)"
                  stroke="none"
                  points={areaPoints}
                />
                <polyline
                  fill="none"
                  stroke="#005048"
                  strokeWidth="0.6"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={linePoints}
                />
              </svg>
              <div className={styles.lineAxis}>
                {chartLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>

      {showModal ? (
        <Modal onClose={closeModal}>
          <ExpenseForm
            key={editingExpense?.id ?? formattedSelectedDate}
            selectedDate={formattedSelectedDate}
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

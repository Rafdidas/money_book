"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import CategoryDoughnutChart from "@/components/chart/CategoryDoughnutChart";
import MonthlyFlowChart from "@/components/chart/MonthlyFlowChart";
import { getExpenses } from "@/lib/api/expense";
import { supabase } from "@/lib/supabase/client";
import type { Expense } from "@/types/expense";

const monthNames = Array.from({ length: 12 }, (_, index) => `${index + 1}월`);
const formatCurrency = (value: number) => `₩ ${value.toLocaleString()}`;

export default function AnalysisPage() {
  const router = useRouter();
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [displayName, setDisplayName] = useState("게스트");
  const [isAuthResolved, setIsAuthResolved] = useState(false);

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
      setIsAuthResolved(true);
    };
    fetchData();
  }, [router]);

  const yearlyExpenses = useMemo(
    () => expenses.filter((item) => new Date(item.date).getFullYear() === selectedYear),
    [expenses, selectedYear],
  );
  const monthlyBreakdown = useMemo(
    () =>
      monthNames.map((label, index) => {
        const items = yearlyExpenses.filter(
          (item) => new Date(item.date).getMonth() === index,
        );
        const expenseTotal = items
          .filter((item) => item.type === "expense")
          .reduce((sum, item) => sum + item.amount, 0);
        const incomeTotal = items
          .filter((item) => item.type === "income")
          .reduce((sum, item) => sum + item.amount, 0);
        return {
          label,
          month: index,
          expenseTotal,
          incomeTotal,
          net: incomeTotal - expenseTotal,
          count: items.length,
        };
      }),
    [yearlyExpenses],
  );
  const selectedMonthItems = useMemo(
    () =>
      yearlyExpenses.filter((item) => new Date(item.date).getMonth() === selectedMonth),
    [selectedMonth, yearlyExpenses],
  );
  const monthlyExpense = selectedMonthItems
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const monthlyIncome = selectedMonthItems
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const categorySummary = Object.entries(
    selectedMonthItems
      .filter((item) => item.type === "expense")
      .reduce<Record<string, number>>((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.amount;
        return acc;
      }, {}),
  ).sort(([, left], [, right]) => right - left);
  const topCategory = categorySummary[0];
  const yearlyExpenseTotal = yearlyExpenses
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const yearlyIncomeTotal = yearlyExpenses
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const yearlyRecordCount = yearlyExpenses.length;
  const categoryChartData = categorySummary.map(([label, value]) => ({ label, value }));

  if (!isAuthResolved) {
    return null;
  }

  return (
    <div className="analysis-page">
      <main className="main">
        <section className="hero">
          <div>
            <p className="hero-eyebrow label--lg">YEARLY ANALYSIS</p>
            <h1 className="hero-title headline--md">{selectedYear}년 월별 분석</h1>
            <p className="hero-meta body--md">
              {displayName} 님의 1월부터 12월까지 흐름을 한눈에 정리했습니다.
            </p>
          </div>
          <div className="year-controls">
            <button
              type="button"
              className="year-button bodyBold--sm"
              onClick={() => setSelectedYear((prev) => prev - 1)}
            >
              이전 해
            </button>
            <strong className="year-label title--sm">{selectedYear}</strong>
            <button
              type="button"
              className="year-button bodyBold--sm"
              onClick={() => setSelectedYear((prev) => prev + 1)}
            >
              다음 해
            </button>
          </div>
        </section>
        <section className="month-selector">
          {monthNames.map((label, index) => (
            <button
              key={label}
              type="button"
              className={`month-chip bodyBold--sm ${selectedMonth === index ? "month-chip-active" : ""}`}
              onClick={() => setSelectedMonth(index)}
            >
              {label}
            </button>
          ))}
        </section>
        <section className="summary-grid">
          <article className="summary-card">
            <span className="summary-label label--md">{monthNames[selectedMonth]} 지출</span>
            <strong className="summary-value summary-value-expense bodyBold--xl">
              {formatCurrency(monthlyExpense)}
            </strong>
          </article>
          <article className="summary-card">
            <span className="summary-label label--md">{monthNames[selectedMonth]} 수입</span>
            <strong className="summary-value bodyBold--xl">
              {formatCurrency(monthlyIncome)}
            </strong>
          </article>
          <article className="summary-card">
            <span className="summary-label label--md">{monthNames[selectedMonth]} 카테고리별 지출</span>
            <strong className="summary-value bodyBold--xl">
              {topCategory ? topCategory[0] : "데이터 없음"}
            </strong>
            <span className="summary-subvalue body--sm">
              {topCategory ? formatCurrency(topCategory[1]) : "기록된 지출이 없습니다."}
            </span>
          </article>
          <article className="summary-card">
            <span className="summary-label label--md">{selectedYear}년 총 데이터</span>
            <strong className="summary-value bodyBold--xl">
              {yearlyRecordCount.toLocaleString()}건
            </strong>
            <span className="summary-subvalue body--sm">
              수입 {formatCurrency(yearlyIncomeTotal)} / 지출 {formatCurrency(yearlyExpenseTotal)}
            </span>
          </article>
        </section>
        <section className="chart-panel">
          <div className="section-header">
            <div>
              <h2 className="section-title title--sm">월별 분석 그래프</h2>
              <p className="section-meta body--sm">
                1월부터 12월까지 수입과 지출을 비교하는 연간 그래프입니다.
              </p>
            </div>
            <div className="chart-legend">
              <span>
                <i className="legend-dot legend-dot-income" />
                수입
              </span>
              <span>
                <i className="legend-dot legend-dot-expense" />
                지출
              </span>
            </div>
          </div>
          <div className="chart-wrap">
            <MonthlyFlowChart data={monthlyBreakdown} currentMonth={selectedMonth} />
          </div>
        </section>
        <section className="year-grid-section">
          <div className="section-header">
            <h2 className="section-title title--sm">1월부터 12월까지</h2>
            <p className="section-meta body--sm">
              각 카드에서 월별 수입, 지출, 순흐름, 기록 수를 확인할 수 있습니다.
            </p>
          </div>
          <div className="year-grid">
            {monthlyBreakdown.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`month-card ${selectedMonth === item.month ? "month-card-active" : ""}`}
                onClick={() => setSelectedMonth(item.month)}
              >
                <div className="month-card__header">
                  <strong className="bodyBold--md">{item.label}</strong>
                  <span>{item.count}건</span>
                </div>
                <div className="month-card__body">
                  <div>
                    <span className="card-meta-label label--md">지출</span>
                    <strong className="card-expense bodyBold--md">
                      {formatCurrency(item.expenseTotal)}
                    </strong>
                  </div>
                  <div>
                    <span className="card-meta-label label--md">수입</span>
                    <strong className="card-income bodyBold--md">
                      {formatCurrency(item.incomeTotal)}
                    </strong>
                  </div>
                  <div>
                    <span className="card-meta-label label--md">순흐름</span>
                    <strong className={`${item.net >= 0 ? "card-income" : "card-expense"} bodyBold--md`}>
                      {formatCurrency(Math.abs(item.net))}
                    </strong>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
        <section className="category-panel">
          <div className="section-header">
            <h2 className="section-title title--sm">{monthNames[selectedMonth]} 카테고리 분석</h2>
            <p className="section-meta body--sm">
              선택한 달의 지출 카테고리를 금액 순으로 정렬했습니다.
            </p>
          </div>
          <div className="category-chart-layout">
            <div className="category-chart-card">
              {categoryChartData.length === 0 ? (
                <p className="empty-text body--sm">선택한 달에 지출 데이터가 없습니다.</p>
              ) : (
                <CategoryDoughnutChart data={categoryChartData} />
              )}
            </div>
            <div className="category-list">
              {categorySummary.length === 0 ? (
                <p className="empty-text body--sm">선택한 달에 지출 데이터가 없습니다.</p>
              ) : (
                categorySummary.map(([label, amount]) => {
                  const ratio = monthlyExpense === 0 ? 0 : (amount / monthlyExpense) * 100;
                  return (
                    <div key={label} className="category-row">
                      <div className="category-meta">
                        <span className="category-label bodyBold--sm">{label}</span>
                        <span className="category-amount body--xs">
                          {formatCurrency(amount)} · {ratio.toFixed(1)}%
                        </span>
                      </div>
                      <div className="category-track">
                        <div
                          className="category-fill"
                          style={{ width: `${Math.max(ratio, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
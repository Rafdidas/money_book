"use client";

import { useMemo, useState } from "react";
import CategoryDoughnutChart from "@/components/chart/CategoryDoughnutChart";
import MonthlyFlowChart from "@/components/chart/MonthlyFlowChart";
import SideMenu from "@/components/common/SideMenu";
import { useAppData } from "@/app/providers";

const monthNames = Array.from({ length: 12 }, (_, index) => `${index + 1}월`);
const formatCurrency = (value: number) => `₩ ${value.toLocaleString()}`;
const formatSignedCurrency = (value: number) =>
  `${value < 0 ? "-" : ""}₩ ${Math.abs(value).toLocaleString()}`;

export default function AnalysisPage() {
  const today = new Date();
  const {
    expenses,
    displayName,
    displayEmail,
    isDemoMode,
    isAuthResolved,
  } = useAppData();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());

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
  const yearlyBalance = yearlyIncomeTotal - yearlyExpenseTotal;
  const yearlyRecordCount = yearlyExpenses.length;
  const categoryChartData = categorySummary.map(([label, value]) => ({ label, value }));

  if (!isAuthResolved) {
    return null;
  }

  return (
    <div className="home-page analysis-page">
      <SideMenu
        displayName={displayName}
        displayEmail={displayEmail}
        isDemoMode={isDemoMode}
      />
      <main className="main column-group">
        <section className="main-header row-group row-group--center row-group--between">
          <div className="column-group">
            <h2 className="main-header--title headline--sm">월별 분석</h2>
            <p className="analysis-header--meta label--md">
              {displayName} 님의 {selectedYear}년 수입과 지출 흐름
            </p>
          </div>
          <div className="analysis-year-control row-group row-group--center">
            <button
              type="button"
              className="button button--icon-only button--sm button--subtle"
              aria-label="이전 해"
              onClick={() => setSelectedYear((prev) => prev - 1)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                chevron_left
              </span>
            </button>
            <strong className="analysis-year-control--label title--sm">
              {selectedYear}
            </strong>
            <button
              type="button"
              className="button button--icon-only button--sm button--subtle"
              aria-label="다음 해"
              onClick={() => setSelectedYear((prev) => prev + 1)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                chevron_right
              </span>
            </button>
          </div>
        </section>

        <section className="analysis-content column-group column-group--gap-16">
          <div className="main-overview column-group column-group--gap-16">
            <h3 className="main-common-title title--md">Overview</h3>
            <div className="main-overview-analysis-card row-group row-group--stretch row-group--gap-16">
              <article className="card analysis-summary-card column-group column-group--center column-group--gap-8">
                <h4 className="analysis-card--title title--sm">
                  {monthNames[selectedMonth]} 잔액
                </h4>
                <strong className="analysis-card--value title--lg">
                  {formatSignedCurrency(monthlyIncome - monthlyExpense)}
                </strong>
                <p className="analysis-card--meta label--md">
                  수입 {formatCurrency(monthlyIncome)} · 지출{" "}
                  {formatCurrency(monthlyExpense)}
                </p>
              </article>
              <article className="card analysis-summary-card column-group column-group--center column-group--gap-8">
                <h4 className="analysis-card--title title--sm">
                  {monthNames[selectedMonth]} 지출
                </h4>
                <strong className="analysis-card--value analysis-card--expense title--lg">
                  {formatCurrency(monthlyExpense)}
                </strong>
                <p className="analysis-card--meta label--md">
                  {selectedMonthItems.length.toLocaleString()}건 중 지출 내역 기준
                </p>
              </article>
              <article className="card analysis-summary-card column-group column-group--center column-group--gap-8">
                <h4 className="analysis-card--title title--sm">최다 지출 카테고리</h4>
                <strong className="analysis-card--value title--lg">
                  {topCategory ? topCategory[0] : "데이터 없음"}
                </strong>
                <p className="analysis-card--meta label--md">
                  {topCategory
                    ? formatCurrency(topCategory[1])
                    : "기록된 지출이 없습니다."}
                </p>
              </article>
              <article className="card analysis-summary-card column-group column-group--center column-group--gap-8">
                <h4 className="analysis-card--title title--sm">
                  {selectedYear}년 순흐름
                </h4>
                <strong
                  className={`analysis-card--value title--lg ${yearlyBalance < 0 ? "analysis-card--expense" : ""}`}
                >
                  {formatSignedCurrency(yearlyBalance)}
                </strong>
                <p className="analysis-card--meta label--md">
                  총 {yearlyRecordCount.toLocaleString()}건 · 수입{" "}
                  {formatCurrency(yearlyIncomeTotal)}
                </p>
              </article>
            </div>
          </div>

          <section className="card analysis-month-panel column-group column-group--gap-16">
            <div className="main-overview--section-header row-group row-group--center row-group--between">
              <h4 className="main-overview--title title--sm">월 선택</h4>
              <span className="badge badge--teal">{monthNames[selectedMonth]}</span>
            </div>
            <label className="analysis-month-select-field">
              {/* <span className="label--md">월</span> */}
              <select
                className="analysis-month-select bodyBold--sm"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(Number(event.target.value))}
              >
                {monthNames.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <div className="analysis-month-selector">
              {monthNames.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  className={`analysis-month-chip bodyBold--sm ${selectedMonth === index ? "is-active" : ""}`}
                  onClick={() => setSelectedMonth(index)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="card analysis-chart-panel column-group column-group--gap-16">
            <div className="main-overview--section-header row-group row-group--center row-group--between">
              <div>
                <h4 className="main-overview--title title--sm">월별 분석 그래프</h4>
                <p className="analysis-section--meta label--md">
                  1월부터 12월까지 수입과 지출을 비교합니다.
                </p>
              </div>
              <div className="analysis-chart-legend row-group row-group--center">
                <span className="label--sm">
                  <i className="analysis-legend-dot analysis-legend-dot--income" />
                  수입
                </span>
                <span className="label--sm">
                  <i className="analysis-legend-dot analysis-legend-dot--expense" />
                  지출
                </span>
              </div>
            </div>
            <div className="analysis-chart-wrap">
              <MonthlyFlowChart data={monthlyBreakdown} currentMonth={selectedMonth} />
            </div>
          </section>

          <section className="card analysis-year-panel column-group column-group--gap-16">
            <div className="main-overview--section-header row-group row-group--center row-group--between">
              <h4 className="main-overview--title title--sm">1월부터 12월까지</h4>
              <span className="label--md analysis-section--meta">
                월별 수입, 지출, 순흐름
              </span>
            </div>
            <div className="analysis-year-grid">
              {monthlyBreakdown.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`analysis-month-card ${selectedMonth === item.month ? "is-active" : ""}`}
                  onClick={() => setSelectedMonth(item.month)}
                >
                  <div className="analysis-month-card--header row-group row-group--center row-group--between">
                    <strong className="bodyBold--md">{item.label}</strong>
                    <span className="badge badge--teal">{item.count}건</span>
                  </div>
                  <div className="analysis-month-card--body">
                    <div>
                      <span className="analysis-card--meta label--md">지출</span>
                      <strong className="analysis-card--expense bodyBold--md">
                        {formatCurrency(item.expenseTotal)}
                      </strong>
                    </div>
                    <div>
                      <span className="analysis-card--meta label--md">수입</span>
                      <strong className="bodyBold--md">
                        {formatCurrency(item.incomeTotal)}
                      </strong>
                    </div>
                    <div>
                      <span className="analysis-card--meta label--md">순흐름</span>
                      <strong
                        className={`${item.net >= 0 ? "" : "analysis-card--expense"} bodyBold--md`}
                      >
                        {formatSignedCurrency(item.net)}
                      </strong>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="card analysis-category-panel column-group column-group--gap-16">
            <div className="main-overview--section-header row-group row-group--center row-group--between">
              <div>
                <h4 className="main-overview--title title--sm">
                  {monthNames[selectedMonth]} 카테고리 분석
                </h4>
                <p className="analysis-section--meta label--md">
                  선택한 달의 지출 카테고리를 금액 순으로 정렬했습니다.
                </p>
              </div>
            </div>
            <div className="analysis-category-layout">
              <div className="analysis-category-chart">
                {categoryChartData.length === 0 ? (
                  <p className="analysis-empty label--md">
                    선택한 달에 지출 데이터가 없습니다.
                  </p>
                ) : (
                  <CategoryDoughnutChart data={categoryChartData} />
                )}
              </div>
              <div className="analysis-category-list column-group column-group--gap-16">
                {categorySummary.length === 0 ? (
                  <p className="analysis-empty label--md">
                    선택한 달에 지출 데이터가 없습니다.
                  </p>
                ) : (
                  categorySummary.map(([label, amount]) => {
                    const ratio =
                      monthlyExpense === 0 ? 0 : (amount / monthlyExpense) * 100;
                    return (
                      <div key={label} className="analysis-category-row">
                        <div className="analysis-category-row--meta row-group row-group--center row-group--between">
                          <span className="bodyBold--sm">{label}</span>
                          <span className="label--md">
                            {formatCurrency(amount)} · {ratio.toFixed(1)}%
                          </span>
                        </div>
                        <div className="analysis-category-track">
                          <div
                            className="analysis-category-fill"
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
        </section>
      </main>
    </div>
  );
}

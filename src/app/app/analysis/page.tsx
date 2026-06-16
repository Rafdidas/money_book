"use client";

import { useEffect, useMemo, useState } from "react";
import CategoryDoughnutChart from "@/components/chart/CategoryDoughnutChart";
import MonthlyFlowChart from "@/components/chart/MonthlyFlowChart";
import AppIcon from "@/components/common/AppIcon";
import SideMenu from "@/components/common/SideMenu";
import Loading from "@/components/loading/Loading";
import { useAppData } from "@/app/providers";
import {
  getMoneyBookEntriesByYear,
  type MoneyBookEntry,
} from "@/lib/api/moneyBookEntries";
import { readDemoExpenses } from "@/lib/demo";

const monthNames = Array.from({ length: 12 }, (_, index) => `${index + 1}월`);
const formatCurrency = (value: number) => `₩ ${value.toLocaleString()}`;
const formatSignedCurrency = (value: number) =>
  `${value < 0 ? "-" : ""}₩ ${Math.abs(value).toLocaleString()}`;
const formatRate = (value: number) => `${value.toFixed(1)}%`;
const isSavingsCategory = (category: string) =>
  category.includes("적금") || category.includes("저축");
const isInvestmentCategory = (category: string) => category.includes("주식");
const isSavingsItem = (item: { type: string }) => item.type === "saving";
const isInvestmentItem = (item: { type: string }) => item.type === "investment";
const isRecurringPaymentEntry = (item: MoneyBookEntry) =>
  item.source === "savings_payment" || item.source === "fixed_expense_payment";
const getDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const mapDemoExpenseToEntry = (item: {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  memo: string;
  date: string;
}): MoneyBookEntry => {
  const isSavings = isSavingsCategory(item.category);
  const isInvestment = isInvestmentCategory(item.category);

  return {
    id: item.id,
    source: isSavings ? "legacy_savings" : "expense",
    amount: item.amount,
    type: isSavings ? "saving" : isInvestment ? "investment" : item.type,
    category: item.category,
    memo: item.memo,
    date: item.date,
    originId: item.id,
  };
};

export default function AnalysisPage() {
  const today = new Date();
  const todayKey = getDateKey(today);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const {
    displayName,
    displayEmail,
    isDemoMode,
    isAuthResolved,
  } = useAppData();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [analysisEntries, setAnalysisEntries] = useState<MoneyBookEntry[]>([]);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(true);

  useEffect(() => {
    if (!isAuthResolved) {
      setIsAnalysisLoading(true);
      return;
    }

    if (isDemoMode) {
      setIsAnalysisLoading(false);
      return;
    }

    let isCancelled = false;

    const fetchYearlyExpenses = async () => {
      setIsAnalysisLoading(true);
      try {
        const data = await getMoneyBookEntriesByYear(selectedYear);
        if (!isCancelled) {
          setAnalysisEntries(data || []);
        }
      } catch {
        if (!isCancelled) {
          setAnalysisEntries([]);
        }
      } finally {
        if (!isCancelled) {
          setIsAnalysisLoading(false);
        }
      }
    };

    fetchYearlyExpenses();

    return () => {
      isCancelled = true;
    };
  }, [isAuthResolved, isDemoMode, selectedYear]);

  const yearlyEntries = useMemo(
    () =>
      isDemoMode
        ? readDemoExpenses()
            .filter((item) => new Date(item.date).getFullYear() === selectedYear)
            .map(mapDemoExpenseToEntry)
        : analysisEntries,
    [analysisEntries, isDemoMode, selectedYear],
  );
  const monthlyBreakdown = useMemo(
    () =>
      monthNames.map((label, index) => {
        const items = yearlyEntries.filter(
          (item) => new Date(item.date).getMonth() === index,
        );
        const isFutureMonth =
          selectedYear > currentYear ||
          (selectedYear === currentYear && index > currentMonth);
        const actualItems = items.filter((item) => {
          if (item.date > todayKey) {
            return false;
          }

          if (isRecurringPaymentEntry(item)) {
            return item.status === "paid";
          }

          return true;
        });
        const scheduledItems = items.filter((item) => {
          if (isRecurringPaymentEntry(item)) {
            return item.status === "scheduled";
          }

          return item.date > todayKey;
        });
        const expenseTotal = actualItems
          .filter((item) => item.type === "expense")
          .reduce((sum, item) => sum + item.amount, 0);
        const savingsTotal = actualItems
          .filter(isSavingsItem)
          .reduce((sum, item) => sum + item.amount, 0);
        const investmentTotal = actualItems
          .filter(isInvestmentItem)
          .reduce((sum, item) => sum + item.amount, 0);
        const incomeTotal = actualItems
          .filter((item) => item.type === "income")
          .reduce((sum, item) => sum + item.amount, 0);
        const scheduledExpenseTotal = scheduledItems
          .filter((item) => item.type === "expense")
          .reduce((sum, item) => sum + item.amount, 0);
        const scheduledSavingsTotal = scheduledItems
          .filter(isSavingsItem)
          .reduce((sum, item) => sum + item.amount, 0);
        const scheduledInvestmentTotal = scheduledItems
          .filter(isInvestmentItem)
          .reduce((sum, item) => sum + item.amount, 0);
        const scheduledIncomeTotal = scheduledItems
          .filter((item) => item.type === "income")
          .reduce((sum, item) => sum + item.amount, 0);
        return {
          label,
          month: index,
          isFutureMonth,
          expenseTotal,
          savingsTotal,
          investmentTotal,
          incomeTotal,
          net: incomeTotal - expenseTotal - savingsTotal - investmentTotal,
          count: actualItems.length,
          scheduledExpenseTotal,
          scheduledSavingsTotal,
          scheduledInvestmentTotal,
          scheduledIncomeTotal,
          scheduledNet:
            scheduledIncomeTotal -
            scheduledExpenseTotal -
            scheduledSavingsTotal -
            scheduledInvestmentTotal,
          scheduledCount: scheduledItems.length,
        };
      }),
    [currentMonth, currentYear, selectedYear, todayKey, yearlyEntries],
  );
  const chartBreakdown = useMemo(
    () =>
      monthlyBreakdown.map((item) =>
        item.isFutureMonth
          ? {
              ...item,
              expenseTotal: 0,
              incomeTotal: 0,
            }
          : item,
      ),
    [monthlyBreakdown],
  );
  const selectedMonthItems = useMemo(
    () =>
      yearlyEntries.filter((item) => new Date(item.date).getMonth() === selectedMonth),
    [selectedMonth, yearlyEntries],
  );
  const selectedActualMonthItems = useMemo(
    () =>
      selectedMonthItems.filter((item) => {
        if (item.date > todayKey) {
          return false;
        }

        if (isRecurringPaymentEntry(item)) {
          return item.status === "paid";
        }

        return true;
      }),
    [selectedMonthItems, todayKey],
  );
  const selectedScheduledMonthItems = useMemo(
    () =>
      selectedMonthItems.filter((item) => {
        if (isRecurringPaymentEntry(item)) {
          return item.status === "scheduled";
        }

        return item.date > todayKey;
      }),
    [selectedMonthItems, todayKey],
  );
  const monthlyExpense = selectedActualMonthItems
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const monthlySavings = selectedActualMonthItems
    .filter(isSavingsItem)
    .reduce((sum, item) => sum + item.amount, 0);
  const monthlyInvestment = selectedActualMonthItems
    .filter(isInvestmentItem)
    .reduce((sum, item) => sum + item.amount, 0);
  const monthlyIncome = selectedActualMonthItems
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const monthlyScheduledExpense = selectedScheduledMonthItems
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const monthlyScheduledSavings = selectedScheduledMonthItems
    .filter(isSavingsItem)
    .reduce((sum, item) => sum + item.amount, 0);
  const monthlyScheduledInvestment = selectedScheduledMonthItems
    .filter(isInvestmentItem)
    .reduce((sum, item) => sum + item.amount, 0);
  const monthlyScheduledOutflow =
    monthlyScheduledExpense + monthlyScheduledSavings + monthlyScheduledInvestment;
  const monthlyAssetMove = monthlySavings + monthlyInvestment;
  const monthlyOutflow = monthlyExpense + monthlyAssetMove;
  const monthlyBalance = monthlyIncome - monthlyOutflow;
  const previousMonthBreakdown =
    monthlyBreakdown[(selectedMonth + monthNames.length - 1) % monthNames.length];
  const previousMonthlyExpense =
    selectedMonth === 0 ? 0 : previousMonthBreakdown?.expenseTotal ?? 0;
  const expenseDiff = monthlyExpense - previousMonthlyExpense;
  const monthlyExpenseCount = selectedActualMonthItems.filter(
    (item) => item.type === "expense",
  ).length;
  const categorySummary = Object.entries(
    selectedActualMonthItems
      .filter((item) => item.type === "expense")
      .reduce<Record<string, number>>((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.amount;
        return acc;
      }, {}),
  ).sort(([, left], [, right]) => right - left);
  const topCategory = categorySummary[0];
  const categoryChartData = categorySummary.map(([label, value]) => ({ label, value }));
  const expenseRate = monthlyIncome === 0 ? 0 : (monthlyExpense / monthlyIncome) * 100;
  const assetMoveRate =
    monthlyIncome === 0 ? 0 : (monthlyAssetMove / monthlyIncome) * 100;
  const balanceRate =
    monthlyIncome === 0 ? 0 : (Math.max(monthlyBalance, 0) / monthlyIncome) * 100;
  const topCategoryRate =
    topCategory && monthlyExpense > 0 ? (topCategory[1] / monthlyExpense) * 100 : 0;

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
              <AppIcon name="chevron_left" />
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
              <AppIcon name="chevron_right" />
            </button>
          </div>
        </section>

        <section className="analysis-content column-group column-group--gap-16">
          <div className="main-overview column-group column-group--gap-16">
            <h3 className="main-common-title title--md">월별 개요</h3>
            <div className="main-overview-analysis-card row-group row-group--stretch row-group--gap-16">
              <article className="card analysis-summary-card column-group column-group--center column-group--gap-8">
                <h4 className="analysis-card--title title--sm">
                  {monthNames[selectedMonth]} 남은 돈
                </h4>
                <strong className="analysis-card--value title--lg">
                  {formatSignedCurrency(monthlyBalance)}
                </strong>
                <p className="analysis-card--meta label--md">
                  수입 {formatCurrency(monthlyIncome)} - 유출{" "}
                  {formatCurrency(monthlyOutflow)}
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
                  {selectedMonth === 0
                    ? `지출 ${monthlyExpenseCount.toLocaleString()}건`
                    : `전월 대비 ${formatSignedCurrency(expenseDiff)}`}
                </p>
              </article>
              <article className="card analysis-summary-card column-group column-group--center column-group--gap-8">
                <h4 className="analysis-card--title title--sm">저축/투자</h4>
                <strong className="analysis-card--value title--lg">
                  {formatCurrency(monthlyAssetMove)}
                </strong>
                <p className="analysis-card--meta label--md">
                  저축 {formatCurrency(monthlySavings)} · 투자{" "}
                  {formatCurrency(monthlyInvestment)}
                </p>
              </article>
              <article className="card analysis-summary-card column-group column-group--center column-group--gap-8">
                <h4 className="analysis-card--title title--sm">최대 지출</h4>
                <strong className="analysis-card--value title--lg">
                  {topCategory ? topCategory[0] : "데이터 없음"}
                </strong>
                <p className="analysis-card--meta label--md">
                  {topCategory
                    ? formatCurrency(topCategory[1])
                    : "기록된 지출이 없습니다."}
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

          <section className="card analysis-flow-summary-panel column-group column-group--gap-16">
            <div className="main-overview--section-header row-group row-group--center row-group--between">
              <div>
                <h4 className="main-overview--title title--sm">
                  {monthNames[selectedMonth]} 돈의 흐름
                </h4>
                <p className="analysis-section--meta label--md">
                  수입에서 지출과 저축/투자로 이동한 뒤 남은 금액입니다.
                </p>
              </div>
            </div>
            <div className="analysis-flow-summary-grid">
              <div className="analysis-flow-summary-item analysis-flow-summary-item--income">
                <span className="label--md">수입</span>
                <strong className="title--md">{formatCurrency(monthlyIncome)}</strong>
              </div>
              <div className="analysis-flow-summary-item analysis-flow-summary-item--expense">
                <span className="label--md">지출</span>
                <strong className="title--md">-{formatCurrency(monthlyExpense)}</strong>
              </div>
              <div className="analysis-flow-summary-item analysis-flow-summary-item--asset">
                <span className="label--md">저축/투자</span>
                <strong className="title--md">-{formatCurrency(monthlyAssetMove)}</strong>
              </div>
              <div className="analysis-flow-summary-item analysis-flow-summary-item--balance">
                <span className="label--md">남은 돈</span>
                <strong className="title--md">{formatSignedCurrency(monthlyBalance)}</strong>
              </div>
            </div>
            <div className="analysis-flow-ratio">
              <div className="analysis-flow-ratio--header row-group row-group--center row-group--between">
                <span className="bodyBold--sm">
                  수입 {formatCurrency(monthlyIncome)} 기준
                </span>
                <span className="label--md">
                  지출률 {formatRate(expenseRate)} · 저축/투자율{" "}
                  {formatRate(assetMoveRate)} · 잔여율 {formatRate(balanceRate)}
                </span>
              </div>
              <div
                className="analysis-flow-ratio-bar"
                aria-label={`${monthNames[selectedMonth]} 돈의 흐름 비율`}
              >
                <span
                  className="analysis-flow-ratio-segment analysis-flow-ratio-segment--expense"
                  style={{ width: `${Math.min(expenseRate, 100)}%` }}
                />
                <span
                  className="analysis-flow-ratio-segment analysis-flow-ratio-segment--asset"
                  style={{ width: `${Math.min(assetMoveRate, 100)}%` }}
                />
                <span
                  className="analysis-flow-ratio-segment analysis-flow-ratio-segment--balance"
                  style={{ width: `${Math.min(balanceRate, 100)}%` }}
                />
              </div>
              <p className="analysis-flow-comment label--md">
                이번 달 수입의 {formatRate(expenseRate)}를 지출했고,{" "}
                {formatRate(assetMoveRate)}를 저축/투자했어요.
              </p>
              {monthlyScheduledOutflow > 0 ? (
                <p className="analysis-flow-scheduled-note label--md">
                  예정 유출 {formatCurrency(monthlyScheduledOutflow)}은 실제 남은
                  돈에 아직 반영하지 않았어요.
                </p>
              ) : null}
            </div>
          </section>

          <section className="card analysis-chart-panel column-group column-group--gap-16">
            <div className="main-overview--section-header row-group row-group--center row-group--between">
              <div>
                <h4 className="main-overview--title title--sm">월별 분석 그래프</h4>
              <p className="analysis-section--meta label--md">
                  현재 월까지 실제 발생한 수입과 지출을 비교합니다.
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
              <MonthlyFlowChart data={chartBreakdown} currentMonth={selectedMonth} />
            </div>
          </section>

          <section className="card analysis-category-panel column-group column-group--gap-16">
            <div className="main-overview--section-header row-group row-group--center row-group--between">
              <div>
                <h4 className="main-overview--title title--sm">
                  {monthNames[selectedMonth]} 지출 카테고리
                </h4>
                <p className="analysis-section--meta label--md">
                  {topCategory
                    ? `총 지출 ${formatCurrency(monthlyExpense)} 중 ${topCategory[0]}이 ${formatRate(topCategoryRate)}를 차지했어요.`
                    : "선택한 달의 지출 데이터가 없습니다."}
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

          <section className="card analysis-year-panel column-group column-group--gap-16">
            <div className="main-overview--section-header row-group row-group--center row-group--between">
              <h4 className="main-overview--title title--sm">1월부터 12월까지</h4>
              <span className="label--md analysis-section--meta">
                월별 남은 돈, 수입, 지출, 저축/투자
              </span>
            </div>
            <div className="analysis-year-grid">
              {monthlyBreakdown.map((item) => {
                const assetMoveTotal = item.savingsTotal + item.investmentTotal;
                const scheduledAssetMoveTotal =
                  item.scheduledSavingsTotal + item.scheduledInvestmentTotal;
                const displayIncome = item.isFutureMonth
                  ? item.scheduledIncomeTotal
                  : item.incomeTotal;
                const displayExpense = item.isFutureMonth
                  ? item.scheduledExpenseTotal
                  : item.expenseTotal;
                const displayAssetMove = item.isFutureMonth
                  ? scheduledAssetMoveTotal
                  : assetMoveTotal;
                const displayNet = item.isFutureMonth ? item.scheduledNet : item.net;
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`analysis-month-card ${item.isFutureMonth ? "is-scheduled" : ""} ${selectedMonth === item.month ? "is-active" : ""}`}
                    onClick={() => setSelectedMonth(item.month)}
                  >
                    <div className="analysis-month-card--header row-group row-group--center row-group--between">
                      <strong className="bodyBold--md">{item.label}</strong>
                      <span className="badge badge--teal">
                        {item.isFutureMonth
                          ? `예정 ${item.scheduledCount}건`
                          : `${item.count}건`}
                      </span>
                    </div>
                    <div className="analysis-month-card--highlight">
                      <span className="analysis-card--meta label--md">
                        {item.isFutureMonth ? "예상 흐름" : "남은 돈"}
                      </span>
                      <strong
                        className={`${displayNet >= 0 ? "" : "analysis-card--expense"} title--sm`}
                      >
                        {formatSignedCurrency(displayNet)}
                      </strong>
                    </div>
                    <div className="analysis-month-card--body">
                      <div>
                        <span className="analysis-card--meta label--md">
                          {item.isFutureMonth ? "예정 수입" : "수입"}
                        </span>
                        <strong className="bodyBold--md">
                          {formatCurrency(displayIncome)}
                        </strong>
                      </div>
                      <div>
                        <span className="analysis-card--meta label--md">
                          {item.isFutureMonth ? "예정 지출" : "지출"}
                        </span>
                        <strong className="analysis-card--expense bodyBold--md">
                          {formatCurrency(displayExpense)}
                        </strong>
                      </div>
                      <div>
                        <span className="analysis-card--meta label--md">
                          {item.isFutureMonth ? "예정 저축/투자" : "저축/투자"}
                        </span>
                        <strong className="bodyBold--md">
                          {formatCurrency(displayAssetMove)}
                        </strong>
                      </div>
                    </div>
                    {!item.isFutureMonth &&
                    item.scheduledExpenseTotal + scheduledAssetMoveTotal > 0 ? (
                      <p className="analysis-month-card--scheduled-note label--md">
                        예정 유출{" "}
                        {formatCurrency(
                          item.scheduledExpenseTotal + scheduledAssetMoveTotal,
                        )}{" "}
                        별도
                      </p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        </section>
      </main>
      {!isAuthResolved || isAnalysisLoading ? (
        <Loading message="월별 분석을 불러오는 중입니다" variant="overlay" />
      ) : null}
    </div>
  );
}

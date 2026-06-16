import { formatWon } from "@/utils/money";
import type {
  DashboardMonthlySummary,
  DashboardScheduleSummary,
} from "./dashboardSummary";

type DashboardSummaryCardsProps = {
  monthlySummary: DashboardMonthlySummary;
  scheduleSummary: DashboardScheduleSummary;
};

export default function DashboardSummaryCards({
  monthlySummary,
  scheduleSummary,
}: DashboardSummaryCardsProps) {
  const assetMove =
    monthlySummary.actualSavings + monthlySummary.actualInvestment;

  return (
    <div className="main-overview column-group column-group--gap-16">
      <h3 className="main-common-title title--md">개요</h3>
      <div className="main-overview-card row-group row-group--stretch row-group--gap-16">
        <article className="card overview-card column-group column-group--center column-group--gap-8">
          <h4 className="main-overview--title title--sm">현재 남은 돈</h4>
          <p className="main-overview--num title--lg">
            {formatWon(monthlySummary.actualRemaining)}
          </p>
          <div className="column-group column-group--gap-4">
            <p className="main-overview--last label--md">
              수입 {formatWon(monthlySummary.actualIncome)} · 지출{" "}
              {formatWon(monthlySummary.actualExpense)}
            </p>
            <p className="main-overview--last label--md">
              저축 {formatWon(monthlySummary.actualSavings)} · 투자원금{" "}
              {formatWon(monthlySummary.actualInvestment)}
            </p>
          </div>
        </article>
        <article className="card overview-card column-group column-group--center column-group--gap-8">
          <h4 className="main-overview--title title--sm">이번 달 수입</h4>
          <p className="main-overview--num title--lg">
            {formatWon(monthlySummary.actualIncome)}
          </p>
          <p className="main-overview--last label--md">
            총 {monthlySummary.incomeCount}건 · 평균{" "}
            {formatWon(monthlySummary.incomeAverage)}
          </p>
        </article>
        <article className="card overview-card column-group column-group--center column-group--gap-8">
          <h4 className="main-overview--title title--sm">이번 달 지출</h4>
          <p className="main-overview--num title--lg">
            {formatWon(monthlySummary.actualExpense)}
          </p>
          <p className="main-overview--last label--md">
            총 {monthlySummary.expenseCount}건 · 평균{" "}
            {formatWon(monthlySummary.expenseAverage)}
          </p>
        </article>
        <article className="card overview-card column-group column-group--center column-group--gap-8">
          <h4 className="main-overview--title title--sm">저축/투자</h4>
          <p className="main-overview--num title--lg">{formatWon(assetMove)}</p>
          <div className="column-group column-group--gap-4">
            <p className="main-overview--last label--md">
              저축 {formatWon(monthlySummary.actualSavings)}
            </p>
            <p className="main-overview--last label--md">
              투자원금 {formatWon(monthlySummary.actualInvestment)}
            </p>
          </div>
        </article>
      </div>
      <article className="card overview-card dashboard-expected-balance column-group column-group--gap-16">
        <div className="main-overview--section-header row-group row-group--center row-group--between">
          <div className="column-group column-group--gap-4">
            <h4 className="main-overview--title title--sm">
              예정 반영 후 예상 잔액
            </h4>
            <p className="main-overview--last label--md">
              남은 예정 지출·저축/투자를 반영한 금액
            </p>
          </div>
          <strong className="main-overview--num title--lg">
            {formatWon(scheduleSummary.expectedRemaining)}
          </strong>
        </div>
        <div className="dashboard-expected-balance--grid">
          <div className="dashboard-expected-balance--item">
            <span className="label--sm">현재 남은 돈</span>
            <strong className="bodyBold--sm">
              {formatWon(monthlySummary.actualRemaining)}
            </strong>
          </div>
          <div className="dashboard-expected-balance--item">
            <span className="label--sm">남은 예정 지출</span>
            <strong className="bodyBold--sm">
              {formatWon(scheduleSummary.scheduledExpense)}
            </strong>
          </div>
          <div className="dashboard-expected-balance--item">
            <span className="label--sm">남은 예정 저축/투자</span>
            <strong className="bodyBold--sm">
              {formatWon(scheduleSummary.scheduledSavingsInvestment)}
            </strong>
          </div>
        </div>
      </article>
    </div>
  );
}

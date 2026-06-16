import AppIcon from "@/components/common/AppIcon";
import { formatWon } from "@/utils/money";
import type { DashboardScheduleItem } from "./dashboardSummary";

type DashboardScheduleCardProps = {
  items: DashboardScheduleItem[];
};

const statusLabel: Record<DashboardScheduleItem["status"], string> = {
  scheduled: "예정",
  paid: "완료",
  overdue: "지남",
  skipped: "건너뜀",
};

const statusClassName: Record<DashboardScheduleItem["status"], string> = {
  scheduled: "badge--teal",
  paid: "badge--green",
  overdue: "badge--red",
  skipped: "badge--blue",
};

const formatScheduleDate = (dateKey: string) => {
  const date = new Date(dateKey);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
};

export default function DashboardScheduleCard({
  items,
}: DashboardScheduleCardProps) {
  const visibleItems = items.slice(0, 6);

  return (
    <section className="card overview-card dashboard-schedule-card column-group column-group--gap-16">
      <div className="main-overview--section-header row-group row-group--center row-group--between">
        <div>
          <h4 className="main-overview--title title--sm">이번 달 남은 예정</h4>
          <p className="main-overview--last label--md">
            고정지출과 저축/투자 납입 상태를 확인합니다.
          </p>
        </div>
        <span className="badge badge--teal">{items.length}건</span>
      </div>
      {visibleItems.length ? (
        <div className="dashboard-schedule-list">
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className={`dashboard-schedule-row dashboard-schedule-row--${item.status}`}
            >
              <span className={`badge ${statusClassName[item.status]}`}>
                {statusLabel[item.status]}
              </span>
              <div className="dashboard-schedule-row--content">
                <strong className="bodyBold--sm">{item.label}</strong>
                <span className="label--md">
                  {formatWon(item.amount)} ·{" "}
                  {item.status === "overdue"
                    ? `${item.daysOverdue}일 지남`
                    : item.status === "paid"
                      ? `${formatScheduleDate(item.date)} 완료`
                      : item.status === "skipped"
                        ? `${formatScheduleDate(item.date)} 건너뜀`
                        : `${formatScheduleDate(item.date)} 예정`}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="dashboard-schedule-empty">
          <AppIcon name="calendar_month" />
          <p className="label--md">이번 달 남은 예정 항목이 없습니다.</p>
        </div>
      )}
    </section>
  );
}

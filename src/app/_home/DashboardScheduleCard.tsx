import AppIcon from "@/components/common/AppIcon";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
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

const statusTone: Record<DashboardScheduleItem["status"], BadgeTone> = {
  scheduled: "teal",
  paid: "success",
  overdue: "danger",
  skipped: "info",
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
    <Card as="section" className="overview-card dashboard-schedule-card column-group column-group--gap-16">
      <div className="main-overview--section-header row-group row-group--center row-group--between">
        <div>
          <h4 className="main-overview--title title--sm">이번 달 남은 예정</h4>
          <p className="main-overview--last label--md">
            고정지출과 저축/투자 납입 상태를 확인합니다.
          </p>
        </div>
        <Badge tone="teal">{items.length}건</Badge>
      </div>
      {visibleItems.length ? (
        <div className="dashboard-schedule-list">
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className={`dashboard-schedule-row dashboard-schedule-row--${item.status}`}
            >
              <Badge tone={statusTone[item.status]}>
                {statusLabel[item.status]}
              </Badge>
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
    </Card>
  );
}

# Dashboard and Analysis Renewal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved dashboard and monthly analysis renewal while keeping investment management unchanged.

**Architecture:** Extract small money/status/month helpers first, then move dashboard summary calculations out of `HomeClient` before adding the new cards. Monthly analysis builds on its existing actual-vs-scheduled logic and adds yearly cumulative totals plus month-state labels.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Sass, existing Supabase-backed API helpers, existing Chart.js components.

---

## Scope

Implement:

- common `원` currency formatting for touched dashboard/analysis areas
- dashboard `현재 남은 돈` top card
- dashboard `예정 반영 후 예상 잔액` card
- dashboard `이번 달 남은 예정 / 지남` card
- monthly analysis yearly actual cumulative summary
- monthly selector and 12-month card state labels

Do not modify:

- investment management
- stock quote behavior
- database schema
- broad `HomeClient` architecture outside the touched dashboard summary area

## File Structure

- Create `src/utils/money.ts`
  - Owns won currency formatting shared by dashboard and analysis.
- Create `src/app/_home/dashboardSummary.ts`
  - Owns dashboard actual totals, scheduled totals, and schedule item row data.
- Create `src/app/_home/DashboardSummaryCards.tsx`
  - Presents top dashboard summary cards and scheduled expected balance.
- Create `src/app/_home/DashboardScheduleCard.tsx`
  - Presents concise current-month scheduled/outdated items.
- Modify `src/app/_home/HomeClient.tsx`
  - Uses the extracted dashboard helpers/components.
  - Removes duplicated top-card JSX and local money formatting for touched cards.
- Modify `src/app/app/analysis/page.tsx`
  - Uses shared won formatting.
  - Adds yearly cumulative summary.
  - Adds month-state labels in selector and 12-month cards.
- Modify `src/app/analysis/analysis.scss`
  - Adds styles for yearly cumulative summary and month-state badges if existing classes are insufficient.
- Modify the dashboard SCSS used by `HomeClient`
  - Add minimal layout styles for the scheduled balance and remaining schedule cards. Locate the existing imported stylesheet from `HomeClient` before editing.
- Modify `HANDOFF.md`
  - Record what changed and verification results after implementation.

## Task 1: Read Required Next.js Docs and Add Money Formatter

**Files:**

- Read: `node_modules/next/dist/docs/`
- Create: `src/utils/money.ts`

- [ ] **Step 1: Locate relevant Next.js docs**

Run:

```powershell
rg --files node_modules\next\dist\docs
```

Expected: list includes App Router and file-conventions docs.

- [ ] **Step 2: Read the App Router docs relevant to client components**

Run a targeted read for docs containing client component guidance:

```powershell
rg -n "use client|Client Component|Server Component" node_modules\next\dist\docs
```

Expected: references confirming that dashboard and analysis files with hooks remain client components.

- [ ] **Step 3: Create the shared formatter**

Create `src/utils/money.ts`:

```ts
export const formatWon = (value: number) =>
  `${value < 0 ? "-" : ""}${Math.round(Math.abs(value)).toLocaleString()}원`;

export const formatSignedWon = (value: number) => formatWon(value);
```

- [ ] **Step 4: Run lint**

Run:

```powershell
npm run lint
```

Expected: pass.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/utils/money.ts
git commit -m "feat: add shared won formatter"
```

## Task 2: Extract Dashboard Summary Calculations

**Files:**

- Create: `src/app/_home/dashboardSummary.ts`
- Modify: `src/app/_home/HomeClient.tsx`

- [ ] **Step 1: Create calculation types and helpers**

Create `src/app/_home/dashboardSummary.ts`:

```ts
import type { Expense } from "@/types/expense";
import type { PaymentStatus } from "@/types/recurring";

export type DashboardEntry = Expense & {
  status?: PaymentStatus;
};

export type DashboardMonthlySummary = {
  actualIncome: number;
  actualExpense: number;
  actualSavings: number;
  actualInvestment: number;
  actualRemaining: number;
  incomeCount: number;
  expenseCount: number;
  incomeAverage: number;
  expenseAverage: number;
};

export type DashboardScheduleItem = {
  id: string;
  kind: "fixedExpense" | "saving";
  label: string;
  amount: number;
  date: string;
  status: "scheduled" | "paid" | "overdue" | "skipped";
  daysOverdue: number;
};

export type DashboardScheduleSummary = {
  scheduledExpense: number;
  scheduledSavingsInvestment: number;
  expectedRemaining: number;
  items: DashboardScheduleItem[];
};

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const isSameMonth = (dateKey: string, year: number, month: number) => {
  const date = new Date(dateKey);
  return date.getFullYear() === year && date.getMonth() === month;
};

export const isDashboardSavingsItem = (item: { category: string }) =>
  item.category.includes("적금") || item.category.includes("저축");

export const isDashboardInvestmentItem = (item: { category: string }) =>
  item.category.includes("주식");

export const getDashboardMonthlySummary = (
  entries: DashboardEntry[],
  year: number,
  month: number,
): DashboardMonthlySummary => {
  const actualEntries = entries.filter(
    (item) => isSameMonth(item.date, year, month) && item.status !== "scheduled" && item.status !== "cancelled",
  );
  const incomeItems = actualEntries.filter((item) => item.type === "income");
  const expenseItems = actualEntries.filter(
    (item) =>
      item.type === "expense" &&
      !isDashboardSavingsItem(item) &&
      !isDashboardInvestmentItem(item),
  );
  const savingsItems = actualEntries.filter(isDashboardSavingsItem);
  const investmentItems = actualEntries.filter(isDashboardInvestmentItem);
  const actualIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
  const actualExpense = expenseItems.reduce((sum, item) => sum + item.amount, 0);
  const actualSavings = savingsItems.reduce((sum, item) => sum + item.amount, 0);
  const actualInvestment = investmentItems.reduce((sum, item) => sum + item.amount, 0);
  const incomeCount = incomeItems.length;
  const expenseCount = expenseItems.length;

  return {
    actualIncome,
    actualExpense,
    actualSavings,
    actualInvestment,
    actualRemaining: actualIncome - actualExpense - actualSavings - actualInvestment,
    incomeCount,
    expenseCount,
    incomeAverage: incomeCount ? actualIncome / incomeCount : 0,
    expenseAverage: expenseCount ? actualExpense / expenseCount : 0,
  };
};

export const getDashboardScheduleSummary = (
  entries: DashboardEntry[],
  year: number,
  month: number,
  today: Date,
  actualRemaining: number,
): DashboardScheduleSummary => {
  const todayKey = toDateKey(today);
  const items = entries
    .filter((item) => isSameMonth(item.date, year, month))
    .filter((item) => item.status === "scheduled" || item.status === "paid" || item.status === "cancelled")
    .map<DashboardScheduleItem>((item) => {
      const dueDate = new Date(item.date);
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      const daysOverdue = Math.max(
        0,
        Math.floor((todayStart.getTime() - dueStart.getTime()) / 86400000),
      );
      const status =
        item.status === "paid"
          ? "paid"
          : item.status === "cancelled"
            ? "skipped"
            : item.date < todayKey
              ? "overdue"
              : "scheduled";

      return {
        id: item.id,
        kind: isDashboardSavingsItem(item) || isDashboardInvestmentItem(item) ? "saving" : "fixedExpense",
        label: item.memo || item.category,
        amount: item.amount,
        date: item.date,
        status,
        daysOverdue,
      };
    })
    .sort((left, right) => {
      const priority = { overdue: 0, scheduled: 1, paid: 2, skipped: 3 };
      return priority[left.status] - priority[right.status] || left.date.localeCompare(right.date);
    });

  const activeScheduledItems = items.filter((item) => item.status === "scheduled" || item.status === "overdue");
  const scheduledExpense = activeScheduledItems
    .filter((item) => item.kind === "fixedExpense")
    .reduce((sum, item) => sum + item.amount, 0);
  const scheduledSavingsInvestment = activeScheduledItems
    .filter((item) => item.kind === "saving")
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    scheduledExpense,
    scheduledSavingsInvestment,
    expectedRemaining: actualRemaining - scheduledExpense - scheduledSavingsInvestment,
    items,
  };
};
```

- [ ] **Step 2: Replace local dashboard totals in `HomeClient`**

In `src/app/_home/HomeClient.tsx`, import:

```ts
import {
  getDashboardMonthlySummary,
  getDashboardScheduleSummary,
} from "./dashboardSummary";
```

Add memoized summaries near the existing monthly totals:

```ts
const dashboardMonthlySummary = useMemo(
  () => getDashboardMonthlySummary(displayDashboardExpenses, currentYear, currentMonth),
  [currentMonth, currentYear, displayDashboardExpenses],
);

const dashboardScheduleSummary = useMemo(
  () =>
    getDashboardScheduleSummary(
      displayDashboardExpenses,
      currentYear,
      currentMonth,
      today,
      dashboardMonthlySummary.actualRemaining,
    ),
  [
    currentMonth,
    currentYear,
    dashboardMonthlySummary.actualRemaining,
    displayDashboardExpenses,
    today,
  ],
);
```

Keep existing variables temporarily if lower dashboard sections still depend on
them. Only replace the top summary usage in later tasks.

- [ ] **Step 3: Run lint**

Run:

```powershell
npm run lint
```

Expected: pass.

- [ ] **Step 4: Commit**

Run:

```powershell
git add src/app/_home/dashboardSummary.ts src/app/_home/HomeClient.tsx
git commit -m "feat: extract dashboard summary calculations"
```

## Task 3: Add Dashboard Summary Components

**Files:**

- Create: `src/app/_home/DashboardSummaryCards.tsx`
- Modify: `src/app/_home/HomeClient.tsx`

- [ ] **Step 1: Create summary card component**

Create `src/app/_home/DashboardSummaryCards.tsx`:

```tsx
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
  const assetMove = monthlySummary.actualSavings + monthlySummary.actualInvestment;

  return (
    <div className="main-overview column-group column-group--gap-16">
      <h3 className="main-common-title title--md">월별 개요</h3>
      <div className="main-overview-card row-group row-group--stretch row-group--gap-16">
        <article className="card overview-card column-group column-group--center column-group--gap-8">
          <h4 className="main-overview--title title--sm">현재 남은 돈</h4>
          <p className="main-overview--num title--lg">
            {formatWon(monthlySummary.actualRemaining)}
          </p>
          <p className="main-overview--last label--md">
            수입 {formatWon(monthlySummary.actualIncome)} · 지출{" "}
            {formatWon(monthlySummary.actualExpense)}
          </p>
          <p className="main-overview--last label--md">
            저축 {formatWon(monthlySummary.actualSavings)} · 투자원금{" "}
            {formatWon(monthlySummary.actualInvestment)}
          </p>
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
          <p className="main-overview--last label--md">
            저축 {formatWon(monthlySummary.actualSavings)}
          </p>
          <p className="main-overview--last label--md">
            투자원금 {formatWon(monthlySummary.actualInvestment)}
          </p>
        </article>
      </div>
      <article className="card overview-card dashboard-expected-balance column-group column-group--gap-12">
        <div className="main-overview--section-header row-group row-group--center row-group--between">
          <div>
            <h4 className="main-overview--title title--sm">예정 반영 후 예상 잔액</h4>
            <p className="main-overview--last label--md">
              아직 남은 예정 지출과 저축/투자를 반영한 금액입니다.
            </p>
          </div>
          <strong className="main-overview--num title--lg">
            {formatWon(scheduleSummary.expectedRemaining)}
          </strong>
        </div>
        <div className="dashboard-expected-balance--grid">
          <span className="label--md">현재 남은 돈 {formatWon(monthlySummary.actualRemaining)}</span>
          <span className="label--md">남은 예정 지출 {formatWon(scheduleSummary.scheduledExpense)}</span>
          <span className="label--md">
            남은 예정 저축/투자 {formatWon(scheduleSummary.scheduledSavingsInvestment)}
          </span>
        </div>
      </article>
    </div>
  );
}
```

- [ ] **Step 2: Use the component in `HomeClient`**

Import:

```ts
import DashboardSummaryCards from "./DashboardSummaryCards";
```

Replace the current top `main-overview` summary block around the four cards
with:

```tsx
<DashboardSummaryCards
  monthlySummary={dashboardMonthlySummary}
  scheduleSummary={dashboardScheduleSummary}
/>
```

- [ ] **Step 3: Run lint**

Run:

```powershell
npm run lint
```

Expected: pass.

- [ ] **Step 4: Commit**

Run:

```powershell
git add src/app/_home/DashboardSummaryCards.tsx src/app/_home/HomeClient.tsx
git commit -m "feat: add dashboard expected balance summary"
```

## Task 4: Add Dashboard Remaining Schedule Card

**Files:**

- Create: `src/app/_home/DashboardScheduleCard.tsx`
- Modify: `src/app/_home/HomeClient.tsx`
- Modify: dashboard SCSS imported by `HomeClient`

- [ ] **Step 1: Create schedule card component**

Create `src/app/_home/DashboardScheduleCard.tsx`:

```tsx
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
  overdue: "badge--orange",
  skipped: "badge--gray",
};

export default function DashboardScheduleCard({ items }: DashboardScheduleCardProps) {
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
            <div key={item.id} className="dashboard-schedule-row">
              <span className={`badge ${statusClassName[item.status]}`}>
                {statusLabel[item.status]}
              </span>
              <div className="dashboard-schedule-row--content">
                <strong className="bodyBold--sm">{item.label}</strong>
                <span className="label--md">
                  {formatWon(item.amount)} ·{" "}
                  {item.status === "overdue"
                    ? `${item.daysOverdue}일 지남`
                    : item.date}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="dashboard-schedule-empty">
          <AppIcon name="event_available" />
          <p className="label--md">이번 달 남은 예정 항목이 없습니다.</p>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Use the component below summary cards**

Import:

```ts
import DashboardScheduleCard from "./DashboardScheduleCard";
```

Render after `DashboardSummaryCards`:

```tsx
<DashboardScheduleCard items={dashboardScheduleSummary.items} />
```

- [ ] **Step 3: Add minimal SCSS**

Find the SCSS file imported by the dashboard route. Add:

```scss
.dashboard-expected-balance--grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.dashboard-schedule-list {
  display: grid;
  gap: 8px;
}

.dashboard-schedule-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.dashboard-schedule-row--content {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.dashboard-schedule-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-gray-600);
}

@media (max-width: 767px) {
  .dashboard-expected-balance--grid {
    grid-template-columns: 1fr;
  }
}
```

If the project does not define `--color-gray-600`, use the existing gray token
already present in that stylesheet.

- [ ] **Step 4: Run lint**

Run:

```powershell
npm run lint
```

Expected: pass.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/app/_home/DashboardScheduleCard.tsx src/app/_home/HomeClient.tsx <dashboard-scss-file>
git commit -m "feat: add dashboard remaining schedule card"
```

## Task 5: Add Monthly Analysis Yearly Cumulative Summary

**Files:**

- Modify: `src/app/app/analysis/page.tsx`
- Modify: `src/app/analysis/analysis.scss`

- [ ] **Step 1: Replace local analysis currency helpers**

In `src/app/app/analysis/page.tsx`, import:

```ts
import { formatSignedWon, formatWon } from "@/utils/money";
```

Remove the local `formatCurrency` and `formatSignedCurrency` helpers.
Replace touched usages:

```ts
formatCurrency(value) -> formatWon(value)
formatSignedCurrency(value) -> formatSignedWon(value)
```

- [ ] **Step 2: Add yearly cumulative calculation**

After `monthlyBreakdown`, add:

```ts
const yearlyActualSummary = useMemo(
  () =>
    monthlyBreakdown.reduce(
      (summary, item) => ({
        income: summary.income + item.incomeTotal,
        expense: summary.expense + item.expenseTotal,
        assetMove:
          summary.assetMove + item.savingsTotal + item.investmentTotal,
        net: summary.net + item.net,
      }),
      { income: 0, expense: 0, assetMove: 0, net: 0 },
    ),
  [monthlyBreakdown],
);
```

- [ ] **Step 3: Render yearly cumulative summary above monthly overview**

Inside `analysis-content`, before the existing `main-overview`, add:

```tsx
<section className="card analysis-yearly-summary column-group column-group--gap-16">
  <div className="main-overview--section-header row-group row-group--center row-group--between">
    <div>
      <h3 className="main-overview--title title--sm">{selectedYear}년 누적 현황</h3>
      <p className="analysis-section--meta label--md">실제 기록 기준 누적</p>
    </div>
  </div>
  <div className="analysis-yearly-summary--grid">
    <div>
      <span className="label--md">누적 수입</span>
      <strong className="title--sm">{formatWon(yearlyActualSummary.income)}</strong>
    </div>
    <div>
      <span className="label--md">누적 지출</span>
      <strong className="title--sm">{formatWon(yearlyActualSummary.expense)}</strong>
    </div>
    <div>
      <span className="label--md">누적 저축/투자</span>
      <strong className="title--sm">{formatWon(yearlyActualSummary.assetMove)}</strong>
    </div>
    <div>
      <span className="label--md">누적 순흐름</span>
      <strong className="title--sm">{formatSignedWon(yearlyActualSummary.net)}</strong>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Add SCSS**

In `src/app/analysis/analysis.scss`, add:

```scss
.analysis-yearly-summary--grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  > div {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
}

@media (max-width: 767px) {
  .analysis-yearly-summary--grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

- [ ] **Step 5: Run lint**

Run:

```powershell
npm run lint
```

Expected: pass.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/app/app/analysis/page.tsx src/app/analysis/analysis.scss src/utils/money.ts
git commit -m "feat: add yearly actual summary"
```

## Task 6: Strengthen Monthly Analysis Month States

**Files:**

- Modify: `src/app/app/analysis/page.tsx`
- Modify: `src/app/analysis/analysis.scss`

- [ ] **Step 1: Add month state helper in analysis page**

Near the top of `src/app/app/analysis/page.tsx`, add:

```ts
type MonthState = "empty" | "complete" | "current" | "scheduled";

const getMonthStateLabel = (state: MonthState) => {
  if (state === "current") return "진행 중";
  if (state === "scheduled") return "예정";
  if (state === "empty") return "기록 없음";
  return "완료";
};
```

- [ ] **Step 2: Add state to monthly breakdown objects**

Inside each `monthlyBreakdown` item, compute:

```ts
const isCurrentMonth =
  selectedYear === currentYear && index === currentMonth;
const monthState: MonthState = isCurrentMonth
  ? "current"
  : isFutureMonth
    ? "scheduled"
    : actualItems.length === 0
      ? "empty"
      : "complete";
```

Return `monthState` with the object.

- [ ] **Step 3: Show state in month chips**

Change month chip content to:

```tsx
<span>{label}</span>
<small>{getMonthStateLabel(monthlyBreakdown[index].monthState)}</small>
```

Keep the button click behavior unchanged.

- [ ] **Step 4: Show state in 12-month cards**

Change the card badge text:

```tsx
<span className="badge badge--teal">
  {getMonthStateLabel(item.monthState)}
</span>
```

For empty past months, change highlight label/value:

```tsx
<span className="analysis-card--meta label--md">
  {item.monthState === "empty"
    ? "기록 없음"
    : item.isFutureMonth
      ? "예상 흐름"
      : "남은 돈"}
</span>
<strong className={`${displayNet >= 0 ? "" : "analysis-card--expense"} title--sm`}>
  {item.monthState === "empty" ? "아직 기록 없음" : formatSignedWon(displayNet)}
</strong>
```

- [ ] **Step 5: Add chip/card SCSS**

In `src/app/analysis/analysis.scss`, add or adjust:

```scss
.analysis-month-chip {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  gap: 2px;

  small {
    font-size: 11px;
    font-weight: 500;
    color: inherit;
    opacity: 0.72;
  }
}
```

- [ ] **Step 6: Run lint**

Run:

```powershell
npm run lint
```

Expected: pass.

- [ ] **Step 7: Commit**

Run:

```powershell
git add src/app/app/analysis/page.tsx src/app/analysis/analysis.scss
git commit -m "feat: strengthen monthly analysis states"
```

## Task 7: Visual Verification and Build

**Files:**

- Modify: `HANDOFF.md`

- [ ] **Step 1: Run full lint**

Run:

```powershell
npm run lint
```

Expected: pass.

- [ ] **Step 2: Run production build**

Run:

```powershell
npm run build
```

Expected: pass.

- [ ] **Step 3: Start or reuse local dev server**

Run:

```powershell
npm run dev -- -p 3001
```

Expected: app serves on `http://localhost:3001`.

- [ ] **Step 4: Browser-check dashboard**

Open `http://localhost:3001/app` and verify:

- top summary says `현재 남은 돈`
- scheduled expected balance card appears below top cards
- remaining schedule card appears
- money values use `원`
- mobile width does not overlap text

- [ ] **Step 5: Browser-check monthly analysis**

Open `http://localhost:3001/app/analysis` and verify:

- yearly cumulative summary appears
- month chips show state labels
- 12-month cards show `기록 없음`, `완료`, `진행 중`, or `예정`
- future months still use `예상 흐름`
- investment page was not changed

- [ ] **Step 6: Update handoff**

Append to `HANDOFF.md`:

```md
## 2026-06-16 Dashboard/Analysis Renewal Implementation

- Implemented common won formatting in renewed dashboard and analysis areas.
- Added dashboard current remaining money and scheduled expected balance.
- Added dashboard remaining scheduled/outdated recurring card.
- Added monthly analysis yearly actual cumulative summary.
- Strengthened monthly state labels in month selector and 12-month cards.
- Investment management was intentionally left unchanged.
- Verified:
  - `npm run lint` passes
  - `npm run build` passes
  - desktop and mobile browser checks for dashboard and monthly analysis pass
```

- [ ] **Step 7: Commit verification handoff**

Run:

```powershell
git add HANDOFF.md
git commit -m "docs: update renewal handoff"
```

## Self-Review

- Spec coverage: all approved scope items map to Tasks 1-7.
- Investment management remains out of scope.
- `HomeClient` growth is controlled by extracting calculation helpers and two small presentational components.
- No new visualization dependency is introduced.
- Verification includes lint, build, and desktop/mobile browser checks.

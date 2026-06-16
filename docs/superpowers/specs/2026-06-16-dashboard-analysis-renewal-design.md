# Dashboard and Analysis Renewal Design

## Goal

This renewal keeps the Money Book product focused on faster financial status
checks and clearer monthly interpretation.

The first implementation scope is:

- common currency and status terminology
- dashboard top summary renewal
- dashboard scheduled/outdated recurring item card
- yearly cumulative summary on monthly analysis
- stronger monthly state labels in month selection and 12-month cards

Investment management is intentionally out of scope for this pass.

## Product Direction

The screen responsibilities are:

- Dashboard: today's financial status and immediate next actions
- Monthly analysis: actual flow, comparisons, and year/month interpretation
- Investment management: current behavior remains unchanged for now

The dashboard should answer:

- Is my current money state okay?
- How much remains after upcoming scheduled outflows?
- Which fixed expense or savings/investment items still need attention?

Monthly analysis should answer:

- How much has actually happened this year?
- What kind of month is this: no records, complete, in progress, or scheduled?
- Is the selected month actual result data or scheduled future flow?

## Chosen Approach

Use an incremental renewal instead of a broad dashboard rewrite.

This keeps the change small enough to verify and avoids making
`src/app/_home/HomeClient.tsx` even harder to reason about. The implementation
should extract calculation and formatting helpers when they are touched, but it
should not attempt a full dashboard component split in the same pass.

### Alternatives Considered

1. Full dashboard refactor first
   - Benefit: cleaner long-term structure.
   - Cost: higher regression risk before the user-visible renewal is proven.

2. Add the new cards directly inside `HomeClient`
   - Benefit: fastest implementation.
   - Cost: worsens an already large file.

3. Incremental extraction while adding the renewal
   - Benefit: delivers the feature and prevents the file from growing
     unchecked.
   - Cost: does not fully solve the large-file problem yet.

The chosen approach is option 3.

## Common Formatting and Status Language

Money amounts should use Korean won notation everywhere touched by this work:

- positive: `1,000원`
- negative: `-1,000원`
- zero: `0원`

Avoid introducing new `₩ 1,000` text in renewed dashboard and analysis areas.

Status copy should use these Korean labels:

- actual entry: `실제`
- scheduled item: `예정`
- paid recurring item: `완료`
- current month: `진행 중`
- past month without actual records: `기록 없음`
- scheduled item past its date and not paid: `지남`
- cancelled/skipped recurring item in UI copy: `건너뜀`

Existing data types do not need to be renamed in this pass. For example,
`cancelled` can remain the stored status while the UI presents it as `건너뜀`
where appropriate.

## Dashboard Design

### Top Summary

The dashboard top summary should prioritize the current month:

- `현재 남은 돈`
- `이번 달 수입`
- `이번 달 지출`
- `저축/투자`

`현재 남은 돈` is calculated from actual current-month data:

```txt
current remaining = actual income - actual expense - actual savings - actual investment
```

Scheduled recurring items should not reduce this actual amount.

### Scheduled Balance Card

Add a wide card below the top summary:

```txt
예정 반영 후 예상 잔액
현재 남은 돈 - 남은 예정 지출 - 남은 예정 저축/투자
```

The card should show the component values so the user can trust the result:

- current remaining money
- remaining scheduled expense
- remaining scheduled savings/investment
- expected balance after schedule

Only active current-month scheduled items should be included. Paid items are
actual data, and cancelled/skipped items are excluded from the expected balance.

### Remaining Scheduled Items Card

Add a card for the current month's pending recurring work:

- fixed expenses
- savings/investment payments
- outdated items

Each row should show:

- status badge: `예정`, `완료`, `지남`, or `건너뜀`
- item name
- amount
- due date or days overdue

Items whose scheduled date is before today and whose status is not paid should
use `지남`.

The card should stay concise. If there are many items, show the most urgent
items first and keep the full management tables lower on the page.

## Monthly Analysis Design

### Yearly Cumulative Summary

Add a yearly cumulative summary near the top of monthly analysis:

- cumulative actual income
- cumulative actual expense
- cumulative actual savings/investment
- cumulative actual net flow

Future scheduled amounts are not included in this summary.

```txt
cumulative net flow =
actual income - actual expense - actual savings - actual investment
```

The UI should make clear that this is actual data only, for example:

```txt
실제 기록 기준 누적
```

### Month State Rules

A month should be classified by year/month and data state:

- `진행 중`: current month
- `예정`: future month with scheduled recurring items
- `기록 없음`: past month with no actual records
- `완료`: past month with one or more actual records

The selected month panel and 12-month cards should use copy that matches the
state:

- past/current actual months: `남은 돈`
- future scheduled months: `예상 흐름`
- no-record past months: empty-state copy instead of only `0원`

The month selector can keep the existing 1-12 month control, but each month
button/card should expose the state with a badge or small label.

## HomeClient Size Strategy

`HomeClient` is already too large. This renewal should avoid making it larger
without boundaries.

For this pass, extract only code that directly supports the renewal:

- currency and signed currency formatting helpers
- dashboard monthly summary calculation
- dashboard scheduled recurring item calculation
- small presentational sections if doing so reduces repeated JSX

Do not perform a broad component architecture rewrite in the same pass.

Good first extraction candidates:

- `src/app/_home/dashboardSummary.ts`
- `src/app/_home/DashboardSummaryCards.tsx`
- `src/app/_home/DashboardScheduleCard.tsx`

The exact filenames can follow the existing local style during implementation.

## Data Flow

Dashboard data already comes from:

- regular expense entries
- savings accounts and payments
- fixed expense rules and payments

The renewal should reuse this data and avoid new dependencies.

Monthly analysis should continue using `MoneyBookEntry` where practical. Shared
money and month-state helpers can be reused between dashboard and analysis if
the dependency direction stays simple.

## Error and Empty States

If scheduled data is unavailable, the dashboard should still show actual monthly
summary values and an empty scheduled card.

Recommended empty copy:

- dashboard scheduled card: `이번 달 남은 예정 항목이 없습니다.`
- monthly past no-record state: `아직 이 달의 실제 기록이 없습니다.`
- future month without schedule: `등록된 예정 항목이 없습니다.`

## Verification

After implementation:

- run `npm run lint`
- run `npm run build`
- verify dashboard desktop and mobile widths
- verify monthly analysis desktop and mobile widths
- verify demo mode still renders dashboard and monthly analysis
- update `HANDOFF.md`

Before code changes, read the relevant Next.js 16 App Router docs under
`node_modules/next/dist/docs/`, following `AGENTS.md`.

## Out of Scope

- investment management UI changes
- current price or valuation behavior
- settings page
- category management
- data export
- database schema rename for statuses
- full `HomeClient` rewrite

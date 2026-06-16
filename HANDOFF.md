# Money Book Handoff

## Current Goal

Refine the monthly analysis page into a clearer "summary -> comparison ->
detail" flow. The current direction removes the Sankey chart and replaces it
with a simpler monthly cash-flow summary.

## Decisions Made

- Use a real data based SVG chart.
- Do not use Lottie as the main chart renderer.
- Do not add `d3-sankey` for the first implementation.
- Classify fixed expenses by current data source:
  - `fixed_expense_payment`
  - `legacy_fixed_expense`
- Treat other `expense` entries as variable expenses.
- Keep `saving` and `investment` as separate allocation groups.
- Use a mobile-specific compact chart instead of horizontal scrolling.

## Work Completed

- Reviewed project structure.
- Confirmed this is a Next.js 16 / React 19 app.
- Confirmed relevant files:
  - `src/app/app/analysis/page.tsx`
  - `src/app/analysis/analysis.scss`
  - `src/components/chart/MonthlyFlowChart.tsx`
  - `src/lib/api/moneyBookEntries.ts`
  - `src/lib/demo.ts`
- Confirmed existing chart stack:
  - Chart.js
  - react-chartjs-2
  - `@lottiefiles/dotlottie-react`
- Wrote the feature design spec:
  - `docs/superpowers/specs/2026-06-16-monthly-sankey-flow-design.md`
- Wrote the implementation plan:
  - `docs/superpowers/plans/2026-06-16-monthly-sankey-flow.md`

## Next Work

1. Execute the implementation plan task by task.
2. Read relevant Next.js docs before code changes, per `AGENTS.md`.
3. Implement the pure Sankey data builder.
4. Implement `MonthlySankeyFlowChart.tsx`.
5. Insert the chart into the monthly analysis page.
6. Add SCSS for desktop and mobile chart layouts.
7. Run lint and build.
8. Verify demo mode on desktop and mobile widths.

## 2026-06-16 Update

- Added the implementation plan for monthly Sankey flow.
- Next step is choosing an execution mode and then implementing task by task.

## 2026-06-16 Implementation Update

- User chose to continue in the main working tree instead of a worktree.
- Updated `AGENTS.md` with Money Book-specific project rules.
- Added pure Sankey data transformation:
  - `src/components/chart/monthlySankeyFlow.ts`
- Added real-data SVG chart component:
  - `src/components/chart/MonthlySankeyFlowChart.tsx`
- Added the new chart card to 월별 분석:
  - `src/app/app/analysis/page.tsx`
- Added desktop and mobile compact styles:
  - `src/app/analysis/analysis.scss`
- Verified:
  - `npm run lint` passes
  - `npm run build` passes
  - Browser check on `http://localhost:3001/app/analysis`
  - Desktop uses the full Sankey chart
  - Mobile uses the compact Sankey chart
  - Month select changes the Sankey data
- Known note:
  - Browser console still shows the pre-existing Next image aspect-ratio warning
    for the logo asset. It is unrelated to the Sankey work.
- Local dev server was started on port `3001` for review.

## 2026-06-16 Size Tuning Update

- Kept the mobile compact Sankey because the user was satisfied with it.
- Reduced the chart's visual weight:
  - smaller desktop and mobile SVG heights
  - thinner node bars
  - lower maximum ribbon width
  - smaller summary chips and chart labels
- Verified:
  - `npm run lint` passes
  - `npm run build` passes

## 2026-06-16 Node Shape Update

- Adjusted Sankey nodes to read closer to the reference:
  - thinner node bars
  - longer node height range
  - kept the overall chart/card size from the previous size tuning
- Verified:
  - `npm run lint` passes
  - `npm run build` passes

## 2026-06-16 Ribbon Shape Update

- Changed Sankey links from thick stroked curves to filled ribbon paths.
- Stacked link attachment points along each node so ribbons connect to the
  vertical bars more like the reference image.
- Removed ribbon stroke outlines while keeping node bars crisp.
- Verified:
  - `npm run lint` passes
  - `npm run build` passes
  - browser render check confirms ribbon paths are closed filled areas and
    link stroke is `none`

## 2026-06-16 Overflow Fix

- Fixed oversized node bars overflowing outside the chart area.
- Root cause: per-node min/max heights could exceed the available SVG height
  when a column had many nodes.
- Changed node layout to fit each column's total node height inside the SVG
  before placing nodes.
- Verified:
  - `npm run lint` passes
  - `npm run build` passes
  - browser render check confirms desktop node bars are inside the SVG bounds

## 2026-06-16 Reference Scale Update

- Reduced the gap between the current chart and the reference infographic.
- Root cause: desktop SVG scaled up to the full card width, making labels, nodes,
  and ribbons much larger than the copied reference.
- Changed desktop SVG to render as a centered fixed-width infographic with
  `max-width: 920px`.
- Reduced desktop label and amount text sizes.
- Reduced maximum ribbon width slightly.
- Verified:
  - `npm run lint` passes
  - `npm run build` passes
  - browser render check confirms the SVG renders at `920px` inside a wider card
    and node bars remain inside bounds

## 2026-06-16 Scope Correction

- User clarified that the concern was the node bars, not the overall chart
  scale, labels, or ribbon size.
- Reverted the broad reference-scale changes:
  - desktop SVG no longer has a fixed `920px` cap
  - desktop/mobile label sizes restored
  - ribbon maximum width restored
  - label offsets restored
- Kept node-focused fixes:
  - thin vertical node bars
  - column-fit layout so nodes do not overflow
  - filled ribbon paths that attach to nodes
- Verified:
  - `npm run lint` passes
  - `npm run build` passes

## 2026-06-16 Analysis IA Update

- Applied the attached critique's 1st-pass information architecture changes.
- Removed the Sankey chart from 월별 분석.
- Deleted the untracked Sankey implementation files:
  - `src/components/chart/MonthlySankeyFlowChart.tsx`
  - `src/components/chart/monthlySankeyFlow.ts`
- Added a simpler selected-month cash-flow summary:
  - income
  - expense
  - savings/investment
  - remaining money
  - stacked ratio bar for expense / savings-investment / remaining
- Reworked top overview cards:
  - selected-month remaining money
  - selected-month expense
  - savings/investment
  - top expense category
- Moved category analysis above the 12-month summary grid.
- Simplified 12-month cards around "remaining money" plus income, expense, and
  savings/investment.
- Verified:
  - `npm run lint` passes without warnings
  - `npm run build` passes
  - browser render check confirms no `.monthly-sankey` element remains and the
    new flow summary and ratio bar render
- Known note:
  - The existing logo image aspect-ratio warning still appears in browser logs
    and is unrelated to this monthly analysis change.

## 2026-06-16 Actual vs Scheduled Monthly Analysis Update

- Applied the attached design for separating actual money from scheduled future
  cash flow.
- Changed monthly analysis calculations so recurring `scheduled` fixed expenses
  and savings payments no longer reduce actual remaining money.
- Actual monthly totals now use:
  - entries dated through today
  - recurring payment entries only when `status === "paid"`
- Future month cards now use scheduled copy:
  - `예정 N건`
  - `예상 흐름`
  - `예정 수입`
  - `예정 지출`
  - `예정 저축/투자`
- Future month cards get a lower-contrast scheduled style.
- Current/past month cards keep actual `남은 돈`, with scheduled outflow shown
  separately when present.
- Monthly bar chart now hides future month values by zeroing future bars, so it
  reads as actual data through the current month.
- Verified:
  - `npm run lint` passes
  - `npm run build` passes
  - Browser check through demo mode on `http://localhost:3001/app/analysis`
    confirms 12 month cards render, future cards are scheduled, and the chart
    meta says it compares actual values through the current month.

## 2026-06-16 Category Empty State Update

- Reworked the 월별 분석 category empty state.
- When the selected month has no expense categories, the section now renders one
  intentional empty-state panel instead of separate empty messages in the chart
  and list columns.
- Added responsive styling for desktop and mobile widths.
- Verified:
  - `npm run lint` passes
  - `npm run build` passes
  - Browser check on `http://localhost:3001/app/analysis`
  - Desktop 7월 empty category state renders as a single panel and removes the
    chart/list layout
  - Mobile 390px empty category state stacks vertically and text fits inside
    the panel
- Known note:
  - Browser console still shows the pre-existing Next image aspect-ratio
    warning for the logo asset. It is unrelated to this empty-state change.

## 2026-06-16 AGENTS Localization Update

- Updated `AGENTS.md` with Korean translations alongside the existing English
  project rules.
- Added token-saving rules for scoped file reads, concise progress updates, and
  summarized verification output.
- Verified:
  - `git diff --check` reports no whitespace errors

## 2026-06-16 Dashboard/Analysis Renewal Spec

- User approved starting with a local design document before implementation.
- Wrote the scoped renewal design:
  - `docs/superpowers/specs/2026-06-16-dashboard-analysis-renewal-design.md`
- Scope:
  - common currency/status terminology
  - dashboard current remaining and scheduled expected balance
  - dashboard remaining scheduled/outdated card
  - monthly analysis yearly cumulative summary
  - stronger month states
- Explicitly excluded investment management changes for this pass.
- Next step:
  - review/approve the spec, then write the implementation plan and execute it
    step by step.

## 2026-06-16 Dashboard/Analysis Renewal Plan

- Wrote the implementation plan:
  - `docs/superpowers/plans/2026-06-16-dashboard-analysis-renewal.md`
- Plan sequence:
  - shared won formatter
  - dashboard summary calculation extraction
  - dashboard summary and schedule cards
  - monthly analysis yearly cumulative summary
  - monthly state labels
  - lint/build/browser verification
- Next step:
  - choose execution mode and implement task by task.

## 2026-06-16 Dashboard/Analysis Renewal Implementation

- Created feature branch:
  - `codex/dashboard-analysis-renewal`
- Implemented common won formatting for renewed dashboard/analysis areas.
- Extracted dashboard monthly summary and schedule calculations:
  - `src/app/_home/dashboardSummary.ts`
- Added dashboard summary components:
  - `src/app/_home/DashboardSummaryCards.tsx`
  - `src/app/_home/DashboardScheduleCard.tsx`
- Dashboard now shows:
  - `현재 남은 돈`
  - `예정 반영 후 예상 잔액`
  - `이번 달 남은 예정`
- Monthly analysis now shows:
  - yearly actual cumulative summary
  - month state labels for `기록 없음`, `완료`, `진행 중`, `예정`
- Investment management was intentionally left unchanged.
- Verified:
  - `npm run lint` passes
  - `npm run build` passes
  - browser check on `http://localhost:3001/app`
  - browser check on `http://localhost:3001/app/analysis`
  - desktop and 390px mobile widths for the renewed dashboard/analysis areas
- Known note:
  - Mobile overflow detection still sees the offscreen side menu/drawer, which
    appears to be existing layout behavior and not caused by the renewed cards.

## Notes For Future Work Sessions

- Update this file after each meaningful work step.
- Keep entries short:
  - what changed
  - what was verified
  - what remains
- Do not remove previous context unless it is clearly obsolete.
- Follow `AGENTS.md`: read relevant Next.js docs in `node_modules/next/dist/docs/`
  before writing Next.js code.

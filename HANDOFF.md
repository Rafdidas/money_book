# Money Book Handoff

## Current Goal

Add a real-data SVG Sankey-style cash flow chart to the monthly analysis page.
The chart belongs in 월별 분석, not the dashboard, because it supports
interpretation rather than quick status checking.

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

## Notes For Future Work Sessions

- Update this file after each meaningful work step.
- Keep entries short:
  - what changed
  - what was verified
  - what remains
- Do not remove previous context unless it is clearly obsolete.
- Follow `AGENTS.md`: read relevant Next.js docs in `node_modules/next/dist/docs/`
  before writing Next.js code.

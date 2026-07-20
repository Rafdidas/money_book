# 2026-07-14 main merge verification

- Added `.worktrees/**` exclusions to ESLint and Vitest so the root checkout does not recursively lint or collect tests from an active isolated worktree.
- Production DB/data changes: none.
- Verification on merged `main`:
  - `npm audit --audit-level=high`: passed; 4 moderate and 1 low findings remain.
  - `npm run lint`: passed.
  - `npm run test`: 12 tests passed.
  - `npm run build`: passed.
  - `npm run test:e2e`: 6 tests passed across desktop and mobile Chromium.
  - `git diff --check`: passed.
- Note: existing intro image aspect-ratio warnings remain visible in browser logs and are outside this stabilization slice.

# 2026-07-14 security and test baseline - release gate

- Next.js: `16.2.10`.
- Vitest excludes `e2e/**`, leaving Playwright as the sole runner for browser specifications.
- Production DB/data changes: none.
- Product behavior changes: none intended.
- Verification:
  - `npm audit --audit-level=high`: passed; 4 moderate and 1 low findings remain.
  - `npm run lint`: passed.
  - `npm run test`: 12 tests passed.
  - `npm run build`: passed.
  - `npm run test:e2e`: 6 tests passed across desktop and mobile Chromium.
  - `git diff --check`: passed.
- Note: local worktree lockfile and existing intro image aspect-ratio warnings remain non-blocking follow-up items.
- Deployment: not executed in this implementation slice.

# 2026-07-14 browser regression baseline

- Added Playwright desktop/mobile Chromium coverage for the public landing page, unauthenticated app redirect, and demo entry.
- Production DB/data changes: none; the browser suite uses local demo storage only.
- Verification:
  - `npm run test:e2e`: 6 tests passed.
  - `npm run lint`: passed.
  - `npm run build`: passed.
- Note: Next.js reports the expected local worktree lockfile warning; existing intro image aspect-ratio warnings appeared in browser logs.
- Remaining: final release gate and handoff.

# 2026-07-14 Proxy regression contract

- Added matcher coverage for protected `/app` paths and public auth/API paths.
- Added access coverage for unauthenticated redirect, authenticated access, and demo-cookie access.
- Used the installed Next.js `unstable_doesMiddlewareMatch` testing adapter export; Proxy implementation remains unchanged.
- Production DB/data changes: none.
- Verification:
  - `npm run test -- src/proxy.test.ts`: 4 tests passed.
  - `npm run test`: 12 tests passed.
  - `npm run lint`: passed.
  - `npm run build`: passed.
- Remaining: browser smoke coverage.

# 2026-07-14 test baseline catch-up

- Vitest harness and finance-summary/stock-normalization characterization were added in the preceding commits.
- Production DB/data changes: none.
- Verification:
  - date formatting: 2 tests passed.
  - finance summary and stock normalization: 6 tests passed.
  - all current unit tests: 12 tests passed.
# 2026-07-14 Next.js security patch

- Updated Next.js from `16.2.4` to `16.2.10` with a targeted install.
- React and React DOM remain `19.2.4`.
- Production DB/data changes: none.
- Verification:
  - `npm audit --audit-level=high`: passed; remaining audit findings are 4 moderate and 1 low.
  - `npm run lint`: passed.
  - `npm run build`: passed.
- Note: the remaining PostCSS remediation proposes a breaking downgrade to Next.js `9.3.3` when forced, so it is intentionally excluded from this patch-only release.
- Remaining: Vitest and Playwright regression baseline.

# 2026-07-14 security and test baseline - pre-change

- Scope: Next.js patch update and regression-test foundation only.
- Production DB/data changes: none.
- Baseline:
  - Node: `v24.12.0`
  - npm: `11.6.2`
  - Next.js: `16.2.4`
  - `npm audit --audit-level=high`: 1 high, 3 moderate, 1 low; high finding is Next.js.
  - `npm run lint`: passed.
  - `npm run build`: passed after copying the ignored local `.env.local` into the isolated worktree.
- Note: build warns that the parent checkout's `package-lock.json` is also visible from the worktree. This is a local worktree warning only; no `next.config.ts` change is included in this release.
- Remaining: targeted Next.js update and automated regression coverage.
# 2026-07-14 security and test baseline implementation plan

- User approved `docs/superpowers/specs/2026-07-14-production-stabilization-design.md`.
- Added `docs/superpowers/plans/2026-07-14-security-test-baseline.md` for the first independently releasable slice.
- Plan scope:
  - targeted Next.js `16.2.10` patch without `npm audit fix`;
  - Vitest regression harness and finance-summary/stock-normalization characterization;
  - Next.js Proxy matcher and access tests;
  - desktop/mobile Playwright smoke tests for public, unauthenticated, and demo flows;
  - a final audit, lint, test, build, E2E, and diff release gate.
- Production DB/data changes: none in this first implementation plan.
- Production deployment: separate verified checkpoint after the A+B implementation passes.
- Verification:
  - Next.js 16 local upgrade, Proxy, Vitest, and Playwright guides reviewed;
  - placeholder and type-consistency self-review completed;
  - `git diff --check`: passed.
- Remaining: commit the plan, request the model change, and execute only after user confirmation.

# Money Book Handoff

## 2026-07-20 최근 직접입력 카테고리 폼 연결

- 직접입력 내역 저장 뒤 지출·수입·저축·투자 유형별 최근 카테고리를 저장·갱신하고, 추가·수정 폼에서 최근 5개를 다시 선택할 수 있게 했습니다.
- 추천 클릭은 직접입력 텍스트만 채우며 기존 내역을 바꾸지 않습니다. 추천 삭제는 해당 추천만 저장소·목록에서 제거합니다.
- 후속 검토 수정: 데모 카테고리의 저장·삭제는 React 상태 업데이터 밖에서 저장소 쓰기를 먼저 수행한 뒤 상태를 갱신하므로, 쓰기 실패 시 해당 한국어 안내가 확실히 표시됩니다.
- 재검토 수정: 데모 내역 생성·수정도 저장소 기록을 상태 업데이터 밖에서 먼저 완료하므로, 내역 저장 실패가 최근 카테고리 저장보다 앞서 같은 저장 오류 처리로 전달됩니다.
- 검증: 삭제 헬퍼 RED 확인 후 GREEN, `npm run lint`, `npm run test`(13 files, 30 tests), `npm run build` 통과.
- 남은 일: Task 4에서 추천 칩의 반응형 시각 다듬기 및 데스크톱·모바일 브라우저 상호작용 검증.

## README 포트폴리오 정리 (2026-06-30)

- README를 문제→해결 구조로 재작성.
- 배포 링크(`https://monibuk.com/`), 프로젝트 목적, 결과 수치, 트러블슈팅 기록을 추가.
- 기술 스택 단순 나열을 제거하고 Next.js, React, Supabase, Chart.js, 외부 API를 어떻게 활용했는지 서술형으로 변경.
- 결과 수치는 코드에서 확인한 값 기준으로 작성:
  - 사용자 화면 11개
  - 서버 API 2개
  - Supabase 마이그레이션 7개
  - 종목 검색 최대 12개
  - 종목 마스터 12시간 캐시
  - 종가 6시간 캐시
  - 요청당 20개 종목, 5개 동시 조회, 사용자당 분당 30개 배치 요청 제한
- 검증: `npm run lint` 통과, `npm run build` 통과.
- 남은 일: README의 성과 수치에 실제 사용자/성능 지표가 생기면 교체 가능.
## 다크모드 (2026-06-24)

- 설계 문서: `docs/superpowers/specs/2026-06-24-dark-mode-design.md`
- 인트로(`/`, `/intro`) 제외 앱 전체 다크모드. 기본 라이트, `localStorage["mb-theme"]` 저장.
- 토글 버튼: `SideMenu`의 nav 리스트 문의하기 아래 (데스크톱/모바일 둘 다).
- 구현:
  - `src/app/color_tokens.scss`: `[data-theme="dark"]` 블록 추가 (핵심 토큰 손튜닝).
  - `src/components/common/ThemeProvider.tsx` (신규): context/토글/저장, 인트로 강제 light.
  - `src/app/layout.tsx`: `<head>` FOUC 방지 인라인 스크립트.
  - `src/app/providers.tsx`: ThemeProvider로 감쌈.
  - `src/components/common/SideMenu.tsx`: 토글 `<li>` 추가, `dark_mode`/`light_mode` 아이콘.
  - `src/components/common/AppIcon.tsx`: 두 아이콘 path 추가.
  - `src/components/common/side-menu.scss`: 모바일 하단 네비/헤더 글래스 다크 보정.
- 버그 수정: `.button--primary`가 다크에서 흰배경+흰글씨로 사라지던 문제 →
  `_button.scss`에 `[data-theme="dark"] .button--primary` 브랜드 블루 오버라이드.
- 하드코딩 색 전면 토큰화 (다크에서 안 바뀌던 레거시 컴포넌트):
  `_field.scss`, `_input.scss`, `expense-form.scss`, `expense-list.scss`,
  `calendar-view.scss`, `expense-pie-chart.scss`, `footer.scss`, `auth.scss`.
  (캘린더 선택일은 `var(--primary)`+흰 글씨로 통일)
- 검증: `npm run lint` 통과, `npm run build` 통과.
- 남은 일: 실기기/브라우저에서 라이트·다크 색감 미세조정 (팔레트는 손튜닝값이라 함께 확인 권장).

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

## 2026-06-16 Dashboard/Analysis Design Polish & Bug Fixes

- Applied consistent grid style to renewed cards:
  - `예정 반영 후 예상 잔액` grid: stacked label/value cells with 1px dividers
    via `gap: 1px + background: outline` trick, `surface-lowest` cell background
  - `이번 달 남은 예정` list: bordered container, row dividers, status-based row
    backgrounds (overdue = red-lower, paid/skipped = reduced opacity)
  - Monthly analysis yearly summary grid: same grid style applied
  - Mobile: grid items switch to horizontal label↔value layout in 1-column view
- Fixed memo metadata leak in `DashboardScheduleCard`:
  - `[[recurring-paused]]` and `[[savings:...]]` markers were rendered as item
    labels; fixed by applying `getVisibleMemo` in `dashboardSummary.ts`
- Fixed fixed-expense actual/scheduled classification bug:
  - Root cause: the actual-vs-scheduled renewal applied `status === "paid"` check
    to both `savings_payment` and `fixed_expense_payment` entries, but
    `fixed_expense_payment` entries have no payment-completion flow and are always
    `status: "scheduled"` in the DB
  - Result: all past fixed expense payments were treated as "scheduled", causing
    "완료되지 않은 예정 XXX원 별도" to appear on every past month analysis card
    and excluding fixed expenses from dashboard "현재 남은 돈" entirely
  - Fix in `analysis/page.tsx`: replaced `isRecurringPaymentEntry` (savings +
    fixed) with `isSavingsPaymentEntry` (savings only); fixed expense payments
    use date-based actual/scheduled classification
  - Fix in `HomeClient.tsx`: `storedFixedExpenseItems` status mapped as
    `payment_date <= todayKey ? "paid" : "scheduled"` instead of raw DB status
- Verified:
  - `npm run lint` passes
  - `npm run build` passes
- Merged `codex/dashboard-analysis-renewal` into `main`; branch deleted

## Notes For Future Work Sessions

- Update this file after each meaningful work step.
- Keep entries short:
  - what changed
  - what was verified
  - what remains
- Do not remove previous context unless it is clearly obsolete.
- Follow `AGENTS.md`: read relevant Next.js docs in `node_modules/next/dist/docs/`
  before writing Next.js code.
# 2026-06-18 QA follow-up fixes

- Investigated QA items reported from demo mode for production-shared code paths.
- Root causes found:
  - Dashboard/common calendar grid used fixed day counts, so 6-week months could be clipped.
  - Dashboard recurring forms nested checkbox labels inside field labels, producing invalid HTML and a likely hydration warning source.
  - Shared modal did not lock body scroll or compensate scrollbar width, causing background layout shifts.
  - Investment stock autocomplete allowed free typing after a stock was selected.
  - Investment holding account badges had tight vertical padding inside table rows.
- Changed:
  - Added shared dynamic month calendar day generation in `src/utils/calendar.ts`.
  - Reused it in dashboard and `CalendarView`.
  - Removed nested field labels around dashboard checkbox groups.
  - Locked/restored body overflow and scrollbar padding in `Modal`.
  - Made selected investment stock search read-only with a clear button.
  - Loosened investment holdings badge padding.
  - Clarified dashboard edit target copy as current-month direct-entry records.
- Verification:
  - `npm run lint`: passed.
  - `npm run build`: passed.
  - Browser QA on `http://localhost:3001`:
    - No hydration/runtime errors observed on `/`, `/app`, or `/app/invest`.
    - Existing unrelated Next image warnings remain for the logo dimensions/LCP.
    - Dashboard August 2026 calendar renders 42 cells and includes August 31.
    - Modal open locks body overflow and applies 15px scrollbar compensation, then restores both on close.
    - Dashboard form DOM has 0 nested labels and explicit labels for fields whose wrappers were changed.
    - Investment stock search becomes read-only after selecting `삼성전자 (005930)` and shows a clear button.
  - Screenshot capture through the in-app browser timed out at the CDP screenshot step; DOM/state checks were used instead.

# 2026-06-18 intro renewal pass 1

- Implemented the first-pass intro renewal from the reviewed design direction.
- Changed:
  - Replaced generic hero copy with the approved value proposition:
    `수입, 지출, 저축, 투자까지 한눈에 정리하는 나만의 가계부`.
  - Added a secondary hero anchor CTA to jump to 주요 기능.
  - Reworked the concerns section with sharper user problem copy.
  - Added a 3-card core value section:
    - 월별 흐름 파악
    - 반복 예정 관리
    - 자산 흐름 정리
  - Replaced the old 5-card feature list with a compressed product-showcase section:
    - 기록
    - 예정
    - 분석
  - Strengthened free/mobile copy and badges.
  - Changed the final CTA from a fixed bottom banner into a regular page-ending CTA.
  - Updated public header CTA copy from `로그인` to `무료로 시작하기`.
- Files changed:
  - `src/app/_intro/IntroPage.tsx`
  - `src/app/intro/intro.scss`
  - `src/components/common/PublicCta.tsx`
- Verification:
  - `npm run lint`: passed.
  - `npm run build`: passed.
  - Browser QA on `http://localhost:3001/`:
    - Desktop DOM check found the renewed hero, concerns, value, feature showcase, free/mobile, and final CTA sections.
    - `주요 기능 보기` anchor moves to `#intro-features`.
    - Mobile 390px check found no horizontal overflow, 4 concern cards, 3 value cards, and 3 feature cards.
    - Mobile screenshot verified the hero copy, CTA stack, and mockup image fit the first viewport.
    - Existing unrelated Next image warnings remain for logo dimensions/LCP.

# 2026-06-18 intro renewal pass 2

- Polished the approved first-pass intro renewal without changing the section order.
- Changed:
  - Added code-native monthly summary cards over the feature showcase screenshot:
    - 이번 달 남은 돈
    - 예정 반영 후
    - 투자 원금
  - Kept the summary cards as a desktop overlay and stacked them under the
    screenshot on mobile.
  - Updated the public header logo image for Next 16 image behavior with
    ratio-preserving style and responsive CSS-variable height.
  - Set both reused intro screenshot images to eager loading so the duplicated
    LCP image no longer produces a dev console warning.
- Files changed:
  - `src/app/_intro/IntroPage.tsx`
  - `src/app/intro/intro.scss`
  - `src/components/common/Header.tsx`
  - `src/components/common/header.scss`
- Verification:
  - `npm run lint`: passed.
  - `npm run build`: passed.
  - Browser plugin desktop DOM check on `http://localhost:3001/`:
    - logo renders at 178x40 with no Next warning portal
    - feature summary cards render as an overlay
    - no horizontal overflow
  - Chrome checks at `1280x900` and `390x1000`:
    - no hydration, image aspect-ratio, or LCP warnings in console
    - no horizontal overflow
    - mobile feature summary cards render as stacked static cards

# 2026-06-18 intro footer polish

- Reworked `.intro-banner` from a standalone primary-color CTA band into a
  quieter footer-style closing section.
- Changed the footer background to the existing low surface color with a subtle
  top border so it matches the intro page rhythm.
- Changed the footer CTA to the existing primary button style for a clearer
  final action.
- Verified:
  - `npm run lint`: passed.
  - `npm run build`: passed.
  - Chrome checks at `1280x900` and `390x900` show no horizontal overflow or
    console warnings.

# 2026-06-18 intro footer Lottie

- User approved trying `diffusionstudio/lottie` in the intro footer.
- Installed the `diffusionstudio/lottie` text-to-lottie skill into:
  - `C:\Users\박현규\.codex\skills\text-to-lottie`
- Created a small footer animation:
  - cards represent money flow being organized
  - moving dot connects the flow
  - final blue check confirms completion
- Added app asset:
  - `public/animations/intro-footer-flow.json`
- Added app renderer:
  - `src/app/_intro/IntroFooterLottie.tsx`
- Inserted the animation into `.intro-banner` between the copy and CTA.
- Added local dotLottie WASM asset to avoid CDN runtime failures:
  - `public/dotlottie-player.wasm`
- Set the WASM URL globally in `src/app/providers.tsx`, which also stabilizes
  existing `DotLottieReact` usages.
- Verified:
  - Lottie JSON parses successfully with Node.
  - Official diffusionstudio player at `http://127.0.0.1:3030/money-book-footer/scene-1`
    renders frames 0, 48, and 95 with no player warnings.
  - App footer renders the Lottie canvas on desktop and mobile.
  - Chrome checks show no dotLottie WASM/CDN failures after local WASM setup.
  - `npm run lint`: passed.
  - `npm run build`: passed.
- Note:
  - Codex may need a restart before the newly installed `text-to-lottie` skill
    appears in the automatic skill list, but it was read directly for this work.

# 2026-06-29 intro design HTML transfer

- Started the screen-by-screen transfer from the provided design HTML.
- Scope for this pass is intro/landing only.
- Changed:
  - Copied only design SVG assets into `src/assets/img/renewal`.
  - Did not copy `support.js` or `image-slot.js` into the app runtime.
  - Replaced the intro page structure with the design HTML section order:
    header, hero, problem cards, solution cards, feature section, two access cards, final CTA, footer.
  - Converted repeated design markup into React arrays and `map` rendering.
  - Added `IntroCta` for signup/app/demo actions while keeping the page body server-rendered.
  - Replaced the old public intro header with the new in-page header to avoid duplicate chrome.
  - Rewrote `intro.scss` with transferred spacing, typography, radius, button, card, grid, shadow, and color values from the design HTML.
  - Used `머니북가계부` for the visible service name and checked the touched intro code/assets for banned source-brand traces.
- Verification so far:
  - `npm run lint`: passed.
- Remaining:
  - Run `npm run build`.
  - Verify desktop and mobile renderings.

# 2026-06-29 intro design HTML transfer verification

- Completed verification for the intro-only design HTML transfer.
- Verification:
  - `npm run lint`: passed.
  - `npm run build`: passed.
  - Chrome headless screenshots captured:
    - `C:\tmp\money-book-intro-desktop.png` at 1280x900.
    - `C:\tmp\money-book-intro-mobile.png` at 390x1000.
  - CDP layout checks at 1280x900 and 390x1000:
    - Section order is header, hero, concerns, values, features, access, final CTA, footer.
    - Rendered card counts match the design transfer: 4 concern cards, 3 value cards, 3 feature items, 2 access cards.
    - Visible brand is `머니북가계부`.
    - Hero title is `수입, 지출, 저축, 투자까지 한눈에 정리해요` with design line breaks.
    - CTA buttons render at 56px height on desktop and mobile.
    - No horizontal overflow on desktop or mobile.
    - Final CTA background resolves to `rgb(49, 130, 246)` from the design brand color.
- Note:
  - The in-app browser and image viewer tools failed with the current sandbox helper error, so visual QA used Chrome headless screenshots plus CDP layout metrics.
- Remaining:
  - None for the intro-only implementation pass.

# 2026-06-29 intro fixed header polish

- Adjusted the transferred intro header per follow-up feedback.
- Changed:
  - Made `.intro-header` fixed at the top with translucent chrome, blur, and bottom border.
  - Added `.intro-page` top padding to match the fixed header height.
  - Standardized the header `로그인` and `시작하기` buttons to the same 40px height on desktop and mobile.
- Verification:
  - `npm run lint`: passed.
  - `npm run build`: passed.
  - Chrome headless CDP checks at 1280x900 and 390x1000:
    - header `position` is `fixed`.
    - header top remains `0` after scrolling.
    - header height is `77px` and page padding-top is `77px`.
    - `로그인` button height is `40px`.
    - `시작하기` button height is `40px`.
    - no horizontal overflow.

# 2026-06-29 auth design HTML transfer

- Transferred the provided design HTML structure to `/auth/login` and `/auth/signup`.
- Changed:
  - Copied only the auth illustration SVG assets into `src/assets/img/renewal`:
    - `safe.svg`
    - `rocket.svg`
  - Did not copy `support.js` or `image-slot.js` into the app runtime.
  - Rebuilt login as the design's two-panel layout while preserving Supabase login, remember-login, demo mode, and redirect logic.
  - Rebuilt signup as the design's two-panel layout while preserving Supabase signup, callback URL, validation, and redirect logic.
  - Rewrote `auth.scss` with transferred values for panel width, form width, gradient side panel, brand marks, typography, input heights, button heights, radii, colors, and mobile collapse.
  - Kept minimal legacy auth styles for callback/status surfaces that still use `signup-stage`, `signup-wrap`, and `signup-card`.
  - Used `머니북가계부` for visible service naming and checked the touched auth code/assets for banned source-brand traces.
- Verification:
  - banned source-brand search in touched auth files/assets: no matches.
  - `npm run lint`: passed.
  - `npm run build`: passed.
  - Chrome headless CDP checks at 1280x900 and 390x1000:
    - `/auth/login`: title `로그인`, brand `머니북가계부`, desktop side panel visible, mobile side panel hidden.
    - `/auth/signup`: title `회원가입`, brand `머니북가계부`, desktop side panel visible, mobile side panel hidden.
    - desktop panel width: 480px; form width: 380px.
    - login inputs: 52px; login/demo buttons: 56px.
    - signup inputs: 50px; signup button: 56px.
    - no horizontal overflow on desktop or mobile.

# 2026-06-29 auth project2 design transfer

- Updated `/auth/login` and `/auth/signup` to the revised auth design from the second provided design package.
- Changed:
  - Rebuilt both auth pages into a single centered card shell with a gradient side panel and a white form panel.
  - Kept Supabase login/signup behavior, remember-login behavior, demo login behavior, callback URL handling, validation, and redirects intact.
  - Updated the auth Sass values to match the revised design card shell:
    - page background `#e9ecef`
    - shell max-width `1080px`
    - shell min-height `600px`
    - shell radius `28px`
    - shell shadow `0 30px 70px rgba(20, 40, 80, 0.16)`
    - desktop panel direction `row`
    - mobile panel direction `column`
    - login input height `52px`
    - signup input height `50px`
    - primary/auth action button height `56px`
  - Kept the visible service name as `머니북가계부`.
  - Did not copy `support.js` or `image-slot.js` into the app runtime.
- Verification:
  - source-brand search in touched auth files/assets: no matches.
  - `npm run lint`: passed.
  - `npm run build`: passed.
  - Chrome headless CDP checks at 1280x900 and 390x1000:
    - `/auth/login`: title `로그인`, subtitle `머니북 계정으로 로그인해요`, brand `머니북가계부`.
    - `/auth/signup`: title `회원가입`, subtitle `무료로 머니북을 시작해요`, brand `머니북가계부`.
    - desktop card width is `1080px`, radius is `28px`, shell padding is `40px`, and direction is `row`.
    - mobile card width is `390px`, radius is `0px`, shell padding is `0px`, and direction is `column`.
    - desktop and mobile side panels are visible for both pages.
    - login inputs are `52px`; login action buttons are `56px`.
    - signup inputs are `50px`; signup action button is `56px`.
    - no horizontal overflow on desktop or mobile.

# 2026-06-30 dashboard design HTML transfer

- Transferred the revised dashboard screen structure to `/app`.
- Changed:
  - Reordered the dashboard surface to match the agreed screen order: hero, summary stats, expected balance, schedule/category grid, calendar/quick record grid, savings/fixed expense grid, recent entries.
  - Rebuilt `DashboardSummaryCards` into the design stat grid and full expected-balance card while keeping existing dashboard summary data.
  - Rebuilt `DashboardScheduleCard` into the design card/list shape while keeping existing schedule summary data.
  - Converted the old detail table into a recent entries full card using the existing monthly entry list.
  - Kept calendar, quick record, savings, fixed expense, and recurring management behavior intact while restyling their containers and controls.
  - Added dashboard tokens and transferred style values in `src/app/page.scss`: 36px desktop app padding, 20px mobile app padding, 18px card radius, 14px stat gap, 16px section grid gap, 44px header action height, 48px form control height, and 52px submit height.
- Verification:
  - source-brand search in touched dashboard files: no matches.
  - `npm run lint`: passed.
  - `npm run build`: passed.
  - Chrome CDP checks on the existing 3000 dev server with demo mode enabled:
    - desktop 1280x900: schedule/category, calendar/quick record, and savings/fixed expense grids render as two columns.
    - mobile 390x1000: the same grids collapse to one column.
    - section order matches the requested dashboard order.
    - card radius is `18px`, main padding is `36px` desktop and `20px 20px 104px` mobile.
    - add button height is `44px`, input height is `48px`, submit height is `52px`.
    - no horizontal overflow on desktop or mobile.

# 2026-06-30 dashboard transfer reverted by user

- User reverted the dashboard implementation files after the dashboard transfer pass.
- Confirmed current state:
  - `src/app/_home/HomeClient.tsx`: no diff.
  - `src/app/_home/DashboardSummaryCards.tsx`: no diff.
  - `src/app/_home/DashboardScheduleCard.tsx`: no diff.
  - `src/app/page.scss`: no diff.
- Result:
  - Dashboard transfer changes are no longer present in the working tree.
  - Remaining modified files are from the intro/auth transfer work and this handoff log.
- Remaining:
  - Re-plan the dashboard transfer before re-implementation if the work resumes.

# 2026-07-14 Release C 계획 검토

- 운영 안정화 3차 범위를 계획으로 확정했습니다: 복구 가능한 App Router 오류 화면, 주식 API 오류 정규화·입력 길이 제한, 기본 보안 헤더, 문의 목록 20건 단위 더 보기입니다.
- Next.js 16 공식 `error.md`, `headers.md`, `route-handlers.md`를 확인했습니다.
- Next.js 16의 재시도 API는 `reset`이 아닌 `unstable_retry`임을 반영했습니다.
- HSTS와 CSP 강제, 분산 환경 검색 API rate limit, DB 스키마 변경은 추가 운영 호환성 검토가 필요해 이번 범위에서 제외했습니다.
- 운영 데이터·Supabase 원격·마이그레이션·배포는 수행하지 않았습니다.
- 남은 작업:
  - `dev` 브랜치에서 구현과 테스트를 수행하고, 전체 검증 뒤 `main`에 fast-forward 병합합니다.

# 2026-07-14 Release C 운영 안정화

- 변경:
  - `error.tsx`와 `global-error.tsx`에 한국어 오류 복구 화면 및 `unstable_retry` 재시도 동작을 추가했습니다.
  - 주식 검색은 80자 초과 입력을 거절하고, 검색·종가 API의 예기치 않은 오류를 고정된 한국어 메시지로 응답하도록 변경했습니다.
  - 전 경로에 `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`를 추가했습니다. CSP와 HSTS는 호환성 검토 후속 작업입니다.
  - 문의 목록은 생성일 내림차순의 기존 읽기 쿼리에 20건 look-ahead `range()`를 적용했고, 더 보기 버튼으로 다음 페이지를 이어서 표시합니다.
- 검증:
  - `npm run lint`: 통과.
  - `npm run test`: 8개 파일, 17개 테스트 통과.
  - `npm run build`: Next.js 16.2.10 프로덕션 빌드 통과.
  - `npm run test:e2e`: 데스크톱·모바일 Chromium 6개 통과.
  - `npm audit --audit-level=high`: high 취약점 없음. moderate 4개·low 1개는 남아 있으며, 강제 수정은 Next 다운그레이드를 제안해 적용하지 않았습니다.
- 운영 데이터·Supabase 원격·마이그레이션·배포는 수행하지 않았습니다.

# 2026-07-14 문의 커서 페이지네이션 계획

- offset 기반 더 보기의 새 문의 이후 경계 이동 가능성을 확인했습니다.
- `created_at`과 `id`를 함께 사용하는 복합 커서 설계와 TDD 구현 계획을 추가했습니다.
- 구현은 새 `dev` worktree에서 수행하며, 기존 문의·금융 데이터·Supabase 스키마를 변경하지 않습니다.

# 2026-07-14 문의 복합 커서 페이지네이션

- `getInquiries`를 offset에서 `created_at DESC, id DESC` 복합 커서 조회로 전환했습니다.
- 다음 요청은 마지막 표시 문의의 생성 시각과 ID를 사용하므로, 새 문의가 추가돼도 기존 페이지 경계가 이동하지 않습니다.
- 문의 페이지는 숫자 페이지 대신 `nextCursor`를 보관해 더 보기 요청에 전달합니다.
- 검증:
  - `npm run lint`: 통과.
  - `npm run test`: 8개 파일, 18개 테스트 통과.
  - `npm run build`: Next.js 16.2.10 빌드 통과.

# 2026-07-14 CSP Report-Only

- 전 경로에 현재 리소스 출처를 선언한 `Content-Security-Policy-Report-Only` 헤더를 추가했습니다. 차단 CSP·HSTS·보고 저장 API는 추가하지 않았습니다.
- 검증: `npm run lint`, `npm run test`(9개 파일 19개), `npm run build`, `npm run test:e2e`(6개) 통과.
- `npm audit --audit-level=high`에서 high 취약점은 없고 moderate 4개·low 1개가 남았습니다. 강제 수정은 Next 다운그레이드를 제안해 적용하지 않았습니다.
- 운영 데이터·Supabase 원격·마이그레이션·배포는 수행하지 않았습니다.

# 2026-07-14 CSP 보고 자동 수집 준비

- 로컬 마이그레이션으로 `csp_reports` 테이블, RLS, 30일 초과 보고 삭제 함수를 추가했습니다. 원격 DB에는 실행하지 않았습니다.
- `/api/csp-reports`는 보고 URL의 query·fragment를 제거하고, 허용 필드와 16KiB 본문 제한을 적용한 뒤 서버 전용 서비스 역할 클라이언트로만 저장합니다.
- Report-Only CSP에 `report-uri`, `report-to`와 `Reporting-Endpoints`를 연결했습니다.
- 검증:
  - `npm run lint`: 통과.
  - `npm run test`: 10개 파일, 20개 테스트 통과.
  - `npm run build`: 통과.

# 2026-07-14 CSP 최신 보고 형식 호환

- Reporting API의 `application/reports+json` 배열 형식도 수집하며, Report-Only의 `reporting` 상태값은 기존 스키마 값인 `report`로 저장합니다.
- 구형 `report-uri` 형식은 유지하고, 최신 형식도 URL query·fragment 제거 규칙을 동일하게 적용합니다.
- 원격 데이터·마이그레이션·배포는 수행하지 않았습니다.
- 검증:
  - `npm run lint`: 통과.
  - `npm test`: 10개 파일, 21개 테스트 통과.
  - `npm run build`: 통과. dev worktree에 원본의 비추적 `.env.local`을 복사한 뒤 원본과 같은 환경으로 확인했습니다.

# 2026-07-14 CSP 보고 30일 보관 자동 정리

- `pg_cron`이 활성화된 Supabase에서 매일 UTC 03:15에 `delete_expired_csp_reports()`를 호출하는 로컬 마이그레이션을 추가했습니다.
- 원격 Supabase에 마이그레이션을 적용했고, 로컬·원격 버전 `20260714000001` 일치를 확인했습니다.

# 2026-07-14 미사용 visual_bg preload 제거

- 홈 화면에서 실제 렌더링 없이 `visual_bg.png`를 강제 preload하던 컴포넌트와 이미지 자산을 제거했습니다.
- 이미지의 남은 코드 참조가 없음을 확인했습니다.
- 검증:
  - `npm run lint`: 통과.
  - `npm test`: 10개 파일, 21개 테스트 통과.
  - `npm run build`: 통과.

# 2026-07-20 최근 직접입력 카테고리 데이터 모델과 API

- `user_custom_categories` 로컬 Supabase 마이그레이션을 추가했습니다. 사용자·유형·정규화 이름의 유니크 제약, 최근 사용 인덱스, 그리고 select/insert/update/delete RLS 정책을 포함합니다.
- `src/lib/api/customCategories.ts`에 최근 20개 조회, 공백 제거·영문 로케일 소문자 정규화 upsert, 사용자 소유 삭제 API를 추가했습니다.
- 검증: 집중 테스트 4개, 전체 Vitest 25개, `npm run lint`, `npm run build` 통과.
- 원격 Supabase 마이그레이션 및 배포는 실행하지 않았습니다.
# 2026-07-20 데모 직접입력 카테고리 저장

- `mb-demo-custom-categories:v1` 로컬 저장소에 데모 직접입력 카테고리를 안전하게 복원·저장하도록 했고, 데모 재설정 시 함께 제거합니다.
- 화면 독립 유틸리티는 유형별 최신 5개 목록과 정규화 이름 기준 불변 upsert를 제공합니다.
- 검증: `npm run lint`, `npm run test`(13개 파일, 29개 테스트), `npm run build` 통과.

# 2026-07-20 데모 직접입력 카테고리 저장 검증 보강

- 데모 직접입력 카테고리 복원 시 공백 ID와 파싱 불가한 타임스탬프를 유효하지 않은 레코드로 필터링합니다.
- 검증: 집중 `npm run test -- src/lib/demo.test.ts`(2개), 전체 `npm run test`(13개 파일, 29개 테스트) 통과.

# 2026-07-20 최근 직접입력 카테고리 반응형 제어 스타일

- `src/app/page.scss`에 최근 직접입력 카테고리 목록과 칩의 범위 한정 스타일을 추가했습니다. 목록은 줄바꿈되며, 긴 이름은 선택 버튼 안에서 말줄임 처리됩니다.
- 선택·삭제 버튼은 프로젝트 색상 토큰과 `:focus-visible` 포커스 링을 사용합니다. 모바일(760px 이하)에서는 삭제 버튼이 최소 44px 터치 영역을 유지합니다.
- 변경된 파일: `src/app/page.scss`, `HANDOFF.md`.
- 검증:
  - `npm run test -- src/lib/api/customCategories.test.ts src/app/_home/customCategories.test.ts`: 2개 파일, 7개 테스트 통과.
  - `npm run lint`: 통과.
  - `npm run test`: 13개 파일, 30개 테스트 통과.
  - `npm run build`: Next.js 16.2.10 프로덕션 빌드 통과.
  - `npm run test:e2e`: 데스크톱·모바일 Chromium 6개 통과. 로고 이미지 aspect-ratio 경고는 기존 경고입니다.
- 렌더링 UI 검증:
  - 인앱 Browser Node 런타임이 `windows sandbox failed: helper_unknown_error: setup refresh had errors`로 두 번 실패해 Playwright 대체 검증을 사용했습니다.
  - 프로덕션 로컬 URL `http://127.0.0.1:3002/app`에서 1440x1000 및 390x844 뷰포트를 확인했습니다.
  - 직접입력 카테고리가 저장·렌더링되고, 칩 선택 시 입력란에 이름이 채워지며, 추천 삭제 후에도 입력 텍스트와 기존 지출 내역이 유지됨을 확인했습니다.
  - 페이지 가로 넘침이 없었고, 삭제 버튼은 데스크톱 32x32px·모바일 44x44px 터치 영역을 유지했습니다.
  - 로컬 환경에서만 Vercel Analytics/Speed Insights 스크립트의 404/MIME 콘솔 오류가 관찰됐으며, 기능 런타임 오류는 없었습니다. 스크린샷은 작업 시각화 폴더에 저장했습니다.
- 원격 Supabase 마이그레이션 및 배포는 여전히 수행되지 않았습니다.

# 2026-07-20 최근 직접입력 카테고리 최종 리뷰 수정

- `public.expenses.entry_type` nullable 컬럼과 4개 subtype check를 추가하는 로컬 마이그레이션을 만들었습니다. 신규 직접입력 지출·수입·저축·투자와 데모 내역은 subtype을 명시적으로 저장하며, 기존 null 행은 종전 category/memo 추론을 유지합니다.
- 홈 분류와 월별 분석 매핑은 durable `entry_type`을 우선하고, 추천 카테고리 삭제는 입력값·기존 내역·저장된 subtype을 변경하지 않습니다.
- 최근 직접입력 카테고리는 4개 유형별 `limit(5)` 쿼리를 병렬 실행해 한 유형이 다른 유형을 밀어내지 않습니다. 조회 실패는 빈 추천 목록으로만 격리되고 dashboard expenses/accounts/rules/payments는 유지됩니다.
- 직접입력 필드는 `htmlFor`/`id`를 사용하며, 최근 추천 컨트롤에는 이름이 있는 `role="group"`을 제공합니다.
- 아직 원격에 적용하지 않은 최초 custom-category 마이그레이션에 trim/lower 정규화와 서버 `now()` 갱신 trigger를 추가해 direct PostgREST 쓰기도 동일한 유니크/정렬 규칙을 따릅니다.
- 회귀 검증은 API 유형별 5개·DB 오류 전파, durable create payload·reload 분류·analysis bucket, dashboard 실패 격리, demo storage, 추천 삭제 보존을 포함합니다.
- 검증:
  - 최초 RED: 집중 6개 파일 중 5개 파일, 9개 테스트가 누락 동작으로 실패.
  - 집중 GREEN: 6개 파일, 20개 테스트 통과. self-review precedence 회귀 2개도 RED 확인 후 GREEN.
  - `npm run lint`: 통과.
  - `npm run test`: 16개 파일, 42개 테스트 통과.
  - `npm run build`: Next.js 16.2.10 프로덕션 빌드 통과.
  - Playwright 신규 demo 회귀: desktop/mobile Chromium 2개 통과. 기존 demo-login smoke desktop 1개도 통과.
- 원격 Supabase 마이그레이션과 배포는 수행하지 않았습니다. 배포 시 `20260720000000_create_user_custom_categories.sql`, `20260720010000_add_expense_entry_type.sql`을 애플리케이션보다 먼저 적용해야 합니다.

# 2026-07-21 durable subtype 요약·분석 후속 수정

- dashboard 월 요약·예정 항목 분류가 non-null `entry_type`을 우선해 임의 이름의 직접입력 저축·투자를 각각 저축·투자로 집계합니다. subtype이 null/undefined인 기존 행만 category 문자열 fallback을 사용합니다.
- demo 분석 화면의 Expense 변환을 `entryMapping.ts` 순수 함수로 분리했습니다. durable savings/investment/expense/income을 우선하고 null legacy 행의 저축·주식 category 추론은 유지합니다.
- TDD RED: dashboard durable 임의 이름이 일반 지출로 잘못 집계됐고, analysis pure mapper가 없어 focused 2개 파일이 실패했습니다.
- 검증:
  - 집중 테스트: 2개 파일, 9개 테스트 통과.
  - `npm run lint`: 통과.
  - `npm run test`: 17개 파일, 49개 테스트 통과.
  - `npm run build`: Next.js 16.2.10 프로덕션 빌드 통과.
- 입력 UI나 저장 흐름은 변경하지 않아 Playwright E2E 재실행 대상은 아니며, 변경된 두 분류 경계는 순수 함수 테스트로 직접 검증했습니다.
- 원격 Supabase 마이그레이션과 배포는 여전히 수행하지 않았습니다.

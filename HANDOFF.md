# 2026-09-03 로그인 세션 쿠키 회귀 수정

- 원인: `422429d`가 Supabase SSR 브라우저 클라이언트의 기본 쿠키 저장소를 `localStorage`/`sessionStorage` 전용 저장소로 덮어썼습니다. 그 결과 비밀번호 로그인 직후 `/app` 프록시가 세션 쿠키를 받지 못해 `/auth/login`으로 되돌렸습니다.
- 수정: `src/lib/supabase/client.ts`에서 해당 저장소 재정의를 제거해 Supabase SSR의 기본 쿠키 기반 세션 동기화를 복구했습니다.
- 회귀 테스트: `src/lib/supabase/client.test.ts`가 서버 보호 경로를 위한 기본 쿠키 저장소를 유지하는지 확인합니다. 수정 전 실패, 수정 후 `npm test -- src/lib/supabase/client.test.ts` 통과.
- 검증: `npm test -- src/lib/supabase/client.test.ts`, `npm run lint`, `npm run build` 통과. `git diff --check` 통과.

# 2026-08-26 사용자 카테고리 관리 — 현재 상태와 복구 원칙

- 작업 브랜치: `codex/custom-category-management`.
- 설계·계획 기준: `docs/superpowers/specs/2026-08-25-custom-category-management-design.md`, `docs/superpowers/plans/2026-08-25-custom-category-management.md`.
- `cc4065f`(다른 브랜치에 잘못 쌓였던 미완성 구현)를 병합했습니다. 병합 커밋은 `d007926`이며, 원본 `codex/bulk-transaction-delete`는 보존합니다.
- 병합 코드는 완료 기능이 아닙니다. API/migration·데모 v2·초안 훅·초안 CategoryManager·마이페이지 카드·홈 즐겨찾기 정렬/버튼이 있으나, 공유 규칙, 훅 계약/테스트, CRUD 검증/수정/삭제 확인, 접근성 모달, 홈 관리 모달 연동, 전체 검증은 미완성입니다.
- 검증: `npm run build` 통과. API·데모·홈 헬퍼 테스트는 통과했으나, 마이페이지 테스트는 훅 mock 누락으로 Supabase 초기화 오류가 발생합니다. 전체 테스트·시각 검증은 미완료입니다.
- 이후 원칙: 계획 Task 1부터 테스트·구현·검증·커밋 단위로 재검토하며, 미완성 코드를 완료로 보고하지 않습니다. 수정·삭제해도 기존 거래의 문자열 카테고리는 바꾸지 않습니다.
- 운영 DB에는 migration을 적용하지 않았습니다. 완료·검토 전 적용하지 않습니다.

# 2026-08-25 거래 다중 선택·일괄 삭제

- 상세내용 표에서 직접 입력한 지출·수입·저축·투자를 개별 또는 전체 선택해 한 번에 삭제할 수 있습니다.
- 정기 적금·고정지출 납입과 일시정지 항목은 선택할 수 없으며, 데모와 로그인 사용자 모두 기존 다중 삭제 API를 사용합니다.
- 코드 리뷰 후 표 전용 체크박스 라벨을 44×44px으로 보완해 모바일 터치 영역을 확보했습니다.
- 선택 건수·합계와 확인창을 추가했고, 모바일에서는 작업 바가 하단 내비게이션 위에 표시됩니다.
- 프로덕션 DB/데이터 변경: 없음.
- 검증: `npm test` 36 files, 146 tests 통과; `npm run lint` 통과; `npm run build` 통과.
- 브라우저 실측: Browser 연결이 작업공간 `helper_unknown_error`로 초기화되지 않아 1280px/390px 실제 렌더링 검증은 다음 작업에서 재시도해야 합니다.

# 2026-08-11 마이페이지 레이아웃 개선

- 데스크톱(1040px 초과)에서 카드를 2열로 배치했습니다. 왼쪽은 내 정보와 약관 동의 현황, 오른쪽은 비밀번호 변경입니다. DOM 순서를 내 정보 → 비밀번호 변경 → 약관 동의로 두어, 1열로 떨어질 때 모바일 순서가 자연스럽게 유지되도록 했습니다.
- 회원 탈퇴를 카드에서 빼고 화면 맨 아래 구분선 밑의 작은 텍스트 버튼으로 내렸습니다. 비밀번호 변경과 같은 시각적 무게를 갖는 것이 어색했습니다. 펼친 뒤의 확인 절차와 삭제 동작은 그대로입니다.
- 프로덕션 DB/데이터 변경: 없음.
- 검증:
  - `npm run lint`: 통과
  - `npm run test`: 통과 (34 files, 140 tests)
  - `npm run build`: 통과
  - 브라우저 실측은 하지 못했습니다. 데모 모드에서는 마이페이지 카드가 렌더되지 않고, 실제 로그인 계정이 필요한데 이 환경에는 그런 계정/자격 증명을 안전하게 쓸 방법이 없었습니다(자격 증명 입력은 정책상 금지). 1280px/1040px/375px 레이아웃과 탈퇴 토글의 실제 동작은 다음 작업자가 실 계정으로 확인해야 합니다.

# 2026-08-10 마이페이지

- `/app/mypage`를 추가하고 사이드 메뉴에 연결했습니다. 내 정보(이름 수정), 비밀번호 변경, 약관 동의 현황, 회원 탈퇴 네 카드로 구성했습니다.
- `expenses.user_id`에 `on delete cascade` 외래키를 추가하는 마이그레이션을 넣었습니다. 제약이 없어 계정을 삭제해도 가계부 기록이 주인 없이 남는 상태였습니다.
- 계정 삭제는 `POST /api/account/delete`에서 처리하며, 삭제 대상은 서버가 세션에서 확인한 사용자로 한정합니다. 요청 본문은 읽지 않습니다.
- 비밀번호 변경과 탈퇴 모두 `signInWithPassword` 재인증을 거칩니다. Supabase에 현재 비밀번호만 검증하는 API가 없기 때문입니다.
- 이메일 변경은 넣지 않았습니다. 가입 이메일 인증이 꺼져 있어 오타 시 재설정 경로까지 잃습니다.
- 프로덕션 DB/데이터 변경: `expenses` 외래키 추가 마이그레이션이 있습니다. **코드보다 먼저 적용해야 합니다.**
- 검증:
  - `npm run lint`: 통과
  - `npm run test`: 통과 (34 files, 136 tests)
  - `npm run build`: 통과, `/app/mypage` 라우트 확인
  - 데스크톱 1280px, 모바일 375px 확인 완료 (임시로 데모 게이트를 우회해 카드 네 개와 회원 탈퇴 카드의 접힘/펼침 상태를 모두 확인한 뒤 원복)
- 남은 작업: 마이그레이션을 운영 DB에 적용해야 합니다. 이 환경에는 Docker와 psql이 없어 로컬 실행 검증을 하지 못했습니다.

# 2026-08-06 비밀번호 재설정

- `/auth/forgot-password`, `/auth/reset-password` 두 화면을 추가하고 로그인 화면에서 연결했습니다.
- `src/lib/auth/password.ts`로 비밀번호 규칙(8자 이상, 영문·숫자 포함, 72바이트 이하)을 분리해 회원가입과 재설정이 공유합니다.
- 회원가입 화면의 `alert` 검증을 인라인 오류로 교체했습니다. 오류 문구는 어느 필드가 문제인지 구체적으로 짚어줍니다.
- `/auth/reset-password`는 링크가 해시, `?code=`, 또는 이미 Supabase SDK가 소비한 세션 등 여러 형태로 도착할 수 있어, 링크 유효성을 오직 사후 `getSession()` 확인 결과로만 판단합니다(교환/소비 호출 자체의 성공 여부로는 판단하지 않음).
- 비밀번호 변경 성공 후 `signOut({ scope: "others" })`로 다른 기기 세션을 끊습니다. 이 세션 해제가 실패해도 사용자에게는 비밀번호 변경이 성공했다고 안내하며, 다른 기기는 여전히 로그인 상태일 수 있다는 안내를 덧붙입니다.
- 로그인 화면의 "비밀번호 찾기" 자리를 `/auth/forgot-password` 링크로 채우고, 이메일 필드 아래에 "가입하신 이메일이 아이디입니다." 안내를 추가했습니다.
- 아이디 찾기는 만들지 않았습니다. 근거는 `docs/superpowers/specs/2026-08-06-password-reset-design.md`에 기록했습니다.
- 프로덕션 DB/데이터 변경: 없음.
- 남은 작업(수동):
  - Supabase 대시보드 Auth 비밀번호 정책을 최소 8자, 영문+숫자 필수로 맞춰야 화면과 서버 규칙이 일치합니다.
  - Supabase 대시보드 Authentication > URL Configuration의 Redirect URLs에 `/auth/reset-password`가 허용되어 있는지 확인해야 합니다.
- 검증:
  - `npm run lint`: 통과
  - `npm run test`: 통과
  - `npm run build`: 통과
  - 데스크톱 1280px, 모바일 375px 확인 완료

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

# 2026-07-21 최근 직접입력 카테고리 원격 마이그레이션 적용

- 테스트 중 `Could not find the 'entry_type' column of 'expenses' in the schema cache` 오류를 재현·조사했습니다.
- `npx supabase migration list`에서 로컬 `20260720000000`, `20260720010000`이 원격에는 미적용임을 확인해 원인을 확정했습니다.
- `npx supabase db push --dry-run`으로 두 additive 마이그레이션만 대상임을 확인한 뒤 연결된 원격 Supabase에 적용했습니다.
- 적용 내용: 사용자별 최근 직접입력 카테고리 테이블·RLS·정규화 trigger, `public.expenses.entry_type` nullable 컬럼·4개 subtype check.
- 검증:
  - 로컬·원격 마이그레이션 버전이 `20260720000000`, `20260720010000`까지 일치합니다.
  - Supabase REST 익명 읽기 쿼리에서 `expenses.entry_type`과 `user_custom_categories` 모두 schema-cache 오류 없이 응답했습니다.
- 애플리케이션 배포는 수행하지 않았습니다.

# 2026-07-27 Open Graph 대표 이미지 검증

- `src/app/opengraph-image.png` 응답은 로컬 개발 서버에서 HTTP 200, `Content-Type: image/png`, 275,084바이트로 확인했습니다.
- Supabase 환경 변수가 없는 초기 확인에서는 홈페이지 `/`가 HTTP 500이었고, 스택은 `src/lib/supabase/client.ts`의 URL/API key 부재를 가리켰습니다. Open Graph 변경 커밋은 `layout.tsx` metadata와 정적 이미지/alt 파일만 변경했으며, 해당 Supabase 초기화·홈페이지 컴포넌트·환경 파일은 변경하지 않았습니다. 검증용 `.env.local` 제공 후 `/`는 HTTP 200이었습니다.
- 렌더링된 홈페이지 HTML에서 `og:image`와 `twitter:image`가 Open Graph 이미지(1200×630, PNG)를 가리키고, `twitter:card`는 `summary_large_image`임을 확인했습니다.
- 검증:
  - `npm run lint`: 통과.
  - `npm run build`: 통과. 정적 라우트 목록에 `/`와 `/opengraph-image.png`가 포함됩니다.
  - `npm run test`: 19개 파일, 51개 테스트 통과.
  - `npm run test:e2e`: desktop/mobile Chromium 8개 테스트 통과.
- E2E 실행 전 수동으로 시작한 포트 3001 개발 서버를 종료했습니다. Playwright 설정의 포트 3100에는 충돌하는 수동 서버가 없었습니다.

# 2026-08-04 개인정보 동의 설계 — 기존 가입자 재동의

- 개인정보 설계 문서에 기존 가입자의 로그인 재동의 정책을 추가했습니다.
- 프로필의 현재 동의 요약값과 append-only `user_legal_consents` 이력, `record_current_legal_consent()` RPC를 설계했습니다.
- 기존 27명은 새 동의 열이 NULL이므로 다음 로그인에서 `/auth/consent`로 이동하고, 필수 동의 전 `/app` 접근이 차단됩니다.
- 검증: 설계 문서의 자체 검토와 `git diff --check`를 수행했습니다. 코드·DB 마이그레이션은 아직 변경하지 않았습니다.
- 남은 작업: 사용자 검토 후 구현 계획을 갱신하고, 마이그레이션·인증 가드·재동의 화면을 구현합니다.

# 2026-08-04 개인정보 동의 구현 계획

- 기존 가입자 재동의 설계를 구현 가능한 6개 작업(버전 모델, DB 이력/RPC, 가입 동의, 인증 가드, 재동의 화면, 전체 검증)으로 분해했습니다.
- 계획 문서: `docs/superpowers/plans/2026-08-04-existing-user-legal-consent.md`.
- 검증: 계획의 범위·인터페이스·자리표시자 자체 검토와 `git diff --check`를 수행했습니다.
- 남은 작업: 실행 방식을 선택한 뒤 계획의 TDD 순서로 구현합니다.

# 2026-08-04 기존 가입자 약관 재동의 화면

- `/auth/consent`에 이용약관·개인정보 처리방침·만 14세 이상 세 가지 필수 동의, 한국어 검증/RPC 오류, 로그아웃을 추가했습니다.
- `recordCurrentLegalConsent()` 완료 뒤 `getAuthenticatedDestination()`이 `/app`을 반환할 때만 이동합니다. 그 외에는 현재 화면에 오류를 표시합니다.
- `.auth-consent*` 범위 스타일은 키보드 focus-visible과 모바일 44px 조작 영역을 포함합니다.
- 검증: 집중 Vitest 4개 통과, `npm run lint` 통과, `npm run build` 통과(`/auth/consent` 포함). Browser 런타임은 Windows sandbox 초기화 오류로 시작하지 못했고, Playwright로 1280×900·390×844 스크린샷을 생성했으나 이미지 조회도 같은 sandbox 오류로 막혔습니다.

# 2026-08-05 법적 문서 404 수정

- 누락됐던 공개 `/legal/privacy`, `/legal/terms` App Router 페이지를 추가했습니다.
- Playwright 회귀 테스트로 두 경로의 비로그인 200 응답과 필수 제목·시행일을 데스크톱/모바일에서 확인했습니다.
- 검증: `npx playwright test e2e/legal-pages.spec.ts` 4개 통과, `npm run lint` 통과, `npm run build` 통과. 빌드 라우트 목록에 두 법적 문서가 포함됩니다.
- 운영 Supabase·운영 데이터·배포에는 접근하지 않았습니다.
# 2026-08-06 동의 게이트 안전화 및 치명적 버그 수정

- 배경: `privacy` 브랜치가 마이그레이션 적용 여부와 관계없이 배포 불가 상태였습니다. 마이그레이션 없이 배포하면 `profiles`의 동의 열 조회가 실패해 기존 사용자가 로그인 화면으로 되돌려지고, 적용 후 배포하면 아래 두 버그가 터집니다.
- 게이트 플래그: `src/lib/legal/consentGate.ts`를 추가하고 `NEXT_PUBLIC_LEGAL_CONSENT_GATE=true`일 때만 동의 조회를 수행하도록 했습니다. 기본값(미설정)에서는 조회 자체를 하지 않으므로 마이그레이션 미적용 상태로 배포해도 운영에 영향이 없습니다.
- 버그 1 (가입 전면 실패): 가입 요청이 `termsAccepted`/`privacyAccepted`/`ageConfirmed`를 보내는데 트리거는 `terms_agreed`/`privacy_agreed`/`age_confirmed`를 읽어 키가 하나도 겹치지 않았습니다. 마이그레이션 적용 시 모든 신규 가입이 거부됩니다. 클라이언트를 트리거 기준 snake_case로 통일했습니다.
- 버그 2 (관리자 잠금): `getCurrentUserLegalConsent()`에 사용자 필터가 없어 RLS의 `or public.is_admin()` 때문에 관리자 계정에서 전체 프로필이 조회되고 `maybeSingle()`이 실패했습니다. `userId` 인자를 받아 `.eq("id", userId)`로 좁혔습니다.
- 실패 시 통과: 동의 조회가 실패해도 인증된 사용자를 막지 않고 `/app`으로 보냅니다. 동의 게이트는 보안 경계가 아니라 기록 장치이므로 조회 실패가 서비스 거부로 이어지면 안 됩니다. 기존의 로그인 리다이렉트 동작을 대체합니다.
- 테스트 셋업: `vitest.setup.ts`에 Testing Library `cleanup`을 등록했습니다. `globals: false`라 자동 cleanup이 없어 한 파일에서 `render()`를 두 번 호출하면 이전 DOM이 남아 조회가 중복 실패했습니다.
- 회귀 테스트: 가입 payload의 동의 키 검증, `.eq("id", userId)` 호출 검증, 게이트 비활성 시 조회 생략, 조회 실패 시 통과를 추가했습니다. 키 검증 테스트는 키를 되돌리면 실제로 실패하는 것을 확인했습니다.
- 검증: `npm test` 24개 파일 73개 통과, `npm run lint` 통과, `npm run build` 통과.
- 운영 Supabase·배포에는 접근하지 않았습니다.
- 남은 작업: 버전 상수 이중 관리(TS/SQL) 해소, 마이그레이션 멱등성, `on conflict` 동의 열 누락, 법적 문서 본문 보강, 문서 접근 경로(푸터·sitemap), 분석 동의와 폰트 CDN 제거.

# 2026-08-06 법적 문서 본문 보강 및 접근 경로

- 개인정보 처리방침을 14개 절로 다시 작성했습니다. 기존 24줄 버전에는 없던 국외 이전, 처리위탁, 제3자 제공, 파기 절차, 자동 수집 장치, 안전성 확보 조치, 권익침해 구제, 변경 고지를 추가했습니다.
- 국외 이전 절은 「개인정보 보호법」 제28조의8 제1항 제3호를 근거로 Supabase/AWS(서울 리전, 지원 과정의 국외 접근), Vercel, Google LLC의 이전 국가·시점·방법·항목을 표로 공개합니다. 이 절이 없으면 별도 동의를 갈음하는 근거가 성립하지 않습니다.
- 보호책임자 연락처 `yhu930421@naver.com`이 코드 어디에도 없었습니다. `legalDocuments.ts`에 운영자·보호책임자·연락처·최소 연령·CSP 보유 기간 상수를 추가하고 두 문서가 이를 참조하도록 했습니다.
- 이용약관을 14개 조항으로 다시 작성했습니다. 투자정보 면책(권유 아님, 정확성 미보장, 손익 책임 귀속), 금지행위, 서비스 중단 시 30일 사전 공지, 탈퇴, 지식재산권, 준거법을 포함합니다. 책임 제한 조항에는 고의·중과실과 법률상 배제 불가 책임의 예외를 명시했습니다.
- 접근 경로: `LegalLinks` 공용 컴포넌트를 추가하고 전역 `Footer`를 활성화했습니다. 인트로와 홈은 자체 `intro-footer`에 링크를 넣고 전역 푸터는 억제해 중복을 피합니다. `sitemap.ts`에 두 문서 URL을 등록했습니다.
- 두 페이지의 `metadata.title`이 루트 레이아웃의 `title.template`과 겹쳐 "개인정보 처리방침 | 머니북가계부 | 머니북가계부"로 중복 출력되고 있었습니다. 접미사를 제거했습니다.
- 스타일: `src/app/legal/legal.scss`를 추가하고 `globals.scss`에 등록했습니다. 표는 `overflow-x: auto` 래퍼 안에서만 가로 스크롤합니다.
- 검증: `npm test` 24개 파일 73개 통과, `npm run lint` 통과, `npm run build` 통과. `npx playwright test e2e/legal-pages.spec.ts` 데스크톱·모바일 12개 통과. 브라우저 런타임에서 375px 기준 페이지 가로 오버플로 0(scrollWidth 375 = viewport), 표 3개 모두 자체 영역 내 스크롤, 푸터 링크 조작 영역 44px, 인트로 법적 내비게이션 1개(중복 없음)를 확인했습니다.
- 스크린샷은 브라우저 패널이 표시되지 않아 촬영하지 못했고, 대신 위 수치 검증으로 대체했습니다.
- 사용자가 실행 중이던 포트 3001 개발 서버는 건드리지 않고, 프로덕션 빌드를 포트 3100에 띄워 검증한 뒤 종료했습니다.
- 남은 작업: 분석 동의 배너(현재 GA는 동의 없이 로드되며 처리방침 10절도 이 상태를 그대로 기술함), Pretendard CDN 제거와 CSP 정리, 마이그레이션 버전 이중 관리·멱등성·`on conflict` 정리.

# 2026-08-06 법적 링크를 사이드 메뉴·모바일 드로어로 이동

- 전역 `Footer` 활성화를 되돌렸습니다. `layout.tsx`의 `<Footer />`는 다시 주석 처리하고 `Footer.tsx`도 원래 형태로 복원했습니다. 앱 화면 하단 푸터가 디자인상 맞지 않는다는 판단에 따른 것입니다.
- 데스크톱: `LegalLinks`를 `.side-menu--inner`의 마지막 자식으로 넣었습니다. 바로 위 `.side-menu--wrap`이 `flex: 1`이라 링크가 사이드 메뉴 맨 아래에 남습니다.
- 모바일: `#mobile-navigation-drawer` 패널의 마지막 자식으로 넣고 `margin-top: auto`로 하단에 고정했습니다. 패널이 `column-group`(flex column, height 100dvh)이라 동작합니다.
- 인트로·홈의 `intro-footer` 링크는 그대로 두었습니다. 비로그인 방문자가 처리방침에 접근하는 공개 경로이므로 유지가 필요합니다.
- 스타일 정리: `.legal-links` 기본 스타일을 `footer.scss`에서 `src/styles/_legal-links.scss`로 옮기고 `globals.scss`에 등록했습니다. 푸터가 더 이상 이 컴포넌트를 쓰지 않기 때문입니다. 배치별 크기는 `.side-menu--legal`, `.mobile-drawer--legal`, `.intro-footer__legal` modifier로 조정합니다.
- 검증: `npm run lint` 통과, `npm run build` 통과, `npm test` 24개 파일 73개 통과, `npx playwright test e2e/legal-pages.spec.ts` 12개 통과.
- 브라우저 런타임 확인(데모 모드로 `/app` 진입): 데스크톱 1280px에서 링크가 `.side-menu--inner`의 마지막 자식이며 하단에서 11px, 앱 푸터 없음. 모바일 375px에서 드로어 패널 마지막 자식이며 하단에서 16px(safe-area 여백), 뷰포트 안에 보이고 링크 높이 44px. 양쪽 모두 가로 오버플로 0.
- 검증에 사용한 데모 모드 저장소는 정리했고, 포트 3100 서버도 종료했습니다. 사용자의 포트 3001 개발 서버는 건드리지 않았습니다.

# 2026-08-06 Geist 스타일 체크박스 도입

- 요청받은 컴포넌트는 Tailwind + shadcn 전제였으나 이 저장소에는 Tailwind·PostCSS·shadcn 설정이 전혀 없고 `globals.css`도 없습니다(Sass 기반). Tailwind를 도입하지 않고 기존 토큰 체계로 포팅했습니다.
- `src/components/common/Checkbox.tsx`와 `checkbox.scss`를 추가하고 `globals.scss`에 등록했습니다. API는 원본과 동일(`checked`, `onChange`, `disabled`, `indeterminate`, `children`)하며 `name`, `required`, `invalid`, `ref`를 추가했습니다.
- 색상은 원본의 `--ds-gray-*` 스케일 대신 기존 `--surface-lowest`, `--outline`, `--primary`, `--on-primary` 토큰에 매핑해 라이트·다크 테마가 자동으로 따라옵니다.
- 원본 대비 고친 점: (1) `checked`만 있고 `onChange`가 없어 React 제어 컴포넌트 경고가 나던 것을 입력 자체에 `onChange`를 붙여 해소, (2) `div` + `onClick` 대신 `label`로 감싸 네이티브 라벨 연결과 키보드 조작을 확보, (3) `indeterminate`일 때 `onChange`를 막던 로직 제거 — 전체 동의가 부분 선택 상태에서 눌리지 않는 문제였습니다, (4) `indeterminate` DOM 프로퍼티를 실제로 설정, (5) `:focus-visible` 링 추가.
- 회원가입과 재동의 화면의 원시 `input[type=checkbox]` 마크업을 이 컴포넌트로 교체하고, 설계 문서에 있던 **전체 동의**(부분 선택 시 indeterminate)를 구현했습니다. 회원가입의 `<label>필수 약관 동의</label>`는 폼 컨트롤이 없는 라벨이라 `<legend>`로 되돌렸습니다.
- 발견해서 고친 문제: `src/styles/_input.scss`의 전역 `input[type="checkbox"]`(우선순위 0,1,1)가 `.checkbox__input`(0,1,0)을 이겨 숨김 입력이 1×1이 아닌 16×16으로 렌더되고 있었습니다. 선택자를 `.checkbox .checkbox__input`으로 좁혀 해결했습니다.
- 직전 작업에서 제가 넣은 `var(--on-surface-variant)`는 정의되지 않은 토큰이었습니다(3곳). `var(--on-surface)`로 교체했습니다.
- 검증: `npm test` 24개 파일 76개 통과(전체 동의 선택·해제·부분 선택 indeterminate 테스트 3개 추가), `npm run lint` 통과, `npm run build` 통과, e2e 12개 통과.
- 브라우저 확인: 미선택 surface-lowest/outline, 선택 primary(#4e86e8)/아이콘 opacity 1, 부분 선택 outline-high + 가로선, 숨김 입력 1×1이며 포커스 가능하고 포커스 링 표시, 항목 높이 44px, 가로 오버플로 0.
- 주의: 브라우저 패널이 표시되지 않으면 페이지가 프레임을 그리지 않아 트랜지션이 시작값에 멈춥니다. 이 상태에서 `getComputedStyle`로 트랜지션 대상 속성(background-color, border-color, opacity)을 읽으면 변경 전 값이 나옵니다. 측정 시 트랜지션을 꺼야 합니다.

# 2026-08-06 남은 체크박스 전면 교체

- 원시 `input[type="checkbox"]` 5곳을 공용 `Checkbox` 컴포넌트로 교체했습니다. 저장소에 남은 원시 체크박스는 이제 없습니다(컴포넌트 내부 제외).
  - `auth/login`: 로그인 유지
  - `_home/HomeClient`: 저축 폼의 "이번 달 부터 변경", "만기일 없음", 고정지출 폼의 "이번 달 부터 변경", "종료일 설정 안함"
- HomeClient의 4곳은 폼 라벨 옆 인라인 자리라 기본 44px 높이가 맞지 않습니다. `Checkbox`에 `className` prop을 추가하고 `.checkbox--compact` 변형(높이 auto, 박스 16px, gap 6px, 글꼴 상속)을 만들어 적용했습니다. 기존 `caption--md` 글꼴 클래스를 함께 넘겨 텍스트 크기를 유지합니다.
- `.auth-check` 스타일은 사용처가 사라져 제거했습니다. `accent-color` 기반 네이티브 체크박스 스타일이었습니다.
- 검증: `npm test` 76개 통과, `npm run lint` 통과, `npm run build` 통과, e2e 12개 통과.
- 브라우저 확인(트랜지션 비활성화 후 측정):
  - 로그인 "로그인 유지": 높이 44px, 토글 시 배경 primary(#4e86e8), 아이콘 opacity 1.
  - `/app` compact 4개: 높이 20px로 옆 `.form-label`(20px)과 상단 정렬 일치, 박스 16px, 글꼴 12px, 토글 시 primary. 가로 오버플로 0.
- 확인에 쓴 데모 모드 저장소는 정리했고 포트 3100 서버도 종료했습니다.

# 2026-08-06 결정: 폰트 CDN·CSP 정리 보류

- Pretendard jsdelivr CDN 제거와 그에 따른 CSP 정리는 당분간 진행하지 않기로 했습니다.
- 공개한 개인정보 처리방침에는 폰트 CDN이 위탁·국외이전 항목으로 기재되어 있지 않으며, 기재할 필요도 없다고 판단했습니다. 폰트 파일 요청은 국내 실무에서 개인정보 처리위탁으로 다루지 않습니다. 따라서 보류해도 문서와 실제 동작이 어긋나지 않습니다.
- 다시 착수할 경우 범위: `layout.tsx`의 preconnect·stylesheet 링크 제거, 서브셋 조각 구조를 유지한 로컬 제공, `next.config.ts`의 `style-src`/`font-src`에서 `https://cdn.jsdelivr.net` 제거, `next.config.test.ts` 갱신, 초기 폰트 전송량 회귀 확인.

# 2026-08-06 결정: 분석 동의 배너 미채택

- 초안에 있던 선택형 분석 동의 배너를 구현하지 않기로 확정했습니다. Google Analytics, Vercel Analytics, Speed Insights는 현재대로 사전 동의 없이 로드합니다.
- 근거 1: 법적 의무가 아닙니다. 개인정보보호법 제30조 1항 7호는 자동 수집 장치의 운영과 거부 방법을 처리방침에 기재하라는 것이고, 사전 동의를 강제하지 않습니다. 공개한 처리방침 제10절이 이미 도구·수집 항목·거부 방법을 기재해 요건을 충족합니다.
- 근거 2: 운영자가 GA 대시보드를 주기적으로 확인하고 있습니다. 사용자 27명 규모에서 동의율만큼 표본이 줄면 GA와 Speed Insights 모두 판단 근거로 쓰기 어려워집니다.
- 재검토 조건: EU·EEA 방문자가 의미 있는 규모로 발생하는 경우(GDPR·ePrivacy는 분석 쿠키에 사전 동의 요구), 또는 사용자 규모가 커져 표본 손실을 감당할 수 있게 되는 경우.
- 설계 문서를 이 결정에 맞춰 갱신했습니다. 목적, 운영 정책 표, 처리위탁 표, 상시 접근 경로(공통 푸터 → 사이드 메뉴·모바일 드로어), 구현 범위, 검증 기준, 자체 검토를 모두 실제 구현과 일치시켰습니다. 미채택·보류 항목은 근거와 재개 조건을 남긴 채 비범위로 옮겼습니다.
- 코드 변경 없음. 검증 불필요.

# 2026-08-06 마이그레이션 정리

- 버전 이중 관리 해소: SQL에 8곳 하드코딩되어 있던 `'2026-08-04'`를 모두 제거했습니다. 이제 문서 버전의 단일 출처는 `src/lib/legal/legalDocuments.ts`이고, 데이터베이스는 전달받은 버전을 기록만 합니다. 양쪽에 버전이 있으면 TS 상수만 올렸을 때 재동의가 영원히 해소되지 않습니다(게이트가 요구 → RPC가 구버전 기록 → 다시 요구).
  - `record_current_legal_consent()` → `record_current_legal_consent(p_terms_version text, p_privacy_version text)`. 구 0-인자 함수는 `drop function if exists`로 제거해 PostgREST 오버로드 노출을 막습니다.
  - 회원가입은 `terms_version`, `privacy_version`을 메타데이터로 함께 전달합니다.
  - `assert_legal_version()`으로 빈 문자열과 32자 초과를 거부합니다.
  - 기록 시각은 종전대로 데이터베이스 `now()`를 씁니다. 클라이언트 시각은 신뢰하지 않습니다.
- 멱등성: `create table if not exists`, `create index if not exists`, 정책은 `do $$ ... pg_policies` 가드로 감쌌습니다. 기존 마이그레이션(20260606 등)의 관례와 일치하며 재적용해도 실패하지 않습니다.
- `on conflict` 누락 수정: 트리거 INSERT 분기가 `set email = excluded.email`만 하고 있어, 프로필이 이미 있으면 `user_legal_consents`에는 기록이 남는데 `profiles` 동의 열은 비는 불일치가 가능했습니다. 동의 열도 함께 갱신하도록 고쳤습니다.
- PL/pgSQL 함정 수정: 지역 변수명이 컬럼명과 같으면 `set terms_version = terms_version`이 모호성 오류를 냅니다. 두 함수 모두 `v_` 접두사로 변경했습니다.
- 트리거 거부 시 한국어 문구를 `getSignupErrorMessage`에 추가했습니다. `Database error saving new user` 등 DB 원문이 alert에 그대로 노출되던 경로입니다.
- 검증: `npm test` 24개 파일 76개 통과, `npm run lint` 통과, `npm run build` 통과. RPC 인자와 가입 메타데이터가 `legalDocuments.ts` 상수와 일치하는지 검증하는 테스트를 포함합니다.
- **SQL은 실행 검증하지 못했습니다.** 이 환경에 Docker와 psql이 없어 `supabase start`로 로컬 DB를 띄울 수 없습니다(`supabase/config.toml`도 없음). 문법·모호성·멱등성은 정적으로 점검했으나, 실제 적용은 로컬 Supabase가 있는 환경에서 확인해야 합니다. 확인 항목은 설계 문서 검증 기준 3~8번입니다.
- **배포 순서(중요):** 코드를 먼저 배포하고 그다음 마이그레이션을 적용해야 합니다. 현재 운영 트리거는 `raw_user_meta_data`를 읽지 않으므로 새 코드가 추가 메타데이터를 보내도 무시합니다. 반대로 마이그레이션을 먼저 적용하면 구 프론트엔드가 동의 메타데이터를 보내지 않아 그 사이 가입이 전부 실패합니다.
- 재동의 게이트는 여전히 `NEXT_PUBLIC_LEGAL_CONSENT_GATE` 미설정으로 꺼져 있습니다. 마이그레이션을 적용해도 기존 27명은 영향받지 않으며, 재동의를 받을지는 별도 결정입니다.

# 2026-08-06 마이그레이션 운영 적용 및 검증

- 운영 Supabase에 `20260804000000_add_legal_consent.sql`을 대시보드 SQL Editor로 적용했습니다(사용자 직접 수행). 오류 없이 완료.
- 이전 기록의 "SQL 실행 검증 못 함" 항목은 아래까지 해소되었습니다.
  - `profiles`에 `terms_version`, `terms_agreed_at`, `privacy_version`, `privacy_agreed_at`, `age_confirmed_at` 5개 열 생성 확인.
  - 함수 3개 확인. `record_current_legal_consent`는 `p_terms_version text, p_privacy_version text` 시그니처 하나만 존재하며, 구 0-인자 버전이 제거되어 PostgREST 오버로드 문제가 없습니다.
  - `record_current_legal_consent` RPC를 `request.jwt.claims`로 사용자를 가장해 트랜잭션 안에서 호출한 뒤 롤백했습니다. 오류 없이 반환되어 `profiles` UPDATE와 `user_legal_consents` INSERT 경로가 정상 동작함을 확인했습니다. 우려했던 변수·컬럼 모호성 오류는 없습니다.
- **아직 검증되지 않은 것: `handle_new_user_profile` 트리거의 INSERT 분기.** 실제 신규 가입이 있어야 실행됩니다. 함수 생성 성공은 문법 검사만 통과했다는 뜻이며 런타임 정확성을 보장하지 않습니다.
- 기존 사용자 3명 조회 결과 동의 열이 모두 NULL입니다. 예상된 상태이며, `NEXT_PUBLIC_LEGAL_CONSENT_GATE`가 꺼져 있는 한 로그인에 영향이 없습니다. 이 플래그를 켜면 기존 사용자 전원이 재동의 화면으로 갑니다.
- **주의: 마이그레이션이 적용된 시점부터 트리거가 동의 메타데이터를 요구합니다.** 새 프론트엔드(커밋 b9ae0b4)가 배포되어 있지 않으면 신규 가입이 실패합니다. 배포 완료 여부 확인이 필요합니다.

# 2026-08-06 신규 가입 트리거 검증 완료

- `test@test.com`으로 실제 신규 가입을 수행해 `handle_new_user_profile` 트리거의 INSERT 분기를 검증했습니다.
- 결과: `terms_version` `2026-08-04`, `privacy_version` `2026-08-04`, `terms_agreed_at`/`age_confirmed_at` 모두 `2026-08-06 07:26:40.220445+00`.
  - 버전은 문서 버전(`legalDocuments.ts` 상수)이고 시각은 서버 시각으로, 버전과 시각의 출처를 분리한 설계가 의도대로 동작합니다.
  - 세 시각이 동일한 것은 트리거가 단일 `consented_at` 변수를 쓰기 때문으로 정상입니다.
- 가입이 성공했다는 사실 자체가 새 프론트엔드(b9ae0b4)가 배포되어 동의 메타데이터를 전송하고 있음을 확인해 줍니다. 구 번들이었다면 트리거가 거부했을 것입니다.
- 이로써 이전 기록의 "SQL 실행 검증 못 함" 항목은 완전히 해소되었습니다. 열 생성, 함수 시그니처, RPC 본문, 트리거 INSERT 분기까지 모두 운영 환경에서 확인했습니다.
- 정리 필요: 검증용 `test@test.com` 계정은 운영 데이터이므로 삭제하는 것이 좋습니다. `profiles`와 `user_legal_consents`는 `auth.users`에 `on delete cascade`로 연결되어 있어 대시보드에서 사용자를 삭제하면 함께 제거됩니다.

# 2026-08-18 CSP 30일 관찰 보완

- 30일 관찰 데이터 153건 중 150건이 WebAssembly 관련으로 판단되는 `script-src` 보고였고, `unsafe-eval` 대신 WebAssembly 전용 `'wasm-unsafe-eval'`을 Report-Only 정책에 추가했습니다.
- 운영 코드·HTML에서 재현되지 않은 `fonts.gstatic.com` 보고 1건과 Vercel Preview의 `manifest-src` 2건은 허용 목록에 추가하지 않았습니다.
- 차단 CSP 전환은 하지 않았으며, 변경 후 7일간 Report-Only 보고를 추가 관찰합니다.

# 2026-08-26 사용자 카테고리·즐겨찾기 관리

- 브랜치: `codex/custom-category-management`; 변경 사항은 아직 커밋되지 않았습니다.
- 완성: `useCustomCategories`가 로딩·오류·작업 중 상태, 이름 검증, 유형별 즐겨찾기 5개 제한, 서버 제한 오류 시 재조회, 데모 저장을 담당합니다. `recordUsedCategory`는 기존 즐겨찾기 상태를 보존합니다.
- 완성: `CategoryManager`에 유형 버튼, 추가, 인라인 이름 수정·취소, 삭제 확인(기존 거래 내역 보존 안내), 즐겨찾기 토글, 재시도·오류 안내를 연결했습니다. 스타일은 모듈 CSS가 아닌 전역 `src/components/category-manager.scss`를 `src/app/globals.scss`에서 불러오는 기존 Sass 규칙을 따릅니다.
- 홈의 추천 칩과 관리 모달이 같은 훅 상태를 사용합니다. 즐겨찾기 우선 정렬은 유지되며, 관리 모달에서 카테고리를 선택하면 직접입력 필드에 적용됩니다.
- 마이페이지의 내 카테고리 카드도 공통 관리 패널을 사용하며, 데스크톱 2×2 배치(내 정보·비밀번호 변경 / 약관 동의·내 카테고리)를 유지합니다.
- `Modal`에 dialog 의미론, Escape·오버레이 닫기, 포커스 트랩·복원을 추가해 관리 모달의 키보드 접근성을 보완했습니다.
- 자동 검증: `npm run lint` 통과, `npm test` 40개 파일 173개 통과, `npm run build` 통과. 새 관리 패널·상태 훅·즐겨찾기 정렬·모달 테스트 및 데모 E2E 테스트를 포함합니다.
- 화면 검증: 별도 프로덕션 서버(3100)에서 데모로 카테고리 추가→즐겨찾기 지정까지 데스크톱 1280px·모바일 393px에서 확인했고, 두 화면 모두 가로 오버플로가 없었습니다. 로컬에서 Vercel Analytics/Speed Insights 스크립트만 404이며 앱 오류는 없었습니다.
- 운영 DB에는 `20260825000000_add_custom_category_favorites.sql`을 아직 적용하지 않았습니다. 코드 배포 후 이 마이그레이션을 적용해야 실제 계정의 즐겨찾기가 작동합니다.

# 2026-08-28 투자관리 진입 JWT 오류 수정

- 원인: `src/lib/supabase/client.ts`가 `authStorage`와 `AUTH_STORAGE_KEY`를 전달하지 않아 Supabase 기본 저장소의 오래된 토큰을 사용했습니다. 투자관리 진입 시 `getUser()`가 이를 검증하며 `JWT issued at future` 오류가 사용자에게 노출됐습니다.
- 수정: 브라우저 Supabase 클라이언트에 앱의 로그인 유지/세션 분리 저장소와 전용 저장소 키를 연결했습니다.
- 회귀 테스트: `src/lib/supabase/client.test.ts`가 해당 저장소 설정 전달을 검증합니다. 환경변수가 없는 단위 테스트에서도 저장소 설정만 정확히 검증하도록 URL·키 기대값을 `undefined`로 고정했습니다.
- 검증: 대상 테스트 통과, `npm run lint` 통과, `npm run build` 통과.
- 참고: 전체 `npm test`는 새 미구현 FAQ 테스트(`src/app/_intro/IntroPage.test.tsx`) 1건이 `자주 묻는 질문` heading을 찾지 못해 실패합니다. 이번 인증 변경과 무관합니다.
- 화면 자동 확인: 브라우저 제어 런타임이 시작 직후 종료되어 로그인한 `/app → /app/invest` 전환을 자동으로 재현하지 못했습니다.
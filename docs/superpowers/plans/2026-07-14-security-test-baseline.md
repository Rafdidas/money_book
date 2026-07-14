# Security Patch and Regression Test Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Patch Next.js to `16.2.10` and establish automated regression coverage for authentication boundaries, demo access, date/stock normalization, and dashboard financial summaries without changing production data or product behavior.

**Architecture:** This is the first independently releasable slice of the approved production-stabilization design. The dependency patch is isolated from database work, Vitest protects synchronous pure logic and Proxy behavior, and Playwright protects browser-level public/auth/demo flows. No Supabase migration, remote command, production deployment, or product refactor belongs in this plan.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, React Testing Library, Playwright, Supabase SSR

## Global Constraints

- 마이그레이션으로 인한 기존 운영 데이터의 손실, 중복, 금액 변경, 사용자 간 노출을 허용하지 않는다.
- 운영 DB 변경과 앱 배포는 백업과 스테이징 검증을 통과한 뒤 수행한다.
- 기존 테이블과 컬럼은 새 경로의 안정화가 끝나기 전에 삭제하거나 의미를 바꾸지 않는다.
- 각 릴리스는 이전 앱 버전으로 되돌릴 수 있어야 한다.
- 사용자에게 보이는 문구는 한국어를 유지한다.
- Next.js 코드를 변경하기 전 `node_modules/next/dist/docs/`의 관련 문서를 확인한다.
- 이 계획에서는 Supabase 로컬·스테이징·운영 스키마와 운영 데이터를 변경하지 않는다.
- `npm audit fix`를 사용하지 않고 필요한 패키지만 명시적으로 변경한다.
- 구현 코드 변경을 시작하기 직전에 사용자에게 모델 변경 시점을 알리고 확인을 기다린다.

## Plan Boundary

This plan covers releases A and B from the approved design:

- Release A: Next.js `16.2.10` security patch
- Release B: unit, Proxy, and browser regression baseline

The following approved work requires separate plans after this plan passes:

- Release C: error recovery, API error normalization, timeouts, rate limits, security headers, inquiry pagination
- Release D: dashboard, investment, and analysis responsibility splits
- Releases E/F: additive database schema, transactional RPC, compatible reads/writes, verified backfill, staging and production rollout

---

### Task 1: Capture the immutable pre-change baseline

**Files:**
- Read: `package.json`
- Read: `package-lock.json`
- Read: `src/proxy.ts`
- Read: `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`
- Read: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
- Modify: `HANDOFF.md`

**Interfaces:**
- Consumes: current dependency tree and existing `proxy(request: NextRequest)` behavior
- Produces: a recorded baseline with the current commit, Node/npm versions, audit result, lint result, and build result

- [ ] **Step 1: Confirm a clean worktree and supported Node runtime**

Run:

```powershell
git status --short
node --version
npm --version
```

Expected: `git status --short` prints nothing and Node is `20.9.0` or newer, as required by Next.js 16.

- [ ] **Step 2: Record the dependency and security baseline**

Run:

```powershell
npm ls next react react-dom --depth=0
npm audit --audit-level=high
```

Expected before the patch: Next.js resolves to `16.2.4`; audit reports the known high-severity Next.js advisory. Save only package names, severities, and advisory identifiers in `HANDOFF.md`; do not copy environment variables or tokens.

- [ ] **Step 3: Verify the current application baseline**

Run:

```powershell
npm run lint
npm run build
```

Expected: both commands exit `0`, matching the pre-plan baseline.

- [ ] **Step 4: Update the handoff record**

Append a dated section to `HANDOFF.md` containing:

```markdown
# 2026-07-14 security and test baseline - pre-change

- Scope: Next.js patch update and regression-test foundation only.
- Production DB/data changes: none.
- Baseline:
  - Node: `v24.12.0`
  - npm: `11.6.2`
  - Next.js: `16.2.4`
  - `npm run lint`: passed
  - `npm run build`: passed
  - `npm audit --audit-level=high`: failed on the recorded high-severity Next.js advisory
- Remaining: targeted Next.js update and automated regression coverage.
```

If the implementation environment changes before Task 1 runs, replace these two recorded
versions with the new exact command output and re-check the Next.js `20.9.0` minimum.

- [ ] **Step 5: Commit the baseline record**

Run:

```powershell
git add HANDOFF.md
git commit -m "docs: record stabilization baseline"
```

Expected: one documentation-only commit; no source, package, or database file is included.

---

### Task 2: Apply the targeted Next.js security patch

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `HANDOFF.md`

**Interfaces:**
- Consumes: existing Next.js 16 App Router application and React `19.2.4`
- Produces: Next.js exactly compatible with patched release `16.2.10`, with React versions unchanged

- [ ] **Step 1: Install only the approved Next.js patch**

Run:

```powershell
npm install next@16.2.10
```

Expected: `package.json` and `package-lock.json` change; no application source or Supabase file changes.

- [ ] **Step 2: Inspect the dependency diff before running fixes**

Run:

```powershell
git diff -- package.json package-lock.json
npm ls next react react-dom --depth=0
```

Expected:

```text
next@16.2.10
react@19.2.4
react-dom@19.2.4
```

Reject the change if React receives a major/minor change or any unrelated production dependency changes major version.

- [ ] **Step 3: Verify the security result without automatic remediation**

Run:

```powershell
npm audit --audit-level=high
```

Expected: exit `0` with no high-severity vulnerability. Moderate or lower findings must be recorded for a separate targeted dependency task; do not run `npm audit fix`.

- [ ] **Step 4: Verify the patched framework build**

Run:

```powershell
npm run lint
npm run build
```

Expected: both exit `0`; build output continues to list Proxy and the existing routes.

- [ ] **Step 5: Update `HANDOFF.md` with the exact audit and build result**

Append:

```markdown
# 2026-07-14 Next.js security patch

- Updated Next.js from `16.2.4` to `16.2.10` with a targeted install.
- React and React DOM remain `19.2.4`.
- Production DB/data changes: none.
- Verification:
  - `npm audit --audit-level=high`: passed with no high-severity finding
  - `npm run lint`: passed
  - `npm run build`: passed
- Remaining: Vitest and Playwright regression baseline.
```

- [ ] **Step 6: Commit the isolated framework patch**

Run:

```powershell
git add package.json package-lock.json HANDOFF.md
git commit -m "chore: patch Next.js security vulnerabilities"
```

Expected: the commit contains only dependency metadata and the handoff entry.

---

### Task 3: Add the Vitest test harness

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.mts`
- Create: `vitest.setup.ts`
- Create: `src/utils/date.test.ts`
- Modify: `HANDOFF.md`

**Interfaces:**
- Consumes: TypeScript path alias `@/* -> ./src/*` from `tsconfig.json`
- Produces: `npm run test`, `npm run test:watch`, and a jsdom test environment with jest-dom matchers

- [ ] **Step 1: Install the framework-documented test dependencies**

Run:

```powershell
npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom vite-tsconfig-paths
```

Expected: only dev dependencies and the lockfile change.

- [ ] **Step 2: Add deterministic test scripts to `package.json`**

Add these entries under `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

The full scripts object must retain the existing `dev`, `build`, `start`, and `lint` entries.

- [ ] **Step 3: Create `vitest.config.mts`**

```ts
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    restoreMocks: true,
    clearMocks: true,
  },
});
```

- [ ] **Step 4: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Add a harness characterization test in `src/utils/date.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { formatDate } from "@/utils/date";

describe("formatDate", () => {
  it("로컬 날짜를 YYYY-MM-DD 형식으로 채운다", () => {
    expect(formatDate(new Date(2026, 1, 3))).toBe("2026-02-03");
  });

  it("연말 날짜를 다음 해로 이동시키지 않는다", () => {
    expect(formatDate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});
```

- [ ] **Step 6: Run the harness and static checks**

Run:

```powershell
npm run test -- src/utils/date.test.ts
npm run lint
```

Expected: 2 tests pass and lint exits `0`.

- [ ] **Step 7: Document and commit the test harness**

Append to `HANDOFF.md` that Vitest is configured, the date tests pass, and production DB/data changes are none. Then run:

```powershell
git add package.json package-lock.json vitest.config.mts vitest.setup.ts src/utils/date.test.ts HANDOFF.md
git commit -m "test: add Vitest regression harness"
```

Expected: one test-infrastructure commit with no product behavior changes.

---

### Task 4: Characterize financial summary and stock normalization behavior

**Files:**
- Create: `src/app/_home/dashboardSummary.test.ts`
- Create: `src/utils/stock.test.ts`
- Read: `src/app/_home/dashboardSummary.ts`
- Read: `src/types/expense.ts`
- Modify: `HANDOFF.md`

**Interfaces:**
- Consumes: `getDashboardMonthlySummary`, `getDashboardScheduleSummary`, `normalizeStockSearchText`, and `Expense`
- Produces: regression contracts for actual/scheduled/skipped totals, remaining balance, schedule order, Unicode normalization, punctuation removal, and stock-code normalization

- [ ] **Step 1: Create `src/app/_home/dashboardSummary.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import type { DashboardEntry } from "@/app/_home/dashboardSummary";
import {
  getDashboardMonthlySummary,
  getDashboardScheduleSummary,
} from "@/app/_home/dashboardSummary";

const entry = (
  overrides: Partial<DashboardEntry> & Pick<DashboardEntry, "id" | "amount" | "type" | "category" | "date">,
): DashboardEntry => ({
  user_id: "user-1",
  memo: "",
  created_at: "2026-07-01T00:00:00.000Z",
  ...overrides,
});

describe("getDashboardMonthlySummary", () => {
  it("완료된 수입·일반지출·저축·투자를 분리하고 예정·취소 내역은 제외한다", () => {
    const entries: DashboardEntry[] = [
      entry({ id: "income", amount: 3_000_000, type: "income", category: "급여", date: "2026-07-01" }),
      entry({ id: "expense", amount: 500_000, type: "expense", category: "생활비", date: "2026-07-02" }),
      entry({ id: "saving", amount: 400_000, type: "expense", category: "📩저축", date: "2026-07-03" }),
      entry({ id: "investment", amount: 300_000, type: "expense", category: "📈주식", date: "2026-07-04" }),
      entry({ id: "scheduled", amount: 200_000, type: "expense", category: "고정지출", date: "2026-07-05", status: "scheduled" }),
      entry({ id: "cancelled", amount: 100_000, type: "expense", category: "생활비", date: "2026-07-06", status: "cancelled" }),
      entry({ id: "other-month", amount: 9_999_999, type: "income", category: "급여", date: "2026-06-30" }),
    ];

    expect(getDashboardMonthlySummary(entries, 2026, 6)).toEqual({
      actualIncome: 3_000_000,
      actualExpense: 500_000,
      actualSavings: 400_000,
      actualInvestment: 300_000,
      actualRemaining: 1_800_000,
      incomeCount: 1,
      expenseCount: 1,
      incomeAverage: 3_000_000,
      expenseAverage: 500_000,
    });
  });
});

describe("getDashboardScheduleSummary", () => {
  it("연체·예정·완료·건너뜀 순으로 정렬하고 활성 예정 금액만 차감한다", () => {
    const entries: DashboardEntry[] = [
      entry({ id: "paid", amount: 50_000, type: "expense", category: "고정지출", memo: "완료", date: "2026-07-01", status: "paid" }),
      entry({ id: "future", amount: 100_000, type: "expense", category: "고정지출", memo: "예정", date: "2026-07-20", status: "scheduled" }),
      entry({ id: "overdue", amount: 200_000, type: "expense", category: "📩저축", memo: "연체", date: "2026-07-05", status: "scheduled" }),
      entry({ id: "skipped", amount: 300_000, type: "expense", category: "고정지출", memo: "건너뜀", date: "2026-07-02", status: "cancelled" }),
    ];

    const summary = getDashboardScheduleSummary(
      entries,
      2026,
      6,
      new Date(2026, 6, 10),
      1_000_000,
    );

    expect(summary.items.map(({ id, status }) => ({ id, status }))).toEqual([
      { id: "overdue", status: "overdue" },
      { id: "future", status: "scheduled" },
      { id: "paid", status: "paid" },
      { id: "skipped", status: "skipped" },
    ]);
    expect(summary.scheduledExpense).toBe(100_000);
    expect(summary.scheduledSavingsInvestment).toBe(200_000);
    expect(summary.expectedRemaining).toBe(700_000);
  });
});
```

- [ ] **Step 2: Create `src/utils/stock.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { normalizeStockSearchText } from "@/utils/stock";

describe("normalizeStockSearchText", () => {
  it.each([
    [" 삼성 전자 ", "삼성전자"],
    ["KODEX-200", "kodex200"],
    ["ＡＢＣ １２３", "abc123"],
    ["005930", "005930"],
  ])("%s를 %s로 정규화한다", (input, expected) => {
    expect(normalizeStockSearchText(input)).toBe(expected);
  });
});
```

- [ ] **Step 3: Run the focused characterization tests**

Run:

```powershell
npm run test -- src/app/_home/dashboardSummary.test.ts src/utils/stock.test.ts
```

Expected: all tests pass without modifying production functions. If an assertion fails, confirm whether the fixture or current documented behavior is wrong before changing source code; this task does not authorize a behavior change.

- [ ] **Step 4: Run the complete unit suite and lint**

Run:

```powershell
npm run test
npm run lint
```

Expected: all unit tests pass and lint exits `0`.

- [ ] **Step 5: Document and commit the characterization suite**

Append the exact test counts to `HANDOFF.md`, state that no production data or product behavior changed, then run:

```powershell
git add src/app/_home/dashboardSummary.test.ts src/utils/stock.test.ts HANDOFF.md
git commit -m "test: characterize finance summary calculations"
```

---

### Task 5: Lock the Next.js Proxy authentication boundary

**Files:**
- Create: `src/proxy.test.ts`
- Read: `src/proxy.ts`
- Read: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
- Modify: `HANDOFF.md`

**Interfaces:**
- Consumes: exported `config`, `proxy(request)`, cookie key `money-book-demo-mode`, and `next/experimental/testing/server`
- Produces: regression coverage for Proxy matcher selection and authenticated, unauthenticated, and demo access

- [ ] **Step 1: Create `src/proxy.test.ts` with a mocked Supabase session boundary**

```ts
import { NextRequest } from "next/server";
import { unstable_doesProxyMatch } from "next/experimental/testing/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser } = vi.hoisted(() => ({
  getUser: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser },
  })),
}));

import { config, proxy } from "@/proxy";

describe("proxy matcher", () => {
  it("/app 하위 경로만 보호한다", () => {
    expect(unstable_doesProxyMatch({ config, nextConfig: {}, url: "/app" })).toBe(true);
    expect(unstable_doesProxyMatch({ config, nextConfig: {}, url: "/app/analysis" })).toBe(true);
    expect(unstable_doesProxyMatch({ config, nextConfig: {}, url: "/auth/login" })).toBe(false);
    expect(unstable_doesProxyMatch({ config, nextConfig: {}, url: "/api/stocks/search" })).toBe(false);
  });
});

describe("proxy access", () => {
  beforeEach(() => {
    getUser.mockReset();
  });

  it("비로그인 사용자를 next 경로와 함께 로그인으로 보낸다", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const response = await proxy(new NextRequest("https://monibuk.com/app/analysis"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://monibuk.com/auth/login?next=%2Fapp%2Fanalysis",
    );
  });

  it("로그인 사용자의 앱 접근을 통과시킨다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const response = await proxy(new NextRequest("https://monibuk.com/app"));

    expect(response.status).toBe(200);
  });

  it("데모 쿠키가 있는 비로그인 사용자의 앱 접근을 통과시킨다", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const request = new NextRequest("https://monibuk.com/app", {
      headers: { cookie: "money-book-demo-mode=true" },
    });
    const response = await proxy(request);

    expect(response.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run the Proxy test and confirm the framework testing adapter works**

Run:

```powershell
npm run test -- src/proxy.test.ts
```

Expected: 4 tests pass. If Next.js marks the experimental adapter as incompatible with jsdom, add this first line to `src/proxy.test.ts` and rerun:

```ts
// @vitest-environment node
```

- [ ] **Step 3: Run the complete unit suite, lint, and build**

Run:

```powershell
npm run test
npm run lint
npm run build
```

Expected: all commands exit `0`.

- [ ] **Step 4: Document and commit the Proxy contract**

Append the matcher and access cases to `HANDOFF.md`, state that no auth implementation or DB policy changed, then run:

```powershell
git add src/proxy.test.ts HANDOFF.md
git commit -m "test: lock app Proxy access behavior"
```

---

### Task 6: Add browser-level public, auth, and demo smoke tests

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `playwright.config.ts`
- Create: `e2e/public-auth-demo.spec.ts`
- Modify: `.gitignore`
- Modify: `HANDOFF.md`

**Interfaces:**
- Consumes: `/`, `/app`, `/auth/login`, the `데모 체험하기` button, and the `대시보드` heading
- Produces: `npm run test:e2e` using an isolated local server on `127.0.0.1:3100`

- [ ] **Step 1: Install Playwright as a dev dependency**

Run:

```powershell
npm install --save-dev @playwright/test
npx playwright install chromium
```

Expected: package metadata changes and Chromium is available locally. No production dependency changes.

- [ ] **Step 2: Add the E2E script to `package.json`**

Add under `scripts`:

```json
"test:e2e": "playwright test"
```

- [ ] **Step 3: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/auth/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 4: Add generated Playwright artifacts to `.gitignore`**

```gitignore
/playwright-report/
/test-results/
```

- [ ] **Step 5: Create `e2e/public-auth-demo.spec.ts`**

```ts
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});

test("공개 첫 화면을 표시한다", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/머니북가계부/);
  await expect(page.getByRole("link", { name: /시작하기/ }).first()).toBeVisible();
});

test("비로그인 앱 접근은 원래 경로를 보존해 로그인으로 이동한다", async ({ page }) => {
  await page.goto("/app/analysis");

  await expect(page).toHaveURL(/\/auth\/login\?next=%2Fapp%2Fanalysis$/);
  await expect(page.getByRole("heading", { level: 1, name: "로그인" })).toBeVisible();
});

test("데모 체험은 운영 DB 로그인 없이 대시보드로 진입한다", async ({ page, context }) => {
  await page.goto("/auth/login");
  await page.getByRole("button", { name: "데모 체험하기" }).click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();

  const cookies = await context.cookies();
  expect(cookies).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: "money-book-demo-mode", value: "true" }),
    ]),
  );
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("money-book:demo-mode")))
    .toBe("true");
});
```

- [ ] **Step 6: Run the desktop and mobile browser suite**

Run:

```powershell
npm run test:e2e
```

Expected: 6 tests pass: 3 scenarios across desktop Chromium and mobile Chromium. The test uses demo browser storage only and does not write to Supabase.

- [ ] **Step 7: Run static and production-build verification**

Run:

```powershell
npm run lint
npm run build
```

Expected: both commands exit `0`.

- [ ] **Step 8: Document and commit the E2E baseline**

Append the exact desktop/mobile result to `HANDOFF.md`, explicitly state that the suite used demo mode and made no production DB change, then run:

```powershell
git add package.json package-lock.json playwright.config.ts e2e/public-auth-demo.spec.ts .gitignore HANDOFF.md
git commit -m "test: add auth and demo browser smoke coverage"
```

---

### Task 7: Run the release gate and prepare the production-safe handoff

**Files:**
- Modify: `HANDOFF.md`
- Read: `docs/superpowers/specs/2026-07-14-production-stabilization-design.md`

**Interfaces:**
- Consumes: patched Next.js dependency, complete Vitest suite, Proxy tests, Playwright smoke suite
- Produces: a releasable A+B commit set and an evidence-based handoff; no deployment is executed by this plan

- [ ] **Step 1: Run the complete release gate from a clean process state**

Run:

```powershell
npm audit --audit-level=high
npm run lint
npm run test
npm run build
npm run test:e2e
git diff --check
```

Expected: every command exits `0`; Playwright reports 6 passing tests; audit reports no high-severity vulnerability.

- [ ] **Step 2: Inspect the final change set for scope violations**

Run:

```powershell
git status --short
git diff --stat HEAD~6..HEAD
git diff --name-only HEAD~6..HEAD
```

Expected files are limited to dependency metadata, test configuration, test files, `.gitignore`, and `HANDOFF.md`. There must be no file under `supabase/`, no `.env*` file, and no product source change except test files beside source.

- [ ] **Step 3: Add the release-gate result to `HANDOFF.md`**

Append:

```markdown
# 2026-07-14 security and test baseline - release gate

- Next.js: `16.2.10`
- Production DB/data changes: none.
- Product behavior changes: none intended.
- Verification:
  - `npm audit --audit-level=high`: passed
  - `npm run lint`: passed
  - `npm run test`: passed
  - `npm run build`: passed
  - `npm run test:e2e`: passed on desktop and mobile Chromium
  - `git diff --check`: passed
- Deployment: not executed in this implementation plan.
- Next release plan: error recovery, API hardening, security headers, and inquiry pagination.
```

- [ ] **Step 4: Commit the final verification record**

Run:

```powershell
git add HANDOFF.md
git commit -m "docs: record security baseline verification"
```

- [ ] **Step 5: Stop before production deployment**

Report the exact commit range, verification results, remaining non-high audit findings, and rollback commit. Production deployment requires the separate deployment checkpoint from the approved design so that the deployment target, current production commit, and rollback mechanism are verified immediately before release.

## Plan Self-Review

- Spec coverage: this plan deliberately covers approved releases A and B only; releases C through F are enumerated under `Plan Boundary` and require separate independently testable plans.
- Data safety: no task reads or writes production Supabase data, changes migrations, or deploys the application.
- Type consistency: test fixtures use the existing `DashboardEntry` and exported function signatures.
- Framework compliance: the plan follows the installed Next.js 16 upgrade, Proxy testing, Vitest, and Playwright guides.
- Rollback: all changes are application dependency or test-only commits; the production app can return to its previous commit without a database rollback.

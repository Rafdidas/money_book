# Operational Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add recoverable application failures, safe API error boundaries and input bounds, security response headers, and bounded inquiry loading without changing Supabase schema or existing financial data.

**Architecture:** Error UI stays client-side at App Router error boundaries. Route handlers return a fixed public message and retain details only in server logs. Inquiry pagination uses Supabase `range()` on the existing ordered query, so it neither migrates nor rewrites any row.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase, Vitest, Playwright

## Global Constraints

- 운영 데이터와 Supabase 스키마를 변경하지 않는다.
- 기존 테이블, RLS 정책, 항목 금액·날짜·소유권을 변경하지 않는다.
- 사용자 노출 문구는 한국어로 유지한다.
- CSP는 외부 폰트·Analytics와의 호환성 검증 전에는 강제하지 않는다.
- 모든 API 오류 응답은 공급자·SQL·환경 변수 상세를 노출하지 않는다.
- 구현 전 `error.md`, `headers.md`, `content-security-policy.md`, `route-handlers.md`를 읽는다.

---

### Task 1: Recoverable App Router error boundaries

**Files:**
- Create: `src/app/error.tsx`
- Create: `src/app/global-error.tsx`
- Create: `src/app/error.test.tsx`

**Interfaces:**
+- `error.tsx` receives `{ error: Error & { digest?: string }; unstable_retry: () => void }`.
- It displays `문제가 발생했어요`, a retry button named `다시 시도`, and a home link.

+- [ ] Write a failing React Testing Library test that renders the boundary, clicks `다시 시도`, and expects `unstable_retry` once.
- [ ] Run `npm run test -- src/app/error.test.tsx`; expect module-not-found failure.
- [ ] Implement a minimal `"use client"` error boundary that logs only `error.digest` or `error.name`, not message content.
- [ ] Implement `global-error.tsx` with `<html lang="ko"><body>` and the same retry semantics.
- [ ] Run focused test, full unit suite, lint, and build.
- [ ] Commit: `feat: add recoverable app error boundaries`.

### Task 2: Security headers and safe stock API failures

**Files:**
- Modify: `next.config.ts`
- Modify: `src/app/api/stocks/search/route.ts`
- Modify: `src/app/api/stocks/quotes/route.ts`
- Create: `src/app/api/stocks/search/route.test.ts`
- Create: `src/app/api/stocks/quotes/route.test.ts`

**Interfaces:**
+- `next.config.ts` exports async `headers()` for `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and `X-Frame-Options: DENY`. HSTS is intentionally deferred until the production domain and all subdomain HTTPS coverage are reviewed.
- Search accepts a trimmed query of 1–80 characters; a longer query returns `{ message: "검색어는 80자 이하로 입력해주세요." }` and status 400.
- Both stock handlers return `{ message: "잠시 후 다시 시도해주세요." }` for unexpected upstream failures; detailed errors are logged server-side without request bodies.

- [ ] Write route-handler tests that mock KIS/FSC/Supabase boundaries and expect fixed public errors rather than provider messages.
- [ ] Run each focused route test; expect imports/tests to fail before implementation.
- [ ] Implement `headers()` without CSP changes and verify public routes retain existing behavior.
- [ ] Add search-length validation before `searchKisStocks` is called.
- [ ] Replace unexpected error response bodies in search and quotes routes with the fixed Korean message, keeping 401, 400, 429, and partial quote failures unchanged.
- [ ] Run focused tests, full unit suite, lint, build, and E2E.
- [ ] Commit: `fix: harden stock api failures and headers`.

### Task 3: Bounded inquiry loading

**Files:**
- Modify: `src/lib/api/inquiries.ts`
- Modify: `src/app/app/inquiries/page.tsx`
- Create: `src/lib/api/inquiries.test.ts`

**Interfaces:**
- `getInquiries(page: number, pageSize = 20): Promise<{ items: Inquiry[]; hasMore: boolean }>` orders by `created_at` descending then uses `.range(page * pageSize, page * pageSize + pageSize)` to fetch one look-ahead row.
- The UI starts at page 0, renders `더 보기` only when `hasMore` is true, appends the next items without losing selection, and preserves existing admin filtering and answer behavior.

- [ ] Write a failing mocked Supabase test that expects range `0..20`, 20 returned items, and `hasMore: true` from 21 rows.
- [ ] Implement `getInquiries` with a constant `INQUIRIES_PAGE_SIZE = 20` and look-ahead pagination.
- [ ] Update the page loader to consume `items` and `hasMore`; implement a disabled `더 보기` while the next page loads.
- [ ] Run focused test, full unit suite, lint, build, and E2E.
- [ ] Commit: `feat: paginate inquiry loading`.

### Task 4: Release gate

- [ ] Run `npm audit --audit-level=high`, `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e`, and `git diff --check`.
- [ ] Update `HANDOFF.md` with exact results, no DB change confirmation, and remaining audit/image warnings.
- [ ] Merge the verified dev branch into main and re-run the same release gate from main.

## Plan Self-Review

- Covers the approved Release C error recovery, API error normalization, security headers, and inquiry pagination scope.
+- Omits CSP enforcement, cross-instance rate-limit schema work, HSTS, and any database migration because each requires an additional compatibility and deployment review.
- No task alters financial entries, RLS, or Supabase schema.

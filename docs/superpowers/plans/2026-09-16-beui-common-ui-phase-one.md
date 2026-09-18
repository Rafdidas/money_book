# beUI 공통 UI 1차 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sass 기반 머니북 공통 UI 계층의 첫 배치와 대시보드 첫 사용처를 만든다.

**Architecture:** Motion의 작은 클라이언트 컴포넌트를 `src/components/ui`에 개별 진입점으로 둔다. 색상과 레이아웃은 기존 CSS 변수·Sass에서 관리하며, 대시보드는 공통 Tabs와 Badge를 조합할 뿐 도메인 상태는 계속 소유한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Sass, Vitest, Testing Library, Motion.

**Spec:** `docs/superpowers/specs/2026-09-16-beui-common-ui-design.md`

## Global Constraints

- 사용자 문구는 한국어로 쓴다.
- Tailwind, shadcn, lucide를 추가하지 않는다.
- 공통 UI는 도메인 로직을 포함하지 않는다.
- `prefers-reduced-motion`을 존중한다.
- 변경 후 `HANDOFF.md`를 갱신하고 lint·build를 실행한다.

---

### Task 1: Motion 기반 공통 인터랙션 토큰

**Files:**
- Create: `src/lib/motion/tokens.ts`
- Create: `src/lib/motion/useReducedMotion.ts`
- Test: `src/lib/motion/tokens.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `PRESS_TRANSITION`, `PANEL_TRANSITION`, `LAYOUT_TRANSITION`, `useReducedMotionPreference()`.

- [ ] Write a failing unit test that asserts the public transition constants have spring configuration and reduced-motion hook reports the browser preference.
- [ ] Run `npm test -- src/lib/motion/tokens.test.ts` and verify the missing-module failure.
- [ ] Add `motion`, implement the constants and hook with no domain imports.
- [ ] Run the targeted test and verify it passes.

### Task 2: Shared Tabs and Badge

**Files:**
- Create: `src/components/ui/Tabs.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/ui.scss`
- Test: `src/components/ui/Tabs.test.tsx`
- Test: `src/components/ui/Badge.test.tsx`
- Modify: `src/app/globals.scss`

**Interfaces:**
- Produces: controlled `Tabs` with `items`, `value`, `onValueChange`, and `ariaLabel`; `Badge` with a `tone` union.

- [ ] Write failing tests for selection change, arrow-key navigation, ARIA state, and tone class exposure.
- [ ] Run the two targeted tests and verify they fail because the exports do not exist.
- [ ] Implement the smallest accessible, reduced-motion-safe components and Sass tokens.
- [ ] Run the targeted tests and verify they pass.

### Task 3: Shared Toast feedback primitive

**Files:**
- Create: `src/components/ui/ToastProvider.tsx`
- Test: `src/components/ui/ToastProvider.test.tsx`

**Interfaces:**
- Produces: `ToastProvider`, `useToast`, and `toast(message, { tone? })` for non-blocking feedback.

- [ ] Write failing tests for visible status feedback and the missing-provider error.
- [ ] Run the targeted test and verify it fails because the module does not exist.
- [ ] Implement a bounded in-memory toast queue using Motion presence; do not alter confirm-dialog behavior.
- [ ] Run the targeted test and verify it passes.

### Task 4: First dashboard adoption

**Files:**
- Modify: `src/app/_home/HomeClient.tsx`
- Modify: `src/app/page.scss`
- Test: `src/app/_home/HomeClient.test.tsx` or the smallest existing dashboard test target

**Interfaces:**
- Consumes: `Tabs` and `Badge` from Task 2.
- Produces: unchanged create/edit and type-selection behavior via common UI primitives.

- [ ] Write a failing dashboard rendering test that targets the common Tabs contract rather than implementation classes.
- [ ] Run the target and verify it fails before integration.
- [ ] Replace the selected dashboard tab surfaces and status badges without moving domain state into `src/components/ui`.
- [ ] Run the target and verify it passes.

### Task 5: Release gate

**Files:**
- Modify: `HANDOFF.md`

- [ ] Run `npm test`, `npm run lint`, `npm run build`, and `git diff --check`.
- [ ] Verify the dashboard at desktop and 390px mobile widths.
- [ ] Record changed UI, verification results, and any remaining components in `HANDOFF.md`.

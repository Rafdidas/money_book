# Inquiry Cursor Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace inquiry offset paging with a stable `created_at` and `id` cursor so newly created inquiries do not duplicate or skip later pages.

**Architecture:** The API returns a serializable cursor taken from the final displayed row. The Supabase query orders by both fields, applies the cursor before the range look-ahead, and returns the next cursor only when more rows exist. The page stores and passes that cursor rather than deriving a page number from rendered list length.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase JavaScript client, Vitest

## Global Constraints

- Do not alter Supabase schema, RLS, existing records, financial data, or inquiry data.
- Do not run migrations, remote Supabase commands, or deployments.
- Keep Korean UI copy and existing loading/error behavior.
- Use `created_at DESC, id DESC` as the stable order.

---

### Task 1: Cursor-aware inquiry API

**Files:**
- Modify: `src/lib/api/inquiries.ts`
- Modify: `src/lib/api/inquiries.test.ts`

**Interfaces:**
- Produces `InquiryCursor = { createdAt: string; id: string }`.
- Changes `getInquiries(cursor?: InquiryCursor, pageSize = 20)` to return `{ items, hasMore, nextCursor }`.

- [ ] Write a failing test with 21 mocked rows that expects `order("created_at", { ascending: false })`, `order("id", { ascending: false })`, a first-page range `0..20`, and a next cursor from row 20.
- [ ] Run `npm run test -- src/lib/api/inquiries.test.ts` and verify it fails because the offset signature does not return `nextCursor`.
- [ ] Write a failing cursor test that expects `.or("created_at.lt.<timestamp>,and(created_at.eq.<timestamp>,id.lt.<id>)")` before `range()`.
- [ ] Implement the `InquiryCursor` type, ordered look-ahead query, cursor filter, and next cursor calculation.
- [ ] Run the focused test and commit with `feat: add inquiry cursor pagination`.

### Task 2: Cursor-backed inquiry page

**Files:**
- Modify: `src/app/app/inquiries/page.tsx`

**Interfaces:**
- Consumes `nextCursor` from `getInquiries`.
- Stores `nextCursor: InquiryCursor | null`; the more button calls `getInquiries(nextCursor)`.

- [ ] Update initial loading to request without a cursor and store its `nextCursor`.
- [ ] Update more loading to use the stored cursor, preserve existing selected inquiry, merge defensively by ID, and replace the cursor with the response value.
- [ ] Ensure a newly created inquiry is prepended without changing the stored cursor.
- [ ] Run `npm run lint` and `npm run test`.

### Task 3: Release verification

- [ ] Run `npm run build`, `npm run test:e2e`, `npm audit --audit-level=high`, and `git diff --check`.
- [ ] Update `HANDOFF.md` with the cursor behavior, verification, and no-remote-change confirmation.
- [ ] Merge the verified `dev` branch into `main`, repeat lint/test/build/E2E on `main`, then remove the isolated worktree.

## Plan Self-Review

- The plan moves only client query boundaries; it does not change table structure or write existing rows.
- The UI retains current Korean copy and retry behavior.
- Every consumer of `getInquiries` is covered: initial load and more load in the inquiry page, plus unit tests.

# CSP Report-Only Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a non-blocking CSP Report-Only header that documents and observes the app's current resource origins.

**Architecture:** A static policy is built in `next.config.ts` and returned with the existing security headers. It permits current self, Google, jsDelivr, data/blob, and HTTPS connectivity sources but does not use nonce or turn on browser enforcement.

**Tech Stack:** Next.js 16, TypeScript, Playwright

## Global Constraints

- Do not change Supabase schema, RLS, or data.
- Do not deploy, configure remote reporting, run migrations, or set HSTS.
- Add only `Content-Security-Policy-Report-Only`; do not add enforcement header.

---

### Task 1: Report-only header

**Files:**
- Modify: `next.config.ts`

- [ ] Write a failing configuration assertion that reads `nextConfig.headers()` and expects a `Content-Security-Policy-Report-Only` entry containing `default-src 'self'` and `report-uri` omitted.
- [ ] Run the focused test and confirm the header is absent.
- [ ] Add the static policy including `script-src` for Google Tag Manager, `style-src` and `font-src` for jsDelivr, `connect-src 'self' https:`, `img-src 'self' data: blob: https:`, `object-src 'none'`, `base-uri 'self'`, and `frame-ancestors 'none'`.
- [ ] Run focused test and commit `feat: add csp report-only header`.

### Task 2: Release verification

- [ ] Run `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e`, `npm audit --audit-level=high`, and `git diff --check`.
- [ ] Record verification and no-remote-change confirmation in `HANDOFF.md`.
- [ ] Merge verified `dev` into `main` and repeat lint/test/build on `main` before cleanup.

## Plan Self-Review

- The policy reports only and cannot block scripts, styles, requests, or pages.
- No report receiver is introduced, so the policy does not create new storage or personal-data collection.
- HSTS and strict nonce CSP remain explicitly out of scope.

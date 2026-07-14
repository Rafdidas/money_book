# CSP Report Collection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare private 30-day Supabase storage and a sanitized CSP report receiver without applying it to the remote project.

**Architecture:** A migration creates the RLS-protected `csp_reports` table and an expiry function. A Node.js Route Handler accepts CSP JSON reports, strips query/fragment data, validates a fixed field set, and uses a server-only service-role client. CSP Report-Only headers point browsers to it after deployment.

**Tech Stack:** Next.js 16 Route Handlers, TypeScript, Supabase Postgres, Vitest

## Global Constraints

- Do not run the migration remotely, deploy, set secrets, or schedule deletion.
- Do not store query strings, fragments, cookies, IPs, user IDs, or request bodies.
- Retain reports for 30 days; ordinary roles have no table access.

---

### Task 1: Private report schema

**Files:**
- Create: `supabase/migrations/20260714000000_create_csp_reports.sql`

- [ ] Define table columns for sanitized report details and `created_at`.
- [ ] Enable RLS with no anon/authenticated read or write policy.
- [ ] Define `delete_expired_csp_reports()` for records older than 30 days without scheduling it.
- [ ] Validate the migration file with SQL review; do not execute it remotely.

### Task 2: Report handler and tests

**Files:**
- Create: `src/app/api/csp-reports/route.ts`
- Create: `src/app/api/csp-reports/route.test.ts`
- Create: `src/lib/supabase/service.ts`

- [ ] Write failing tests for JSON normalization, query/fragment removal, oversized input rejection, and empty 204 response.
- [ ] Implement a server-only service client requiring `SUPABASE_SERVICE_ROLE_KEY` only when the handler receives a valid report.
- [ ] Implement a 16 KiB body cap and fixed field validation before insert.
- [ ] Run focused and full tests.

### Task 3: Browser reporting and release gate

**Files:**
- Modify: `next.config.ts`
- Modify: `next.config.test.ts`

- [ ] Add `report-uri /api/csp-reports` and `report-to csp-endpoint` to Report-Only policy, plus a `Reporting-Endpoints` response header.
- [ ] Run lint, unit tests, build, E2E, audit, and diff checks.
- [ ] Update HANDOFF, merge verified dev into main, and leave remote migration/secret/deploy/cron for explicit approval.

## Plan Self-Review

- Storage and deletion code are local artifacts only; no operational data changes occur in this plan.
- The endpoint persists only sanitized metadata and does not expose table access to browser roles.

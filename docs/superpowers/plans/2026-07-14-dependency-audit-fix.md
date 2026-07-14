# Dependency Audit Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply only compatibility-preserving audit lockfile updates and verify the application remains healthy.

**Architecture:** Run `npm audit fix` in an isolated worktree, inspect the resulting package diff, and reject the work if package.json changes or a Next downgrade appears. Package lock changes are validated through the full existing test and build suite.

**Tech Stack:** npm, Next.js 16, Vitest, Playwright

## Global Constraints

- Never run `npm audit fix --force`.
- Do not change Supabase, data, schema, RLS, deployment, or environment variables.
- Accept only `package-lock.json` dependency resolution changes; `package.json` must remain unchanged.

---

### Task 1: Apply audited lockfile updates

**Files:**
- Modify: `package-lock.json`

- [ ] Run `npm audit fix` in `dev`.
- [ ] Verify `git diff --name-only` contains only `package-lock.json`.
- [ ] Run `npm audit --audit-level=high` and confirm no high vulnerability.
- [ ] Commit with `chore: update audited dependencies`.

### Task 2: Release verification

- [ ] Run `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e`, and `git diff --check`.
- [ ] Record remaining postcss risk and no-remote-change confirmation in `HANDOFF.md`.
- [ ] Fast-forward verified `dev` into `main`, repeat lint/test/build, then clean up worktree.

## Plan Self-Review

- The plan excludes breaking force updates and direct package manifest edits.
- The single expected artifact is the lockfile; any broader diff is a stop condition.

# Existing User Legal Consent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require existing members to accept the current terms and privacy policy before accessing Money Book after login.

**Architecture:** Keep the latest consent snapshot on `profiles` for fast gating and append every accepted legal version to `user_legal_consents`. A database-owned RPC records current consent atomically; client code can only read the status and invoke that RPC. Login, already-authenticated auth pages, and `/app` all use one status resolver to select `/app` or `/auth/consent`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Sass, Supabase PostgreSQL/RLS/RPC, Vitest, Playwright.

## Global Constraints

- Follow the existing Next.js 16 App Router conventions documented under `node_modules/next/dist/docs/` before modifying routes or client navigation.
- Keep user-facing copy in Korean and preserve the existing auth page visual system in `src/app/auth/auth.scss`.
- Do not add dependencies.
- `profiles` has no client write policy; consent writes must use `security definer` database code constrained by `auth.uid()`.
- Database time (`now()`) and database-owned current versions are the source of record; clients do not submit consent versions or timestamps.
- Demo mode remains exempt from legal-consent gating.
- Do not apply the migration to the remote Supabase project or deploy in this work.
- Run `npm run lint` after meaningful changes, and `npm run build` before completion. Verify desktop and mobile consent UI. Update `HANDOFF.md` after each meaningful step.

---

## File Map

- `src/lib/legal/legalDocuments.ts`: exposes the current terms and privacy versions and public-document metadata.
- `src/lib/legal/consentStatus.ts`: pure predicate for whether a profile needs current consent.
- `src/lib/legal/consentStatus.test.ts`: version/null/missing-profile predicate coverage.
- `src/lib/api/legalConsent.ts`: reads the authenticated user’s consent fields and invokes `record_current_legal_consent`.
- `supabase/migrations/20260804000000_add_legal_consent.sql`: creates profile fields, immutable history, RLS, secure RPC, and extends `handle_new_user_profile`.
- `src/app/auth/consent/page.tsx`: mandatory consent form and sign-out action.
- `src/app/auth/auth.scss`: scoped consent-page styles and mobile layout.
- `src/app/auth/login/page.tsx`, `src/app/auth/signup/page.tsx`, `src/app/providers.tsx`: redirect and app-route gate integration.
- `src/app/auth/consent/page.test.tsx`, `src/app/providers.test.tsx`: UI and routing coverage with mocked Supabase.
- `tests/e2e/legal-consent.spec.ts`: desktop/mobile regression path with a seeded or mocked authenticated state, if the existing E2E harness supports it.
- `HANDOFF.md`: implementation notes and verification record.

### Task 1: Legal version model and consent predicate

**Files:**
- Create: `src/lib/legal/legalDocuments.ts`
- Create: `src/lib/legal/consentStatus.ts`
- Create: `src/lib/legal/consentStatus.test.ts`

**Interfaces:**
- Produces `CURRENT_TERMS_VERSION`, `CURRENT_PRIVACY_VERSION` and `needsCurrentLegalConsent(profile)`.
- `needsCurrentLegalConsent` accepts `{ terms_version: string | null; privacy_version: string | null; terms_agreed_at: string | null; privacy_agreed_at: string | null; age_confirmed_at: string | null } | null`.

- [ ] **Step 1: Write the failing pure-function tests**

```ts
expect(needsCurrentLegalConsent(null)).toBe(true);
expect(needsCurrentLegalConsent({
  terms_version: CURRENT_TERMS_VERSION,
  privacy_version: CURRENT_PRIVACY_VERSION,
  terms_agreed_at: "2026-08-04T00:00:00Z",
  privacy_agreed_at: "2026-08-04T00:00:00Z",
  age_confirmed_at: "2026-08-04T00:00:00Z",
})).toBe(false);
expect(needsCurrentLegalConsent({ ...current, privacy_version: "2026-01-01" })).toBe(true);
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `npm run test -- src/lib/legal/consentStatus.test.ts`
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the constants and predicate**

```ts
export const CURRENT_TERMS_VERSION = "2026-08-04";
export const CURRENT_PRIVACY_VERSION = "2026-08-04";

export const needsCurrentLegalConsent = (profile: LegalConsentProfile | null) =>
  !profile ||
  profile.terms_version !== CURRENT_TERMS_VERSION ||
  profile.privacy_version !== CURRENT_PRIVACY_VERSION ||
  !profile.terms_agreed_at ||
  !profile.privacy_agreed_at ||
  !profile.age_confirmed_at;
```

- [ ] **Step 4: Run the focused test and commit the task**

Run: `npm run test -- src/lib/legal/consentStatus.test.ts`
Expected: PASS.

Commit:
```bash
git add src/lib/legal/legalDocuments.ts src/lib/legal/consentStatus.ts src/lib/legal/consentStatus.test.ts
git commit -m "feat: add legal consent status model"
```

### Task 2: Database consent history and authenticated recorder

**Files:**
- Create: `supabase/migrations/20260804000000_add_legal_consent.sql`

**Interfaces:**
- Consumes the Task 1 version values; copy their exact literals into the migration.
- Produces `public.record_current_legal_consent() returns void` executable by `authenticated` only.

- [ ] **Step 1: Write SQL assertions or a local-Supabase verification script before the migration**

Verify these cases after the migration is applied locally: a legacy profile has null fields; `authenticated` cannot insert directly into `user_legal_consents`; the RPC writes both tables; an unauthenticated RPC call fails.

- [ ] **Step 2: Apply the pre-migration checks locally**

Run: `npx supabase db reset`
Expected: the target table/function do not yet exist; direct consent-history writes cannot be tested until the migration is added.

- [ ] **Step 3: Implement one additive migration**

```sql
alter table public.profiles
  add column if not exists terms_version text,
  add column if not exists terms_agreed_at timestamptz,
  add column if not exists privacy_version text,
  add column if not exists privacy_agreed_at timestamptz,
  add column if not exists age_confirmed_at timestamptz;

create table public.user_legal_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null,
  privacy_version text not null,
  age_confirmed_at timestamptz not null,
  recorded_at timestamptz not null default now()
);
```

Extend `handle_new_user_profile()` only in `TG_OP = 'INSERT'`: validate the three signup metadata flags, write server timestamps and versions into `profiles`, then insert an identical history row. Preserve the email-only update branch unchanged.

Create `record_current_legal_consent()` as `security definer set search_path = public`; it must reject a null `auth.uid()`, update only `where id = auth.uid()`, insert that user’s history row, revoke public access, and grant execute only to `authenticated`. Add select-only own-row RLS for `user_legal_consents`, with no write policy.

- [ ] **Step 4: Reset local Supabase and run the stated SQL checks**

Run: `npx supabase db reset`
Expected: migration succeeds; legacy profiles retain null consent fields; direct client writes fail while the authenticated RPC records one profile snapshot and one history row.

- [ ] **Step 5: Commit the task**

```bash
git add supabase/migrations/20260804000000_add_legal_consent.sql
git commit -m "feat: record legal consent history"
```

### Task 3: Client legal-consent API and signup metadata

**Files:**
- Create: `src/lib/api/legalConsent.ts`
- Create: `src/lib/api/legalConsent.test.ts`
- Modify: `src/app/auth/signup/page.tsx`

**Interfaces:**
- Produces `getCurrentUserLegalConsent(): Promise<LegalConsentProfile | null>` and `recordCurrentLegalConsent(): Promise<void>`.
- Signup sends `name`, `termsAccepted: true`, `privacyAccepted: true`, and `ageConfirmed: true` only after local validation.

- [ ] **Step 1: Write failing tests for profile selection, RPC invocation, and rejected errors**

```ts
expect(supabase.from).toHaveBeenCalledWith("profiles");
expect(supabase.rpc).toHaveBeenCalledWith("record_current_legal_consent");
await expect(recordCurrentLegalConsent()).rejects.toThrow("동의 기록을 저장하지 못했습니다.");
```

- [ ] **Step 2: Run the API test and confirm it fails**

Run: `npm run test -- src/lib/api/legalConsent.test.ts`
Expected: FAIL because the API module does not exist.

- [ ] **Step 3: Implement the minimal API and signup controls**

Use `.select("terms_version, terms_agreed_at, privacy_version, privacy_agreed_at, age_confirmed_at").maybeSingle()` for the authenticated profile. Call `supabase.rpc("record_current_legal_consent")` without arguments.

Add three controlled required checkboxes to signup. Keep the existing `name` metadata and add the three boolean metadata fields only after all checkbox validations pass. Link the terms/privacy labels to `/legal/terms` and `/legal/privacy`; focus the first unchecked control and show Korean inline error text.

- [ ] **Step 4: Run focused tests and commit the task**

Run: `npm run test -- src/lib/api/legalConsent.test.ts`
Expected: PASS.

Commit:
```bash
git add src/lib/api/legalConsent.ts src/lib/api/legalConsent.test.ts src/app/auth/signup/page.tsx
git commit -m "feat: collect signup legal consent"
```

### Task 4: Gate login and protected app routes

**Files:**
- Modify: `src/app/providers.tsx`
- Modify: `src/app/auth/login/page.tsx`
- Create: `src/app/providers.test.tsx`

**Interfaces:**
- Consumes `getCurrentUserLegalConsent` and `needsCurrentLegalConsent`.
- Produces a single `getAuthenticatedDestination()` helper returning `"/app" | "/auth/consent" | "/auth/login"`.

- [ ] **Step 1: Write failing route-decision tests**

```ts
expect(await getAuthenticatedDestination()).toBe("/auth/login");
mockLegalProfile(legacyProfile);
expect(await getAuthenticatedDestination()).toBe("/auth/consent");
mockLegalProfile(currentProfile);
expect(await getAuthenticatedDestination()).toBe("/app");
```

- [ ] **Step 2: Run the focused provider test and confirm it fails**

Run: `npm run test -- src/app/providers.test.tsx`
Expected: FAIL because the destination helper does not exist.

- [ ] **Step 3: Implement a shared resolver and use it everywhere**

After password login and the login-page already-authenticated check, route to the resolver’s result rather than hard-coded `/app`. In `Providers`, after a non-demo user has been authenticated for an `/app` route, load the consent profile before setting `isAuthResolved`; redirect to `/auth/consent` and leave it unresolved when consent is stale/missing. Preserve `/auth/login` for no authenticated user and do not query Supabase for demo mode.

- [ ] **Step 4: Run focused tests and commit the task**

Run: `npm run test -- src/app/providers.test.tsx`
Expected: PASS.

Commit:
```bash
git add src/app/providers.tsx src/app/auth/login/page.tsx src/app/providers.test.tsx
git commit -m "feat: gate app access on legal consent"
```

### Task 5: Build the mandatory re-consent screen

**Files:**
- Create: `src/app/auth/consent/page.tsx`
- Create: `src/app/auth/consent/page.test.tsx`
- Modify: `src/app/auth/auth.scss`
- Modify: `src/app/auth/signup/page.tsx`

**Interfaces:**
- Consumes `recordCurrentLegalConsent`, `getAuthenticatedDestination`, Supabase `auth.signOut`, and the legal document links.
- Produces `/auth/consent`, which cannot route to `/app` before successful RPC completion.

- [ ] **Step 1: Write failing component tests**

```tsx
render(<ConsentPage />);
expect(screen.getByRole("heading", { name: "약관 재동의" })).toBeInTheDocument();
await user.click(screen.getByRole("button", { name: "동의하고 계속하기" }));
expect(recordCurrentLegalConsent).not.toHaveBeenCalled();
await selectAllRequiredChecks(user);
await user.click(screen.getByRole("button", { name: "동의하고 계속하기" }));
expect(mockRouterReplace).toHaveBeenCalledWith("/app");
```

- [ ] **Step 2: Run the component test and confirm it fails**

Run: `npm run test -- src/app/auth/consent/page.test.tsx`
Expected: FAIL because the route does not exist.

- [ ] **Step 3: Implement the form and styles**

Render a Korean heading, short explanation, three required checkboxes, legal-document links, inline validation, disabled submit state, Korean RPC failure message, and `로그아웃` button. On a successful RPC call, call the shared destination resolver; only replace with `/app` for a current profile, otherwise remain on the page with an error. On sign-out success, replace `/auth/login`.

Add only `.auth-consent*` selectors under the current auth stylesheet. Maintain keyboard-visible focus and 44px minimum interactive targets at the mobile breakpoint.

- [ ] **Step 4: Run focused tests and commit the task**

Run: `npm run test -- src/app/auth/consent/page.test.tsx`
Expected: PASS.

Commit:
```bash
git add src/app/auth/consent/page.tsx src/app/auth/consent/page.test.tsx src/app/auth/auth.scss
git commit -m "feat: add legal consent renewal screen"
```

### Task 6: Full verification, visual checks, and handoff

**Files:**
- Modify: `HANDOFF.md`
- Create: `tests/e2e/legal-consent.spec.ts` only if the test fixture can establish legacy/current authenticated users without contacting production.

**Interfaces:**
- Consumes all preceding tasks.
- Produces repeatable evidence for missing/stale/current consent and desktop/mobile accessibility.

- [ ] **Step 1: Add the regression test cases**

Cover: legacy null profile redirects from login and direct `/app` to `/auth/consent`; all-unchecked submit reports the first missing choice; successful RPC transitions to `/app`; current profile bypasses the renewal page; demo mode still opens `/app`; changing either version makes the profile stale.

- [ ] **Step 2: Run focused and full unit tests**

Run: `npm run test -- src/lib/legal/consentStatus.test.ts src/lib/api/legalConsent.test.ts src/app/providers.test.tsx src/app/auth/consent/page.test.tsx`
Expected: PASS.

Run: `npm run test`
Expected: PASS.

- [ ] **Step 3: Run static and production verification**

Run: `npm run lint`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Verify the rendered flow at both breakpoints**

Run the local app with a legacy authenticated fixture. Inspect `/auth/consent` at 1280×900 and 390×844: no horizontal overflow; all labels and links are visible; controls have keyboard focus; submit and logout affordances remain usable. Confirm direct `/app` navigation never renders app data before redirecting.

- [ ] **Step 5: Update handoff and commit the verification record**

Record the migration state (local only), exact test/build results, visual results, and any remaining remote/deployment work in `HANDOFF.md`.

```bash
git add HANDOFF.md tests/e2e/legal-consent.spec.ts
git commit -m "test: verify legal consent renewal"
```

## Plan Self-Review

- **Spec coverage:** Tasks 1–2 cover version ownership, append-only history, server timestamps, RLS, RPC, and legacy NULL state. Tasks 3–5 cover signup, login, existing sessions, direct protected-route access, mandatory consent, sign-out, and demo bypass. Task 6 covers stale-version, visual, lint, test, build, and handoff checks.
- **Placeholder scan:** No unresolved placeholder markers remain; conditional E2E creation is limited to a fixture capability check and does not replace the mandatory unit and visual verification.
- **Type consistency:** `LegalConsentProfile`, `needsCurrentLegalConsent`, `getCurrentUserLegalConsent`, `recordCurrentLegalConsent`, and `getAuthenticatedDestination` are defined once and consumed under the same names throughout.
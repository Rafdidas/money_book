# 최근 직접입력 카테고리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 회원이 직접 입력한 카테고리를 지출·수입·저축·투자 유형별로 최대 5개까지 다시 선택하고 추천 목록에서 삭제할 수 있게 만든다.

**Architecture:** Supabase `user_custom_categories` 테이블은 로그인 회원의 최근 카테고리를 보관하고 RLS로 소유자를 제한한다. 전용 API와 순수 목록 유틸리티가 저장·정렬·삭제를 담당하며, `HomeClient`는 로그인 모드에서 API, 데모 모드에서 전용 localStorage를 사용한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase, Sass, Vitest.

## Global Constraints

- 사용자 노출 문구는 한국어로 작성한다.
- 기존 `Expense`와 가계부 내역의 `category` 데이터는 변경하거나 삭제하지 않는다.
- 직접입력 카테고리는 `expense`, `income`, `savings`, `investment` 유형별로 독립 관리한다.
- 최근 목록은 최근 사용순 최대 5개만 표시하고, 삭제는 추천 목록에만 적용한다.
- 새 시각화 의존성을 추가하지 않는다.
- Next.js 16 관련 구현 전 `node_modules/next/dist/docs/`의 관련 가이드를 확인한다.
- 각 코드 변경 전에는 실패하는 테스트를 먼저 작성하고, 변경 후 `npm run lint`와 완료 전 `npm run build`를 실행한다.

---

### Task 1: 최근 직접입력 카테고리 데이터 모델과 Supabase API

**Files:**
- Create: `supabase/migrations/20260720000000_create_user_custom_categories.sql`
- Create: `src/lib/api/customCategories.ts`
- Create: `src/lib/api/customCategories.test.ts`

**Interfaces:**
- Produces: `CustomCategoryType = "expense" | "income" | "savings" | "investment"`.
- Produces: `CustomCategory = { id: string; type: CustomCategoryType; name: string; lastUsedAt: string }`.
- Produces: `getRecentCustomCategories(): Promise<CustomCategory[]>`, `saveCustomCategory(type: CustomCategoryType, name: string): Promise<CustomCategory>`, `deleteCustomCategory(id: string): Promise<void>`.

- [ ] **Step 1: Write failing API tests**

```ts
it("loads the five newest categories for the authenticated user", async () => {
  await expect(getRecentCustomCategories()).resolves.toEqual([
    { id: "category-1", type: "expense", name: "병원", lastUsedAt: "2026-07-20T00:00:00.000Z" },
  ]);
});

it("upserts a normalized category and returns the saved row", async () => {
  await expect(saveCustomCategory("expense", " 병원 ")).resolves.toMatchObject({
    type: "expense",
    name: "병원",
  });
});
```

- [ ] **Step 2: Run the API tests and verify failure**

Run: `npm run test -- src/lib/api/customCategories.test.ts`

Expected: FAIL because `customCategories.ts` and its exports do not exist.

- [ ] **Step 3: Add the migration**

```sql
create table if not exists public.user_custom_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_type text not null check (entry_type in ('expense', 'income', 'savings', 'investment')),
  name text not null check (char_length(btrim(name)) > 0),
  normalized_name text not null,
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, entry_type, normalized_name)
);

create index if not exists idx_user_custom_categories_recent
  on public.user_custom_categories(user_id, entry_type, last_used_at desc);
```

Add select, insert, update, and delete RLS policies using `auth.uid() = user_id`, matching the existing recurring-table policy style.

- [ ] **Step 4: Implement the API module**

```ts
export type CustomCategoryType = "expense" | "income" | "savings" | "investment";

export const normalizeCustomCategoryName = (name: string) => name.trim().toLocaleLowerCase("en-US");

export const saveCustomCategory = async (type: CustomCategoryType, name: string) => {
  const trimmedName = name.trim();
  // Resolve the authenticated user, upsert user_id + entry_type + normalized_name,
  // set last_used_at to the current ISO timestamp, select and map the saved row.
};
```

Use `.upsert(..., { onConflict: "user_id,entry_type,normalized_name" })`, return only `id`, `entry_type`, `name`, and `last_used_at`, order query results by `last_used_at` descending, and limit the retrieval query to 20 rows so the client can group safely.

- [ ] **Step 5: Run API tests and verify pass**

Run: `npm run test -- src/lib/api/customCategories.test.ts`

Expected: PASS with authentication, query shape, mapping, and failure propagation covered.

- [ ] **Step 6: Commit Task 1**

```bash
git add supabase/migrations/20260720000000_create_user_custom_categories.sql src/lib/api/customCategories.ts src/lib/api/customCategories.test.ts
git commit -m "feat: store recent custom categories"
```

### Task 2: 데모 목록 저장과 화면 독립 목록 유틸리티

**Files:**
- Create: `src/app/_home/customCategories.ts`
- Create: `src/app/_home/customCategories.test.ts`
- Modify: `src/lib/demo.ts`

**Interfaces:**
- Consumes: `CustomCategory`, `CustomCategoryType` from `src/lib/api/customCategories.ts`.
- Produces: `getRecentCategoriesForType(categories, type): CustomCategory[]` and `upsertRecentCategory(categories, category): CustomCategory[]`.
- Produces: `readDemoCustomCategories(): CustomCategory[]`, `writeDemoCustomCategories(categories: CustomCategory[]): void`, and reset integration in `clearDemoMode()`.

- [ ] **Step 1: Write failing pure-function tests**

```ts
it("keeps five newest categories for one type without affecting another type", () => {
  expect(getRecentCategoriesForType(categories, "expense")).toHaveLength(5);
  expect(getRecentCategoriesForType(categories, "income")).toEqual([incomeCategory]);
});

it("moves a reused normalized category to the front without duplicating it", () => {
  expect(upsertRecentCategory(categories, reusedCategory)).toHaveLength(categories.length);
});
```

- [ ] **Step 2: Run utility tests and verify failure**

Run: `npm run test -- src/app/_home/customCategories.test.ts`

Expected: FAIL because the module exports do not exist.

- [ ] **Step 3: Implement deterministic list helpers**

```ts
export const getRecentCategoriesForType = (categories: CustomCategory[], type: CustomCategoryType) =>
  categories
    .filter((category) => category.type === type)
    .toSorted((left, right) => right.lastUsedAt.localeCompare(left.lastUsedAt))
    .slice(0, 5);
```

`upsertRecentCategory` must replace a same-type, same-normalized-name item, preserve categories of other types, and return a new array. Add a versioned `mb-demo-custom-categories` key, parse only arrays of valid records, and remove it in `clearDemoMode()`.

- [ ] **Step 4: Run utility tests and verify pass**

Run: `npm run test -- src/app/_home/customCategories.test.ts`

Expected: PASS for type separation, sort order, five-item display limit, normalized deduplication, and deletion-ready immutable output.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/app/_home/customCategories.ts src/app/_home/customCategories.test.ts src/lib/demo.ts
git commit -m "feat: persist demo custom categories"
```

### Task 3: 내역 추가·수정 폼 연결

**Files:**
- Modify: `src/app/_home/HomeClient.tsx`
- Modify: `src/app/_home/home.scss` or the existing stylesheet that defines `.main-overview--field`
- Test: `src/app/_home/customCategories.test.ts`

**Interfaces:**
- Consumes: Task 1 API functions and types.
- Consumes: Task 2 demo persistence and `getRecentCategoriesForType`.
- Produces: direct-entry form behavior: select a suggestion, delete a suggestion, save a direct entry.

- [ ] **Step 1: Add failing behavior tests for the state helper**

```ts
it("removes only the requested suggestion while leaving the selected input text intact", () => {
  expect(removeCustomCategory(categories, "category-2")).not.toContainEqual(categories[1]);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm run test -- src/app/_home/customCategories.test.ts`

Expected: FAIL because `removeCustomCategory` does not exist.

- [ ] **Step 3: Add state and handlers to `HomeClient`**

```ts
const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
const recentCustomCategories = useMemo(
  () => getRecentCategoriesForType(customCategories, inlineType),
  [customCategories, inlineType],
);
```

Load remote categories in parallel with dashboard records after auth resolution. For demo mode, read the demo key. After a successful create or update using `customCategoryValue`, save the category after the expense request; update local state only if the category save succeeds. If category persistence fails, keep the successful expense save and call `alert("최근 카테고리를 저장하지 못했습니다.")`.

Add a deletion handler that calls `deleteCustomCategory` or writes demo storage first, then removes only that ID from `customCategories`; on error call `alert("최근 카테고리를 삭제하지 못했습니다.")`.

- [ ] **Step 4: Render the accessible recent category controls**

```tsx
{recentCustomCategories.length ? (
  <div className="main-overview--custom-category-list" aria-label="최근 직접입력 카테고리">
    {recentCustomCategories.map((category) => (
      <span className="main-overview--custom-category-chip" key={category.id}>
        <button type="button" onClick={() => setInlineCustomCategory(category.name)}>{category.name}</button>
        <button type="button" aria-label={`${category.name} 최근 카테고리 삭제`} onClick={() => handleCustomCategoryDelete(category.id)}>
          <AppIcon name="close" />
        </button>
      </span>
    ))}
  </div>
) : null}
```

Place this list between the direct-entry label and text input. Change the label to `직접입력 카테고리`; neither click action may alter existing expense data.

- [ ] **Step 5: Run behavior tests and verify pass**

Run: `npm run test -- src/app/_home/customCategories.test.ts`

Expected: PASS for deletion state behavior plus all Task 2 cases.

- [ ] **Step 6: Commit Task 3**

```bash
git add src/app/_home/HomeClient.tsx src/app/_home/customCategories.ts src/app/_home/customCategories.test.ts src/app/_home/home.scss
git commit -m "feat: reuse recent custom categories in entry form"
```

### Task 4: 반응형 스타일, 통합 검증, 인계 문서

**Files:**
- Modify: stylesheet selected in Task 3
- Modify: `HANDOFF.md`

**Interfaces:**
- Consumes: `main-overview--custom-category-list` and `main-overview--custom-category-chip` rendered by Task 3.
- Produces: readable desktop/mobile chip layout and an implementation handoff entry.

- [ ] **Step 1: Add scoped Sass styles**

```scss
.main-overview--custom-category-list { display: flex; flex-wrap: wrap; gap: 8px; }
.main-overview--custom-category-chip { display: inline-flex; align-items: center; max-width: 100%; }
.main-overview--custom-category-chip > button:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
```

Use the project button tokens and provide a visible keyboard focus style. At the mobile breakpoint, retain wrapping and prevent the delete control from shrinking below a tappable size.

- [ ] **Step 2: Run focused and full automated verification**

Run: `npm run test -- src/lib/api/customCategories.test.ts src/app/_home/customCategories.test.ts`

Expected: PASS.

Run: `npm run lint`

Expected: exit code 0.

Run: `npm run test`

Expected: exit code 0.

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 3: Verify the rendered UI at desktop and mobile widths**

Open the home page, select `직접 입력` for every type, save a category, select its suggestion, delete it, and confirm the existing expense remains. Inspect at a desktop width and at 390px: names wrap, the delete buttons remain visible, and no horizontal page overflow appears.

- [ ] **Step 4: Update handoff and commit Task 4**

Add `HANDOFF.md` notes for changed files, migration status, commands run, desktop/mobile verification, and any remaining remote Supabase migration or deployment step.

```bash
git add HANDOFF.md src/app/_home/home.scss
git commit -m "style: polish recent category controls"
```

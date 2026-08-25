# 사용자 카테고리 관리와 자주 쓰기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기본 카테고리를 보존하면서 사용자 카테고리 CRUD, 유형별 최대 5개의 자주 쓰기, 거래 입력 모달과 마이페이지 관리 카드를 구현한다.

**Architecture:** 기존 `user_custom_categories` 테이블과 RLS를 확장하고, Supabase/데모 저장소 차이를 공통 클라이언트 훅 뒤에 숨긴다. 표시와 입력은 재사용 가능한 `CategoryManager`와 홈 전용 `InlineCategorySelector`로 분리하며, 기존 거래의 문자열 카테고리는 수정하지 않는다.

**Tech Stack:** Next.js 16 App Router, React 19 Client Components, TypeScript, Sass/CSS Modules, Supabase Postgres/RLS, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-08-25-custom-category-management-design.md`

## Global Constraints

- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`와 `11-css.md`의 Next.js 16 지침을 따른다.
- 기본 카테고리는 추가·수정·삭제 또는 자주 쓰기 대상이 아니다.
- 사용자 카테고리 수정·삭제는 기존 거래의 `category` 문자열을 변경하지 않는다.
- 자주 쓰는 사용자 카테고리는 사용자·유형별 최대 5개다.
- 로그인 사용자는 Supabase/RLS, 데모 사용자는 버전형 localStorage를 사용한다.
- 사용자에게 보이는 문구는 한국어로 작성하고 모바일 핵심 조작 영역은 최소 44px로 유지한다.
- 새 시각화·상태 관리 의존성을 추가하지 않는다.
- 의미 있는 작업 단계마다 `HANDOFF.md`를 갱신한다.
- 구현 완료 전 `npm test`, `npm run lint`, `npm run build`와 데스크톱·모바일 시각 검증을 수행한다.

---

## File Map

- Create `supabase/migrations/20260825000000_add_custom_category_favorites.sql`: `is_favorite`, 최근 사용 trigger 수정, 동시성 안전한 유형별 5개 제한을 소유한다.
- Modify `src/lib/api/customCategories.ts`: 로그인 사용자 전체 조회와 create/touch/rename/delete/favorite API를 소유한다.
- Modify `src/lib/api/customCategories.test.ts`: Supabase query 형태와 인증 사용자 범위를 검증한다.
- Create `src/lib/customCategoryRules.ts`: 이름 검증, 유형별 정렬, 즐겨찾기 선택, 불변 상태 변환을 소유한다.
- Create `src/lib/customCategoryRules.test.ts`: 공유 순수 규칙을 검증한다.
- Delete in Task 6 `src/app/_home/customCategories.ts` and `src/app/_home/customCategories.test.ts`: 홈 전용 최근 목록 규칙을 공유 규칙으로 대체한다.
- Modify `src/lib/demo.ts` and `src/lib/demo.test.ts`: v1 데이터를 보존하는 v2 카테고리 저장소를 소유한다.
- Create `src/hooks/useCustomCategories.ts` and `src/hooks/useCustomCategories.test.tsx`: Supabase/데모 분기, 로드, 오류, mutation 상태를 소유한다.
- Create `src/components/category/CategoryManager.tsx`, `CategoryManager.module.scss`, and `CategoryManager.test.tsx`: 재사용 가능한 관리 화면을 소유한다.
- Modify `src/components/common/Modal.tsx` and create `src/components/common/Modal.test.tsx`: dialog semantics, 초점 진입·복원, Tab trap, ESC를 소유한다.
- Create `src/app/_home/InlineCategorySelector.tsx` and `InlineCategorySelector.test.tsx`: 거래 폼의 기본/사용자 선택지, 즐겨찾기 칩, 직접 입력, 관리 버튼을 소유한다.
- Modify `src/app/_home/HomeClient.tsx` and `src/app/page.scss`: 홈 상태 연결과 관리 모달 배치를 소유한다.
- Modify `src/app/app/mypage/page.tsx`, `page.test.tsx`, and `mypage.scss`: 로그인/데모 카테고리 관리 카드를 소유한다.
- Modify `HANDOFF.md`: 구현·검증·배포 순서를 기록한다.

---

### Task 1: Supabase 스키마와 로그인 사용자 API 확장

**Files:**
- Create: `supabase/migrations/20260825000000_add_custom_category_favorites.sql`
- Modify: `src/lib/api/customCategories.ts`
- Test: `src/lib/api/customCategories.test.ts`
- Modify for the required field: `src/app/_home/HomeClient.tsx`, `src/app/_home/customCategories.test.ts`, `src/lib/demo.test.ts`

**Interfaces:**
- Produces: `CustomCategory`에 `isFavorite: boolean`
- Produces: `getCustomCategories(): Promise<CustomCategory[]>`
- Produces: `createCustomCategory(type, name): Promise<CustomCategory>`
- Produces: `touchCustomCategory(type, name): Promise<CustomCategory>`
- Produces: `renameCustomCategory(id, name): Promise<CustomCategory>`
- Produces: `setCustomCategoryFavorite(id, isFavorite): Promise<CustomCategory>`
- Preserves: `deleteCustomCategory(id): Promise<void>`

- [ ] **Step 1: 전체 조회와 새 mutation의 실패 테스트 작성**

`src/lib/api/customCategories.test.ts`에서 최근 5개/유형별 4회 query 테스트를 제거하고 다음 동작을 구체적으로 검증한다.

```ts
it("loads every category ordered by type, favorite, and recent use", async () => {
  const queryResult = {
    data: [{
      id: "category-1",
      entry_type: "expense",
      name: "반려동물",
      last_used_at: "2026-08-25T00:00:00.000Z",
      is_favorite: true,
    }],
    error: null,
  };
  const thirdOrder = vi.fn().mockResolvedValue(queryResult);
  const secondOrder = vi.fn(() => ({ order: thirdOrder }));
  const firstOrder = vi.fn(() => ({ order: secondOrder }));
  const eq = vi.fn(() => ({ order: firstOrder }));
  from.mockReturnValue({ select: vi.fn(() => ({ eq })) });

  await expect(getCustomCategories()).resolves.toEqual([{
    id: "category-1",
    type: "expense",
    name: "반려동물",
    lastUsedAt: "2026-08-25T00:00:00.000Z",
    isFavorite: true,
  }]);
  expect(firstOrder).toHaveBeenCalledWith("entry_type", { ascending: true });
  expect(secondOrder).toHaveBeenCalledWith("is_favorite", { ascending: false });
  expect(thirdOrder).toHaveBeenCalledWith("last_used_at", { ascending: false });
});
```

추가 테스트는 create가 `insert`, touch가 `upsert`와 `last_used_at`, rename/favorite가 `update().eq("id").eq("user_id")`, delete가 기존 사용자 범위를 사용하는지 각각 검증한다. 모든 반환 row에는 `is_favorite`가 포함되어야 한다.

- [ ] **Step 2: API 테스트가 현재 구현에서 실패하는지 확인**

Run: `npm test -- src/lib/api/customCategories.test.ts`

Expected: FAIL because `getCustomCategories`, `createCustomCategory`, `touchCustomCategory`, `renameCustomCategory`, `setCustomCategoryFavorite` do not exist and `CustomCategory` has no `isFavorite`.

- [ ] **Step 3: 동시성 안전한 migration 작성**

`supabase/migrations/20260825000000_add_custom_category_favorites.sql`에 다음 핵심 SQL을 작성한다.

```sql
alter table public.user_custom_categories
  add column if not exists is_favorite boolean not null default false;

create index if not exists idx_user_custom_categories_listing
  on public.user_custom_categories(
    user_id,
    entry_type,
    is_favorite desc,
    last_used_at desc
  );

create or replace function public.set_user_custom_category_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name := btrim(new.name);
  new.normalized_name := lower(new.name);
  return new;
end;
$$;

create or replace function public.enforce_user_custom_category_favorite_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_favorite then
    perform pg_advisory_xact_lock(
      hashtextextended(new.user_id::text || ':' || new.entry_type, 0)
    );

    if (
      select count(*)
      from public.user_custom_categories
      where user_id = new.user_id
        and entry_type = new.entry_type
        and is_favorite
        and id <> new.id
    ) >= 5 then
      raise exception using
        errcode = 'P0001',
        message = 'custom_category_favorite_limit';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_user_custom_category_favorite_limit
  on public.user_custom_categories;
create trigger enforce_user_custom_category_favorite_limit
  before insert or update of is_favorite, entry_type, user_id
  on public.user_custom_categories
  for each row execute function public.enforce_user_custom_category_favorite_limit();
```

기존 행은 default `false`로 유지한다. 기존 `set_user_custom_category_fields` trigger는 그대로 연결하되 더 이상 모든 update에서 `last_used_at`을 바꾸지 않게 위 함수로 교체한다.

- [ ] **Step 4: 로그인 사용자 API 최소 구현**

row mapping과 mutation select 열을 하나의 상수로 통일하고 다음 형태를 구현한다.

```ts
export type CustomCategory = {
  id: string;
  type: CustomCategoryType;
  name: string;
  lastUsedAt: string;
  isFavorite: boolean;
};

const customCategoryColumns =
  "id, entry_type, name, last_used_at, is_favorite";

export const getCustomCategories = async (): Promise<CustomCategory[]> => {
  const userId = await getAuthenticatedUserId();
  const { data, error } = await supabase
    .from("user_custom_categories")
    .select(customCategoryColumns)
    .eq("user_id", userId)
    .order("entry_type", { ascending: true })
    .order("is_favorite", { ascending: false })
    .order("last_used_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as CustomCategoryRow[]).map(toCustomCategory);
};
```

`createCustomCategory`는 `insert({ user_id, entry_type, name, is_favorite: false })`, `touchCustomCategory`는 기존 conflict key로 upsert하면서 `last_used_at: new Date().toISOString()`, rename/favorite은 user ID를 포함한 update를 사용한다. 데이터베이스 message가 `custom_category_favorite_limit`이면 `자주 쓰는 카테고리는 유형별로 5개까지 지정할 수 있습니다.`로 변환한다.

HomeClient의 데모 직접입력 category literal과 기존 custom category test fixtures에는 `isFavorite: false`를 추가한다. 기존 `getRecentCustomCategories`는 Home 연동 전까지 호환 wrapper로 유지하되 새 row mapping을 사용하고, Task 6에서 호출부와 함께 제거한다. 이 단계의 커밋은 전체 TypeScript build가 가능한 상태여야 한다.

- [ ] **Step 5: API 테스트 통과 확인**

Run: `npm test -- src/lib/api/customCategories.test.ts`

Expected: PASS for whole-list mapping, create/touch/rename/favorite/delete, authentication, and database errors.

- [ ] **Step 6: migration과 API 커밋**

```bash
git add supabase/migrations/20260825000000_add_custom_category_favorites.sql src/lib/api/customCategories.ts src/lib/api/customCategories.test.ts src/app/_home/HomeClient.tsx src/app/_home/customCategories.test.ts src/lib/demo.test.ts
git commit -m "feat: extend custom category persistence"
```

---

### Task 2: 공유 카테고리 규칙과 데모 v2 저장소

**Files:**
- Create: `src/lib/customCategoryRules.ts`
- Create: `src/lib/customCategoryRules.test.ts`
- Modify: `src/lib/demo.ts`
- Test: `src/lib/demo.test.ts`

**Interfaces:**
- Consumes: `CustomCategory`, `CustomCategoryType`
- Produces: `CUSTOM_CATEGORY_FAVORITE_LIMIT = 5`
- Produces: `getCategoriesForType`, `getFavoriteCategoriesForType`, `getCustomCategoryNameError`, `replaceCustomCategory`, `removeCustomCategory`
- Produces: v2 `readDemoCustomCategories()` and `writeDemoCustomCategories()` preserving v1 rows as `isFavorite: false`

- [ ] **Step 1: 공유 규칙의 실패 테스트 작성**

`src/lib/customCategoryRules.test.ts`에 다음 사례를 실제 category fixture로 작성한다.

```ts
it("returns at most five favorite categories for one type", () => {
  const categories = Array.from({ length: 6 }, (_, index) => ({
    id: `expense-${index}`,
    type: "expense" as const,
    name: `분류 ${index}`,
    lastUsedAt: `2026-08-2${index}T00:00:00.000Z`,
    isFavorite: true,
  }));

  expect(getFavoriteCategoriesForType(categories, "expense")).toEqual(
    categories.toSorted((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt)).slice(0, 5),
  );
});

it("rejects a duplicate user name and a default category name", () => {
  const categories = [category({ id: "pet", name: "반려동물" })];
  expect(getCustomCategoryNameError({
    categories,
    type: "expense",
    name: " 반려동물 ",
    defaultNames: ["🍚식비"],
  })).toBe("이미 등록된 카테고리입니다.");
  expect(getCustomCategoryNameError({
    categories,
    type: "expense",
    name: "🍚식비",
    defaultNames: ["🍚식비"],
  })).toBe("기본 카테고리와 같은 이름은 사용할 수 없습니다.");
});
```

같은 ID를 제외하는 rename, 다른 유형의 같은 이름 허용, favorite 우선/최근 사용순 정렬, 불변 replace/remove도 각각 검증한다.

- [ ] **Step 2: 데모 v1 호환 실패 테스트 작성**

`src/lib/demo.test.ts`에서 legacy key에 `isFavorite` 없는 row를 넣고 v2로 읽히는지 검증한다.

```ts
window.localStorage.setItem(
  DEMO_CUSTOM_CATEGORIES_LEGACY_STORAGE_KEY,
  JSON.stringify([legacyCategory]),
);

expect(readDemoCustomCategories()).toEqual([
  { ...legacyCategory, isFavorite: false },
]);
expect(window.localStorage.getItem(DEMO_CUSTOM_CATEGORIES_STORAGE_KEY)).not.toBeNull();
expect(window.localStorage.getItem(DEMO_CUSTOM_CATEGORIES_LEGACY_STORAGE_KEY)).toBeNull();
```

v2는 boolean이 아닌 `isFavorite` row를 버리고, write/read와 `clearDemoMode()`가 v1·v2 key를 모두 제거하는 테스트도 추가한다.

- [ ] **Step 3: 규칙과 데모 테스트가 실패하는지 확인**

Run: `npm test -- src/lib/customCategoryRules.test.ts src/lib/demo.test.ts`

Expected: FAIL because the shared rule module, v2 key, legacy migration, and `isFavorite` validation do not exist.

- [ ] **Step 4: 공유 순수 규칙 구현**

```ts
export const CUSTOM_CATEGORY_FAVORITE_LIMIT = 5;

export const getFavoriteCategoriesForType = (
  categories: CustomCategory[],
  type: CustomCategoryType,
) => getCategoriesForType(categories, type)
  .filter((category) => category.isFavorite)
  .slice(0, CUSTOM_CATEGORY_FAVORITE_LIMIT);

export const getCustomCategoryNameError = ({
  categories,
  type,
  name,
  defaultNames,
  excludeId,
}: ValidateCustomCategoryNameOptions): string => {
  const normalizedName = normalizeCustomCategoryName(name);
  if (!normalizedName) return "카테고리 이름을 입력해주세요.";
  if (defaultNames.some((item) => normalizeCustomCategoryName(item) === normalizedName)) {
    return "기본 카테고리와 같은 이름은 사용할 수 없습니다.";
  }
  if (categories.some((item) =>
    item.id !== excludeId &&
    item.type === type &&
    normalizeCustomCategoryName(item.name) === normalizedName
  )) return "이미 등록된 카테고리입니다.";
  return "";
};
```

`getCategoriesForType`은 favorite 우선, 그다음 `lastUsedAt` 내림차순으로 새 배열을 반환한다. `replaceCustomCategory`는 동일 ID만 교체하고, `removeCustomCategory`는 동일 ID만 제거한다.

- [ ] **Step 5: 데모 v2 migration 구현**

```ts
export const DEMO_CUSTOM_CATEGORIES_STORAGE_KEY = "mb-demo-custom-categories:v2";
export const DEMO_CUSTOM_CATEGORIES_LEGACY_STORAGE_KEY = "mb-demo-custom-categories:v1";

const toDemoCustomCategory = (value: unknown): CustomCategory | null => {
  if (!isDemoCustomCategoryBase(value)) return null;
  const category = value as Record<string, unknown>;
  if (typeof category.isFavorite !== "boolean") return null;
  return category as CustomCategory;
};
```

`readDemoCustomCategories`는 v2가 있으면 v2만 검증한다. v2가 없고 v1이 있으면 기존 base 필드를 검증한 뒤 `isFavorite: false`를 붙여 v2에 쓰고 v1을 제거한다. `clearDemoMode`는 두 key를 모두 제거한다.

- [ ] **Step 6: 공유 규칙과 데모 테스트 통과 확인**

Run: `npm test -- src/lib/customCategoryRules.test.ts src/lib/demo.test.ts`

Expected: PASS.

- [ ] **Step 7: 공유 규칙과 데모 저장소 커밋**

기존 `src/app/_home/customCategories.ts`와 테스트는 HomeClient 호출부가 교체되는 Task 6까지 유지한다. 따라서 이 단계도 전체 TypeScript build가 가능한 상태로 끝낸다.

```bash
git add src/lib/customCategoryRules.ts src/lib/customCategoryRules.test.ts src/lib/demo.ts src/lib/demo.test.ts
git commit -m "feat: add shared custom category rules"
```

---

### Task 3: Supabase와 데모를 통합하는 카테고리 상태 훅

**Files:**
- Create: `src/hooks/useCustomCategories.ts`
- Test: `src/hooks/useCustomCategories.test.tsx`

**Interfaces:**
- Consumes: Task 1 API와 Task 2 demo/rule functions
- Produces: `useCustomCategories({ enabled, isDemoMode, defaultOptionsByType })`
- Produces result: `categories`, `isLoading`, `loadError`, `mutationError`, `busyKey`, `reload`, `addCategory`, `renameCategory`, `deleteCategory`, `toggleFavorite`, `recordUsedCategory`

```ts
export type UseCustomCategoriesResult = {
  categories: CustomCategory[];
  isLoading: boolean;
  loadError: string;
  mutationError: string;
  busyKey: string;
  reload: () => Promise<void>;
  addCategory: (type: CustomCategoryType, name: string) => Promise<boolean>;
  renameCategory: (category: CustomCategory, name: string) => Promise<boolean>;
  deleteCategory: (category: CustomCategory) => Promise<boolean>;
  toggleFavorite: (category: CustomCategory) => Promise<boolean>;
  recordUsedCategory: (type: CustomCategoryType, name: string) => Promise<CustomCategory | null>;
};
```

- [ ] **Step 1: 훅의 로그인/데모 실패 테스트 작성**

Testing Library의 `renderHook`으로 다음을 검증한다.

```ts
const { result } = renderHook(() => useCustomCategories({
  enabled: true,
  isDemoMode: false,
  defaultOptionsByType,
}));

await waitFor(() => expect(result.current.isLoading).toBe(false));
expect(getCustomCategories).toHaveBeenCalledOnce();
expect(result.current.categories).toEqual([savedCategory]);
```

별도 테스트에서 `enabled: false`는 어떤 저장소도 조회하지 않고, 데모 모드는 `readDemoCustomCategories`만 호출하며, load 실패는 `loadError`를 설정하고 빈 목록으로 다른 화면을 막지 않는지 확인한다. add/rename/delete/toggle은 저장 성공 뒤에만 목록을 바꾸고, 실패 시 기존 참조 내용을 보존하는지 검증한다.

- [ ] **Step 2: 이름·5개 제한·과거 거래 불변 테스트 작성**

```ts
await act(async () => {
  await result.current.toggleFavorite(nonFavoriteCategory);
});

expect(setCustomCategoryFavorite).not.toHaveBeenCalled();
expect(result.current.mutationError).toBe(
  "자주 쓰는 카테고리는 유형별로 5개까지 지정할 수 있습니다.",
);
```

rename/delete가 category 상태만 바꾸고 expense API는 import하거나 호출하지 않는 구조인지 테스트 mock 목록으로 보장한다. `recordUsedCategory`는 직접입력 저장 후 touch 결과를 `replaceCustomCategory`로 반영하며 기존 favorite 값을 보존한다.

- [ ] **Step 3: 훅 테스트가 실패하는지 확인**

Run: `npm test -- src/hooks/useCustomCategories.test.tsx`

Expected: FAIL because `useCustomCategories` does not exist.

- [ ] **Step 4: 훅 최소 구현**

```ts
export const useCustomCategories = ({
  enabled,
  isDemoMode,
  defaultOptionsByType,
}: UseCustomCategoriesOptions): UseCustomCategoriesResult => {
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [loadError, setLoadError] = useState("");
  const [mutationError, setMutationError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const reload = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError("");
    try {
      setCategories(isDemoMode
        ? readDemoCustomCategories()
        : await getCustomCategories());
    } catch {
      setLoadError("카테고리를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [enabled, isDemoMode]);

  useEffect(() => { void reload(); }, [reload]);
```

mutation 공통 wrapper는 `busyKey`와 오류를 설정하고 영속 저장 성공 뒤에만 `setCategories`를 호출한다. add/rename/delete/toggle은 성공 여부 boolean을 반환하고, `recordUsedCategory`는 저장 row 또는 실패 시 `null`을 반환한다. demo add는 `crypto.randomUUID()`와 현재 ISO 시각, `isFavorite: false`를 사용한다. toggle 제한은 API 호출 전에 검사하고 서버의 제한 오류가 나면 `reload()`로 상태를 맞춘다.

- [ ] **Step 5: 훅 테스트와 영향을 받은 기존 테스트 통과 확인**

Run: `npm test -- src/hooks/useCustomCategories.test.tsx src/lib/customCategoryRules.test.ts src/lib/demo.test.ts src/lib/api/customCategories.test.ts`

Expected: PASS.

- [ ] **Step 6: 공통 훅 커밋**

```bash
git add src/hooks/useCustomCategories.ts src/hooks/useCustomCategories.test.tsx
git commit -m "feat: add custom category state hook"
```

---

### Task 4: 재사용 가능한 CategoryManager 구현

**Files:**
- Create: `src/components/category/CategoryManager.tsx`
- Create: `src/components/category/CategoryManager.module.scss`
- Test: `src/components/category/CategoryManager.test.tsx`

**Interfaces:**
- Consumes: `UseCustomCategoriesResult`의 목록·상태·mutation callbacks
- Produces: `CategoryManager` with optional `onUse(category: CustomCategory): void`
- Requires: heading ID를 외부에서 받아 modal `aria-labelledby`와 연결할 수 있어야 한다.

- [ ] **Step 1: 탭·추가·수정·삭제·별표의 실패 테스트 작성**

```tsx
render(
  <CategoryManager
    headingId="category-manager-title"
    categories={[favoriteCategory, normalCategory]}
    selectedType="expense"
    isLoading={false}
    loadError=""
    mutationError=""
    busyKey=""
    onTypeChange={onTypeChange}
    onRetry={onRetry}
    onAdd={onAdd}
    onRename={onRename}
    onDelete={onDelete}
    onToggleFavorite={onToggleFavorite}
    onUse={onUse}
  />,
);

expect(screen.getByRole("heading", { name: "카테고리 관리" })).toBeInTheDocument();
await user.click(screen.getByRole("button", { name: "반려동물 자주 쓰기 지정" }));
expect(onToggleFavorite).toHaveBeenCalledWith(normalCategory);
```

추가 input의 빈 이름 오류, 수정 취소, 삭제 confirm에 `기존 거래 내역은 변경되지 않습니다`, 5개 도달 시 해제 별표는 활성/추가 별표는 disabled, `onUse`가 없으면 사용 버튼이 렌더되지 않는 경우도 테스트한다. `useAppAlert`는 실제 provider wrapper 또는 모킹된 `confirm`으로 제어한다.

- [ ] **Step 2: 컴포넌트 테스트가 실패하는지 확인**

Run: `npm test -- src/components/category/CategoryManager.test.tsx`

Expected: FAIL because `CategoryManager` does not exist.

- [ ] **Step 3: 관리 컴포넌트 최소 구현**

```tsx
const categoryTypeLabels: Record<CustomCategoryType, string> = {
  expense: "지출",
  income: "수입",
  savings: "저축",
  investment: "투자",
};

export default function CategoryManager(props: CategoryManagerProps) {
  const { confirm } = useAppAlert();
  const visibleCategories = getCategoriesForType(props.categories, props.selectedType);
  const favoriteCount = visibleCategories.filter((item) => item.isFavorite).length;

  const requestDelete = async (category: CustomCategory) => {
    const approved = await confirm(`${category.name} 카테고리를 삭제할까요?`, {
      description: "기존 거래 내역은 변경되지 않습니다.",
      confirmText: "삭제",
      cancelText: "취소",
    });
    if (approved) await props.onDelete(category);
  };
```

탭은 `aria-pressed`, 목록은 이름·별표·수정·삭제·선택 버튼을 제공한다. 수정 모드는 해당 행에만 input을 렌더한다. load error에는 `다시 시도`, 빈 상태에는 `등록한 사용자 카테고리가 없습니다.`를 표시한다. CSS Module에서 행/탭/input/button을 범위화하고 모든 icon button에 44px hit area를 준다.

- [ ] **Step 4: CategoryManager 테스트 통과 확인**

Run: `npm test -- src/components/category/CategoryManager.test.tsx`

Expected: PASS.

- [ ] **Step 5: CategoryManager 커밋**

```bash
git add src/components/category/CategoryManager.tsx src/components/category/CategoryManager.module.scss src/components/category/CategoryManager.test.tsx
git commit -m "feat: add reusable category manager"
```

---

### Task 5: 공통 Modal의 dialog와 초점 동작 보강

**Files:**
- Modify: `src/components/common/Modal.tsx`
- Create: `src/components/common/Modal.test.tsx`
- Modify: `src/app/_home/HomeClient.tsx` only for the existing calendar title ID and modal prop

**Interfaces:**
- Produces: `Modal({ children, onClose, ariaLabelledBy })`
- Preserves: overlay click, ESC close, body scroll lock
- Adds: `role="dialog"`, `aria-modal="true"`, initial focus, Tab loop, trigger focus restore

- [ ] **Step 1: dialog semantics와 focus 실패 테스트 작성**

```tsx
render(
  <>
    <button type="button">열기 버튼</button>
    <Modal onClose={onClose} ariaLabelledBy="dialog-title">
      <h2 id="dialog-title">테스트 모달</h2>
      <button type="button">첫 버튼</button>
      <button type="button">마지막 버튼</button>
    </Modal>
  </>,
);

expect(screen.getByRole("dialog", { name: "테스트 모달" })).toHaveAttribute(
  "aria-modal",
  "true",
);
expect(screen.getByRole("button", { name: "첫 버튼" })).toHaveFocus();
```

Tab/Shift+Tab이 양 끝에서 순환하고, Escape와 overlay click이 닫으며, unmount 후 열기 전 activeElement로 focus가 돌아가는 테스트를 추가한다.

- [ ] **Step 2: Modal 테스트가 실패하는지 확인**

Run: `npm test -- src/components/common/Modal.test.tsx`

Expected: FAIL because current modal has no dialog role, label prop, focus management, or Tab trap.

- [ ] **Step 3: Modal 접근성 구현**

```tsx
type Props = {
  children: React.ReactNode;
  onClose: () => void;
  ariaLabelledBy: string;
};

<div className="modal-overlay" onMouseDown={handleOverlayMouseDown}>
  <div
    ref={dialogRef}
    className="modal-content"
    role="dialog"
    aria-modal="true"
    aria-labelledby={ariaLabelledBy}
    tabIndex={-1}
    onMouseDown={(event) => event.stopPropagation()}
  >
    {children}
  </div>
</div>
```

effect 시작 시 `document.activeElement`를 저장하고 dialog 내부의 button/input/select/textarea/[tabindex] 중 disabled가 아닌 첫 요소에 focus한다. keydown에서 Escape를 닫고 Tab의 첫/마지막 요소를 순환시킨다. cleanup은 body style과 이전 focus를 복원한다.

- [ ] **Step 4: 기존 calendar modal label 연결**

달력 제목에 `id="calendar-picker-title"`, Modal에 `ariaLabelledBy="calendar-picker-title"`를 전달하고 닫기 접근성 이름을 `달력 닫기`로 바꾼다.

- [ ] **Step 5: Modal과 관련 홈 테스트 통과 확인**

Run: `npm test -- src/components/common/Modal.test.tsx`

Expected: PASS.

- [ ] **Step 6: Modal 접근성 커밋**

```bash
git add src/components/common/Modal.tsx src/components/common/Modal.test.tsx src/app/_home/HomeClient.tsx
git commit -m "fix: make common modal keyboard accessible"
```

---

### Task 6: 거래 입력 카테고리 선택기와 관리 모달 연동

**Files:**
- Create: `src/app/_home/InlineCategorySelector.tsx`
- Test: `src/app/_home/InlineCategorySelector.test.tsx`
- Modify: `src/app/_home/HomeClient.tsx`
- Modify: `src/app/page.scss`
- Delete: `src/app/_home/customCategories.ts`
- Delete: `src/app/_home/customCategories.test.ts`

**Interfaces:**
- Consumes: `CustomCategory[]`, current `CustomCategoryType`, default options, current select/custom values
- Produces: grouped select, favorite chips, direct input, `onOpenManager`
- Home consumes: `useCustomCategories`, `CategoryManager`, accessible `Modal`

- [ ] **Step 1: InlineCategorySelector 실패 테스트 작성**

```tsx
render(
  <InlineCategorySelector
    type="expense"
    defaultOptions={["🍚식비", "🚗교통비"]}
    categories={[favoriteCategory, normalCategory]}
    value="🍚식비"
    customValue=""
    onValueChange={onValueChange}
    onCustomValueChange={onCustomValueChange}
    onOpenManager={onOpenManager}
  />,
);

expect(screen.getByRole("group", { name: "자주 쓰는 카테고리" })).toBeInTheDocument();
expect(screen.getByRole("option", { name: "반려동물" })).toBeInTheDocument();
expect(screen.getByRole("option", { name: "직접 입력" })).toBeInTheDocument();
await user.click(screen.getByRole("button", { name: "반려동물 선택" }));
expect(onValueChange).toHaveBeenCalledWith("반려동물");
```

favorite가 없을 때 group 숨김, `<optgroup label="기본 카테고리">`와 `<optgroup label="내 카테고리">`, 직접 입력 선택 시 input 표시, 관리 버튼 호출을 테스트한다.

- [ ] **Step 2: 선택기 테스트가 실패하는지 확인**

Run: `npm test -- src/app/_home/InlineCategorySelector.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: 선택기 최소 구현**

```tsx
const favoriteCategories = getFavoriteCategoriesForType(categories, type);
const userCategories = getCategoriesForType(categories, type);

<select value={value} onChange={(event) => onValueChange(event.target.value)}>
  <optgroup label="기본 카테고리">
    {defaultOptions.map((option) => <option key={option}>{option}</option>)}
  </optgroup>
  {userCategories.length ? (
    <optgroup label="내 카테고리">
      {userCategories.map((category) => (
        <option key={category.id} value={category.name}>{category.name}</option>
      ))}
    </optgroup>
  ) : null}
  <option value={customCategoryValue}>직접 입력</option>
</select>
```

favorite 칩에는 `${name} 선택` 접근성 이름을 주고 `onValueChange(name)`을 호출한다. 현재 사용 중인 grid를 유지할 수 있도록 category field 자체만 렌더하고 날짜 field는 HomeClient에 남긴다.

- [ ] **Step 4: HomeClient를 공통 훅과 관리 모달에 연결**

기존 `customCategories` state, dashboard Promise.all의 최근 조회, `recentCustomCategories`, `handleCustomCategoryDelete`를 제거한다. `src/app/_home/customCategories.ts`와 해당 테스트도 삭제하고 모든 list/state 연산을 공유 규칙으로 교체한다. 다음 연결을 추가한다.

```tsx
const categoryState = useCustomCategories({
  enabled: isAuthResolved,
  isDemoMode,
  defaultOptionsByType: {
    expense: categoryOptions,
    income: incomeCategoryOptions,
    savings: savingsCategoryOptions,
    investment: investmentCategoryOptions,
  },
});
const [showCategoryManager, setShowCategoryManager] = useState(false);
```

직접입력 거래 저장 성공 뒤 기존 save 블록 대신 다음을 호출한다.

```ts
const recordedCategory = await categoryState.recordUsedCategory(inlineType, category);
if (!recordedCategory) {
  alert("내역은 저장됐지만 카테고리 목록을 갱신하지 못했습니다.");
}
```

관리 모달의 `onUse`는 `setInlineCategory(category.name)`, `setInlineCustomCategory("")`, `setShowCategoryManager(false)`를 호출한다. delete 성공 뒤 현재 `inlineCategory`가 삭제한 이름이면 현재 유형의 첫 기본값으로 초기화한다.

- [ ] **Step 5: Home 스타일 정리**

`src/app/page.scss`에서 삭제된 최근 카테고리의 X 포함 칩 스타일을 제거하고 favorite chip list, 카테고리 label/action row, 모달 너비만 홈 범위에 추가한다. shared manager 내부 스타일은 CSS Module에 유지한다. 모바일 390px에서 칩은 줄바꿈하고 이름은 말줄임하며 관리 버튼과 칩 hit area는 44px 이상이어야 한다.

- [ ] **Step 6: 홈 선택기와 관련 테스트 통과 확인**

Run: `npm test -- src/app/_home/InlineCategorySelector.test.tsx src/hooks/useCustomCategories.test.tsx src/components/category/CategoryManager.test.tsx`

Expected: PASS.

- [ ] **Step 7: 거래 입력 연동 커밋**

```bash
git add src/app/_home/InlineCategorySelector.tsx src/app/_home/InlineCategorySelector.test.tsx src/app/_home/HomeClient.tsx src/app/_home/customCategories.ts src/app/_home/customCategories.test.ts src/app/page.scss
git commit -m "feat: manage categories from transaction form"
```

---

### Task 7: 마이페이지 로그인·데모 관리 카드 연동

**Files:**
- Modify: `src/app/app/mypage/page.tsx`
- Test: `src/app/app/mypage/page.test.tsx`
- Modify: `src/app/app/mypage/mypage.scss`

**Interfaces:**
- Consumes: `useCustomCategories` and `CategoryManager`
- Produces: 마이페이지의 로그인/데모 공통 `카테고리 관리` 카드

- [ ] **Step 1: 로그인·데모 카드 실패 테스트 작성**

`useCustomCategories`를 안정적인 fixture로 mock하고 기존 세 shell 테스트에 다음 검증을 추가한다.

```ts
it("shows category management in demo mode", () => {
  useAppData.mockReturnValue(demoAppData);
  render(<MyPage />);
  expect(screen.getByRole("heading", { name: "카테고리 관리" })).toBeInTheDocument();
  expect(screen.getByText("데모 데이터는 이 브라우저에만 저장됩니다.")).toBeInTheDocument();
});

it("shows category management for a signed-in user", async () => {
  useAppData.mockReturnValue(signedInAppData);
  render(<MyPage />);
  expect(screen.getByRole("heading", { name: "카테고리 관리" })).toBeInTheDocument();
});
```

auth 미확정 상태에서는 카드도 렌더되지 않는지 유지한다.

- [ ] **Step 2: 마이페이지 테스트가 실패하는지 확인**

Run: `npm test -- src/app/app/mypage/page.test.tsx`

Expected: FAIL because MyPage does not render CategoryManager.

- [ ] **Step 3: MyPage에 공통 훅과 카드 연결**

`MyPage` 최상위에서 `useCustomCategories({ enabled: isAuthResolved, isDemoMode, defaultOptionsByType })`를 호출한다. 데모 안내와 로그인 계정 카드는 현재 조건을 유지하고, 그 아래에 다음 카드를 양쪽 모드 공통으로 렌더한다.

```tsx
<section className="card mypage-card mypage-category-card">
  {isDemoMode ? (
    <p className="caption--md color-gray">
      데모 데이터는 이 브라우저에만 저장됩니다.
    </p>
  ) : null}
  <CategoryManager
    headingId="mypage-category-manager-title"
    {...categoryManagerProps}
  />
</section>
```

MyPage가 선택 callback을 넘기지 않으므로 `이 카테고리 사용` 버튼은 보이지 않아야 한다.

- [ ] **Step 4: 마이페이지 반응형 스타일 추가**

category card는 desktop에서 기존 account grid 아래 전체 너비, mobile에서는 데모/계정 카드 다음 순서로 둔다. `.mypage-category-card`에 grid column 전체 범위를 주고 기존 password card의 명시적 배치를 깨지 않게 한다.

- [ ] **Step 5: 마이페이지와 전체 카테고리 테스트 통과 확인**

Run: `npm test -- src/app/app/mypage/page.test.tsx src/components/category/CategoryManager.test.tsx src/hooks/useCustomCategories.test.tsx`

Expected: PASS.

- [ ] **Step 6: 마이페이지 연동 커밋**

```bash
git add src/app/app/mypage/page.tsx src/app/app/mypage/page.test.tsx src/app/app/mypage/mypage.scss
git commit -m "feat: add category manager to mypage"
```

---

### Task 8: 전체 검증, 실제 화면 점검, HANDOFF 갱신

**Files:**
- Modify: `HANDOFF.md`

**Interfaces:**
- Verifies all earlier tasks as one feature.

- [ ] **Step 1: 전체 테스트 실행**

Run: `npm test`

Expected: all Vitest files pass, including API, demo migration, hook, manager, modal, selector, and MyPage tests.

- [ ] **Step 2: lint 실행**

Run: `npm run lint`

Expected: exit code 0 with no ESLint errors.

- [ ] **Step 3: production build 실행**

Run: `npm run build`

Expected: Next.js 16 production build, type checking, and route generation succeed.

- [ ] **Step 4: 데스크톱 실제 화면 검증**

Run: `npm run dev -- --port 3001`

Browser plugin으로 1280px에서 데모 모드를 열고 다음을 확인한다.

- 거래 입력의 favorite 칩 선택
- 기본/내 카테고리 optgroup
- 관리 모달 추가·수정·삭제·별표·사용
- 마이페이지 카드와 데모 저장 안내
- ESC, overlay, Tab 순환과 닫은 뒤 trigger focus 복원

Expected: 주요 값과 동작이 hover 없이 보이고, modal이 viewport 안에 있으며 배경은 스크롤되지 않는다.

- [ ] **Step 5: 모바일 실제 화면 검증**

같은 서버를 390px viewport로 확인한다.

Expected: favorite 칩이 줄바꿈되고 긴 이름이 레이아웃을 밀지 않으며 모든 주요 touch target이 44px 이상이다. modal 내용은 세로 스크롤 가능하고 하단 내비게이션에 가리지 않는다.

- [ ] **Step 6: HANDOFF와 배포 순서 기록**

`HANDOFF.md` 최상단 설계 항목을 구현 결과로 갱신한다. 실제 테스트 file/test 수, lint/build 결과, desktop/mobile 검증 결과를 기록한다. 운영 배포에는 `20260825000000_add_custom_category_favorites.sql`을 애플리케이션보다 먼저 적용해야 하며, 원격 migration을 이 작업에서 적용하지 않았다면 명시한다.

- [ ] **Step 7: 최종 diff 검사**

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 8: 최종 문서 커밋**

```bash
git add HANDOFF.md
git commit -m "docs: record custom category verification"
```

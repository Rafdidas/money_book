# 거래 다중 선택·일괄 삭제 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 선택한 월의 상세내용 표에서 직접 입력 거래 여러 건을 안전하게 선택하고 한 번에 삭제한다.

**Architecture:** 기존 `monthlyEditableExpenses`를 삭제 가능 항목의 기준으로 재사용하고, 선택 집합과 요약 계산은 순수 함수로 분리한다. `HomeClient`가 실제 선택 상태와 Supabase/데모 삭제를 소유하며, 작은 작업 바 컴포넌트는 선택 건수·합계와 작업 버튼만 렌더링한다.

**Tech Stack:** Next.js 16 App Router, React 19 Client Components, TypeScript, Sass, Supabase, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-08-25-bulk-transaction-delete-design.md`

## Global Constraints

- 사용자에게 보이는 문구는 한국어로 작성한다.
- 기본 `expenses` 테이블, RLS, `deleteExpenses(ids)`를 재사용하며 DB 마이그레이션을 추가하지 않는다.
- `monthlyEditableExpenses`에 포함된 직접 입력 거래만 선택 가능하다.
- 적금·고정지출 규칙에서 생성된 납입과 일시정지 내역은 선택할 수 없다.
- 데모 저장은 `writeDemoExpenses` 성공 후 React 상태를 갱신한다.
- 새 시각화 또는 UI 의존성을 추가하지 않는다.
- 구현 전에 `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`를 다시 확인한다.
- 의미 있는 변경 뒤 `npm run lint`, 완료 전 `npm run build`, 데스크톱 1280px와 모바일 390px 브라우저 검증을 수행한다.
- 각 작업 완료 시 `HANDOFF.md`에 변경, 검증, 남은 일을 기록한다.

---

### Task 1: 선택 정책과 요약 계산을 순수 함수로 분리

**Files:**
- Create: `src/app/_home/detailBulkDelete.ts`
- Create: `src/app/_home/detailBulkDelete.test.ts`

**Interfaces:**
- Consumes: `Expense` from `src/types/expense.ts`
- Produces: `getSelectableDetailIds(detailItems, editableItems): string[]`
- Produces: `pruneSelectedDetailIds(selectedIds, selectableIds): Set<string>`
- Produces: `getDetailBulkSelectionSummary(items, selectedIds): { count: number; total: number }`

- [ ] **Step 1: 선택 정책의 실패 테스트 작성**

```ts
import { describe, expect, it } from "vitest";
import type { Expense } from "@/types/expense";
import {
  getDetailBulkSelectionSummary,
  getSelectableDetailIds,
  pruneSelectedDetailIds,
} from "./detailBulkDelete";

const expense = (id: string, amount: number, entryType: Expense["entry_type"] = "expense"):
  Expense => ({
  id,
  user_id: "user-1",
  amount,
  type: "expense",
  entry_type: entryType,
  category: entryType === "savings" ? "비상금" : "식비",
  memo: "",
  date: "2026-08-10",
  created_at: "2026-08-10T00:00:00.000Z",
});

describe("detail bulk delete selection", () => {
  it("selects only detail items also present in the editable list", () => {
    const directExpense = expense("expense-1", 10000);
    const directSavings = expense("savings-1", 50000, "savings");
    const scheduledPayment = expense("payment-1", 30000, "savings");

    expect(
      getSelectableDetailIds(
        [directExpense, directSavings, scheduledPayment],
        [directExpense, directSavings],
      ),
    ).toEqual(["expense-1", "savings-1"]);
  });

  it("drops selected ids that are no longer selectable", () => {
    expect(
      [...pruneSelectedDetailIds(new Set(["expense-1", "old-id"]), new Set(["expense-1"]))],
    ).toEqual(["expense-1"]);
  });

  it("counts and sums only selected items still present in the list", () => {
    expect(
      getDetailBulkSelectionSummary(
        [expense("expense-1", 10000), expense("savings-1", 50000, "savings")],
        new Set(["expense-1", "savings-1", "missing-id"]),
      ),
    ).toEqual({ count: 2, total: 60000 });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/app/_home/detailBulkDelete.test.ts`

Expected: FAIL because `./detailBulkDelete` does not exist.

- [ ] **Step 3: 최소 구현 작성**

```ts
import type { Expense } from "@/types/expense";

type DetailBulkItem = Pick<Expense, "id" | "amount">;

export type DetailBulkSelectionSummary = {
  count: number;
  total: number;
};

export const getSelectableDetailIds = (
  detailItems: readonly DetailBulkItem[],
  editableItems: readonly DetailBulkItem[],
) => {
  const editableIds = new Set(editableItems.map((item) => item.id));
  return detailItems.filter((item) => editableIds.has(item.id)).map((item) => item.id);
};

export const pruneSelectedDetailIds = (
  selectedIds: ReadonlySet<string>,
  selectableIds: ReadonlySet<string>,
) => new Set([...selectedIds].filter((id) => selectableIds.has(id)));

export const getDetailBulkSelectionSummary = (
  items: readonly DetailBulkItem[],
  selectedIds: ReadonlySet<string>,
): DetailBulkSelectionSummary => {
  const selectedItems = items.filter((item) => selectedIds.has(item.id));
  return {
    count: selectedItems.length,
    total: selectedItems.reduce((sum, item) => sum + item.amount, 0),
  };
};
```

- [ ] **Step 4: 단위 테스트 통과 확인**

Run: `npx vitest run src/app/_home/detailBulkDelete.test.ts`

Expected: 3 tests PASS.

- [ ] **Step 5: 작업 기록과 커밋**

`HANDOFF.md`에 선택 정책 순수 함수와 테스트 결과를 기록한다.

```bash
git add src/app/_home/detailBulkDelete.ts src/app/_home/detailBulkDelete.test.ts HANDOFF.md
git commit -m "test: define bulk transaction selection rules"
```

---

### Task 2: 선택 작업 바 컴포넌트 추가

**Files:**
- Create: `src/app/_home/DetailBulkActionBar.tsx`
- Create: `src/app/_home/DetailBulkActionBar.test.tsx`

**Interfaces:**
- Consumes: `count: number`, `total: number`, `isDeleting: boolean`
- Consumes: `onClear(): void`, `onDelete(): void`
- Produces: `DetailBulkActionBar` Client Component with `aria-live="polite"`

- [ ] **Step 1: 작업 바 동작의 실패 테스트 작성**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DetailBulkActionBar from "./DetailBulkActionBar";

describe("DetailBulkActionBar", () => {
  it("shows the selected count and total and calls both actions", () => {
    const onClear = vi.fn();
    const onDelete = vi.fn();
    render(
      <DetailBulkActionBar
        count={3}
        total={150000}
        isDeleting={false}
        onClear={onClear}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText("3건 선택 · 합계 150,000원")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "선택 해제" }));
    fireEvent.click(screen.getByRole("button", { name: "선택 삭제" }));
    expect(onClear).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("disables actions while deletion is in progress", () => {
    render(
      <DetailBulkActionBar
        count={2}
        total={30000}
        isDeleting
        onClear={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "선택 해제" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "삭제 중..." })).toBeDisabled();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/app/_home/DetailBulkActionBar.test.tsx`

Expected: FAIL because `DetailBulkActionBar` does not exist.

- [ ] **Step 3: 최소 컴포넌트 구현**

```tsx
"use client";

import { formatWon } from "@/utils/money";

type DetailBulkActionBarProps = {
  count: number;
  total: number;
  isDeleting: boolean;
  onClear: () => void;
  onDelete: () => void;
};

export default function DetailBulkActionBar({
  count,
  total,
  isDeleting,
  onClear,
  onDelete,
}: DetailBulkActionBarProps) {
  return (
    <div className="detail-bulk-actions" aria-live="polite">
      <strong className="detail-bulk-actions__summary">
        {count}건 선택 · 합계 {formatWon(total)}
      </strong>
      <div className="detail-bulk-actions__buttons">
        <button
          type="button"
          className="button button--sm button--subtle"
          disabled={isDeleting}
          onClick={onClear}
        >
          선택 해제
        </button>
        <button
          type="button"
          className="button button--sm button--danger"
          disabled={isDeleting}
          onClick={onDelete}
        >
          {isDeleting ? "삭제 중..." : "선택 삭제"}
        </button>
      </div>
    </div>
  );
}
```

If `button--danger` is not defined in the current Sass, use the existing destructive button class found by `rg -n "button--danger|danger" src/app src/styles src/components`; do not invent a second global danger style.

- [ ] **Step 4: 컴포넌트 테스트 통과 확인**

Run: `npx vitest run src/app/_home/DetailBulkActionBar.test.tsx`

Expected: 2 tests PASS.

- [ ] **Step 5: 작업 기록과 커밋**

`HANDOFF.md`에 작업 바와 테스트 결과를 기록한다.

```bash
git add src/app/_home/DetailBulkActionBar.tsx src/app/_home/DetailBulkActionBar.test.tsx HANDOFF.md
git commit -m "feat: add bulk delete action bar"
```

---

### Task 3: 상세 표 선택 상태와 실제 삭제 연결

**Files:**
- Modify: `src/app/_home/HomeClient.tsx:1-100`
- Modify: `src/app/_home/HomeClient.tsx:300-820`
- Modify: `src/app/_home/HomeClient.tsx:1197-1230`
- Modify: `src/app/_home/HomeClient.tsx:3291-3425`

**Interfaces:**
- Consumes: Task 1의 `getSelectableDetailIds`, `pruneSelectedDetailIds`, `getDetailBulkSelectionSummary`
- Consumes: Task 2의 `DetailBulkActionBar`
- Consumes: 기존 `deleteExpenses(ids)`, `writeDemoExpenses(items)`, `Checkbox`, `useAppAlert`
- Produces: `selectedDetailIds: Set<string>`와 선택/전체 선택/일괄 삭제 핸들러

- [ ] **Step 1: 현재 Next.js Client Component 지침 재확인**

Run: `Get-Content node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`

Expected: 상태와 이벤트 핸들러는 기존 Client Component 경계인 `HomeClient` 안에 둔다.

- [ ] **Step 2: 선택 상태와 파생값 연결**

`HomeClient.tsx`에 다음 import와 상태를 추가한다.

```tsx
import DetailBulkActionBar from "./DetailBulkActionBar";
import {
  getDetailBulkSelectionSummary,
  getSelectableDetailIds,
  pruneSelectedDetailIds,
} from "./detailBulkDelete";

const [selectedDetailIds, setSelectedDetailIds] = useState<Set<string>>(() => new Set());
const [isDetailBulkDeleting, setIsDetailBulkDeleting] = useState(false);
```

`detailItems`와 `monthlyEditableExpenses`가 계산된 뒤 다음 파생값과 정리 effect를 둔다.

```tsx
const selectableDetailIds = useMemo(
  () => new Set(getSelectableDetailIds(detailItems, monthlyEditableExpenses)),
  [detailItems, monthlyEditableExpenses],
);
const detailBulkSummary = useMemo(
  () => getDetailBulkSelectionSummary(detailItems, selectedDetailIds),
  [detailItems, selectedDetailIds],
);
const allSelectableDetailsSelected =
  selectableDetailIds.size > 0 &&
  [...selectableDetailIds].every((id) => selectedDetailIds.has(id));
const someSelectableDetailsSelected =
  !allSelectableDetailsSelected &&
  [...selectableDetailIds].some((id) => selectedDetailIds.has(id));

useEffect(() => {
  setSelectedDetailIds((current) => {
    const next = pruneSelectedDetailIds(current, selectableDetailIds);
    return next.size === current.size ? current : next;
  });
}, [selectableDetailIds]);
```

- [ ] **Step 3: 개별/전체 선택 핸들러 추가**

```tsx
const handleDetailSelectionChange = (id: string, checked: boolean) => {
  if (!selectableDetailIds.has(id)) return;
  setSelectedDetailIds((current) => {
    const next = new Set(current);
    if (checked) next.add(id);
    else next.delete(id);
    return next;
  });
};

const handleAllDetailSelectionChange = (checked: boolean) => {
  setSelectedDetailIds(checked ? new Set(selectableDetailIds) : new Set());
};
```

- [ ] **Step 4: 일괄 삭제 핸들러 추가**

기존 `handleDelete` 근처에 다음 동작을 추가한다. 실제 코드에서는 프로젝트의
`confirm` options 타입에 맞춰 그대로 타입 검사한다.

```tsx
const handleBulkDetailDelete = async () => {
  const selectedItems = detailItems.filter(
    (item) => selectedDetailIds.has(item.id) && selectableDetailIds.has(item.id),
  );
  if (!selectedItems.length) return;

  const ids = selectedItems.map((item) => item.id);
  const deletedIds = new Set(ids);
  const summary = getDetailBulkSelectionSummary(selectedItems, deletedIds);
  const confirmed = await confirm(`선택한 내역 ${summary.count}건을 삭제할까요?`, {
    description: `합계 ${formatCurrency(summary.total)}의 내역이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`,
    confirmText: "삭제",
    cancelText: "취소",
  });
  if (!confirmed) return;

  setIsDetailBulkDeleting(true);
  try {
    if (isDemoMode) {
      const nextExpenses = expenses.filter((item) => !deletedIds.has(item.id));
      writeDemoExpenses(nextExpenses);
      setExpenses(nextExpenses);
    } else {
      await deleteExpenses(ids);
      setExpenses((current) => current.filter((item) => !deletedIds.has(item.id)));
    }

    if (inlineEditingId && deletedIds.has(inlineEditingId)) {
      setInlineEditingId("");
      setInlineFormMode("create");
      resetInlineCreateForm();
    }
    setSelectedDetailIds(new Set());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "선택한 내역을 삭제하지 못했습니다.";
    alert(message);
  } finally {
    setIsDetailBulkDeleting(false);
  }
};
```

- [ ] **Step 5: 표에 전체/개별 체크박스 추가**

`colgroup` 첫 열에 48px 선택 열을 추가하고 기존 비율 열을 나머지 폭에 맞춰
조정한다. 헤더에는 공용 `Checkbox`를 사용한다.

```tsx
<th className="detail-table__selection">
  <Checkbox
    checked={allSelectableDetailsSelected}
    indeterminate={someSelectableDetailsSelected}
    disabled={selectableDetailIds.size === 0 || isDetailBulkDeleting}
    onChange={handleAllDetailSelectionChange}
    className="checkbox--compact"
  >
    <span className="detail-table__a11y-label">삭제 가능한 내역 전체 선택</span>
  </Checkbox>
</th>
```

각 행의 첫 셀은 선택 가능 여부를 명시한다.

```tsx
const isSelectable = selectableDetailIds.has(item.id);

<td className="detail-table__selection">
  <Checkbox
    checked={selectedDetailIds.has(item.id)}
    disabled={!isSelectable || isDetailBulkDeleting}
    onChange={(checked) => handleDetailSelectionChange(item.id, checked)}
    className="checkbox--compact"
  >
    <span className="detail-table__a11y-label">
      {isSelectable
        ? `${item.category} ${formatDetailDate(item.date)} 내역 선택`
        : "정기 항목은 해당 관리 메뉴에서 변경해주세요"}
    </span>
  </Checkbox>
</td>
```

빈 상태의 `colSpan`은 5에서 6으로 변경한다.

- [ ] **Step 6: 선택 작업 바 렌더링**

표 래퍼 바로 뒤, `main-detail` 안에 선택이 있을 때만 작업 바를 렌더링한다.

```tsx
{detailBulkSummary.count > 0 ? (
  <DetailBulkActionBar
    count={detailBulkSummary.count}
    total={detailBulkSummary.total}
    isDeleting={isDetailBulkDeleting}
    onClear={() => setSelectedDetailIds(new Set())}
    onDelete={handleBulkDetailDelete}
  />
) : null}
```

- [ ] **Step 7: 관련 테스트와 타입 검사 실행**

Run: `npx vitest run src/app/_home/detailBulkDelete.test.ts src/app/_home/DetailBulkActionBar.test.tsx`

Expected: 5 tests PASS.

Run: `npm run lint`

Expected: PASS with no new lint errors.

- [ ] **Step 8: 작업 기록과 커밋**

`HANDOFF.md`에 선택 가능 정책, 데모/로그인 삭제 흐름, 실패 시 선택 유지 동작을
기록한다.

```bash
git add src/app/_home/HomeClient.tsx HANDOFF.md
git commit -m "feat: bulk delete editable transactions"
```

---

### Task 4: 반응형 스타일과 최종 검증

**Files:**
- Modify: `src/app/page.scss`
- Modify: `HANDOFF.md`

**Interfaces:**
- Consumes: `.detail-table__selection`, `.detail-table__a11y-label`, `.detail-bulk-actions*`
- Produces: desktop 1280px and mobile 390px layouts without bottom navigation overlap

- [ ] **Step 1: 선택 열과 접근성 라벨 스타일 추가**

기존 상세 표 스타일 범위 안에 다음 규칙을 추가하고, 프로젝트 토큰 이름이 다르면
동일 의미의 기존 토큰으로 치환한다.

```scss
.detail-table__selection {
  width: 48px;
  min-width: 48px;
  padding-inline: 8px;
  text-align: center;
}

.detail-table__a11y-label {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

- [ ] **Step 2: sticky 작업 바 스타일 추가**

```scss
.detail-bulk-actions {
  position: sticky;
  bottom: 16px;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 12px;
  padding: 12px 16px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--background);
  box-shadow: 0 8px 24px rgb(15 23 42 / 12%);
}

.detail-bulk-actions__buttons {
  display: flex;
  gap: 8px;
}

@media (max-width: 760px) {
  .detail-bulk-actions {
    bottom: calc(84px + env(safe-area-inset-bottom));
    align-items: stretch;
    flex-direction: column;
  }

  .detail-bulk-actions__buttons > .button {
    min-height: 44px;
    flex: 1;
  }
}
```

Before keeping `var(--line)` and `var(--background)`, inspect `src/app/page.scss` and use
the exact existing border/background tokens already used by neighboring cards.

- [ ] **Step 3: 전체 자동 검증**

Run: `npm test`

Expected: all test files PASS.

Run: `npm run lint`

Expected: PASS.

Run: `npm run build`

Expected: Next.js production build completes successfully.

- [ ] **Step 4: 데스크톱 브라우저 검증**

Run: `npm run dev`

At 1280px verify:

- 직접 입력 지출·수입·저축·투자 체크박스가 동작한다.
- 저장된 적금·고정지출 납입과 일시정지 행은 비활성화된다.
- 전체 선택은 선택 가능한 행만 포함하며 일부 선택 시 혼합 상태를 표시한다.
- 확인 취소는 선택과 데이터를 유지한다.
- 삭제 성공은 선택한 행만 제거하고 합계/차트를 갱신한다.
- 키보드 Tab/Space/Enter로 선택과 삭제 확인을 수행할 수 있다.

- [ ] **Step 5: 모바일과 데모 지속성 검증**

At 390px verify:

- 가로 넘침이 새로 생기지 않는다.
- 체크박스와 버튼의 조작 영역이 최소 44px이다.
- 작업 바가 하단 내비게이션과 겹치지 않는다.
- 데모에서 여러 건 삭제 후 새로고침해도 삭제 상태가 유지된다.

- [ ] **Step 6: 최종 작업 기록과 커밋**

`HANDOFF.md`에 `npm test`, `npm run lint`, `npm run build`, 1280px/390px 브라우저
검증 결과와 남은 제약을 기록한다.

```bash
git add src/app/page.scss HANDOFF.md
git commit -m "style: polish bulk transaction actions"
```

---

## Completion Gate

- 상세 표에서 선택 가능한 직접 입력 거래만 다중 선택된다.
- 직접 입력 저축은 선택 가능하고, 정기 적금·고정지출 납입은 선택 불가하다.
- 확인 취소와 삭제 실패 시 데이터와 선택을 유지한다.
- 로그인과 데모 모드 모두 한 번의 작업으로 여러 건을 삭제한다.
- 전체 테스트, lint, production build가 통과한다.
- 데스크톱 1280px와 모바일 390px에서 시각·키보드 검증이 완료된다.
- `HANDOFF.md`가 최종 상태를 설명한다.

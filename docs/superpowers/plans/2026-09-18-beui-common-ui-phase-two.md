# beUI 공통 UI 2차 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모든 컨트롤이 하나의 높이 스케일을 쓰게 만들고, 버튼·배지·카드·표·날짜 입력을 `src/components/ui` 공통 계층으로 옮긴다.

**Architecture:** 단계 A는 SCSS만 만진다. `src/styles/_control-tokens.scss`에 크기·표면 토큰을 정의하고 기존 `.button`/`.form-input`/`.badge`/`.ui-*`가 이 토큰을 참조하게 바꾼다. 단계 B는 React 컴포넌트를 추가하되 기존 클래스 체계를 유지해 회귀 면적을 줄인다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Sass, Vitest, Playwright, motion.

## Global Constraints

- 사용자에게 보이는 UI 문구는 한국어로 쓴다.
- 새 시각화 의존성을 추가하지 않는다. 모션은 이미 있는 `motion` 패키지만 쓴다.
- 공통 UI는 `src/components/ui`에 두고 거래·카테고리·투자 도메인 로직을 넣지 않는다.
- 색 토큰은 `src/app/color_tokens.scss`가 담당한다. 새 파일에 색을 중복 정의하지 않는다.
- `backdrop-filter`를 새로 추가하지 않는다. 2026-09-14 기록대로 창 크기 변경 중 합성 레이어 깜빡임의 원인이었다.
- 모션은 상호작용(press/hover/탭 선택 이동/토스트)에만 적용한다. 목록 진입 순차 애니메이션은 넣지 않는다.
- 모든 신규 컴포넌트는 `useReducedMotionPreference`를 존중한다.
- 컨트롤 높이 스케일: sm 32px / md 40px / lg 48px. md가 기본.
- 각 Task 완료 후 `npm run lint`와 `npm run build`가 통과해야 한다.
- 각 Task 완료 후 `HANDOFF.md`에 변경·검증·남은 일을 한 단락으로 추가한다.

## 스펙과의 의도적 차이

스펙 B-4는 "표의 헤더·행 높이를 `--control-height-*`에 맞춘다"고 적었다. 현재
`_table.scss`의 셀 패딩은 `5px 10px`이고 행 높이는 약 30px다. 이를 40px로 올리면
상세내역 표가 1.3배 길어진다. 밀도 변경은 일관성 수정이 아니라 제품 결정이므로,
Task 7은 **현재 값을 토큰으로 중앙화만** 하고 밀도는 바꾸지 않는다. 표 안의
버튼·배지만 컨트롤 스케일에 맞춘다.

## File Structure

| 경로 | 역할 | Task |
|---|---|---|
| `src/styles/_control-tokens.scss` | 신규. 컨트롤 크기·반경·간격·반투명 표면 토큰 | 1, 3, 7 |
| `src/app/globals.scss` | 신규 파티셜 `@use` 추가 | 1 |
| `src/components/ui/ui.scss` | 공통 UI 스타일이 토큰 참조 | 1, 5, 6, 8 |
| `src/styles/_button.scss` | `--button-height`가 토큰 참조 | 2 |
| `src/styles/_input.scss` | `.form-input` 높이가 토큰 참조 | 2 |
| `src/styles/_badge.scss` | Task 5에서 제거 | 2, 5 |
| `src/styles/_calendar-picker.scss` | 셀 높이가 토큰 참조 | 2 |
| `src/components/ui/Button.tsx` | 신규. 기존 `.button` 클래스 출력 + press 모션 | 4 |
| `src/components/ui/Badge.tsx` | tone 확장 | 5 |
| `src/components/ui/Card.tsx` | 신규. 반투명 표면 카드 | 6 |
| `src/styles/_table.scss` | 셀 패딩 토큰화 | 7 |
| `src/components/ui/DateField.tsx` | 신규. 날짜 입력 | 8 |
| `e2e/control-alignment.spec.ts` | 신규. 컨트롤 높이 회귀 테스트 | 1, 2 |

---

### Task 1: 컨트롤 토큰 정의와 공통 UI 높이 정렬

**Files:**
- Create: `src/styles/_control-tokens.scss`
- Create: `e2e/control-alignment.spec.ts`
- Modify: `src/app/globals.scss:1`
- Modify: `src/components/ui/ui.scss`

**Interfaces:**
- Produces: CSS 커스텀 속성 `--control-height-sm|md|lg`, `--control-pad-sm|md|lg`, `--control-radius-sm|md`, `--control-gap`, `--badge-height`. 이후 모든 Task가 이 이름을 그대로 쓴다.

- [ ] **Step 1: 실패하는 e2e 테스트를 작성한다**

Create `e2e/control-alignment.spec.ts`:

```ts
import { expect, test, type Page } from "@playwright/test";

async function openDemoDashboard(page: Page) {
  await page.goto("/auth/login");
  await page.getByRole("button", { name: "데모 체험하기" }).click();
  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
}

test("대시보드 입력 컨트롤 높이가 40px 스케일을 따른다", async ({ page }) => {
  await openDemoDashboard(page);

  const control = page.locator(".main-overview--control").first();
  await expect(control).toBeVisible();

  const height = await control.evaluate((element) =>
    Math.round(element.getBoundingClientRect().height),
  );
  expect(height).toBe(40);
});
```

`.main-overview--control`이 기본 화면에서 보이지 않으면(추가 폼이 닫혀 있는 경우)
`openDemoDashboard` 다음에 추가 폼을 여는 클릭을 넣는다. 기존
`e2e/public-auth-demo.spec.ts`의 대시보드 흐름에서 해당 클릭 선택자를 가져다 쓴다.

- [ ] **Step 2: 실패를 확인한다**

Run: `npx playwright test e2e/control-alignment.spec.ts --project=chromium`
Expected: FAIL — `expect(received).toBe(expected)`에서 received가 42.

- [ ] **Step 3: 토큰 파일을 만든다**

Create `src/styles/_control-tokens.scss`:

```scss
:root {
  --control-height-sm: 32px;
  --control-height-md: 40px;
  --control-height-lg: 48px;

  --control-pad-sm: 10px;
  --control-pad-md: 12px;
  --control-pad-lg: 16px;

  --control-radius-sm: 6px;
  --control-radius-md: 8px;

  --control-gap: 8px;

  --badge-height: 24px;
}
```

반경 기본값을 6px/8px로 잡은 이유: 기존 `.button`의 `--button-radius`가 6px,
`.ui-tabs__tab`이 8px이라 두 값을 그대로 승계하면 시각적 변화 없이 중앙화된다.

- [ ] **Step 4: globals에 연결한다**

Modify `src/app/globals.scss` — 1번째 줄 `@use "../app/color_tokens.scss";` 바로 다음 줄에 추가:

```scss
@use "../styles/control-tokens";
```

- [ ] **Step 5: 공통 UI 스타일이 토큰을 참조하게 바꾼다**

Modify `src/components/ui/ui.scss` — 아래 다섯 곳을 치환한다.

`.ui-tabs__tab`의 `min-height: 32px;` →

```scss
    min-height: var(--control-height-sm);
```

`.ui-form-control`의 `min-height: 42px;` →

```scss
  min-height: var(--control-height-md);
```

`.main-overview--control.ui-form-control` 블록 전체 →

```scss
.main-overview--control.ui-form-control {
  height: var(--control-height-md);
  min-height: var(--control-height-md);
  padding: 0 var(--control-pad-md);
}
```

`.main-overview--type-toggle.ui-tabs .ui-tabs__tab`의 `min-height: 38px;` →

```scss
  min-height: var(--control-height-md);
```

`.ui-badge`의 `min-height: 24px;` →

```scss
  min-height: var(--badge-height);
```

- [ ] **Step 6: 테스트가 통과하는지 확인한다**

Run: `npx playwright test e2e/control-alignment.spec.ts --project=chromium`
Expected: PASS

- [ ] **Step 7: 전체 검증을 돌린다**

Run: `npm run lint`
Expected: 오류 없음

Run: `npm run build`
Expected: 빌드 성공

Run: `npx playwright test --project=chromium`
Expected: 기존 e2e 전부 통과

- [ ] **Step 8: HANDOFF를 갱신하고 커밋한다**

`HANDOFF.md` 끝에 추가:

```markdown
# 2026-09-18 공통 컨트롤 높이 토큰 도입

- `src/styles/_control-tokens.scss`에 sm 32 / md 40 / lg 48 높이 스케일과 패딩·반경·배지 높이 토큰을 정의했습니다.
- 1차 공통 UI가 쓰던 42px 입력과 38px 타입 토글을 md(40px)로, 탭을 sm(32px)으로 맞췄습니다.
- 검증: `e2e/control-alignment.spec.ts` 신규 테스트가 수정 전 42px로 실패하고 수정 후 통과했습니다. `npm run lint`, `npm run build`, 기존 Playwright 스펙도 통과했습니다.
- 남은 일: 기존 `.button`·`.form-input`·`.badge`는 아직 리터럴 값을 씁니다. Task 2에서 연결합니다.
```

```bash
git add src/styles/_control-tokens.scss src/app/globals.scss src/components/ui/ui.scss e2e/control-alignment.spec.ts HANDOFF.md
git commit -m "feat: 공통 컨트롤 높이 토큰 도입"
```

---

### Task 2: 기존 컨트롤 스타일을 토큰에 연결

**Files:**
- Modify: `src/styles/_button.scss:19,51,61,71,81,91`
- Modify: `src/styles/_input.scss:73,78,83`
- Modify: `src/styles/_badge.scss:7`
- Modify: `src/styles/_calendar-picker.scss:48,59`
- Modify: `e2e/control-alignment.spec.ts`
- Modify: `src/app/app/invest/page.tsx:1189`

**Interfaces:**
- Consumes: Task 1의 `--control-height-sm|md|lg`, `--control-pad-sm|md|lg`, `--badge-height`.

`.button`의 `xmd`(36px)는 `src/app/app/invest/page.tsx:1189` 한 곳에서만 쓰인다.
스케일에 없는 값이므로 그 한 곳을 `button--sm`으로 바꾸고 `--xmd` 정의를 지운다.
`xs`(24px)는 배지와 같은 높이이므로 `--badge-height`를 참조하게 한다.

- [ ] **Step 1: 실패하는 테스트를 추가한다**

Modify `e2e/control-alignment.spec.ts` — 파일 끝에 추가:

```ts
test("버튼과 배지 높이가 공통 스케일을 따른다", async ({ page }) => {
  await openDemoDashboard(page);

  const smallButton = page.locator(".button.button--sm").first();
  await expect(smallButton).toBeVisible();
  await expect
    .poll(() => smallButton.evaluate((el) => Math.round(el.getBoundingClientRect().height)))
    .toBe(32);

  const scale = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    return {
      sm: styles.getPropertyValue("--control-height-sm").trim(),
      md: styles.getPropertyValue("--control-height-md").trim(),
      lg: styles.getPropertyValue("--control-height-lg").trim(),
      badge: styles.getPropertyValue("--badge-height").trim(),
    };
  });
  expect(scale).toEqual({ sm: "32px", md: "40px", lg: "48px", badge: "24px" });

  const usesScale = await page.evaluate(() => {
    const sheetText = Array.from(document.styleSheets)
      .flatMap((sheet) => {
        try {
          return Array.from(sheet.cssRules).map((rule) => rule.cssText);
        } catch {
          return [];
        }
      })
      .join("\n");
    return /--button-height:\s*var\(--control-height-md\)/.test(sheetText);
  });
  expect(usesScale).toBe(true);
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npx playwright test e2e/control-alignment.spec.ts --project=chromium`
Expected: FAIL — `usesScale`가 false. `--button-height`가 아직 리터럴 40px다.

- [ ] **Step 3: 버튼 높이를 토큰에 연결한다**

Modify `src/styles/_button.scss`:

19번째 줄 `--button-height: 40px;` →

```scss
  --button-height: var(--control-height-md);
```

`&--lg` 블록의 `--button-height: 48px;` →

```scss
    --button-height: var(--control-height-lg);
```

`&--md` 블록의 `--button-height: 40px;` →

```scss
    --button-height: var(--control-height-md);
```

`&--sm` 블록의 `--button-height: 32px;` →

```scss
    --button-height: var(--control-height-sm);
```

`&--xs` 블록의 `--button-height: 24px;` →

```scss
    --button-height: var(--badge-height);
```

`&--xmd` 블록 전체를 삭제한다. 아이콘 크기·폰트·반경이 `&--sm`과 동일해
대체해도 시각 차이는 높이 4px뿐이다.

`&--icon-left.button--xmd` 같이 `xmd`를 참조하는 패딩 규칙이 남아 있으면 함께
지운다. `rg 'xmd' src`로 확인한다.

- [ ] **Step 4: xmd 사용처를 sm으로 바꾼다**

Modify `src/app/app/invest/page.tsx:1189`:

```tsx
                      className="button button--outline button--sm"
```

- [ ] **Step 5: 입력·배지·달력을 토큰에 연결한다**

Modify `src/styles/_input.scss` — `.form-input`의 크기 변형 세 곳:

```scss
    height: var(--control-height-sm);
    padding: 4px var(--control-pad-sm);
```

```scss
    height: var(--control-height-md);
    padding: 8px var(--control-pad-md);
```

```scss
    height: var(--control-height-lg);
    padding: 10px var(--control-pad-lg);
```

Modify `src/styles/_badge.scss:7` — `height: 24px;` →

```scss
  height: var(--badge-height);
```

Modify `src/styles/_calendar-picker.scss:48,59` — 두 곳의 `height: 40px;` →

```scss
    height: var(--control-height-md);
```

- [ ] **Step 6: 테스트가 통과하는지 확인한다**

Run: `npx playwright test e2e/control-alignment.spec.ts --project=chromium`
Expected: PASS (2 tests)

- [ ] **Step 7: 전체 검증을 돌린다**

Run: `npm run lint && npm run build && npx playwright test --project=chromium`
Expected: 전부 통과

투자 화면 `/app/invest`에서 Step 4로 바뀐 버튼이 옆 요소와 어긋나지 않는지
눈으로 확인한다. 날짜 선택 모달을 열어 달력 셀이 40px로 유지되는지 확인한다.

- [ ] **Step 8: HANDOFF를 갱신하고 커밋한다**

`HANDOFF.md`에 변경(버튼·입력·배지·달력의 토큰 연결, `xmd` 제거와 그 사용처 1곳
교체), 검증(위 명령과 화면 확인), 남은 일(컴포넌트 이관은 Task 4부터)을 적는다.

```bash
git add src/styles/_button.scss src/styles/_input.scss src/styles/_badge.scss src/styles/_calendar-picker.scss src/app/app/invest/page.tsx e2e/control-alignment.spec.ts HANDOFF.md
git commit -m "refactor: 기존 컨트롤 높이를 공통 토큰에 연결"
```

---

### Task 3: 반투명 표면 토큰 정의

**Files:**
- Modify: `src/styles/_control-tokens.scss`
- Create: `src/styles/control-tokens.test.ts`

**Interfaces:**
- Consumes: Task 1이 만든 `src/styles/_control-tokens.scss`.
- Produces: `--surface-translucent`, `--surface-translucent-strong`, `--surface-border-translucent`, `--surface-shadow-soft`. Task 6이 쓴다.

현재 코드에 반투명 톤이 없으므로 새로 정의한다. HANDOFF의 2026-09-14 기록에
반투명 톤 작업이 있으나 해당 변경은 코드에 남아 있지 않다. 값은 초기값이며
Task 6에서 실제 대비를 보고 조정한다.

- [ ] **Step 1: 다크 모드 선택자 방식을 확인한다**

Run: `rg -n 'data-theme|prefers-color-scheme' src/app/color_tokens.scss`

결과에 나온 선택자 방식을 Step 3에서 그대로 따른다. 기존 파일이
`:root[data-theme="dark"]`만 쓰면 `@media` 블록은 만들지 않고, 그 경우 Step 2의
테스트 기대 횟수를 2에서 실제 정의 횟수로 맞춘다.

- [ ] **Step 2: 실패하는 테스트를 작성한다**

Create `src/styles/control-tokens.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./_control-tokens.scss", import.meta.url), "utf8");

describe("control tokens", () => {
  it("컨트롤 높이 스케일을 정의한다", () => {
    expect(source).toContain("--control-height-sm: 32px;");
    expect(source).toContain("--control-height-md: 40px;");
    expect(source).toContain("--control-height-lg: 48px;");
  });

  it("반투명 표면 토큰을 라이트와 다크 모두 정의한다", () => {
    const names = [
      "--surface-translucent",
      "--surface-translucent-strong",
      "--surface-border-translucent",
      "--surface-shadow-soft",
    ];
    for (const name of names) {
      const occurrences = source.split(`${name}:`).length - 1;
      expect(occurrences, `${name} 는 라이트와 다크에서 정의되어야 한다`).toBeGreaterThanOrEqual(2);
    }
  });

  it("backdrop-filter 를 쓰지 않는다", () => {
    expect(source).not.toContain("backdrop-filter");
  });
});
```

`--surface-translucent`가 `--surface-translucent-strong`의 접두사이므로
`split("--surface-translucent:")`처럼 콜론까지 포함해 세는 점이 중요하다. 위 코드는
이미 그렇게 되어 있다.

- [ ] **Step 3: 실패를 확인한다**

Run: `npx vitest run src/styles/control-tokens.test.ts`
Expected: FAIL — 반투명 토큰 개수가 0이어서 두 번째 테스트가 실패.

- [ ] **Step 4: 토큰을 추가한다**

Modify `src/styles/_control-tokens.scss` — `:root` 블록 안, `--badge-height` 아래에 추가:

```scss
  --surface-translucent: color-mix(in srgb, var(--surface-lowest) 78%, transparent);
  --surface-translucent-strong: color-mix(in srgb, var(--surface-lowest) 88%, transparent);
  --surface-border-translucent: color-mix(in srgb, var(--outline) 62%, transparent);
  --surface-shadow-soft: 0 2px 8px rgba(9, 11, 17, 0.06);
```

그림자는 `src/app/page.scss:287`에 이미 쓰이는 값을 그대로 가져왔다.

Step 1에서 확인한 방식에 맞춰 다크 값을 추가한다. `color_tokens.scss`가
`@media (prefers-color-scheme: dark)`를 쓰면:

```scss
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --surface-translucent: color-mix(in srgb, var(--surface-lowest) 70%, transparent);
    --surface-translucent-strong: color-mix(in srgb, var(--surface-lowest) 84%, transparent);
    --surface-border-translucent: color-mix(in srgb, var(--outline) 70%, transparent);
    --surface-shadow-soft: 0 2px 10px rgba(0, 0, 0, 0.32);
  }
}

:root[data-theme="dark"] {
  --surface-translucent: color-mix(in srgb, var(--surface-lowest) 70%, transparent);
  --surface-translucent-strong: color-mix(in srgb, var(--surface-lowest) 84%, transparent);
  --surface-border-translucent: color-mix(in srgb, var(--outline) 70%, transparent);
  --surface-shadow-soft: 0 2px 10px rgba(0, 0, 0, 0.32);
}
```

`:root[data-theme="dark"]`만 쓰면 뒤쪽 블록만 추가하고 Step 2의 기대값을 1로 낮춘다.

- [ ] **Step 5: 테스트가 통과하는지 확인한다**

Run: `npx vitest run src/styles/control-tokens.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 6: 검증하고 커밋한다**

Run: `npm run lint && npm run build`
Expected: 통과

`HANDOFF.md`에 반투명 토큰 신설과 초기값, 값이 Task 6에서 조정될 수 있다는 점을
적는다.

```bash
git add src/styles/_control-tokens.scss src/styles/control-tokens.test.ts HANDOFF.md
git commit -m "feat: 반투명 표면 토큰 추가"
```

---

### Task 4: Button 공통 컴포넌트

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Button.test.tsx`
- Modify: `src/app/_home/HomeClient.tsx:2666,2679`

**Interfaces:**
- Consumes: `PRESS_TRANSITION` from `@/lib/motion/tokens`, `useReducedMotionPreference` from `@/lib/motion/useReducedMotion`, Task 2가 연결한 `.button` 클래스.
- Produces: `Button` — props `variant?: ButtonVariant`, `size?: ButtonSize`, `full?: boolean`, 나머지는 `ButtonHTMLAttributes<HTMLButtonElement>`.
  - `export type ButtonVariant = "default" | "primary" | "secondary" | "outline" | "outline-primary" | "subtle" | "negative";`
  - `export type ButtonSize = "xs" | "sm" | "md" | "lg";`

기존 `.button` 클래스 체계를 그대로 출력한다. 전체 사용처를 일괄 치환하지 않으므로
당분간 컴포넌트와 생 `<button className="button">`이 공존한다. 사용자가 승인한
절충이다.

- [ ] **Step 1: 실패하는 테스트를 작성한다**

Create `src/components/ui/Button.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./Button";

describe("Button", () => {
  it("variant 와 size 를 기존 클래스로 출력한다", () => {
    render(<Button variant="primary" size="md">저장</Button>);
    const button = screen.getByRole("button", { name: "저장" });
    expect(button.className).toContain("button");
    expect(button.className).toContain("button--primary");
    expect(button.className).toContain("button--md");
  });

  it("full 을 주면 button--full 을 붙인다", () => {
    render(<Button full>저장</Button>);
    expect(screen.getByRole("button", { name: "저장" }).className).toContain("button--full");
  });

  it("기본값은 md 이고 variant 클래스를 붙이지 않는다", () => {
    render(<Button>확인</Button>);
    const className = screen.getByRole("button", { name: "확인" }).className;
    expect(className).toContain("button--md");
    expect(className).not.toContain("button--default");
  });

  it("disabled 이면 클릭 핸들러가 호출되지 않는다", () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>삭제</Button>);
    fireEvent.click(screen.getByRole("button", { name: "삭제" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("전달한 className 을 유지한다", () => {
    render(<Button className="main-overview--submit">제출</Button>);
    expect(screen.getByRole("button", { name: "제출" }).className).toContain(
      "main-overview--submit",
    );
  });

  it("기본 type 은 button 이다", () => {
    render(<Button>확인</Button>);
    expect(screen.getByRole("button", { name: "확인" })).toHaveAttribute("type", "button");
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/components/ui/Button.test.tsx`
Expected: FAIL — `Failed to resolve import "./Button"`

- [ ] **Step 3: 컴포넌트를 구현한다**

Create `src/components/ui/Button.tsx`:

```tsx
"use client";

import { motion } from "motion/react";
import type { ButtonHTMLAttributes } from "react";

import { PRESS_TRANSITION } from "@/lib/motion/tokens";
import { useReducedMotionPreference } from "@/lib/motion/useReducedMotion";

export type ButtonVariant =
  | "default"
  | "primary"
  | "secondary"
  | "outline"
  | "outline-primary"
  | "subtle"
  | "negative";

export type ButtonSize = "xs" | "sm" | "md" | "lg";

type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onAnimationStart" | "onAnimationEnd" | "onDrag" | "onDragStart" | "onDragEnd"
> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
};

export function Button({
  variant = "default",
  size = "md",
  full = false,
  className,
  type = "button",
  disabled,
  ...props
}: ButtonProps) {
  const prefersReducedMotion = useReducedMotionPreference();

  const classNames = [
    "button",
    variant === "default" ? "" : `button--${variant}`,
    `button--${size}`,
    full ? "button--full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.button
      {...props}
      type={type}
      disabled={disabled}
      className={classNames}
      whileTap={prefersReducedMotion || disabled ? undefined : { scale: 0.98 }}
      transition={PRESS_TRANSITION}
    />
  );
}
```

`PRESS_TRANSITION`의 실제 이름이 다르면 `src/lib/motion/tokens.ts`를 읽고 그
이름을 쓴다. 1차의 `Badge.tsx`가 같은 토큰을 쓰므로 그 import를 참고한다.

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `npx vitest run src/components/ui/Button.test.tsx`
Expected: PASS (6 tests)

- [ ] **Step 5: 대시보드 주요 액션 버튼을 이관한다**

Modify `src/app/_home/HomeClient.tsx` — import 블록(18~21번째 줄 근처)에 추가:

```tsx
import { Button } from "@/components/ui/Button";
```

2666번째 줄 근처 `className="button button--outline button--md main-overview--delete"`인
삭제 버튼을 바꾼다:

```tsx
<Button variant="outline" size="md" className="main-overview--delete" onClick={...}>
```

2679번째 줄 근처 `className="button button--primary button--md button--full main-overview--submit"`인
제출 버튼을 바꾼다:

```tsx
<Button variant="primary" size="md" full className="main-overview--submit" onClick={...}>
```

`onClick`, `disabled`, `type`, `aria-*` 등 기존 속성은 그대로 옮기고 닫는 태그를
`</Button>`으로 맞춘다.

- [ ] **Step 6: 검증한다**

Run: `npm test`
Expected: 기존 테스트 전부 + Button 6개 통과

Run: `npm run lint && npm run build`
Expected: 통과

Run: `npx playwright test --project=chromium --project="Mobile Chrome"`
Expected: 통과. 대시보드 추가/수정 흐름이 그대로 동작해야 한다.

프로젝트의 Playwright 프로젝트 이름이 다르면 `playwright.config.ts`에 정의된
이름을 쓴다.

- [ ] **Step 7: HANDOFF를 갱신하고 커밋한다**

```bash
git add src/components/ui/Button.tsx src/components/ui/Button.test.tsx src/app/_home/HomeClient.tsx HANDOFF.md
git commit -m "feat: 공통 Button 컴포넌트 추가"
```

---

### Task 5: Badge 통합

**Files:**
- Modify: `src/components/ui/Badge.tsx`
- Modify: `src/components/ui/Badge.test.tsx`
- Modify: `src/components/ui/ui.scss`
- Delete: `src/styles/_badge.scss`
- Modify: `src/app/globals.scss` (`@use "../styles/badge";` 제거)
- Modify: `src/app/app/analysis/page.tsx:425,641`
- Modify: `src/app/app/inquiries/page.tsx:241,323,358`
- Modify: `src/app/app/invest/page.tsx:124,125,128,129,130,131,1288,1386,1453,1566`

**Interfaces:**
- Consumes: Task 1의 `--badge-height`, `--control-radius-sm`.
- Produces: `Badge` — `tone?: BadgeTone` where
  `export type BadgeTone = "neutral" | "info" | "success" | "danger" | "teal" | "violet";`

기존 `.badge`의 색 변형은 green/red/teal/blue/violet 다섯 개다. `ui-badge`의
tone은 neutral/info/success/danger 네 개다. blue→info, green→success, red→danger로
매핑하고 teal·violet을 tone으로 추가한다.

- [ ] **Step 1: 실패하는 테스트를 추가한다**

Modify `src/components/ui/Badge.test.tsx` — 기존 `describe` 안, 파일 끝에 추가:

```tsx
it("teal 과 violet tone 을 지원한다", () => {
  const { rerender } = render(<Badge tone="teal">답변 대기</Badge>);
  expect(screen.getByText("답변 대기").className).toContain("ui-badge--teal");

  rerender(<Badge tone="violet">ISA</Badge>);
  expect(screen.getByText("ISA").className).toContain("ui-badge--violet");
});
```

기존 파일의 import에 `render`, `screen`이 없으면 `@testing-library/react`에서 함께
가져온다.

- [ ] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/components/ui/Badge.test.tsx`
Expected: FAIL — 타입 오류 또는 클래스 불일치.

- [ ] **Step 3: tone 을 확장한다**

Modify `src/components/ui/Badge.tsx` — `BadgeTone` 정의를 바꾼다:

```tsx
export type BadgeTone = "neutral" | "info" | "success" | "danger" | "teal" | "violet";
```

Modify `src/components/ui/ui.scss` — `.ui-badge` 블록 안 `&--danger` 다음에 추가:

```scss
  &--teal {
    border-color: var(--teal-mid);
    background: var(--teal-lower);
    color: var(--on-teal-high);
  }

  &--violet {
    border-color: var(--violet-mid);
    background: var(--violet-lower);
    color: var(--on-violet-high);
  }
```

같은 블록의 `border-radius: 6px;`를 `var(--control-radius-sm)`로 바꾼다. 두 값이
이미 6px로 같으므로 시각 변화는 없다.

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `npx vitest run src/components/ui/Badge.test.tsx`
Expected: PASS

- [ ] **Step 5: 기존 `.badge` 사용처를 옮긴다**

각 사용처를 `Badge`로 바꾼다. `src/app/app/inquiries/page.tsx:241`:

```tsx
            <span className="badge badge--teal">답변 대기 {pendingCount}건</span>
```

→

```tsx
            <Badge tone="teal">답변 대기 {pendingCount}건</Badge>
```

같은 파일 323, 358번째 줄의 조건부 클래스는 tone 삼항으로 바꾼다:

```tsx
<Badge tone={inquiry.status === "ANSWERED" ? "teal" : "info"}>
```

`src/app/app/invest/page.tsx:124~131`의 클래스 상수 맵은 tone 맵으로 바꾼다.
기존 변수명은 유지하고 값만 tone 문자열로 바꾼다:

```tsx
const ACCOUNT_BADGE_TONES: Record<string, BadgeTone> = {
  ISA: "violet",
  PENSION: "success",
};

const SECTION_BADGE_TONES: Record<string, BadgeTone> = {
  "종목별 비중": "info",
  "계좌별 배분": "violet",
  "시장별 배분": "success",
  "통화별 배분": "teal",
};
```

각 파일 상단에 `import { Badge, type BadgeTone } from "@/components/ui/Badge";`를
추가한다. `caption--md`처럼 함께 붙어 있던 타이포 클래스는 `className` prop으로
넘긴다.

- [ ] **Step 6: 옛 스타일을 제거한다**

```bash
git rm src/styles/_badge.scss
```

Modify `src/app/globals.scss` — `@use "../styles/badge";` 줄을 삭제한다.

- [ ] **Step 7: 남은 사용처가 없는지 확인한다**

Run: `rg 'className="badge|badge--' src`
Expected: 결과 없음. 남아 있으면 Step 5로 돌아간다.

- [ ] **Step 8: 검증하고 커밋한다**

Run: `npm test && npm run lint && npm run build`
Expected: 통과

분석·문의·투자 화면을 열어 배지 색과 높이가 이전과 같은지 눈으로 확인한다.
`Badge`는 등장 시 미세한 scale 모션이 있으므로 목록에 배지가 여러 개인 화면에서
과하지 않은지 함께 본다. 과하면 `Badge.tsx`의 `initial`을 `false`로 두는 옵션을
검토하고 결정을 HANDOFF에 적는다.

```bash
git add -A src HANDOFF.md
git commit -m "refactor: 배지를 공통 Badge 컴포넌트로 통합"
```

---

### Task 6: Card 컴포넌트와 반투명 톤 적용

**Files:**
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Card.test.tsx`
- Modify: `src/components/ui/ui.scss`
- Modify: `src/app/_home/DashboardSummaryCards.tsx`
- Modify: `src/app/page.scss` (카드 배경·테두리 중복 선언 제거)

**Interfaces:**
- Consumes: Task 3의 `--surface-translucent`, `--surface-translucent-strong`, `--surface-border-translucent`, `--surface-shadow-soft`; Task 1의 `--control-radius-md`.
- Produces: `Card` — props `tone?: "default" | "strong"`, `padding?: "default" | "compact"`, `as?: "div" | "section" | "article"`, `className?: string`, `children: ReactNode`.

- [ ] **Step 1: 실패하는 테스트를 작성한다**

Create `src/components/ui/Card.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Card } from "./Card";

describe("Card", () => {
  it("기본 tone 과 padding 클래스를 출력한다", () => {
    render(<Card>내용</Card>);
    const card = screen.getByText("내용");
    expect(card.className).toContain("ui-card");
    expect(card.className).not.toContain("ui-card--strong");
    expect(card.className).not.toContain("ui-card--compact");
  });

  it("strong tone 과 compact padding 을 반영한다", () => {
    render(
      <Card tone="strong" padding="compact">
        내용
      </Card>,
    );
    const card = screen.getByText("내용");
    expect(card.className).toContain("ui-card--strong");
    expect(card.className).toContain("ui-card--compact");
  });

  it("as 로 요소를 바꾼다", () => {
    render(<Card as="section">내용</Card>);
    expect(screen.getByText("내용").tagName).toBe("SECTION");
  });

  it("전달한 className 을 유지한다", () => {
    render(<Card className="main-overview--card">내용</Card>);
    expect(screen.getByText("내용").className).toContain("main-overview--card");
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/components/ui/Card.test.tsx`
Expected: FAIL — `Failed to resolve import "./Card"`

- [ ] **Step 3: 컴포넌트를 구현한다**

Create `src/components/ui/Card.tsx`:

```tsx
import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  tone?: "default" | "strong";
  padding?: "default" | "compact";
  as?: "div" | "section" | "article";
  className?: string;
};

export function Card({
  children,
  tone = "default",
  padding = "default",
  as: Element = "div",
  className,
}: CardProps) {
  const classNames = [
    "ui-card",
    tone === "strong" ? "ui-card--strong" : "",
    padding === "compact" ? "ui-card--compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <Element className={classNames}>{children}</Element>;
}
```

모션은 넣지 않는다. 카드 진입 애니메이션은 Global Constraints에서 제외했다.

- [ ] **Step 4: 스타일을 추가한다**

Modify `src/components/ui/ui.scss` — `.ui-badge` 블록 앞에 추가:

```scss
.ui-card {
  padding: 16px;
  border: 1px solid var(--surface-border-translucent);
  border-radius: var(--control-radius-md);
  background: var(--surface-translucent);
  box-shadow: var(--surface-shadow-soft);

  &--strong {
    background: var(--surface-translucent-strong);
  }

  &--compact {
    padding: 12px;
  }
}
```

- [ ] **Step 5: 테스트가 통과하는지 확인한다**

Run: `npx vitest run src/components/ui/Card.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 6: 대시보드 개요 카드에 적용한다**

Modify `src/app/_home/DashboardSummaryCards.tsx` — 개요 카드 네 개와 일정 카드의
바깥 요소를 `<Card>`로 바꾸고 기존 클래스는 `className`으로 넘긴다:

```tsx
<Card className="main-overview--card">
  ...
</Card>
```

`import { Card } from "@/components/ui/Card";`를 추가한다.

그다음 `src/app/page.scss`에서 같은 카드에 `background`·`border`·`box-shadow`를
직접 지정한 선언을 찾아 제거한다. `.ui-card`와 경쟁하면 반투명 톤이 덮인다.
Run: `rg -n 'main-overview--card' src/app/page.scss` 로 해당 블록을 찾는다.
패딩·레이아웃 선언은 남긴다. `.ui-card`의 `padding: 16px`가 기존 레이아웃을
망가뜨리면 `main-overview--card`의 패딩이 이기도록 `page.scss` 쪽 선언을 유지한다.

개요 카드 네 개는 미세한 색감 차이만 두고 위쪽 단색 선은 두지 않는다.

- [ ] **Step 7: 대비를 확인한다**

로컬 프로덕션 빌드(`npm run build && npm run start`)를 띄우고 데모 대시보드를
데스크톱 1440px, 1024px, 390px과 다크 모드 1440px, 390px에서 확인한다.

- 반투명 배경 위에서 금액 텍스트가 읽힌다
- 가로 오버플로가 0이다
- 프레임워크 오류 화면이 없다
- 창 크기를 1440 → 1200 → 800 → 1440으로 연속 변경해도 카드가 계속 보인다

읽기 어렵거나 톤이 과하면 Task 3의 `--surface-translucent` 비율(78%/88%, 다크
70%/84%)을 조정한다. 최종 값을 HANDOFF에 남긴다.

- [ ] **Step 8: 검증하고 커밋한다**

Run: `npm test && npm run lint && npm run build && npx playwright test --project=chromium --project="Mobile Chrome"`
Expected: 통과

```bash
git add src/components/ui/Card.tsx src/components/ui/Card.test.tsx src/components/ui/ui.scss src/app/_home/DashboardSummaryCards.tsx src/app/page.scss src/styles/_control-tokens.scss HANDOFF.md
git commit -m "feat: 반투명 표면 Card 컴포넌트 적용"
```

---

### Task 7: 표 셀 패딩 토큰화

**Files:**
- Modify: `src/styles/_table.scss:28,37,63`
- Modify: `src/styles/_control-tokens.scss`
- Modify: `src/styles/control-tokens.test.ts`

**Interfaces:**
- Consumes: Task 3이 만든 `src/styles/control-tokens.test.ts`.
- Produces: `--table-cell-pad-block`, `--table-cell-pad-inline`.

밀도는 바꾸지 않는다. 현재 값 `5px 10px`을 토큰으로 옮겨 표마다 다른 값이
생기지 않게 한다. 표 안의 버튼·배지는 Task 2·5에서 이미 스케일을 따른다.

- [ ] **Step 1: 실패하는 테스트를 추가한다**

Modify `src/styles/control-tokens.test.ts` — `describe` 블록 안에 추가:

```ts
it("표 셀 패딩 토큰을 정의한다", () => {
  expect(source).toContain("--table-cell-pad-block: 5px;");
  expect(source).toContain("--table-cell-pad-inline: 10px;");
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/styles/control-tokens.test.ts`
Expected: FAIL — 토큰이 없다.

- [ ] **Step 3: 토큰을 추가한다**

Modify `src/styles/_control-tokens.scss` — `:root` 블록의 `--badge-height` 아래에 추가:

```scss
  --table-cell-pad-block: 5px;
  --table-cell-pad-inline: 10px;
```

- [ ] **Step 4: 표가 토큰을 쓰게 한다**

Modify `src/styles/_table.scss` — `padding: 5px 10px;` 세 곳(28, 37, 63번째 줄)을 모두 치환:

```scss
      padding: var(--table-cell-pad-block) var(--table-cell-pad-inline);
```

들여쓰기는 각 위치의 기존 들여쓰기를 유지한다.

- [ ] **Step 5: 테스트가 통과하는지 확인한다**

Run: `npx vitest run src/styles/control-tokens.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: 표 회귀를 확인한다**

Run: `npx playwright test e2e/dashboard-detail-scroll.spec.ts --project=chromium --project="Mobile Chrome"`
Expected: PASS. 표 내부 세로 오버플로가 0으로 유지되고 마지막 행이 보인다.

Run: `npm run lint && npm run build`
Expected: 통과

- [ ] **Step 7: 커밋한다**

`HANDOFF.md`에 밀도를 바꾸지 않고 값만 중앙화했다는 점과 그 이유를 적는다.

```bash
git add src/styles/_table.scss src/styles/_control-tokens.scss src/styles/control-tokens.test.ts HANDOFF.md
git commit -m "refactor: 표 셀 패딩을 토큰으로 중앙화"
```

---

### Task 8: DateField 컴포넌트

**Files:**
- Create: `src/components/ui/DateField.tsx`
- Create: `src/components/ui/DateField.test.tsx`
- Modify: `src/app/_home/HomeClient.tsx:2576,2847,3116`
- Modify: `src/components/ui/ui.scss`

**Interfaces:**
- Consumes: Task 1의 `--control-height-md`, `--control-pad-md`; 기존 `TextInput` from `@/components/ui/FormControl`.
- Produces: `DateField` — props `value: string`(`YYYY-MM-DD`), `onChange: (value: string) => void`, `id?: string`, `disabled?: boolean`, `className?: string`, `"aria-label"?: string`.

현재 `type="date"` 네이티브 입력이 `HomeClient.tsx` 2576, 2847, 3116번째 줄에
흩어져 있고, 별도 `.calendar-picker` 모달이 3480번째 줄 근처에 인라인으로 있다.
이 Task는 날짜 입력 쪽만 하나로 모은다. 달력 팝오버 통합은 Step 6의 실측 결과에
따라 후속 작업으로 넘길 수 있다.

- [ ] **Step 1: 실패하는 테스트를 작성한다**

Create `src/components/ui/DateField.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DateField } from "./DateField";

describe("DateField", () => {
  it("값을 표시한다", () => {
    render(<DateField value="2026-09-18" onChange={() => {}} aria-label="날짜" />);
    expect(screen.getByLabelText("날짜")).toHaveValue("2026-09-18");
  });

  it("값이 바뀌면 onChange 를 문자열로 부른다", () => {
    const onChange = vi.fn();
    render(<DateField value="2026-09-18" onChange={onChange} aria-label="날짜" />);
    fireEvent.change(screen.getByLabelText("날짜"), { target: { value: "2026-09-20" } });
    expect(onChange).toHaveBeenCalledWith("2026-09-20");
  });

  it("빈 값을 허용한다", () => {
    const onChange = vi.fn();
    render(<DateField value="2026-09-18" onChange={onChange} aria-label="날짜" />);
    fireEvent.change(screen.getByLabelText("날짜"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("disabled 이면 입력이 비활성화된다", () => {
    render(<DateField value="2026-09-18" onChange={() => {}} aria-label="날짜" disabled />);
    expect(screen.getByLabelText("날짜")).toBeDisabled();
  });

  it("공통 컨트롤 클래스를 쓴다", () => {
    render(<DateField value="2026-09-18" onChange={() => {}} aria-label="날짜" />);
    expect(screen.getByLabelText("날짜").className).toContain("ui-form-control");
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/components/ui/DateField.test.tsx`
Expected: FAIL — `Failed to resolve import "./DateField"`

- [ ] **Step 3: 컴포넌트를 구현한다**

Create `src/components/ui/DateField.tsx`:

```tsx
"use client";

import { TextInput } from "./FormControl";

type DateFieldProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export function DateField({ value, onChange, className, ...props }: DateFieldProps) {
  return (
    <TextInput
      {...props}
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={["ui-date-field", className].filter(Boolean).join(" ")}
    />
  );
}
```

`TextInput`이 이미 `ui-form-control` 클래스를 붙이므로 Step 1의 마지막 테스트가
통과한다.

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `npx vitest run src/components/ui/DateField.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 5: 사용처를 옮긴다**

Modify `src/app/_home/HomeClient.tsx` — 2576, 2847, 3116번째 줄 근처의 세 곳.
현재 형태:

```tsx
                        <TextInput
                          className="main-overview--control body--sm"
                          type="date"
                          value={inlineDate}
                          onChange={(event) => setInlineDate(event.target.value)}
                        />
```

바꿀 형태:

```tsx
                        <DateField
                          className="main-overview--control body--sm"
                          value={inlineDate}
                          onChange={setInlineDate}
                        />
```

상태 변수명은 세 곳이 다를 수 있다. 각 줄을 읽고 그 위치의 실제 이름을 쓴다.
`onChange`가 단순 setter가 아니라 추가 로직을 담고 있으면
`onChange={(next) => { ... }}` 형태로 옮긴다.

import에 `import { DateField } from "@/components/ui/DateField";`를 추가한다.

- [ ] **Step 6: 모바일 동작을 실측한다**

로컬 프로덕션 빌드에서 390px 뷰포트로 날짜 입력을 연다.

- 트리거 높이가 40px인지 확인한다. 아니면 `src/components/ui/ui.scss`에 추가한다:

```scss
.ui-date-field.ui-form-control {
  height: var(--control-height-md);
  min-height: var(--control-height-md);
  padding: 0 var(--control-pad-md);
}
```

- 네이티브 피커가 쓰기 편하면 그대로 둔다.
- 네이티브 피커가 어색하면 `.calendar-picker` 팝오버를 `DateField` 안으로 옮기는
  후속 작업을 HANDOFF의 "남은 일"에 적는다. 이 Task에서는 하지 않는다.

측정 결과와 결정을 HANDOFF에 남긴다.

- [ ] **Step 7: 검증하고 커밋한다**

Run: `npm test && npm run lint && npm run build && npx playwright test --project=chromium --project="Mobile Chrome"`
Expected: 통과

```bash
git add src/components/ui/DateField.tsx src/components/ui/DateField.test.tsx src/components/ui/ui.scss src/app/_home/HomeClient.tsx HANDOFF.md
git commit -m "feat: 공통 DateField 컴포넌트 추가"
```

---

## 완료 기준

- 대시보드의 입력·선택·탭·버튼이 32/40/48 스케일 안에서만 높이를 가진다.
- `rg 'className="badge'` 결과가 없다.
- 대시보드 카드에 반투명 톤이 적용되고 다크 모드에서도 금액이 읽힌다.
- `npm test`, `npm run lint`, `npm run build`, `npx playwright test`가 전부 통과한다.
- `HANDOFF.md`에 Task별 기록이 남는다.

## 이 계획에 없는 것

- `.button` 사용처 전체의 `Button` 컴포넌트 이관. Task 4는 대시보드 주요 액션
  두 곳만 옮긴다. 나머지는 기존 마크업으로 계속 동작한다.
- 표 밀도 변경. Task 7은 값 중앙화만 한다.
- 분석·마이페이지·투자 화면의 카드 이관. Task 6은 대시보드만 다룬다.
- Input, Select/Combobox, Checkbox, Radio Group, Bottom Sheet, Tooltip의 공통
  계층 이관. 1차 HANDOFF에 적힌 대로 이후 단계로 남긴다.

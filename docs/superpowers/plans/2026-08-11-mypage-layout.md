# 마이페이지 레이아웃 개선 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 데스크톱에서 마이페이지 카드를 2열로 배치하고, 회원 탈퇴를 카드에서 빼서 화면 맨 아래 작은 텍스트 버튼으로 내린다.

**Architecture:** CSS Grid 자동 배치만으로 두 요구사항을 동시에 만족시킨다. DOM 순서를 내 정보 → 비밀번호 변경 → 약관 동의로 두면, 2열에서는 왼쪽에 내 정보·약관 동의가, 오른쪽에 비밀번호 변경이 놓이고, 1열로 떨어지면 그 DOM 순서가 그대로 모바일 순서가 된다. `order` 속성이나 `grid-area` 지정이 필요 없다. 탈퇴는 그리드 바깥으로 빼서 항상 전체 너비 맨 아래에 둔다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Sass, Vitest + Testing Library

**Spec:** `docs/superpowers/specs/2026-08-11-mypage-layout-design.md`

## Global Constraints

- 사용자에게 보이는 문구는 모두 한국어로 작성한다.
- 2열↔1열 전환 기준은 `1040px`이다. `src/app/app/inquiries/inquiries.scss:149`가 이미 쓰는 값이므로 새 기준을 만들지 않는다.
- 탈퇴의 확인 절차와 삭제 로직은 바꾸지 않는다. 바뀌는 것은 접힌 상태의 겉모습과 위치뿐이다.
- 탈퇴 토글의 접근성 이름은 정확히 `회원 탈퇴`를 유지한다. 기존 테스트 6건이 모두 `getByRole("button", { name: "회원 탈퇴" })`로 이 버튼을 찾는다.
- 새 SCSS 파일을 만들지 않는다. `src/app/app/mypage/mypage.scss`에 추가한다.
- 데모 모드 안내 카드와 페이지 헤더는 건드리지 않는다.

## jsdom으로 검증할 수 없는 것

이 작업의 핵심은 CSS 레이아웃이고, jsdom은 그리드 계산을 하지 않는다. 컬럼 배치와
반응형 전환은 **브라우저에서 눈으로 확인해야 한다.** 테스트는 DOM 구조와 동작이
깨지지 않았음을 지키는 역할만 한다. 계획에 없는 레이아웃 단언 테스트를 지어내지 말 것.

---

### Task 1: 2열 그리드와 탈퇴 영역 분리

**Files:**
- Modify: `src/app/app/mypage/page.tsx:74-88` (카드 배치)
- Modify: `src/app/app/mypage/mypage.scss:16-19` (`.mypage-layout` 규칙)

**Interfaces:**
- Consumes: `ProfileCard`, `PasswordCard`, `ConsentCard`, `WithdrawCard` (기존 컴포넌트, props 변경 없음)
- Produces: `.mypage-grid` 클래스 — Task 2가 이 그리드 **바깥**에 탈퇴 영역이 있다는 전제로 스타일을 붙인다

- [ ] **Step 1: Confirm the existing tests pass before changing anything**

```bash
npx vitest run src/app/app/mypage src/components/mypage
```

Expected: PASS — 이 시점의 통과 건수를 기록해둔다. Task 1은 동작을 바꾸지 않으므로
작업 후에도 같은 건수가 나와야 한다.

- [ ] **Step 2: Rearrange the cards in page.tsx**

`src/app/app/mypage/page.tsx`의 아래 블록을 찾는다.

```tsx
          <div className="mypage-layout column-group column-group--gap-16">
            {loadError ? (
              <p className="caption--md mypage-error" role="alert">
                {loadError}
              </p>
            ) : null}
            {overview ? (
              <>
                <ProfileCard overview={overview} onNameSaved={setName} />
                <PasswordCard email={overview.email} />
                <ConsentCard overview={overview} />
                <WithdrawCard email={overview.email} />
              </>
            ) : null}
          </div>
```

이것으로 교체한다.

```tsx
          <div className="mypage-layout">
            {loadError ? (
              <p className="caption--md mypage-error" role="alert">
                {loadError}
              </p>
            ) : null}
            {overview ? (
              <>
                {/* DOM 순서가 곧 모바일 순서다. 2열에서는 자동 배치로
                    왼쪽에 내 정보·약관 동의, 오른쪽에 비밀번호 변경이 놓인다. */}
                <div className="mypage-grid">
                  <ProfileCard overview={overview} onNameSaved={setName} />
                  <PasswordCard email={overview.email} />
                  <ConsentCard overview={overview} />
                </div>
                <WithdrawCard email={overview.email} />
              </>
            ) : null}
          </div>
```

`column-group column-group--gap-16`을 `.mypage-layout`에서 뺀 이유는 이제 자식이
그리드와 탈퇴 영역 둘뿐이고, 간격은 각자가 책임지기 때문이다.

- [ ] **Step 3: Replace the layout rule in mypage.scss**

`src/app/app/mypage/mypage.scss`의 아래 규칙을 찾는다.

```scss
  .mypage-layout {
    margin-top: 20px;
    max-width: 640px;
  }
```

이것으로 교체한다.

```scss
  .mypage-layout {
    margin-top: 20px;
    max-width: 1100px;
  }

  .mypage-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    // 카드마다 높이가 달라 stretch되면 빈 공간이 늘어난다.
    align-items: start;
  }
```

그리고 파일 맨 아래, 닫는 중괄호 **직전**에 반응형 분기를 추가한다.

```scss
  @media (max-width: 1040px) {
    .mypage-grid {
      grid-template-columns: 1fr;
    }
  }
```

- [ ] **Step 4: Run the tests to confirm nothing broke**

```bash
npx vitest run src/app/app/mypage src/components/mypage
```

Expected: PASS — Step 1과 같은 건수. 동작을 바꾸지 않았으므로 늘거나 줄면 안 된다.

- [ ] **Step 5: Commit**

```bash
git add src/app/app/mypage/page.tsx src/app/app/mypage/mypage.scss
git commit -m "feat: lay out mypage cards in two columns on desktop"
```

---

### Task 2: 탈퇴 접힌 상태를 텍스트 버튼으로

접힌 상태에서 카드 껍데기와 제목을 없애고, 구분선 아래 작은 텍스트 버튼만 남긴다.
펼친 뒤의 모습과 동작은 지금 그대로다.

**Files:**
- Modify: `src/components/mypage/WithdrawCard.tsx:43-118` (렌더 부분)
- Modify: `src/app/app/mypage/mypage.scss` (`.mypage-withdraw` 규칙)
- Test: `src/components/mypage/WithdrawCard.test.tsx` (케이스 1건 추가)

**Interfaces:**
- Consumes: `.mypage-grid` 바깥에 놓인다는 Task 1의 배치
- Produces: 없음

- [ ] **Step 1: Write the failing test**

`src/components/mypage/WithdrawCard.test.tsx`의 `describe` 블록 안, 마지막 `it` 뒤에
추가한다. 기존 6건은 건드리지 않는다.

```tsx
  it("shows only a plain toggle when collapsed, and the card heading once opened", () => {
    // 접힌 상태에서는 카드 제목까지 보이면 비밀번호 변경과 같은 무게로 읽힌다.
    // 평생 한 번 쓸까 말까 한 기능이라 접힌 동안에는 버튼 하나만 남긴다.
    render(<WithdrawCard email="hong@example.com" />);

    expect(screen.queryByRole("heading", { name: "회원 탈퇴" })).not.toBeInTheDocument();
    expect(screen.queryByText("계정과 기록을 모두 삭제합니다.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "회원 탈퇴" }));

    expect(screen.getByRole("heading", { name: "회원 탈퇴" })).toBeInTheDocument();
    expect(screen.getByText("계정과 기록을 모두 삭제합니다.")).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/components/mypage/WithdrawCard.test.tsx
```

Expected: FAIL — 새 케이스가 `queryByRole("heading", { name: "회원 탈퇴" })`에서
실패한다. 지금은 접힌 상태에서도 `<h3>회원 탈퇴</h3>`가 렌더되기 때문이다. 기존
6건은 PASS.

- [ ] **Step 3: Restructure the render in WithdrawCard.tsx**

`src/components/mypage/WithdrawCard.tsx`의 `return (` 이후 전체를 아래로 교체한다.
`handleSubmit`과 상태 선언부는 건드리지 않는다.

```tsx
  return (
    <section className="mypage-withdraw">
      {isOpen ? (
        <div className="card mypage-card column-group column-group--gap-16">
          <div>
            <h3 className="title--sm mypage-card--title">회원 탈퇴</h3>
            <p className="caption--md mypage-card--description">
              계정과 기록을 모두 삭제합니다.
            </p>
          </div>

          <form className="column-group column-group--gap-16" noValidate onSubmit={handleSubmit}>
            <div className="mypage-withdraw--warning">
              <p className="body--sm">탈퇴하면 아래 정보가 모두 삭제됩니다.</p>
              <ul className="caption--md">
                <li>가계부 기록</li>
                <li>저축과 고정지출</li>
                <li>투자 내역</li>
                <li>문의 내역</li>
                <li>약관 동의 이력</li>
              </ul>
              <p className="body--sm">삭제한 정보는 복구할 수 없습니다.</p>
            </div>

            <div className="mypage-field">
              <label htmlFor="mypage-withdraw-password" className="label--md">
                비밀번호
              </label>
              <input
                id="mypage-withdraw-password"
                className="main-overview--control body--sm"
                type="password"
                value={password}
                autoComplete="current-password"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "mypage-withdraw-error" : undefined}
                disabled={isSubmitting}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError("");
                }}
              />
              {error ? (
                <p id="mypage-withdraw-error" className="caption--md mypage-error" role="alert">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="row-group row-group--gap-8">
              <button
                type="submit"
                className="button button--negative button--primary button--md"
                disabled={isSubmitting}
              >
                {isSubmitting ? "처리 중..." : "탈퇴하기"}
              </button>
              <button
                type="button"
                className="button button--secondary button--md"
                disabled={isSubmitting}
                onClick={() => {
                  setIsOpen(false);
                  setPassword("");
                  setError("");
                }}
              >
                취소
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          type="button"
          className="mypage-withdraw--toggle caption--md"
          onClick={() => setIsOpen(true)}
        >
          회원 탈퇴
        </button>
      )}
    </section>
  );
```

바뀐 것은 두 가지다. 바깥 `<section>`이 더 이상 `card mypage-card` 껍데기를 갖지
않고, 제목 블록이 `isOpen`일 때만 렌더되도록 안쪽으로 들어갔다. 폼 내부는 그대로다.

- [ ] **Step 4: Style the withdraw section**

`src/app/app/mypage/mypage.scss`의 아래 규칙을 찾는다.

```scss
  .mypage-withdraw {
    &--warning {
      display: flex;
      flex-direction: column;
      gap: 8px;

      ul {
        margin: 0;
        padding-left: 18px;
        color: var(--on-surface);
      }
    }
  }
```

이것으로 교체한다.

```scss
  .mypage-withdraw {
    margin-top: 32px;
    padding-top: 20px;
    border-top: 1px solid var(--outline);

    &--toggle {
      padding: 0;
      border: 0;
      background: none;
      color: var(--on-surface);
      text-decoration: underline;
      cursor: pointer;
    }

    &--warning {
      display: flex;
      flex-direction: column;
      gap: 8px;

      ul {
        margin: 0;
        padding-left: 18px;
        color: var(--on-surface);
      }
    }
  }
```

`--outline`은 `src/app/page.scss`가 입력 테두리에 이미 쓰는 토큰이다. 새 색을
만들지 않는다.

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npx vitest run src/components/mypage/WithdrawCard.test.tsx
```

Expected: PASS — 7 tests (기존 6 + 신규 1)

- [ ] **Step 6: Run the full verification suite**

```bash
npm run lint
```

Expected: 오류 없이 종료

```bash
npm run test
```

Expected: 전부 통과. 이번 작업으로 늘어난 건 WithdrawCard 1건뿐이다.

```bash
npm run build
```

Expected: 빌드 성공

- [ ] **Step 7: Check the layout in a browser**

이 작업의 핵심은 여기서만 확인된다. `npm run dev`로 띄운 뒤 `/app/mypage`를 연다.
데모 모드로는 카드가 보이지 않으므로 실제 로그인 계정이 필요하다. 계정을 쓸 수 없는
환경이면 그 사실을 보고서에 명확히 적고 넘어간다 — 확인한 척하지 말 것.

- 1280px: 왼쪽에 내 정보·약관 동의, 오른쪽에 비밀번호 변경. 카드 상단이 맞물리고
  아래쪽이 과하게 벌어지지 않는지 본다.
- 1040px 부근에서 창을 좁혀 2열이 1열로 떨어지는 순간을 확인한다.
- 375px: 내 정보 → 비밀번호 변경 → 약관 동의 순서. 가로 스크롤이 없어야 한다.
- 모든 너비에서 탈퇴는 맨 아래 구분선 밑의 작은 텍스트 버튼이고, 누르면 그 자리에
  경고와 비밀번호 입력이 펼쳐진다.

- [ ] **Step 8: Update HANDOFF.md**

파일 맨 위에 추가한다.

```markdown
# 2026-08-11 마이페이지 레이아웃 개선

- 데스크톱(1040px 초과)에서 카드를 2열로 배치했습니다. 왼쪽은 내 정보와 약관 동의 현황, 오른쪽은 비밀번호 변경입니다. DOM 순서를 내 정보 → 비밀번호 변경 → 약관 동의로 두어, 1열로 떨어질 때 모바일 순서가 자연스럽게 유지되도록 했습니다.
- 회원 탈퇴를 카드에서 빼고 화면 맨 아래 구분선 밑의 작은 텍스트 버튼으로 내렸습니다. 비밀번호 변경과 같은 시각적 무게를 갖는 것이 어색했습니다. 펼친 뒤의 확인 절차와 삭제 동작은 그대로입니다.
- 프로덕션 DB/데이터 변경: 없음.
- 검증:
  - `npm run lint`: 통과
  - `npm run test`: 통과
  - `npm run build`: 통과
```

브라우저 확인을 실제로 했다면 그 결과도 한 줄 덧붙인다. 못 했다면 못 했다고 적는다.

- [ ] **Step 9: Commit**

```bash
git add src/components/mypage/WithdrawCard.tsx src/components/mypage/WithdrawCard.test.tsx src/app/app/mypage/mypage.scss HANDOFF.md
git commit -m "feat: demote account withdrawal to a footer text button"
```

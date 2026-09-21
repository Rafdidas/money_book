# beUI 공통 UI 3차 (전체 화면 확장) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 대시보드에 적용한 공통 UI(Button, TextInput/Select/Textarea, Card, Badge, DateField, Tabs)를 앱 전체 화면으로 확장한다.

**Architecture:** 2차에서 만든 토큰(`_control-tokens.scss`)과 `src/components/ui`를 그대로 쓴다. 새 스타일 체계를 만들지 않고, 기존 마크업을 공통 컴포넌트로 기계적으로 치환한다. 치환 전후 화면이 (의도한 통일 외에는) 같아야 한다.

**Tech Stack:** Next.js 16, React 19, TypeScript, Sass, Vitest, Playwright, motion.

**선행:** 브랜치 `feat/beui-common-ui-phase-two` 위에서 이어 작업한다. 설계 근거는 `docs/superpowers/specs/2026-09-18-beui-common-ui-phase-two-design.md`.

## Global Constraints

- UI 문구는 한국어. 새 시각화/UI 의존성 추가 금지. backdrop-filter 신규 추가 금지.
- 모션은 상호작용(press/hover/탭/토스트)에만. 진입 애니메이션 금지. reduced-motion 존중.
- 높이 스케일 sm 32 / md 40 / lg 48 (`--control-height-*`). 리터럴 높이로 되돌리지 않는다.
- **인증(`app/auth/*`)·소개(`_intro`, `intro`)·약관(`legal`) 화면은 Button/입력 통일만 하고 `Card`(반투명)는 적용하지 않는다.** 배경 톤이 다르다.
- 치환은 동작(핸들러, disabled, type, aria, id, ref, name, autoComplete 등)을 100% 보존한다. 스타일 클래스만 컴포넌트 props로 옮긴다.
- **특이성 함정:** `page.scss`/각 화면 scss의 `.home-page .main .xxx`처럼 3클래스 이상 규칙은 `.ui-*`(1~2클래스)보다 우선한다. 컴포넌트를 적용한 뒤 실제 렌더 높이/배경이 토큰대로 나오는지 측정하고, 안 나오면 레거시 규칙의 겹치는 선언(height/padding/border/background)을 삭제한다. `!important` 금지.
- Playwright 프로젝트명은 `desktop-chromium`, `mobile-chromium`. `e2e/public-auth-demo.spec.ts:51`은 베이스 커밋에서도 실패하는 기존 결함이므로 정확히 그 2건만 실패해야 한다.
- 각 Task: `npm test`, `npm run lint`, `npm run build`, Playwright 통과 + 해당 화면 데스크톱(1440)·모바일(390)·다크 스크린샷 육안 확인 + 가로 오버플로 0. HANDOFF.md에 기록. 한국어 커밋 + 트레일러 `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- 서브에이전트는 확인 질문 없이 진행한다(사용자 승인 완료).

## 치환 규칙

| 기존 | 변경 |
|---|---|
| `<button className="button button--primary button--md ...extra">` | `<Button variant="primary" size="md" className="...extra">` |
| `button--full` | `full` |
| `button--icon-only`, `button--icon-left/right` | Task 1이 만든 `iconOnly`/`icon` prop (혹은 className 유지) |
| `button--header-primary/header-ghost/banner` | Task 1이 추가하는 variant |
| `<input className="form-input ...">`, 임의 `<input>` | `<TextInput className=...>` (type 유지) |
| `<select>` | `<Select>` |
| `<textarea>` | `<Textarea>` (Task 1) |
| `<div className="card ...">` (앱 내부 화면) | `<Card as? className>` |
| `<span className="badge ...">` | 이미 완료 |
| 체크박스/라디오 | 기존 `components/common/Checkbox.tsx` 유지, 높이만 토큰 확인 |

---

### Task 1: 공통 부품 보강 (Button 변형, Textarea)

**Files:**
- Modify: `src/components/ui/Button.tsx`, `Button.test.tsx`
- Create: `src/components/ui/Textarea.tsx`(또는 `FormControl.tsx`에 추가), 테스트
- Modify: `src/components/ui/ui.scss`

**Interfaces:**
- Produces:
  - `ButtonVariant` 확장: 기존 + `"header-primary" | "header-ghost" | "banner"` (기존 `.button--*` 클래스 출력).
  - `Button` props 추가: `icon?: "left" | "right"`(→ `button--icon-left/right`), `iconOnly?: boolean`(→ `button--icon-only`). 기존 클래스 스타일을 그대로 쓴다.
  - `Textarea` — `TextareaHTMLAttributes` 그대로, `ui-form-control ui-textarea` 클래스 출력, invalid/has-value 처리는 `TextInput`과 동일.

- [ ] Step 1: 사용 중인 모든 `button--*` 변형/조합을 `rg -o 'button--[a-z-]+' src --glob '*.tsx'`(주의: `-h` 옵션 쓰지 말 것)로 수집해 `Button`이 빠짐없이 표현 가능한지 확인, 부족하면 variant/prop 추가.
- [ ] Step 2: 실패하는 테스트 작성 → 구현 → 통과 (variant/icon/iconOnly 클래스 출력, Textarea 클래스/aria-invalid).
- [ ] Step 3: `.ui-textarea`는 `min-height`만 토큰(`--control-height-lg` 이상)으로 두고 패딩은 `--control-pad-md`. 세로 리사이즈 허용.
- [ ] Step 4: 검증·HANDOFF·커밋.

### Task 2: 대시보드 마무리

**Files:** `src/app/_home/HomeClient.tsx`, `DetailBulkActionBar.tsx`, `DashboardScheduleCard.tsx`, `src/app/page.scss`

- [ ] 남은 `.button` 전부를 `Button`으로 치환(약 30곳, 삭제/제출 3쌍은 완료). `DetailBulkActionBar`, 달력 이동 버튼, 모달 버튼 포함.
- [ ] `.main-overview--calendar-nav .button { width:28px; height:28px }` 같은 리터럴 높이는 `--control-height-sm` 이하 아이콘 버튼 규칙으로 정리하거나 의도 주석을 남긴다.
- [ ] 검증(대시보드 e2e 전체, 스크린샷) → HANDOFF → 커밋.

### Task 3: 분석 · 투자 화면

**Files:** `src/app/app/analysis/page.tsx`, `analysis.scss`, `src/app/app/invest/page.tsx`, `invest.scss`, `src/components/chart/*`(필요 시)

- [ ] 카드(분석 10, 투자 9) → `Card`. 레거시 `.card` 의존 규칙(`> .card`, `.card .empty` 등) 보존/이전.
- [ ] 버튼 → `Button`, input/select → `TextInput`/`Select`(연 선택 `analysis-year-control` 등 리터럴 높이 정리).
- [ ] 투자 표의 `min-height: 22px` 배지 예외(`invest.scss`)는 유지하되 이유 주석.
- [ ] 검증(분석·투자 데모 화면 스크린샷 라이트/다크, 데스크톱/모바일) → HANDOFF → 커밋.

### Task 4: 문의 · 마이페이지

**Files:** `src/app/app/inquiries/page.tsx`, `src/app/app/mypage/*`, `src/components/mypage/*Card.tsx`, 관련 scss

- [ ] 문의: 카드 4, 버튼, input/select/textarea → 공통 컴포넌트.
- [ ] 마이페이지 카드 4종 + 폼 → `Card`, `TextInput`, `Button`. 기존 vitest(`ProfileCard`, `PasswordCard` 등)가 있으면 그대로 통과해야 한다.
- [ ] 검증 → HANDOFF → 커밋. (실계정이 없어 데모 모드로 렌더되는 범위까지만 육안 확인하고 한계를 기록.)

### Task 5: 공통 폼·모달·CategoryManager·달력

**Files:** `src/components/expense/ExpenseForm.tsx`, `ExpenseList.tsx`, `src/components/CategoryManager.tsx`, `calendar/CalendarView.tsx`, `app-alert/AppAlertProvider.tsx`, `common/SideMenu.tsx`, `common/Modal.tsx`

- [ ] 버튼/입력을 공통 컴포넌트로 치환. `CategoryManager`는 vitest·e2e(`custom-category-manager.spec.ts`)가 있으므로 반드시 통과.
- [ ] `SideMenu`는 nav 링크/드로어 버튼이 많아 스타일 손상 위험이 크다. `Button`으로 바꾸는 대상은 로그아웃·닫기 같은 실제 버튼만, `Link` 기반 메뉴 항목은 건드리지 않는다.
- [ ] 검증 → HANDOFF → 커밋.

### Task 6: 인증 · 소개 · 오류 화면 (Card 제외)

**Files:** `src/app/auth/{login,signup,reset-password,forgot-password,consent,callback}/page.tsx`, `_intro/IntroCta.tsx`, `common/PublicCta.tsx`, `error.tsx`, `global-error.tsx`, 관련 scss

- [ ] 버튼 → `Button`, input → `TextInput`. 높이는 md(40px) 또는 lg(48px, 기존 로그인 폼이 큰 입력이면 lg 유지).
- [ ] 로그인 e2e(`public-auth-demo.spec.ts`)와 `login` 관련 vitest 통과. 로그인 진행 표시(스피너/문구)·오류 안내·입력값 보존 동작을 바꾸지 않는다.
- [ ] 검증(로그인/가입 화면 스크린샷 데스크톱·모바일·다크) → HANDOFF → 커밋.

### Task 7: 잔여 정리

- [ ] `rg 'className="button|className=\{`button|button button--' src --glob '*.tsx'` 잔여 확인. 의도적 예외(SideMenu Link 등)만 남기고 목록화.
- [ ] `rg '<input|<select|<textarea' src --glob '*.tsx'`로 공통 컴포넌트 밖 입력 확인.
- [ ] 사용되지 않게 된 레거시 scss(`_input.scss` 등)와 죽은 규칙 삭제. 삭제 전 `rg`로 참조 0 확인.
- [ ] 전체 e2e·스크린샷 스윕(모든 주요 라우트 × 1440/390 × 라이트/다크), 가로 오버플로 0 확인.
- [ ] HANDOFF 최종 정리 → 커밋.

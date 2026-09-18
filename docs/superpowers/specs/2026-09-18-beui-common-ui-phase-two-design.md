# beUI 기반 공통 UI 2차 설계 — 토큰 정렬과 컴포넌트 이관

날짜: 2026-09-18
선행: `docs/superpowers/specs/2026-09-16-beui-common-ui-design.md`

## 배경

1차에서 `src/components/ui`에 Tabs, TextInput/Select, Badge, ToastProvider,
AnimatedNumber를 만들고 대시보드에 연결했습니다. 화면을 확인한 결과 두 가지
문제가 남았습니다.

1. **대체가 아니라 추가였습니다.** 입력·선택은 18곳 전부 `ui-form-control`로
   교체됐지만, 화면 면적이 가장 큰 버튼은 `.button` 222곳이 그대로이고 공통
   계층에 Button 자체가 없습니다. 배지는 `ui-badge` 1곳과 기존 `.badge` 9곳이
   혼재합니다. 표·모달·카드·탐색은 손대지 않았습니다.
2. **높이 체계가 둘로 갈라졌습니다.** 기존 시스템은 `.button`의
   `--button-height` 24/32/36/40/48, `.form-input`의 32/40/48, `.badge` 24px로
   정렬돼 있습니다. 1차 계층은 `ui.scss`에서 각자 높이를 직접 씁니다 —
   `ui-form-control` 42px, `ui-tabs__tab` 32px, 타입 토글 38px, 토스트 48px.
   42px는 기존 스텝에 없어 같은 줄의 40px 버튼과 어긋나고, 탭은 옆 입력보다
   10px 낮습니다. 공유 사이즈 토큰이 없어 컴포넌트가 늘수록 어긋남이 누적됩니다.

## 목표

- 모든 컨트롤이 하나의 높이 스케일을 참조하게 합니다.
- 버튼·배지·카드·표·날짜 입력을 공통 UI 계층으로 옮겨 실제로 "대체된" 화면을
  만듭니다.
- 대시보드의 반투명 톤은 유지하되 토큰으로 체계화합니다.

## 범위 밖

- Tailwind·shadcn 계층 도입. 1차 결정대로 Sass 토큰에 포팅합니다.
- 새 시각화 의존성 추가.
- 분석·마이페이지·투자 화면의 전면 개편. 토큰 정렬 효과는 자동으로 미치지만
  컴포넌트 이관은 대시보드를 우선합니다.

## 단계 A — 공통 컨트롤 토큰

코드 변경 없이 SCSS 값만 토큰으로 치환합니다. 이 단계만으로 높이 불일치가
해소되며 회귀 위험이 낮습니다.

### A-1. `src/styles/_control-tokens.scss` 신설

`:root`에 크기·표면 토큰만 정의합니다. 색은 `src/app/color_tokens.scss`가 계속
담당하며 중복 정의하지 않습니다.

```
--control-height-sm: 32px;   --control-pad-sm: 10px;
--control-height-md: 40px;   --control-pad-md: 12px;
--control-height-lg: 48px;   --control-pad-lg: 16px;
--control-radius-sm: 8px;    --control-radius-md: 10px;
--control-gap: 8px;
--badge-height: 24px;
```

기본 스텝은 md = 40px입니다. 기존 `.button` 기본값이 40px, `.form-input`
중간값도 40px이라 이미 화면 다수가 여기에 맞춰져 있고, 모바일 터치 타깃
기준도 충족합니다.

### A-2. 반투명 표면 토큰

대시보드에 옅은 반투명 톤을 적용하려는 의도가 있습니다. HANDOFF의 2026-09-14
"대시보드 반투명 톤 정리" 기록이 있으나 해당 변경은 현재 코드에 없습니다
(`dashboard-page` 범위가 어디에도 없고 `page.scss`의 미커밋 변경은 4줄뿐).
따라서 이 항목은 기존 값의 체계화가 아니라 **새로 정의**하는 작업입니다.

같은 파일에 표면 토큰을 정의하고 라이트/다크 각각의 값을 둡니다.

```
--surface-translucent:        color-mix(in srgb, var(--surface-lowest) 78%, transparent)
--surface-translucent-strong: color-mix(in srgb, var(--surface-lowest) 88%, transparent)
--surface-border-translucent: color-mix(in srgb, var(--outline) 62%, transparent)
--surface-shadow-soft:        0 2px 8px rgba(9, 11, 17, 0.06)
```

그림자는 `page.scss:287`에 이미 쓰이는 값을 기준으로 삼습니다. 나머지 세 값은
초기값이며, B-3 구현 중 실제 화면에서 대비를 보고 비율을 조정합니다.
`backdrop-filter`는 넣지 않습니다 — 2026-09-14 기록대로 창 크기 변경 중 합성
레이어 깜빡임의 원인이 됐습니다. 다크 모드는 어두운 반투명 패널로 별도 값을
둡니다.

### A-3. 기존 스타일 연결

| 대상 | 현재 | 변경 후 |
|---|---|---|
| `.ui-form-control` | 42px | `var(--control-height-md)` = 40px |
| `.main-overview--control.ui-form-control` | height/min-height 42px, padding 9px 12px | md 토큰 + `--control-pad-md` |
| `.ui-tabs__tab` | min-height 32px | `var(--control-height-sm)` (32px 유지) |
| `.main-overview--type-toggle .ui-tabs__tab` | 38px | `var(--control-height-md)` = 40px |
| `.button` `--button-height` | 40px 리터럴 | md 토큰 참조 (sm/lg도 동일 대응) |
| `.form-input` | 32/40/48 리터럴 | sm/md/lg 토큰 참조 |
| `.badge`, `.ui-badge` | 각각 24px | `var(--badge-height)` |
| `.calendar-picker` 셀 | 40px | `var(--control-height-md)` |

`.button`의 24px·36px 스텝은 스케일에 없는 값입니다. 사용처를 확인해 36px는
sm(32px) 또는 md(40px)로 흡수하고, 24px는 배지 높이와 같은 용도이므로
`--badge-height`를 참조하게 합니다. 흡수 대상이 시각적으로 어색한 곳이 나오면
해당 스텝만 예외로 남기고 이유를 주석으로 남깁니다.

### A-4. 검증

`npm run lint`, `npm run build`. 데스크톱과 390px에서 같은 줄에 놓인
입력·선택·버튼·탭의 높이가 일치하는지 확인합니다.

## 단계 B — 컴포넌트 이관

다섯 대상을 `src/components/ui`에 두고 거래·카테고리·투자 도메인 로직은 넣지
않습니다. 순서는 아래와 같으며, 각 항목이 끝날 때마다 검증합니다.

### B-1. Button

`.button` 클래스 체계를 유지한 채 `Button.tsx`가 기존 클래스를 그대로
출력합니다. 222곳의 클래스명을 일괄 치환하지 않는 절충이며, 당분간 컴포넌트를
쓰는 곳과 생 `<button class="button">`이 공존합니다. 사용자가 이 절충을
승인했습니다.

- props: `variant`(primary/secondary/ghost/danger), `size`(sm/md/lg),
  `disabled`, 나머지는 `ButtonHTMLAttributes` 전달.
- 높이·패딩은 A의 토큰을 참조합니다.
- 절제된 press/hover 모션만 얹습니다(`PRESS_TRANSITION`).
- 이관은 대시보드의 주요 액션 버튼부터 시작합니다.

### B-2. Badge

기존 `.badge` 9곳을 `ui-badge`로 흡수하고 `src/styles/_badge.scss`를 제거합니다.
수가 적어 완전 치환이 가능합니다. 기존 `.badge`의 색 변형이 `ui-badge`의
tone(neutral/info/success/danger)에 대응되지 않으면 tone을 추가합니다.

### B-3. Card

대시보드 카드·패널의 표면을 `Card.tsx` 하나로 모으고, A-2의 토큰으로 옅은
반투명 톤을 새로 적용합니다. 패딩·테두리 반경·그림자를 한 곳에서 정의해 카드마다
다른 값이 생기지 않게 합니다.

- props: `tone`(기본/강조), `padding`(기본/컴팩트), `as`.
- 개요 카드 네 개는 미세한 색감 차이만 두고 위쪽 단색 선은 두지 않습니다.
- 대비를 확인합니다. 반투명 배경 위에서도 금액 텍스트가 읽혀야 합니다.

### B-4. Table

상세내역 표의 헤더·행 높이를 `--control-height-*`에 맞추고 톤을 Card와
통일합니다. 세로 높이 제한은 `107218d`에서 제거한 상태를 유지하고 가로
스크롤도 유지합니다. 이 두 가지는 Playwright 회귀 테스트로 이미 보호됩니다.

### B-5. DateField

현재 `type="date"` 네이티브 입력 3곳과 별도 `.calendar-picker` 모달이 갈라져
있습니다. 하나의 `DateField`로 합칩니다.

- 트리거는 40px 컨트롤(`ui-form-control`과 같은 토큰).
- 팝오버는 기존 `.calendar-picker`를 재사용합니다.
- 모바일은 네이티브 피커가 더 쓰기 좋을 수 있으므로, 뷰포트에 따라 갈라지는
  동작을 유지할지는 구현 중 390px 실측으로 정하고 결과를 HANDOFF에 남깁니다.

## 모션 방침

상호작용에만 적용합니다 — press/hover, 탭 선택 이동, 토스트 등장·퇴장.
카드·표 행의 진입 순차 애니메이션은 넣지 않습니다. 목록이 길 때 모바일에서
느려지고, 핵심 값은 움직임 없이 즉시 읽혀야 하기 때문입니다.
모든 신규 컴포넌트는 `useReducedMotionPreference`를 존중합니다.

## 테스트

1차와 같이 각 신규 모듈의 테스트를 먼저 작성합니다.

- Button: variant/size 클래스 출력, disabled 시 클릭 미발생, reduced-motion.
- Badge: tone별 클래스, 기존 `.badge` 사용처의 대체 렌더링.
- Card: tone/padding 클래스 출력.
- DateField: 값 선택·변경 콜백, 키보드 접근, 잘못된 날짜 입력 처리.
- 토큰: 기존 `src/lib/motion/tokens.test.ts`와 같은 방식으로 필요한 경우만.

## 검증

- `npm test`, `npm run lint`, `npm run build`.
- Playwright 대시보드 데모 흐름(추가/수정 탭 전환 포함), Chromium 및 Pixel 5.
- 데스크톱 1440px, 1024px, 390px 및 다크 모드에서 육안 확인. 가로 오버플로 0,
  같은 줄 컨트롤 높이 일치, 프레임워크 오류 화면 없음.
- 단계 A와 B의 각 항목이 끝날 때마다 HANDOFF.md를 갱신합니다.

## 열린 항목

- `.button`의 36px·24px 스텝 흡수 결과는 A-3 구현 중 사용처를 보고 확정합니다.
- 반투명 표면의 최종 투명도 비율은 B-3 구현 중 라이트·다크 대비를 보고
  확정합니다.
- DateField의 모바일 네이티브 피커 유지 여부는 B-5 구현 중 실측으로 정합니다.

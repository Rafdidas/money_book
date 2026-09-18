# beUI 기반 공통 UI 설계

## 목적

beUI의 접근성·모션 패턴을 머니북의 Sass 토큰 위에 이식해, 화면별 도메인 로직과 분리된 공통 UI 계층을 만든다. 첫 사용처는 대시보드지만 컴포넌트는 거래·분석·투자·인증 화면에서 재사용 가능해야 한다.

## 범위

- `src/components/ui`에 Button, Input, Tabs, Select, Checkbox, Badge, Modal, Toast의 공통 인터페이스를 둔다.
- `motion`만 런타임 의존성으로 추가한다. Tailwind, shadcn, lucide는 도입하지 않는다.
- 기존 Sass 컬러 토큰과 다크 모드를 그대로 사용한다.
- 1차에서는 Tabs, Badge, Toast 기반과 대시보드의 입력 모드 탭·상태 배지를 전환한다.

## 설계 원칙

- 공통 컴포넌트는 거래·카테고리·투자 같은 도메인 용어·판단을 포함하지 않는다.
- 모든 인터랙티브 컴포넌트는 필요한 위치에만 `"use client"` 경계를 둔다.
- 사용자가 `prefers-reduced-motion: reduce`를 설정하면 이동·스케일 애니메이션을 제거한다.
- 기존 `AppAlertProvider`의 확인 대화상자는 사용자의 결정을 기다리는 Modal 역할을 유지한다. Toast는 저장 결과처럼 비차단 피드백에만 사용한다.
- 기존 CSS 클래스 및 API는 즉시 제거하지 않는다. 대시보드는 공통 컴포넌트의 첫 소비자로만 변경한다.

## 1차 검증 기준

- Tabs는 `role=tablist/tab`, 선택 상태 및 키보드 이동을 제공한다.
- Badge는 `neutral`, `info`, `success`, `danger` tone을 지원하고 상태 의미를 추론하지 않는다.
- Toast는 제공자 밖 사용을 명확히 거부하고, 호출 시 `role=status` 피드백을 렌더링한다.
- 대시보드의 추가/수정 전환은 공통 Tabs를 사용하며 기존 동작을 보존한다.
- 단위 테스트, lint, production build를 실행한다. 대시보드를 데스크톱과 390px 모바일 폭에서 확인한다.

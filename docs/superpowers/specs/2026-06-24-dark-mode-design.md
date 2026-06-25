# 다크모드 설계 (2026-06-24)

## 목표
인트로 페이지(`/`, `/intro`)를 제외한 앱 전체에 다크모드를 제공한다.
토글 버튼은 `SideMenu`의 nav `.side-menu--list` 안, 문의하기 항목 바로 아래에 둔다.

## 핵심 결정
- **팔레트**: `color_tokens.scss`의 핵심 토큰만 손튜닝. `:root`(라이트)는 그대로 두고
  같은 파일에 `[data-theme="dark"]` 블록을 추가해 덮어쓴다.
  - surface / on-surface / outline / transparency: 전면 다크 재정의 (UI 대부분 차지)
  - primary: 옅은 틴트(ultra-low~low)만 다크 블루 틴트로, 액티브용 higher/highest는 명도 보정
  - 강조색: 독립 텍스트로 쓰이는 `*-highest`는 밝게, 배지 배경 `*-lower`는 다크 틴트,
    배지 텍스트 `--on-*-high`는 밝게. (이 둘은 서로 다른 토큰이라 충돌 없음)
  - 그 외 강조색 base/mid/high(채도 높은 채움색)는 다크에서도 가독성이 충분해 유지
- **저장/기본값**: 기본 라이트. 선택은 `localStorage["mb-theme"]`에 저장, 토글로 수동 전환.
  시스템 설정(prefers-color-scheme)은 따르지 않는다.
- **적용 위치**: `<html>`의 `data-theme` 속성.
- **인트로 제외**: `/`·`/intro`에서는 저장값과 무관하게 항상 `light` 강제.
- **FOUC 방지**: `layout.tsx` `<head>`에 인라인 스크립트로 렌더 전 `data-theme` 선설정
  (인트로 경로면 light).

## 변경 파일
1. `src/app/color_tokens.scss` — `[data-theme="dark"]` 블록 추가 (파일 끝, `:root` 뒤).
2. `src/components/common/AppIcon.tsx` — `dark_mode`, `light_mode` 아이콘 path 추가.
3. `src/components/common/ThemeProvider.tsx` (신규) — 테마 context/provider, localStorage,
   인트로 강제 light, 속성 적용. 초기 깜빡임은 인라인 스크립트가 처리하므로 apply effect는
   첫 실행을 스킵.
4. `src/app/providers.tsx` — children을 `ThemeProvider`로 감싼다.
5. `src/app/layout.tsx` — `<head>`에 FOUC 방지 인라인 스크립트.
6. `src/components/common/SideMenu.tsx` — `useTheme` 사용, 데스크톱/모바일 nav 리스트
   문의하기 아래에 토글 `<li>` 추가 (기존 `side-menu--item` 스타일 재사용).
7. `src/components/common/side-menu.scss` — 모바일 하단 네비/헤더의 하드코딩 화이트 글래스
   다크 오버라이드.

## 검증
- `npm run lint`, `npm run build`
- 데스크톱/모바일 너비에서 라이트·다크 모두 확인, 인트로는 항상 라이트 확인.

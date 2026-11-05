# 대시보드 상세내용 카테고리 필터 설계

## 의도

대시보드 '상세내용' 테이블을 카테고리별로 보고 싶다는 요청이 많다. 가계부이므로
필터 결과의 건수와 금액(수입·지출)을 함께 보여준다.

## 배치

```
상세내용 (h3, 기존 제목)
[분류 필터 — Multi Select]
총 12건 · 수입 1,200,000원 · 지출 340,000원
[detail-table]
```

## 결정 사항 (사용자 확정)

- 필터는 제목과 테이블 사이, 요약 줄은 필터 아래에 둔다.
- 요약 줄에는 총 건수, 수입 합계, 지출 합계를 표시한다.
- 필터 UI는 beUI Multi Select(https://beui.dev/components/motion/multi-select)를
  기존 방침대로 Sass + `motion`으로 포팅한다(Tailwind·lucide·clsx 도입 없음).
- Center Morph Modal, Date Range Picker는 이번 범위에서 제외하고 별도 작업으로 진행한다.

## 동작

- 선택지: 이번 달 상세내용(`displayMonthlyExpenses`)에 실제로 존재하는 카테고리.
- 아무것도 선택하지 않으면 전체로 본다. 여러 개를 선택하면 합집합으로 거른다.
- 기존 정렬(`detailSort`)과 일괄 삭제는 필터 결과 안에서 동작한다.
- 요약 줄의 값은 모두 필터가 적용된 결과 기준이다.
- 금액은 hover 없이 항상 보인다.

## 구현자 판단으로 정한 것 (사용자 검토 대상)

- 필터를 바꾸면 일괄 삭제 선택을 초기화한다(보이지 않는 행 삭제 방지).
- 적금·투자 내역이 결과에 있으면 지출에 합치지 않고 `저축 ○○원`을 따로 덧붙인다.
- 모바일에서는 요약 줄이 줄바꿈되고, 칩이 많으면 "식비 외 3개"처럼 축약한다.
- 월이 바뀌면 필터는 초기화한다.

## 코드 배치

- 공통 컴포넌트: `src/components/ui/MultiSelect.tsx` (+ 테스트, `ui.scss`). 도메인 용어 금지.
  키보드(화살표/Enter/Escape/Backspace), combobox ARIA, 검색, reduced-motion 지원.
- 집계 로직: `src/app/_home/dashboardSummary.ts`에 순수 함수로 분리하고 테스트 추가.
- 렌더링: `src/app/_home/HomeClient.tsx` 상세내용 영역, 스타일은 `src/app/page.scss`.

## 검증

- 대상 Vitest, `npm run lint`, `npm run build`, 데스크톱·모바일 너비 육안 확인.

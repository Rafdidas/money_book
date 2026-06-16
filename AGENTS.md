<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# 알고 있던 Next.js라고 가정하지 마세요

이 버전은 API, 관례, 파일 구조에 breaking change가 있을 수 있습니다. 코드를 작성하기 전에 반드시 `node_modules/next/dist/docs/`에서 관련 가이드를 읽고, deprecation 안내를 따르세요.
<!-- END:nextjs-agent-rules -->

# Money Book Project Rules

# 머니북 프로젝트 규칙

## Product Shape

Money Book is a Korean personal finance web app. Keep dashboard surfaces focused
on quick status checks, and put heavier interpretation features in analysis
screens.

## 제품 형태

머니북은 한국어 개인 재무 웹 앱입니다. 대시보드는 빠른 상태 확인에 집중하고,
무거운 해석 기능은 분석 화면에 배치하세요.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Sass
- Supabase
- Chart.js / react-chartjs-2 for existing standard charts
- Custom SVG is acceptable for bespoke finance visualizations

## 기술 스택

- Next.js 16 App Router
- React 19
- TypeScript
- Sass
- Supabase
- 기존 표준 차트는 Chart.js / react-chartjs-2 사용
- 맞춤형 재무 시각화에는 Custom SVG 사용 가능

## Code Style

- Follow existing file placement under `src/app`, `src/components`, `src/lib`,
  `src/styles`, and `src/types`.
- Keep reusable chart data transformation logic separate from React rendering
  when it is non-trivial.
- Prefer existing API types such as `MoneyBookEntry` over duplicating data
  shapes.
- Use Korean UI copy for user-facing text.
- Do not introduce new visualization dependencies unless the feature genuinely
  needs a layout engine or renderer.

## 코드 스타일

- `src/app`, `src/components`, `src/lib`, `src/styles`, `src/types` 아래의
  기존 파일 배치 규칙을 따르세요.
- 차트 데이터 변환 로직이 단순하지 않다면 React 렌더링 코드와 분리하세요.
- 데이터 형태를 새로 중복 정의하기보다 `MoneyBookEntry` 같은 기존 API 타입을
  우선 사용하세요.
- 사용자에게 보이는 UI 문구는 한국어로 작성하세요.
- 기능에 실제로 레이아웃 엔진이나 렌더러가 필요한 경우가 아니라면 새 시각화
  의존성을 추가하지 마세요.

## UX Guidelines

- Dashboard: quick monthly totals, recent entries, progress, and concise CTAs.
- Monthly analysis: richer interpretation such as category analysis, year/month
  comparisons, and cash-flow explanations.
- Mobile is a primary target. Avoid dense desktop charts on mobile when a
  compact interpretation is clearer.
- Essential values must be readable without hover.

## UX 가이드라인

- 대시보드: 빠른 월별 합계, 최근 내역, 진행 상태, 간결한 CTA에 집중하세요.
- 월별 분석: 카테고리 분석, 연/월 비교, 현금 흐름 설명처럼 더 깊은 해석을
  제공합니다.
- 모바일은 주요 대상입니다. 모바일에서는 조밀한 데스크톱 차트보다 간결한 해석이
  더 명확한 경우 이를 우선하세요.
- 핵심 값은 hover 없이도 읽을 수 있어야 합니다.

## Token-Saving Rules

- Read only the files needed for the current task, and prefer targeted `rg`
  searches before opening large files.
- Avoid dumping full command output into the chat. Summarize the important
  result, errors, and next action.
- Keep progress updates short and focused on what changed or what was learned.
- Do not re-read unchanged files unless the previous context is stale or the
  task depends on exact current contents.
- Prefer small, scoped diffs over broad refactors.
- When verification passes, report the command and outcome instead of pasting
  long logs.

## 토큰 절약 규칙

- 현재 작업에 필요한 파일만 읽고, 큰 파일을 열기 전에는 `rg`로 필요한 위치를
  먼저 좁히세요.
- 명령 출력 전체를 대화에 붙여넣지 말고, 중요한 결과와 오류, 다음 행동만
  요약하세요.
- 진행 상황 공유는 짧게 유지하고, 무엇이 바뀌었는지 또는 무엇을 알게 되었는지에
  집중하세요.
- 이전 맥락이 오래되었거나 정확한 최신 내용이 필요한 경우가 아니라면 변경되지
  않은 파일을 반복해서 읽지 마세요.
- 넓은 리팩터링보다 작고 범위가 명확한 diff를 선호하세요.
- 검증이 통과하면 긴 로그 대신 실행한 명령과 결과를 보고하세요.

## Verification

- Run `npm run lint` after meaningful code changes.
- Run `npm run build` before calling implementation complete.
- For visual changes, verify both desktop and mobile widths.
- Update `HANDOFF.md` after each meaningful work step with what changed, what
  was verified, and what remains.

## 검증

- 의미 있는 코드 변경 후에는 `npm run lint`를 실행하세요.
- 구현 완료를 말하기 전에는 `npm run build`를 실행하세요.
- 시각적 변경은 데스크톱과 모바일 너비를 모두 확인하세요.
- 의미 있는 작업 단계마다 `HANDOFF.md`에 변경 사항, 검증한 내용, 남은 일을
  업데이트하세요.

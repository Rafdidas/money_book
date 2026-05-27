# Money Book

수입과 지출을 월 단위로 기록하고 한눈에 확인하는 개인 가계부 대시보드입니다. Supabase 인증을 사용해 사용자별 데이터를 분리하고, 로그인 없이도 데모 모드로 주요 기능을 체험할 수 있습니다.

https://money-book-one.vercel.app/

## 주요 기능

- 이메일 기반 회원가입 및 로그인
- 데모 모드 지원
- 수입/지출 내역 추가, 수정, 삭제
- 월별 수입, 지출, 잔액 요약
- 전월 대비 잔액 변화율 확인
- 일별 누적 흐름 라인 차트
- 카테고리별 지출 비율 파이 차트
- 월간 캘린더와 선택 날짜별 내역 확인
- 사용자별 Supabase RLS 정책 적용

## 기술 스택

- Next.js 16
- React 19
- TypeScript
- Sass
- Supabase Auth / Database
- Chart.js, react-chartjs-2
- react-calendar

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 만들고 Supabase 프로젝트 정보를 입력합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Supabase 테이블 생성

Supabase SQL Editor에서 아래 테이블을 생성합니다.

```sql
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  memo text not null default '',
  date date not null,
  created_at timestamptz not null default now()
);
```

RLS 정책은 `supabase/migrations/20260504000000_enable_expenses_rls.sql`에 포함되어 있습니다. Supabase CLI를 사용한다면 마이그레이션을 적용하고, CLI를 사용하지 않는다면 해당 SQL을 Supabase SQL Editor에서 실행합니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 열어 확인합니다.

## 사용 가능한 스크립트

```bash
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 실행
npm run lint     # ESLint 검사
```

## 프로젝트 구조

```text
src/
  app/
    auth/          # 로그인, 회원가입 화면
    page.tsx       # 메인 대시보드
    providers.tsx  # 인증 상태와 가계부 데이터 공급
  components/
    chart/         # 차트 컴포넌트
    common/        # 공통 UI 컴포넌트
  lib/
    api/           # Supabase 데이터 API
    supabase/      # Supabase 클라이언트
    demo.ts        # 데모 모드 데이터
  types/           # 공통 타입
  utils/           # 유틸 함수
supabase/
  migrations/      # Supabase RLS 마이그레이션
```

## 데모 모드

로그인 페이지의 `데모 체험하기` 버튼을 누르면 브라우저 `localStorage`에 샘플 내역이 저장됩니다. 데모 모드에서 추가, 수정, 삭제한 데이터는 Supabase에 저장되지 않으며 같은 브라우저에서만 유지됩니다.

## 배포

Vercel 등 Next.js를 지원하는 플랫폼에 배포할 수 있습니다. 배포 환경에도 `.env.local`과 같은 Supabase 환경 변수를 등록해야 합니다.

투자 현재가 기능은 `KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL`을 서버
환경변수로 사용합니다. 프로덕션에서는 KIS 시세를 서비스 화면에 제공할 수
있는 이용 범위를 확인한 뒤에만 `KIS_PUBLIC_QUOTE_ENABLED=true`를 설정하세요.
값을 설정하지 않거나 `false`이면 `/api/stocks/quotes`는 현재가 조회를
비활성화합니다.

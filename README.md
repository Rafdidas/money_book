# 머니북가계부

> 수입, 지출, 고정지출, 적금, 투자까지. 흩어진 돈의 흐름을 한눈에 정리하는 무료 온라인 가계부

[서비스 바로가기](https://monibuk.com/) · [데모 체험하기](https://monibuk.com/auth/login)

![머니북가계부 대시보드 미리보기](src/assets/img/renewal/feature.svg)

머니북가계부는 단순히 거래를 기록하는 데서 멈추지 않습니다. 이번 달에 얼마가
남았는지, 앞으로 얼마가 나갈지, 소비와 저축·투자가 어떤 흐름을 만들고 있는지를
빠르게 파악할 수 있도록 만든 한국어 개인 재무 웹 서비스입니다.

로그인 화면에서 **데모 체험하기**를 선택하면 가입 없이 바로 기능을 살펴볼 수 있습니다.

## 이런 순간을 위해 만들었습니다

- 월말마다 수입·지출·저축을 다시 계산하고 있다면
- 구독료, 보험료, 적금처럼 반복되는 납입일을 놓치기 쉽다면
- 소비 기록뿐 아니라 저축과 투자 원금도 한 흐름으로 보고 싶다면
- PC와 모바일에서 설치 없이 같은 가계부를 쓰고 싶다면

머니북은 대시보드에는 빠른 현황 확인을, 월별 분석에는 더 깊은 해석을 담았습니다.
핵심 금액은 차트에 마우스를 올리지 않아도 읽을 수 있도록 구성했습니다.

## 주요 기능

### 오늘의 돈 흐름을 빠르게 확인

- 수입·지출·저축·투자를 한 번에 기록하고 월별 합계를 확인합니다.
- 현재 남은 돈과 예정 금액을 함께 보여줘, 실제 잔액과 앞으로의 여유 자금을 구분합니다.
- 월간 캘린더와 최근 내역으로 언제 무엇을 기록했는지 빠르게 찾아봅니다.

### 반복되는 돈을 따로 관리

- 고정지출을 등록해 매달 반복되는 지출을 예정 금액으로 관리합니다.
- 적금의 납입액·납입일·만기일과 누적 납입액을 확인합니다.
- 만기 처리 시 해당 월 납입을 포함할지 선택하고, 완료된 적금도 만기 월 납입을 다시 수정할 수 있습니다.

### 소비를 월별로 해석

- 카테고리별 소비 비율과 월별 수입·지출·저축·투자 흐름을 분석합니다.
- 실제 기록과 예정 내역을 구분해 이번 달 현금 흐름을 이해합니다.
- 대시보드는 빠른 확인에, 분석 화면은 비교와 해석에 집중합니다.

### 투자 기록까지 한곳에서

- 국내 주식 매수 기록과 투자 원금을 가계부 흐름에 함께 정리합니다.
- 최근 거래일 종가 기준 평가금액, 평가손익, 포트폴리오 비중을 확인합니다.
- 일반계좌·ISA·연금저축 계좌를 구분하고 연도별 한도를 관리합니다.

## 안심하고 사용할 수 있도록

- **데모 데이터 분리**: 데모 모드는 브라우저에만 샘플 데이터를 저장하며, 실제 사용자 데이터와 섞이지 않습니다.
- **사용자별 접근 제어**: Supabase Auth와 Row Level Security(RLS) 정책으로 사용자별 데이터를 분리합니다.
- **어디서나 사용**: 별도 설치 없이 PC와 모바일 브라우저에서 이용할 수 있습니다.

## 기술 구성

| 영역 | 사용 기술 |
| --- | --- |
| 웹 애플리케이션 | Next.js 16 App Router, React 19, TypeScript |
| 스타일 | Sass |
| 데이터·인증 | Supabase Auth, PostgreSQL, RLS |
| 시각화 | Chart.js, react-chartjs-2, Custom SVG |
| 국내 주식 데이터 | 한국투자증권 종목 마스터, 금융위원회 공공데이터 API |

외부 종목·종가 데이터는 서버 경로에서 정규화하고 캐시·요청 제한을 적용합니다. 브라우저에
외부 API 키를 노출하지 않으면서도, 검색과 평가금액 조회를 안정적으로 제공하기 위한 구성입니다.

## 로컬에서 실행하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local`을 만들고 `.env.example`을 참고해 값을 입력합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 투자 종목 검색·종가 조회 기능을 사용할 때만 필요합니다.
FSC_STOCK_SERVICE_KEY=your-stock-service-key
FSC_SECURITIES_PRODUCT_SERVICE_KEY=your-securities-product-service-key
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인합니다.

## 데이터베이스 설정

Supabase 프로젝트를 만든 뒤 `supabase/migrations/`의 마이그레이션을 적용합니다. 이
마이그레이션에는 가계부·고정지출·적금·투자·문의·사용자 카테고리 테이블과 사용자별
접근을 위한 RLS 정책이 포함됩니다.

Supabase CLI를 쓰는 경우에는 프로젝트 연결 후 마이그레이션을 적용하고, CLI를 사용하지
않는 경우에는 Supabase SQL Editor에서 순서대로 실행할 수 있습니다.

## 개발 스크립트

```bash
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 실행
npm run lint     # ESLint 검사
npm test         # Vitest 테스트 실행
npm run test:e2e # Playwright E2E 테스트 실행
```

## 프로젝트 구조

```text
src/
  app/        # App Router 화면, 레이아웃, 서버 API
  components/ # 공통 UI와 차트 컴포넌트
  lib/        # Supabase, 외부 API, 데이터 처리 로직
  styles/     # 공통 스타일
  types/      # 공통 타입
  utils/      # 정규화와 포맷팅 유틸
supabase/
  migrations/ # 테이블, RLS, RPC 마이그레이션
```

## 서비스 링크

- [머니북가계부](https://monibuk.com/)
- [로그인 및 데모 체험](https://monibuk.com/auth/login)
- [이용약관](https://monibuk.com/legal/terms)
- [개인정보 처리방침](https://monibuk.com/legal/privacy)

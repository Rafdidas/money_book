# Money Book DB 구조 개선 설계서 1차

## 1. 설계 배경

현재 Money Book 서비스는 `expenses` 테이블 하나에 여러 성격의 데이터가 함께 저장되어 있다.

현재 `expenses`에 들어가는 데이터는 다음과 같다.

- 일반 수입
- 일반 지출
- 적금/저축 납입 내역
- 고정지출 예정/실행 내역
- 과거 주식 매수 내역 일부

현재 구조에서는 적금, 고정지출, 과거 주식 데이터를 별도 컬럼으로 구분하지 않고 `memo` 문자열 안의 메타데이터로 구분하고 있다.

예시:

```txt
[[savings:...]]
[[fixed-expense:...]]
[[stock:...]]
```

이 방식은 초기 개발에는 빠르게 구현할 수 있지만, 장기 운영 관점에서는 다음 문제가 생긴다.

- 문자열 파싱에 의존한다.
- 데이터 성격이 명확하지 않다.
- 적금/고정지출/투자 기능 확장이 어렵다.
- 월별 분석, 대시보드, 캘린더 로직이 복잡해진다.
- 기존 데이터와 신규 데이터의 역할이 섞인다.
- 나중에 마이그레이션할 때 중복 집계 위험이 있다.

따라서 이번 설계의 목표는 `expenses`의 역할을 단순화하고, 적금과 고정지출을 전용 테이블로 분리하는 것이다.

---

## 2. 설계 목표

이번 DB 구조 개선의 목표는 다음과 같다.

```txt
1. expenses의 역할을 실제 수입/지출 기록으로 단순화한다.
2. 적금과 고정지출은 전용 테이블로 분리한다.
3. 월별 예정/완료/취소/건너뜀 상태를 명확하게 관리한다.
4. 기존 데이터는 당장 이전하지 않는다.
5. 신규 데이터부터 새 구조를 적용한다.
6. 기존 expenses 기반 데이터는 당분간 함께 읽는다.
7. 충분히 안정화된 뒤 기존 데이터 이전을 검토한다.
```

---

## 3. 현재 expenses 테이블

현재 `expenses` 테이블 구조는 다음과 같다.

```sql
create table public.expenses (
  id uuid not null default gen_random_uuid (),
  amount bigint not null,
  type text null,
  category text null,
  memo text null,
  date date null,
  created_at timestamp with time zone null default now(),
  user_id uuid null,
  constraint expenses_pkey primary key (id)
) TABLESPACE pg_default;
```

주의:

```txt
README.md에 기록된 초기 생성 SQL과 실제 Supabase 콘솔에서 확인한 스키마가 다를 수 있다.
마이그레이션 실행 전에는 반드시 Supabase Table Editor 또는 SQL Editor에서 실제 컬럼 타입/null 여부를 확인한다.
특히 amount 타입, type/category/memo/date/user_id의 null 허용 여부를 확인해야 한다.
```

README.md 기준 초기 설계는 다음과 비슷하다.

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

장기적으로 `expenses`의 역할은 다음처럼 재정의한다.

```txt
expenses = 실제 발생한 일반 수입/지출 기록
```

다만 운영 안정성을 위해 기존 데이터는 그대로 유지한다.

```txt
기존 일반 수입/지출: expenses에서 계속 사용
기존 적금 데이터: expenses에서 legacy 데이터로 계속 읽기
기존 고정지출 데이터: expenses에서 legacy 데이터로 계속 읽기
기존 주식 데이터: 무시 또는 과거 데이터로만 유지
신규 적금 데이터: savings_accounts / savings_payments 사용
신규 고정지출 데이터: fixed_expense_rules / fixed_expense_payments 사용
```

---

## 4. 기존 데이터 처리 방향

기존 데이터는 바로 마이그레이션하지 않는다.

선택한 방향은 다음과 같다.

```txt
당분간 둘 다 읽고, 나중에 천천히 이전한다.
```

즉, 새 테이블을 만들더라도 기존 `expenses` 안의 적금/고정지출 데이터는 그대로 유지한다.

화면에서는 다음 데이터를 병합해서 보여준다.

```txt
1. expenses 기반 일반 수입/지출
2. expenses 기반 기존 적금 데이터
3. expenses 기반 기존 고정지출 데이터
4. savings_payments 기반 신규 적금 데이터
5. fixed_expense_payments 기반 신규 고정지출 데이터
```

---

## 5. 신규 테이블 설계 방향

적금과 고정지출은 다음 방식으로 분리한다.

```txt
전용 테이블 + 월별 인스턴스 테이블
```

즉, 규칙과 월별 내역을 분리한다.

```txt
savings_accounts = 적금 계좌/규칙
savings_payments = 월별 적금 납입 예정/완료 내역

fixed_expense_rules = 고정지출 반복 규칙
fixed_expense_payments = 월별 고정지출 예정/완료 내역
```

---

## 6. savings_accounts 테이블

`savings_accounts`는 적금 계좌 또는 적금 규칙을 저장하는 테이블이다.

```sql
create table public.savings_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  monthly_amount bigint not null,
  payment_day integer not null check (payment_day between 1 and 31),

  start_date date not null,
  maturity_date date null,
  has_no_maturity boolean not null default false,

  initial_amount bigint not null default 0,
  status text not null default 'active'
    check (status in ('active', 'completed', 'ended')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 역할

```txt
적금 이름
월 납입액
납입일
시작일
만기일
만기 없음 여부
초기 납입액
현재 상태
```

### 기존 memo 메타데이터와의 매핑

기존 `[[savings:...]]` 안에 있던 값은 다음 컬럼으로 분리한다.

| 기존 메타 값 | 신규 컬럼 |
|---|---|
| id | id |
| name | name |
| paymentDay | payment_day |
| maturityDate | maturity_date |
| initialAmount | initial_amount |
| hasNoMaturity | has_no_maturity |

기존에는 월 납입액이 `expenses.amount`에 저장되어 있었지만, 새 구조에서는 `monthly_amount`로 분리한다.

---

## 7. savings_payments 테이블

`savings_payments`는 월별 적금 납입 예정/완료 내역을 저장하는 테이블이다.

```sql
create table public.savings_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  savings_account_id uuid not null references public.savings_accounts(id) on delete cascade,

  amount bigint not null,
  payment_date date not null,

  status text not null default 'scheduled'
    check (status in ('scheduled', 'paid', 'skipped', 'cancelled')),

  paid_at timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 역할

```txt
월별 납입 예정일
납입 금액
납입 상태
실제 납입 완료 시간
```

### status 의미

| status | 의미 |
|---|---|
| scheduled | 납입 예정 |
| paid | 납입 완료 |
| skipped | 건너뜀 |
| cancelled | 취소 |

### 초기 UX 방침

현재 서비스는 개별 월 납입 완료 버튼이 없다.

기존 UX를 유지하려면 초기에는 다음 방식으로 계산할 수 있다.

```txt
payment_date <= 오늘이면 paid처럼 계산
status UI는 나중에 노출
```

다만 장기적으로는 사용자가 직접 납입 완료, 건너뜀, 취소를 선택할 수 있게 하는 것이 좋다.

---

## 8. fixed_expense_rules 테이블

`fixed_expense_rules`는 고정지출 반복 규칙을 저장하는 테이블이다.

```sql
create table public.fixed_expense_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  amount bigint not null,
  category text null,

  payment_day integer not null check (payment_day between 1 and 31),

  start_date date not null,
  end_date date null,
  has_no_end_date boolean not null default false,

  status text not null default 'active'
    check (status in ('active', 'ended')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 역할

```txt
고정지출명
금액
카테고리
매월 지출일
시작일
종료일
종료일 없음 여부
상태
```

### 기존 memo 메타데이터와의 매핑

기존 `[[fixed-expense:...]]` 안에 있던 값은 다음 컬럼으로 분리한다.

| 기존 메타 값 | 신규 컬럼 |
|---|---|
| id | id |
| name | name |
| paymentDay | payment_day |
| endDate | end_date |
| hasNoEndDate | has_no_end_date |

기존에는 금액이 `expenses.amount`에 저장되어 있었지만, 새 구조에서는 `fixed_expense_rules.amount`에 저장한다.

---

## 9. fixed_expense_payments 테이블

`fixed_expense_payments`는 월별 고정지출 예정/완료 내역을 저장하는 테이블이다.

```sql
create table public.fixed_expense_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fixed_expense_rule_id uuid not null references public.fixed_expense_rules(id) on delete cascade,

  amount bigint not null,
  payment_date date not null,

  status text not null default 'scheduled'
    check (status in ('scheduled', 'paid', 'skipped', 'cancelled')),

  paid_at timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 역할

```txt
월별 지출 예정일
금액
납부 상태
실제 납부 완료 시간
```

### status 의미

| status | 의미 |
|---|---|
| scheduled | 지출 예정 |
| paid | 납부 완료 |
| skipped | 건너뜀 |
| cancelled | 취소 |

---

## 10. 투자 테이블 설계 방향

현재 투자 기능은 Supabase 테이블이 아니라 브라우저 `localStorage` 기반이다.

현재 투자 데이터 구조는 실질적으로 다음과 같다.

```txt
id
symbol
name
market
quantity
unitPrice
purchaseDate
createdAt
```

현재가, 평가금액, 수익률, 일간수익은 저장하지 않고 화면에서 계산한다.

투자는 이번 1차 마이그레이션 대상에서는 제외한다.

추후 확장 시 최소 테이블은 다음처럼 잡을 수 있다.

```sql
create table public.investment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  symbol text not null,
  name text not null,
  market text not null,

  transaction_type text not null default 'buy'
    check (transaction_type in ('buy', 'sell')),

  quantity numeric not null,
  unit_price numeric not null,
  transaction_date date not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

투자 데이터의 원칙은 다음과 같다.

```txt
저장: 매수/매도 원본 데이터
계산: 현재가, 평가금액, 수익률, 일간수익
```

수익률과 현재가는 API 결과에 따라 달라지므로 DB에 고정 저장하지 않는 편이 안전하다.

---

## 11. RLS 정책 설계

모든 신규 테이블은 `user_id = auth.uid()` 기준으로 접근을 제한한다.

기본 원칙은 다음과 같다.

```txt
본인 user_id 데이터만 select 가능
본인 user_id 데이터만 insert 가능
본인 user_id 데이터만 update 가능
본인 user_id 데이터만 delete 가능
```

### RLS 활성화

```sql
alter table public.savings_accounts enable row level security;
alter table public.savings_payments enable row level security;
alter table public.fixed_expense_rules enable row level security;
alter table public.fixed_expense_payments enable row level security;
```

### savings_accounts 정책 예시

```sql
create policy "select_own_savings_accounts"
on public.savings_accounts
for select
to authenticated
using (auth.uid() = user_id);

create policy "insert_own_savings_accounts"
on public.savings_accounts
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "update_own_savings_accounts"
on public.savings_accounts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "delete_own_savings_accounts"
on public.savings_accounts
for delete
to authenticated
using (auth.uid() = user_id);
```

다른 테이블도 동일한 패턴으로 생성한다.

### payments 테이블의 부모 소유권 검증

`savings_payments`와 `fixed_expense_payments`는 각각 부모 테이블을 참조한다.

따라서 단순히 payment row의 `user_id = auth.uid()`만 확인하면 부족할 수 있다.

예를 들어 악의적이거나 잘못된 클라이언트가 다음처럼 요청할 가능성을 막아야 한다.

```txt
user_id는 본인 ID
savings_account_id는 다른 사용자의 계좌 ID
```

따라서 payment 테이블의 insert/update 정책은 부모 row의 소유권까지 확인하는 것이 안전하다.

### savings_payments 정책 예시

```sql
create policy "select_own_savings_payments"
on public.savings_payments
for select
to authenticated
using (auth.uid() = user_id);

create policy "insert_own_savings_payments"
on public.savings_payments
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.savings_accounts account
    where account.id = savings_account_id
      and account.user_id = auth.uid()
  )
);

create policy "update_own_savings_payments"
on public.savings_payments
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.savings_accounts account
    where account.id = savings_account_id
      and account.user_id = auth.uid()
  )
);

create policy "delete_own_savings_payments"
on public.savings_payments
for delete
to authenticated
using (auth.uid() = user_id);
```

### fixed_expense_payments 정책 예시

```sql
create policy "select_own_fixed_expense_payments"
on public.fixed_expense_payments
for select
to authenticated
using (auth.uid() = user_id);

create policy "insert_own_fixed_expense_payments"
on public.fixed_expense_payments
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.fixed_expense_rules rule
    where rule.id = fixed_expense_rule_id
      and rule.user_id = auth.uid()
  )
);

create policy "update_own_fixed_expense_payments"
on public.fixed_expense_payments
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.fixed_expense_rules rule
    where rule.id = fixed_expense_rule_id
      and rule.user_id = auth.uid()
  )
);

create policy "delete_own_fixed_expense_payments"
on public.fixed_expense_payments
for delete
to authenticated
using (auth.uid() = user_id);
```

### 대안: 복합 FK 방식

부모 소유권 검증을 더 강하게 DB 제약으로 보장하려면 다음 방식도 가능하다.

```txt
savings_accounts에 unique(id, user_id) 추가
savings_payments에서 (savings_account_id, user_id) -> savings_accounts(id, user_id) 복합 FK 추가

fixed_expense_rules에 unique(id, user_id) 추가
fixed_expense_payments에서 (fixed_expense_rule_id, user_id) -> fixed_expense_rules(id, user_id) 복합 FK 추가
```

초기 구현은 `exists` 기반 RLS로 시작해도 충분하지만, 장기적으로는 복합 FK를 검토한다.

---

## 11-1. 인덱스 설계

대시보드와 분석 화면은 대부분 사용자별 날짜 범위 조회를 사용한다.

따라서 신규 테이블 생성 시 다음 인덱스를 함께 만든다.

```sql
create index if not exists idx_expenses_user_date
on public.expenses(user_id, date);

create index if not exists idx_savings_accounts_user_status
on public.savings_accounts(user_id, status);

create index if not exists idx_savings_payments_user_date
on public.savings_payments(user_id, payment_date);

create index if not exists idx_savings_payments_account_date
on public.savings_payments(savings_account_id, payment_date);

create index if not exists idx_fixed_expense_rules_user_status
on public.fixed_expense_rules(user_id, status);

create index if not exists idx_fixed_expense_payments_user_date
on public.fixed_expense_payments(user_id, payment_date);

create index if not exists idx_fixed_expense_payments_rule_date
on public.fixed_expense_payments(fixed_expense_rule_id, payment_date);
```

역할:

```txt
idx_*_user_date:
대시보드/분석의 날짜 범위 조회 최적화

idx_*_account_date, idx_*_rule_date:
특정 적금/고정지출 수정, 종료, 미래 내역 취소 시 조회 최적화

idx_*_user_status:
활성 적금/고정지출 목록 조회 최적화
```

---

## 12. 기존 expenses RLS 점검 사항

현재 `expenses`에는 다음과 같은 정책들이 있다.

```txt
delete_own_expenses
insert_own_expenses
select_own_expenses
Users can create their own expenses
Users can delete their own expenses
Users can read their own expenses
Users can update their own expenses
```

비슷한 역할의 정책이 `public`, `authenticated` 대상으로 중복되어 있는 것으로 보인다.

최종적으로는 다음 4개 정책만 명확하게 남기는 편이 좋다.

```txt
select_own_expenses
insert_own_expenses
update_own_expenses
delete_own_expenses
```

주의할 점:

```txt
운영 중인 서비스이므로 RLS 정책 삭제는 신중하게 해야 한다.
먼저 현재 동작을 확인한 뒤 중복 정책을 정리한다.
update 정책의 with check 조건이 정상인지 확인한다.
```

---

## 13. 조회 전략

기존 데이터와 신규 데이터를 당분간 함께 읽는다.

### 대시보드 조회 방식

현재 대시보드는 선택 월 기준 과거 12개월 ~ 미래 12개월 범위의 `expenses`를 조회한다.

변경 후에는 다음 데이터를 함께 조회한다.

```txt
1. expenses에서 일반 수입/지출 조회
2. expenses에서 legacy 적금/고정지출 조회
3. savings_payments에서 신규 적금 납입 내역 조회
4. fixed_expense_payments에서 신규 고정지출 내역 조회
5. 화면 표시용 ViewModel로 병합
```

화면에서는 하나의 내역 배열처럼 보여주되 내부적으로 source를 구분한다.

```ts
type MoneyBookEntrySource =
  | "expense"
  | "legacy_savings"
  | "legacy_fixed_expense"
  | "savings_payment"
  | "fixed_expense_payment";
```

### ViewModel 예시

```ts
type MoneyBookEntry = {
  id: string;
  source: MoneyBookEntrySource;
  amount: number;
  type: "income" | "expense" | "saving";
  category: string;
  memo: string;
  date: string;
  status?: "scheduled" | "paid" | "skipped" | "cancelled";
  originId?: string;
};
```

이렇게 하면 상세 테이블, 캘린더, 월별 분석에서 같은 형태로 데이터를 다룰 수 있다.

---

## 14. 화면별 영향 범위

### 대시보드 `/app`

영향이 가장 크다.

변경 대상:

```txt
이번 달 수입 합계
이번 달 일반 지출 합계
이번 달 적금/저축 합계
일별 현금흐름 그래프
카테고리별 지출 비율
달력 날짜별 내역 표시
선택 날짜 내역 표시
적금 계좌 묶기
고정지출 규칙 묶기
상세내용 테이블
```

### 수입/지출 등록/수정

일반 수입/지출은 기존 `expenses`를 계속 사용한다.

```txt
일반 수입 생성: expenses insert
일반 지출 생성: expenses insert
일반 수입/지출 수정: expenses update
일반 수입/지출 삭제: expenses delete
```

### 적금 관리

신규 적금부터 새 테이블을 사용한다.

```txt
적금 계좌 생성: savings_accounts insert
월별 납입 내역 생성: savings_payments bulk insert
적금 수정: savings_accounts update + future savings_payments update
적금 삭제: savings_accounts delete 또는 status 변경
적금 종료/만기: savings_accounts status 변경 + future payments cancel
```

### 고정지출 관리

신규 고정지출부터 새 테이블을 사용한다.

```txt
고정지출 규칙 생성: fixed_expense_rules insert
월별 지출 내역 생성: fixed_expense_payments bulk insert
고정지출 수정: fixed_expense_rules update + future fixed_expense_payments update
고정지출 삭제: fixed_expense_rules delete 또는 status 변경
고정지출 종료: fixed_expense_rules status 변경 + future payments cancel
```

### 월별 분석 `/app/analysis`

분석 화면도 병합 조회가 필요하다.

```txt
expenses 일반 수입/지출
legacy expenses 적금/고정지출
savings_payments 신규 적금
fixed_expense_payments 신규 고정지출
```

월별 분석에서는 특히 중복 집계를 조심해야 한다.

---

## 15. API 함수 설계

기존 `src/lib/api/expense.ts`는 유지한다.

신규 API 파일은 다음처럼 분리한다.

```txt
src/lib/api/savings.ts
src/lib/api/fixedExpense.ts
src/lib/api/moneyBookEntries.ts
```

### savings.ts 후보 함수

```ts
createSavingsAccount
createSavingsPayments
getSavingsAccounts
getSavingsPaymentsByRange
updateSavingsAccount
updateSavingsPayments
deleteSavingsAccount
cancelFutureSavingsPayments
```

### fixedExpense.ts 후보 함수

```ts
createFixedExpenseRule
createFixedExpensePayments
getFixedExpenseRules
getFixedExpensePaymentsByRange
updateFixedExpenseRule
updateFixedExpensePayments
deleteFixedExpenseRule
cancelFutureFixedExpensePayments
```

### moneyBookEntries.ts 후보 함수

```ts
getMoneyBookEntriesByRange
getMoneyBookEntriesByYear
```

이 파일은 화면에서 쓰기 좋게 기존 `expenses`와 신규 테이블 데이터를 병합해서 반환하는 역할을 한다.

### 트랜잭션 전략

적금/고정지출 생성은 다음 작업이 함께 일어난다.

```txt
1. savings_accounts 또는 fixed_expense_rules row 생성
2. 월별 savings_payments 또는 fixed_expense_payments bulk insert
```

프론트에서 두 요청을 따로 실행하면 중간 실패 시 불완전한 데이터가 남을 수 있다.

예:

```txt
savings_accounts 생성 성공
savings_payments bulk insert 실패
=> 계좌만 있고 납입 예정 내역이 없는 상태 발생
```

초기 구현에서는 프론트 2단계 요청으로 시작할 수 있지만, 운영 안정성을 위해 다음 방식이 더 안전하다.

```txt
권장:
Supabase RPC 또는 서버 액션에서 account/rule 생성과 payment 생성 전체를 하나의 트랜잭션으로 처리
```

RPC 후보:

```txt
create_savings_account_with_payments
update_savings_account_with_future_payments
create_fixed_expense_rule_with_payments
update_fixed_expense_rule_with_future_payments
```

초기 단계에서는 다음 기준으로 진행한다.

```txt
1차:
프론트 API 함수로 구현하되 실패 시 사용자에게 오류 표시

안정화 단계:
RPC/서버 액션으로 트랜잭션화
```

---

## 16. 마이그레이션 전략

한 번에 모든 데이터를 이전하지 않는다.

### 1단계: 테이블 생성

```txt
savings_accounts
savings_payments
fixed_expense_rules
fixed_expense_payments
```

### 2단계: RLS 정책 추가

각 테이블에 `auth.uid() = user_id` 기준 정책을 추가한다.

### 3단계: 신규 API 함수 추가

기존 `expenses` API는 유지하고, 신규 테이블용 API를 추가한다.

### 4단계: 신규 적금 등록만 새 테이블 적용

기존 적금 데이터는 계속 `expenses`에서 읽는다.

### 5단계: 대시보드 병합 조회 적용

`expenses` + `savings_payments`를 함께 읽어서 적금 영역에 표시한다.

### 6단계: 신규 고정지출 등록만 새 테이블 적용

기존 고정지출 데이터는 계속 `expenses`에서 읽는다.

### 7단계: 대시보드 고정지출 병합 조회 적용

`expenses` + `fixed_expense_payments`를 함께 읽어서 고정지출 영역에 표시한다.

### 8단계: 월별 분석 반영

분석 화면에서도 병합 데이터를 사용한다.

### 9단계: 안정화 후 legacy 데이터 이전 검토

기존 `expenses.memo`의 메타데이터를 파싱해서 새 테이블로 옮길지 검토한다.

---

## 17. 기존 데이터 이전을 나중으로 미루는 이유

기존 데이터를 바로 이전하지 않는 이유는 다음과 같다.

```txt
1. memo 파싱 실패 가능성이 있다.
2. 기존 적금/고정지출 데이터가 중복 집계될 수 있다.
3. 분석 화면 금액이 달라질 수 있다.
4. 사용자의 과거 데이터가 손상될 수 있다.
5. RLS 실수 시 데이터 접근 문제가 생길 수 있다.
6. 운영 중인 서비스라 즉시 마이그레이션 위험이 크다.
```

따라서 현재는 신규 데이터부터 새 구조를 적용하고, 기존 데이터는 legacy로 유지하는 것이 안전하다.

---

## 18. 개발 순서 추천

권장 개발 순서는 다음과 같다.

```txt
1. 현재 expenses RLS 정책 확인 및 중복 정책 정리 계획 수립
2. 신규 테이블 생성 SQL 작성
3. 신규 테이블 RLS SQL 작성
4. Supabase 마이그레이션 실행
5. savings.ts API 작성
6. fixedExpense.ts API 작성
7. moneyBookEntries.ts 병합 조회 함수 작성
8. 적금 신규 등록 로직을 새 테이블로 변경
9. 대시보드 적금 영역에서 legacy + 신규 데이터 병합 표시
10. 고정지출 신규 등록 로직을 새 테이블로 변경
11. 대시보드 고정지출 영역에서 legacy + 신규 데이터 병합 표시
12. 상세내용 테이블 병합 표시 반영
13. 캘린더 병합 표시 반영
14. 월별 분석 병합 조회 반영
15. 안정화 후 legacy 데이터 이전 검토
```

---

## 19. 주의 사항

### 19-1. 중복 집계 방지

기존 `expenses`에 이미 적금/고정지출 내역이 있고, 신규 테이블에도 같은 내역을 만들면 중복 집계된다.

따라서 신규 구조 적용 후 기존 데이터와 신규 데이터를 구분할 수 있어야 한다.

```txt
legacy_savings
legacy_fixed_expense
savings_payment
fixed_expense_payment
```

### 19-2. 삭제 정책

적금/고정지출 삭제 시 실제로 row를 삭제할지, status만 변경할지 결정해야 한다.

초기에는 다음 방식을 추천한다.

```txt
사용자가 완전히 삭제 요청: delete
종료/만기 처리: status 변경 + 미래 payment cancel
```

### 19-3. 예정 데이터 생성 기간

현재는 만기일/종료일 없음이면 10년치 데이터를 생성하고 있다.

새 구조에서도 초기에는 동일하게 10년치를 생성해도 된다.

```txt
openEndedSavingsYears = 10
```

다만 장기적으로는 화면 조회 범위 기준으로 필요한 월별 인스턴스만 생성하는 방식도 고려할 수 있다.

### 19-4. updated_at 자동 갱신

신규 테이블에는 `updated_at` 컬럼이 있으므로, 실제 운영에서는 업데이트 시 자동 갱신 트리거를 추가하는 것이 좋다.

예시:

```sql
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
```

각 테이블에 trigger를 추가한다.

---

## 20. 최종 결론

이번 개선의 핵심은 `expenses`를 없애는 것이 아니라 역할을 줄이는 것이다.

```txt
expenses = 실제 일반 수입/지출 기록
savings_accounts = 적금 계좌/규칙
savings_payments = 월별 적금 납입 내역
fixed_expense_rules = 고정지출 규칙
fixed_expense_payments = 월별 고정지출 내역
investment_transactions = 추후 투자 거래 기록
```

가장 안전한 운영 전략은 다음과 같다.

```txt
기존 expenses 데이터는 유지한다.
신규 적금/고정지출부터 새 테이블을 사용한다.
대시보드와 분석 화면에서는 legacy 데이터와 신규 데이터를 병합해서 보여준다.
기존 데이터 이전은 충분히 안정화된 뒤 검토한다.
```

이 방식이면 운영 중인 사용자 데이터를 건드리지 않으면서도, 앞으로의 확장성을 확보할 수 있다.

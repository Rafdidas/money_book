# 마이페이지 설계

작성일: 2026-08-10

## 배경

계정 관리 화면이 없다. 사이드 메뉴는 대시보드·월별 분석·투자 관리·문의하기
넷뿐이고, 로그인한 사용자가 자기 정보를 보거나 고칠 방법이 없다.

여기서 두 가지 공백이 생긴다.

**개인정보 처리방침이 약속한 것을 제품이 못 지킨다.** `src/app/legal/privacy/page.tsx`
에 "회원 탈퇴 또는 삭제 요청 시까지 보관하며, 요청을 받으면 지체 없이 파기합니다"
라고 적혀 있으나 탈퇴 수단이 없다. 문의 기능으로 접수할 수는 있지만 해당 분류도
없다.

**비밀번호를 로그인 상태에서 바꿀 수 없다.** 현재는 로그아웃한 뒤 비밀번호 찾기로
메일을 받는 방법뿐이다. 유출이 걱정되어 바꾸려는 사용자에게 불필요한 우회다.

## 범위

`/app/mypage` 한 화면에 카드 네 개를 세로로 쌓는다. 모바일이 주 대상이므로 탭이나
아코디언 대신 스크롤로 훑게 한다.

1. **내 정보** — 이름(수정 가능), 이메일(읽기 전용), 가입일
2. **비밀번호 변경** — 현재 비밀번호 확인 후 새 비밀번호 설정
3. **약관 동의 현황** — 동의한 버전과 일시, 각 문서 링크
4. **회원 탈퇴** — 기본은 접힌 상태, 펼쳐야 보인다

사이드 메뉴에 "마이페이지" 항목을 추가한다.

### 범위 제외

**이메일 변경.** 가입 이메일 인증이 꺼져 있어 Supabase에서 이메일을 바꾸면 확인
절차 없이 즉시 적용될 가능성이 높다. 사용자가 오타를 내면 그 순간 비밀번호 재설정
경로까지 잃는다. 계정 복구 수단을 만들어놓고 다시 끊는 셈이므로, 가입 인증을 켜는
결정이 난 뒤에 다룬다.

**테마 전환.** 이미 사이드 메뉴에 있다. 옮기지 않는다.

## 회원 탈퇴

### 즉시 완전 삭제

유예 기간이나 소프트 삭제를 두지 않는다. 확인 절차를 통과하면 계정과 데이터를 바로
지우고 복구하지 않는다. 개인정보 처리방침의 "지체 없이 파기" 문구와 정확히 맞고,
배치 작업이나 예약 함수 같은 인프라가 필요 없다.

가계부는 실수로 지우면 타격이 큰 데이터이므로, 유예 기간 대신 **확인 절차를 두껍게**
한다.

### 화면 흐름

카드는 접힌 상태로 시작하고 "회원 탈퇴" 링크를 누르면 펼쳐진다. 펼친 뒤에는

- 무엇이 지워지는지 명시한다: 가계부 기록, 저축·고정지출, 투자 내역, 문의 내역,
  약관 동의 이력
- 복구할 수 없다는 점을 분명히 적는다
- 비밀번호를 다시 입력받는다

비밀번호가 확인되어야 삭제 요청을 보낸다. 성공하면 로그아웃하고 랜딩(`/`)으로
이동한다.

### 서버 라우트

클라이언트는 자기 계정을 지울 수 없으므로 `POST /api/account/delete`를 만든다.

1. `src/lib/supabase/server.ts`의 쿠키 기반 클라이언트로 **서버가 요청자를 직접
   확인한다.** 요청 본문으로 받은 사용자 id는 신뢰하지 않는다. 신뢰하면 남의 계정을
   지울 수 있는 구멍이 된다.
2. 확인된 id로 `createServiceClient()`의 `auth.admin.deleteUser()`를 호출한다.

인증 없이 호출하면 401을 반환한다.

### expenses 외래키 추가 (선행 작업)

운영 DB에서 `auth.users`를 참조하는 제약을 조회한 결과, 사용자 데이터 테이블은 모두
`on delete cascade`로 걸려 있어 `deleteUser()` 한 번으로 함께 지워진다. 확인된
테이블은 `profiles`, `savings_accounts`, `savings_payments`,
`fixed_expense_rules`, `fixed_expense_payments`, `investment_stocks`,
`investment_account_limits`, `stock_quote_rate_limits`,
`user_custom_categories`, `user_legal_consents`, `inquiries`다.
`inquiries.answered_by`만 `set null`인데, 답변한 관리자가 탈퇴해도 문의 글은 남아야
하므로 의도된 설정이다.

**`expenses`는 `user_id`에 외래키 제약이 아예 없다.** 마이그레이션 파일 없이
대시보드에서 만들어진 테이블이다.

이 상태에서 계정을 삭제하면 실패하지는 않는다. 위반할 제약이 없으므로
`deleteUser()`는 성공한다. 대신 **가계부 기록이 주인 없이 그대로 남는다.** 계정은
사라졌는데 수입·지출 데이터는 DB에 계속 존재하는 상태이며, 개인정보 처리방침의
"지체 없이 파기"와 어긋난다. 실패보다 알아채기 어려워 더 위험하다.

따라서 외래키를 추가하는 마이그레이션을 탈퇴 기능보다 먼저 넣는다. 라우트에서
`expenses`를 따로 지우는 방법도 있지만, 제약으로 걸어두면 앞으로 어떤 경로로 계정이
지워져도 자동으로 따라온다.

```sql
alter table public.expenses
  add constraint expenses_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;
```

적용 전 상태를 운영 DB에서 확인했다(2026-08-10 기준).

- `user_id`가 비어 있는 행: 0건
- 존재하지 않는 사용자를 가리키는 행: 0건
- 전체: 3,404건
- RLS: 활성

주인 없는 행이 없으므로 제약을 그대로 추가할 수 있다.

## 비밀번호 변경

Supabase에는 현재 비밀번호를 검증하는 API가 없다. 현재 이메일과 입력받은 비밀번호로
`signInWithPassword`를 호출해 **재인증**하고, 성공하면 `updateUser({ password })`를
부른다. 재인증이 실패하면 "현재 비밀번호가 올바르지 않습니다."를 표시한다.

변경에 성공하면 비밀번호 재설정 화면과 동일하게 `signOut({ scope: "others" })`로 다른
기기의 세션을 끊는다. 이 호출이 실패해도 변경 자체는 성공했으므로 성공으로 안내하되,
다른 기기의 로그인이 남아 있을 수 있다고 덧붙인다.

새 비밀번호 검증은 `src/lib/auth/password.ts`의 `getPasswordError`와
`PASSWORD_MISMATCH_MESSAGE`를 쓴다. 규칙을 다시 적지 않는다.

## 내 정보

이름은 `profiles` 테이블이 아니라 `auth.users`의 메타데이터에 있다. 가입 시
`options.data.name`으로 저장한 값을 `src/app/providers.tsx`가 읽어 쓴다. 따라서 수정은
`updateUser({ data: { name } })`이다.

이메일은 읽기 전용으로 표시하고 "로그인 아이디입니다"를 덧붙인다. 별도의 아이디가
있다고 오해하는 경우를 줄이기 위함이며, 로그인 화면의 안내와 같은 이유다.

가입일은 `auth.users`의 `created_at`을 쓴다.

## 약관 동의 현황

`profiles`의 `terms_version`, `terms_agreed_at`, `privacy_version`,
`privacy_agreed_at`, `age_confirmed_at`을 읽어 표시한다. 각 항목에서
`/legal/terms`와 `/legal/privacy`로 이동할 수 있게 한다.

기존 사용자는 이 값이 비어 있을 수 있다. 동의 이력을 남기기 전에 가입한 계정이기
때문이다. 값이 없으면 "기록 없음"으로 표시하고 오류로 취급하지 않는다.

## 데모 모드

데모 사용자는 실제 계정이 없어 이 화면의 모든 동작이 실패한다.

- 데모 상태에서는 사이드 메뉴의 마이페이지 항목을 감춘다.
- URL로 직접 접근하면 "데모 체험 중에는 사용할 수 없습니다." 안내와 함께 `/app`으로
  보낸다.

## 파일 배치

**신규**

- `supabase/migrations/20260810000000_add_expenses_user_fk.sql`
- `src/app/app/mypage/page.tsx`
- `src/app/app/mypage/layout.tsx` (metadata, `robots: index false`)
- `src/app/app/mypage/page.test.tsx`
- `src/components/mypage/ProfileCard.tsx`
- `src/components/mypage/PasswordCard.tsx`
- `src/components/mypage/ConsentCard.tsx`
- `src/components/mypage/WithdrawCard.tsx`
- `src/components/mypage/mypage.scss`
- `src/lib/api/account.ts` — 프로필 조회·수정, 탈퇴 요청
- `src/lib/api/account.test.ts`
- `src/app/api/account/delete/route.ts`
- `src/app/api/account/delete/route.test.ts`

카드를 각각 분리하는 이유는 한 화면에 네 가지 독립적인 동작이 모이기 때문이다. 한
파일에 두면 상태와 오류 처리가 뒤섞여 읽기 어려워진다.

**수정**

- `src/components/common/SideMenu.tsx` — 메뉴 항목 추가, 데모 모드에서 숨김

## 테스트

**서버 라우트** — 가장 중요한 검증 대상이다.

- 인증 없이 호출하면 401을 반환하고 `deleteUser`를 호출하지 않는다
- 본문에 다른 사용자의 id를 넣어도 무시하고, 세션에서 확인된 id로만 삭제한다
- 정상 호출 시 확인된 id로 `deleteUser`를 호출한다

**비밀번호 변경**

- 현재 비밀번호가 틀리면 `updateUser`를 호출하지 않고 오류를 표시한다
- 새 비밀번호가 규칙에 어긋나면 재인증도 시도하지 않는다
- 성공 시 `updateUser` 후 `signOut({ scope: "others" })`를 호출한다

**탈퇴 카드**

- 기본 상태에서는 확인 폼이 보이지 않는다
- 비밀번호 없이 제출하면 삭제 요청을 보내지 않는다

**내 정보**

- 이름이 비어 있으면 `updateUser`를 호출하지 않는다
- 저장 시 `updateUser({ data: { name } })`를 호출한다

**동의 현황**

- 값이 없으면 "기록 없음"을 표시한다

## 검증

- `npm run lint`
- `npm run test`
- `npm run build`
- 데스크톱과 모바일 너비에서 확인
- `HANDOFF.md` 갱신

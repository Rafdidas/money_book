# 비밀번호 재설정 설계

작성일: 2026-08-06

## 배경

로그인 화면에 "비밀번호 찾기" 자리가 주석으로만 남아 있고, 비밀번호를 잊은
사용자가 계정을 되찾을 방법이 없다. 이번 작업으로 이메일 기반 재설정 흐름을
추가한다.

## 아이디 찾기를 만들지 않는 이유

로그인 아이디는 이메일이고, 가입 시 수집하는 항목은 이름·이메일·비밀번호뿐이다.
아이디 찾기가 성립하려면 본인만 알고 공격자는 모르는 두 번째 식별 정보가
필요한데, 대조할 수 있는 값이 이름 하나밖에 없다.

- 이름은 동명이인이 흔하고 공개된 정보라 본인 확인 수단이 되지 못한다.
- 이름만으로 조회를 열면 "그 이름으로 가입한 계정이 존재한다"는 사실과 메일
  도메인이 노출되는 계정 열거 창구가 된다. 마스킹(`p****@gmail.com`)은 출력
  형식일 뿐 입력 쪽 관문을 대신하지 못한다.
- 마스킹된 값으로는 로그인할 수 없어, 사용자가 얻는 것은 도메인 힌트뿐이다.
  같은 정보를 본인 메일함에서 더 정확히 확인할 수 있다.

휴대폰 본인인증을 도입하면 해결되지만 건당 발송 비용과 개인정보 처리방침 개정,
기존 가입자 마이그레이션이 따라온다. 현재 앱 규모에서는 대가가 이득보다 크다고
판단해 아이디 찾기 기능은 만들지 않는다.

대신 로그인 화면에서 "가입하신 이메일이 아이디입니다"를 안내해, 별도의 아이디가
있다고 오해하는 경우를 줄인다.

## 가입 이메일 인증을 켜지 않는 이유

가입 시 이메일 인증은 과거에 사용하다가 절차가 번거로워 비활성화했다. 이번
작업에서 다시 켜지 않는다.

인증이 꺼져 있어 남는 실질적 문제는 "오타 이메일로 가입한 사용자는 재설정
메일을 받지 못한다" 하나다. 남의 이메일로 가입한 계정을 메일 주인이 재설정으로
가져가는 경로는 피해자에게 손해가 되는 구조가 아니고, 공격자가 타인 계정을
탈취하려면 그 사람의 메일함을 이미 장악해야 하므로 재설정 기능이 새로 여는
위험이 아니다.

오타 대응(흔한 도메인 오타 경고 등)과 가입 인증 재활성화는 가입 이탈률까지 함께
봐야 하는 별개 결정이므로 이번 범위에서 제외한다.

## 메일 발송

Supabase 기본 SMTP를 그대로 사용한다. 과거 가입 인증 메일이 정상 수신된
이력이 있어 별도 SMTP 제공자 연결이나 추가 비용이 필요하지 않다.

`resetPasswordForEmail`은 기존 가입 인증 메일과 동일한 Supabase Auth 메일
경로를 사용한다.

## 범위

**신규 화면**

- `/auth/forgot-password` — 이메일 입력, 재설정 메일 발송
- `/auth/reset-password` — 메일 링크 진입, 새 비밀번호 설정

**기존 화면 수정**

- `/auth/login` — 주석 처리된 "비밀번호 찾기" 자리를
  `/auth/forgot-password` 링크로 활성화, 이메일 필드에 아이디 안내 문구 추가

**범위 제외**

- 아이디 찾기
- 가입 이메일 인증 재활성화
- `/auth/callback`의 옛 `signup-stage` 마크업 정리 (재설정 흐름은 콜백을
  거치지 않음)

## 흐름

1. 로그인 화면에서 "비밀번호 찾기" → `/auth/forgot-password`
2. 이메일 입력 후 제출 →
   `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
3. 결과와 무관하게 항상 동일한 완료 문구를 표시한다 (계정 열거 방지)
4. 메일 링크 → `/auth/reset-password#access_token=...`
5. 기존 `consumeAuthHashSession()`으로 복구 세션 수립
6. 새 비밀번호 + 확인 입력 → `supabase.auth.updateUser({ password })`
7. 완료 안내 후 `/app`으로 이동

`redirectTo`는 `/auth/callback`이 아니라 `/auth/reset-password`를 직접
가리킨다. 콜백 화면은 세션이 수립되면 곧바로 `/app`으로 이동시키므로, 콜백을
경유하면 비밀번호를 변경할 화면에 도달하지 못한다.

## 구현 시 주의할 점

**재설정 화면에서 로그인 리다이렉트 로직을 호출하지 않는다.**
`/auth/reset-password`는 복구 세션이 있는 상태이므로
`getAuthenticatedDestination()`을 호출하면 "이미 로그인됨"으로 판정되어
화면 밖으로 튕겨난다. 로그인 화면의 `useEffect` 패턴을 그대로 복사하면 이
문제가 발생한다.

**만료·재사용 링크 처리.** 세션 수립에 실패하면 에러 문구와 함께
`/auth/forgot-password` 재요청 링크를 보여준다.

**Proxy 설정은 수정하지 않는다.** `src/proxy.ts`의 matcher는
`/app/:path*`뿐이므로 새 `/auth/*` 경로는 별도 조치 없이 공개된다.

**비밀번호 규칙은 가입 화면과 동일하게 맞춘다.**

## 레이아웃

로그인·회원가입과 동일한 구조를 사용한다.

```
auth-page > auth-shell > auth-card-shell
  ├─ aside.auth-side    (브랜드 · 소개 문구)
  └─ section.auth-panel (auth-form-wrap > auth-title/auth-subtitle > auth-form)
```

`auth.scss`의 기존 클래스를 재사용하고, 좌측 `auth-side` 문구만 각 화면 상황에
맞게 작성한다. 새 스타일 파일은 만들지 않는다.

## 파일 배치

기존 `src/app/auth/signup` 구조를 따른다.

- `src/app/auth/forgot-password/page.tsx`
- `src/app/auth/forgot-password/layout.tsx` (metadata, `robots: index false`)
- `src/app/auth/forgot-password/page.test.tsx`
- `src/app/auth/reset-password/page.tsx`
- `src/app/auth/reset-password/layout.tsx`
- `src/app/auth/reset-password/page.test.tsx`
- `src/lib/supabase/auth-url.ts` — `getResetPasswordUrl()` 추가
- `src/app/auth/login/page.tsx` — 링크 및 안내 문구 수정

## 테스트

기존 `signup/page.test.tsx`, `consent/page.test.tsx` 패턴을 따라
`@/lib/supabase/client`를 모킹한다.

**forgot-password**

- 이메일 미입력 시 `resetPasswordForEmail`을 호출하지 않는다
- 제출 시 입력한 이메일과 `redirectTo`로 호출한다
- 오류가 반환되어도 성공과 동일한 문구를 표시한다

**reset-password**

- 해시 세션이 없으면 만료 안내와 재요청 링크를 표시한다
- 비밀번호와 확인 값이 다르면 `updateUser`를 호출하지 않는다
- 정상 입력 시 `updateUser`를 새 비밀번호로 호출한다

## 검증

- `npm run lint`
- `npm run test`
- `npm run build`
- 데스크톱·모바일 너비에서 두 화면 확인
- `HANDOFF.md` 갱신

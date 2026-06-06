# 머니북 문의하기 기능 설계서 v0.2

## 0. 검토 후 확정 사항

- 관리자 권한은 이메일 하드코딩이나 공개 환경변수가 아니라 `profiles.role`을 기준으로 판단한다.
- 실제 접근 권한은 화면 분기가 아니라 Supabase RLS와 `public.is_admin()` 함수가 통제한다.
- 일반 사용자는 문의 등록 및 본인 문의 조회만 가능하며, 등록 후 수정과 삭제는 제공하지 않는다.
- 관리자는 전체 문의 조회와 답변 작성/수정만 가능하다.
- 문의 목록, 상세, 작성 및 답변은 초기 버전에서 `/app/inquiries` 단일 화면으로 제공한다.
- 데모 모드에서는 문의 데이터 조회와 등록을 제공하지 않는다.
- 제목과 본문에는 DB 제약과 클라이언트 검증을 함께 적용한다.
  - 문의 제목: 2~100자
  - 문의 내용: 10~5,000자
  - 답변 제목: 2~100자
  - 답변 내용: 2~5,000자
- 마이그레이션 적용 후 최초 관리자는 SQL로 명시적으로 승격한다.

```sql
update public.profiles
set role = 'ADMIN'
where email = '관리자 이메일';
```

## 1. 기능 개요

머니북 서비스에 사용자가 직접 문의 및 요청사항을 남길 수 있는 **문의하기 페이지**를 추가한다.

일반 사용자는 본인이 작성한 문의만 확인할 수 있고, 관리자는 전체 회원의 문의를 확인한 뒤 각 문의에 답변을 작성할 수 있다.

초기 버전에서는 이미지 첨부 기능은 제외한다. 무료 DB 사용량과 저장소 비용을 고려하여 텍스트 기반 문의 기능만 구현한다.

---

## 2. 기능 목적

### 사용자 관점

- 서비스 이용 중 불편사항을 전달할 수 있다.
- 개선 요청, 오류 제보, 기능 제안을 남길 수 있다.
- 본인이 작성한 문의와 답변 여부를 확인할 수 있다.
- 답변이 완료된 경우 관리자 답변 내용을 확인할 수 있다.

### 운영자 관점

- 사용자 피드백을 DB에 누적하여 관리할 수 있다.
- 문의 상태를 `답변 전`, `답변 완료`로 구분할 수 있다.
- 관리자 계정으로 전체 문의를 확인하고 답변할 수 있다.
- 향후 자주 들어오는 문의를 FAQ나 기능 개선 항목으로 전환할 수 있다.

---

## 3. 사용자 구분

문의하기 기능은 권한에 따라 화면과 기능이 다르게 동작한다.

| 구분 | 설명 | 가능 기능 |
|---|---|---|
| 일반 사용자 | 로그인한 일반 회원 | 문의 작성, 본인 문의 목록 조회, 본인 문의 상세 조회 |
| 관리자 | 미리 지정한 관리자 계정 | 전체 문의 목록 조회, 문의 상세 조회, 답변 작성/수정 |

관리자 여부는 `profiles.role` 기준으로 판단한다.

예시:

```ts
const ADMIN_EMAILS = ["admin@example.com"];
```

또는 Supabase `profiles` 테이블에 `role` 컬럼을 두고 관리할 수도 있다.

```ts
role: "USER" | "ADMIN"
```

이메일 하드코딩 방식은 RLS 권한 관리와 운영 변경에 취약하므로 사용하지 않는다.

---

## 4. 페이지 구조

### 경로

```txt
/app/inquiries
```

또는 현재 머니북 앱 라우팅 구조에 맞춰 다음과 같이 사용할 수 있다.

```txt
/app/contact
/app/inquiry
/app/support
```

추천 경로:

```txt
/app/inquiries
```

이유:

- 문의 데이터가 여러 개의 리스트 형태로 관리된다.
- 사용자와 관리자 모두 같은 진입점을 사용하되 권한에 따라 화면이 달라진다.
- 추후 문의 상세 페이지를 `/app/inquiries/[id]` 형태로 확장하기 좋다.

---

## 5. 일반 사용자 화면 설계

### 5-1. 문의 작성 영역

일반 사용자가 문의하기 페이지에 진입하면 상단에 문의 작성 폼이 노출된다.

입력 항목:

| 항목 | 필수 여부 | 설명 |
|---|---|---|
| 제목 | 필수 | 문의 제목 |
| 내용 | 필수 | 문의 상세 내용 |

초기 버전에서는 첨부 이미지는 제공하지 않는다.

폼 예시:

```txt
[문의 제목 입력]

[문의 내용을 입력해주세요]

[문의 등록]
```

### 5-2. 나의 문의 리스트

문의 작성 영역 아래에는 **나의 문의 리스트**가 표시된다.

일반 사용자는 본인이 작성한 문의만 볼 수 있다.

리스트 표시 항목:

| 항목 | 설명 |
|---|---|
| 상태 뱃지 | 답변 전 / 답변 완료 |
| 제목 | 문의 제목 |
| 작성일 | 문의 작성 날짜 |
| 답변일 | 답변 완료 시 표시, 없으면 미표시 |

상태 뱃지:

| 상태 | 표시 문구 | 의미 |
|---|---|---|
| `PENDING` | 답변 전 | 아직 관리자가 답변하지 않음 |
| `ANSWERED` | 답변 완료 | 관리자가 답변을 작성함 |

리스트 예시:

```txt
[답변 전] 기능 요청드립니다.        2026.06.06
[답변 완료] 로그인 오류 문의        2026.06.01 / 답변 2026.06.02
```

### 5-3. 문의 상세 화면

사용자가 문의 리스트에서 글을 선택하면 상세 내용을 볼 수 있다.

상세 화면 표시 항목:

- 상태 뱃지
- 문의 제목
- 문의 내용
- 작성일
- 답변 내용
- 답변일

답변 전 상태일 경우:

```txt
아직 답변이 등록되지 않았습니다.
확인 후 답변드릴게요.
```

답변 완료 상태일 경우:

```txt
관리자 답변
문의주신 내용 확인했습니다...
```

---

## 6. 관리자 화면 설계

관리자로 지정된 계정이 문의하기 페이지에 진입하면 일반 사용자용 문의 작성 폼은 노출하지 않는다.

대신 전체 회원의 문의 목록을 볼 수 있다.

### 6-1. 관리자 문의 리스트

관리자 화면 표시 항목:

| 항목 | 설명 |
|---|---|
| 상태 뱃지 | 답변 전 / 답변 완료 |
| 문의 제목 | 사용자가 작성한 제목 |
| 작성자 | 사용자 이메일 또는 닉네임 |
| 작성일 | 문의 작성 날짜 |
| 답변일 | 답변 완료 시 표시 |

관리자 리스트 예시:

```txt
[답변 전] 카테고리 추가 요청        user01@email.com    2026.06.06
[답변 완료] 로그인 오류 문의        user02@email.com    2026.06.01
```

### 6-2. 관리자 문의 상세

관리자가 문의를 선택하면 사용자가 작성한 문의 내용을 확인할 수 있다.

표시 항목:

- 상태 뱃지
- 작성자 정보
- 문의 제목
- 문의 내용
- 작성일
- 기존 답변 내용
- 답변일

### 6-3. 답변 작성/수정

관리자는 선택한 문의 상세 화면에서 `답변하기` 버튼을 누르면 답변 폼을 볼 수 있다.

답변 입력 항목:

| 항목 | 필수 여부 | 설명 |
|---|---|---|
| 답변 제목 | 필수 | 관리자 답변 제목 |
| 답변 내용 | 필수 | 관리자 답변 본문 |

답변 저장 시 문의 상태는 자동으로 `ANSWERED`로 변경된다.

답변 후 저장되는 값:

- 답변 제목
- 답변 내용
- 답변 작성자 ID
- 답변 작성일
- 문의 상태 `ANSWERED`

관리자는 이미 답변 완료된 문의도 다시 수정할 수 있다.

---

## 7. DB 설계

문의 전용 테이블이 필요하다.

초기 버전에서는 문의와 답변을 하나의 테이블에서 관리한다.

문의 하나당 답변 하나만 존재하는 구조로 시작한다.

### 7-1. 테이블명

```sql
inquiries
```

### 7-2. 컬럼 설계

| 컬럼명 | 타입 | 필수 | 설명 |
|---|---|---|---|
| id | uuid | 필수 | 문의 고유 ID |
| user_id | uuid | 필수 | 문의 작성자 ID |
| user_email | text | 선택 | 작성자 이메일. 관리자 목록 표시용 |
| title | text | 필수 | 문의 제목 |
| content | text | 필수 | 문의 내용 |
| status | text | 필수 | `PENDING` 또는 `ANSWERED` |
| answer_title | text | 선택 | 관리자 답변 제목 |
| answer_content | text | 선택 | 관리자 답변 내용 |
| answered_by | uuid | 선택 | 답변한 관리자 ID |
| answered_at | timestamptz | 선택 | 답변 작성일 |
| created_at | timestamptz | 필수 | 문의 작성일 |
| updated_at | timestamptz | 필수 | 수정일 |

---

## 8. Supabase SQL 예시

```sql
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  title text not null,
  content text not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'ANSWERED')),
  answer_title text,
  answer_content text,
  answered_by uuid references auth.users(id),
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 9. updated_at 자동 갱신 트리거

```sql
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_inquiries_updated_at
before update on public.inquiries
for each row
execute function public.set_updated_at();
```

이미 프로젝트에 공통 `updated_at` 트리거 함수가 있다면 새로 만들지 않고 기존 함수를 재사용한다.

---

## 10. RLS 정책 설계

문의 데이터는 사용자별로 접근 제한이 필요하다.

일반 사용자는 본인이 작성한 문의만 조회할 수 있어야 한다.

관리자는 전체 문의를 조회하고 답변을 작성할 수 있어야 한다.

---

## 11. 관리자 판별 방식

### 적용 방식: profiles 테이블 role 사용

`profiles` 테이블에 `role` 컬럼을 두고 관리자 권한을 관리한다.

```sql
alter table public.profiles
add column if not exists role text not null default 'USER'
check (role in ('USER', 'ADMIN'));
```

관리자 판별 함수:

```sql
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'ADMIN'
  );
end;
$$ language plpgsql security definer;
```

`public.is_admin()`은 `security definer`와 고정 `search_path`를 적용하고, 실행 권한은 `authenticated` 역할에만 허용한다.

---

## 12. RLS SQL 예시

```sql
alter table public.inquiries enable row level security;
```

### 12-1. 일반 사용자 문의 등록

```sql
create policy "Users can create their own inquiries"
on public.inquiries
for insert
with check (auth.uid() = user_id);
```

### 12-2. 일반 사용자 본인 문의 조회

```sql
create policy "Users can read their own inquiries"
on public.inquiries
for select
using (
  auth.uid() = user_id
  or public.is_admin()
);
```

### 12-3. 일반 사용자 본인 문의 수정 제한

초기 버전에서는 일반 사용자가 작성 후 문의를 수정하지 못하도록 한다.

이유:

- 관리자가 이미 확인한 문의 내용이 바뀌면 운영상 혼선이 생길 수 있다.
- 수정 기능은 추후 필요할 때 추가한다.

### 12-4. 관리자 답변 수정

```sql
create policy "Admins can update inquiries"
on public.inquiries
for update
using (public.is_admin())
with check (public.is_admin());
```

### 12-5. 삭제 정책

초기 버전에서는 사용자와 관리자 모두 문의 삭제 기능을 제공하지 않는다.

삭제가 필요할 경우 관리자 전용 소프트 삭제 컬럼을 추가한다.

```sql
is_deleted boolean not null default false
```

초기 MVP에서는 제외한다.

---

## 13. 데이터 흐름

### 13-1. 일반 사용자 문의 등록

```txt
1. 사용자가 제목과 내용을 입력한다.
2. 문의 등록 버튼을 누른다.
3. inquiries 테이블에 insert한다.
4. status는 기본값 PENDING으로 저장된다.
5. 등록 후 나의 문의 리스트를 다시 조회한다.
```

저장 데이터 예시:

```ts
{
  user_id: user.id,
  user_email: user.email,
  title: "카테고리 추가 요청",
  content: "지출 카테고리에 반려동물 항목이 있으면 좋겠습니다.",
  status: "PENDING"
}
```

### 13-2. 일반 사용자 문의 목록 조회

```txt
1. 현재 로그인한 사용자의 user_id를 기준으로 조회한다.
2. created_at desc 기준으로 정렬한다.
3. 본인이 작성한 문의만 화면에 표시한다.
```

Supabase 쿼리 예시:

```ts
const { data, error } = await supabase
  .from("inquiries")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });
```

RLS가 적용되어 있으므로 클라이언트에서 실수로 전체 조회를 하더라도 일반 사용자는 본인 문의만 접근 가능해야 한다.

### 13-3. 관리자 전체 문의 조회

```txt
1. 관리자가 문의하기 페이지에 진입한다.
2. 관리자 여부를 확인한다.
3. 전체 문의 목록을 created_at desc 기준으로 조회한다.
4. 상태별 필터를 제공할 수 있다.
```

Supabase 쿼리 예시:

```ts
const { data, error } = await supabase
  .from("inquiries")
  .select("*")
  .order("created_at", { ascending: false });
```

관리자는 RLS 정책에 의해 전체 문의를 조회할 수 있다.

### 13-4. 관리자 답변 저장

```txt
1. 관리자가 문의 상세에서 답변하기를 누른다.
2. 답변 제목과 답변 내용을 입력한다.
3. 저장 시 inquiries 테이블의 답변 관련 컬럼을 update한다.
4. status를 ANSWERED로 변경한다.
5. answered_at에 현재 시간을 저장한다.
```

Supabase 쿼리 예시:

```ts
const { data, error } = await supabase
  .from("inquiries")
  .update({
    answer_title: answerTitle,
    answer_content: answerContent,
    answered_by: adminUser.id,
    answered_at: new Date().toISOString(),
    status: "ANSWERED",
  })
  .eq("id", inquiryId);
```

---

## 14. 화면 구성 상세

## 14-1. 일반 사용자 문의하기 페이지

```txt
문의하기
서비스 이용 중 불편한 점이나 요청사항을 남겨주세요.
확인 후 답변드릴게요.

[문의 작성 폼]
- 제목
- 내용
- 등록 버튼

나의 문의 리스트
[답변 전] 제목 / 작성일
[답변 완료] 제목 / 작성일 / 답변일
```

빈 상태 문구:

```txt
아직 작성한 문의가 없습니다.
궁금한 점이나 요청사항이 있다면 문의를 남겨주세요.
```

등록 완료 토스트:

```txt
문의가 등록되었습니다.
```

등록 실패 토스트:

```txt
문의 등록에 실패했습니다. 잠시 후 다시 시도해주세요.
```

---

## 14-2. 일반 사용자 문의 상세

```txt
[답변 전]
문의 제목
작성일

문의 내용

관리자 답변
아직 답변이 등록되지 않았습니다.
```

```txt
[답변 완료]
문의 제목
작성일

문의 내용

관리자 답변
답변 제목
답변 내용
답변일
```

---

## 14-3. 관리자 문의 관리 페이지

```txt
문의 관리
전체 회원의 문의사항을 확인하고 답변할 수 있습니다.

[상태 필터]
전체 / 답변 전 / 답변 완료

[문의 리스트]
[답변 전] 제목 / 작성자 / 작성일
[답변 완료] 제목 / 작성자 / 작성일 / 답변일
```

---

## 14-4. 관리자 문의 상세 및 답변

```txt
문의 상세

작성자: user@email.com
상태: 답변 전
작성일: 2026.06.06

문의 제목
문의 내용

[답변하기]
```

답변하기 클릭 후:

```txt
답변 제목
[입력]

답변 내용
[입력]

[답변 저장]
```

답변 완료 후:

```txt
답변이 저장되었습니다.
```

---

## 15. 컴포넌트 설계

예상 컴포넌트 구조:

```txt
app/inquiries/page.tsx

components/inquiries/
  InquiryForm.tsx
  InquiryList.tsx
  InquiryListItem.tsx
  InquiryDetail.tsx
  InquiryStatusBadge.tsx
  AdminInquiryList.tsx
  AdminInquiryDetail.tsx
  AdminAnswerForm.tsx
```

### 컴포넌트 역할

| 컴포넌트 | 역할 |
|---|---|
| `InquiryForm` | 일반 사용자 문의 작성 폼 |
| `InquiryList` | 나의 문의 리스트 |
| `InquiryListItem` | 문의 리스트 개별 아이템 |
| `InquiryDetail` | 사용자 문의 상세 |
| `InquiryStatusBadge` | 답변 상태 뱃지 |
| `AdminInquiryList` | 관리자 전체 문의 리스트 |
| `AdminInquiryDetail` | 관리자 문의 상세 |
| `AdminAnswerForm` | 관리자 답변 작성/수정 폼 |

---

## 16. 타입 설계

```ts
export type InquiryStatus = "PENDING" | "ANSWERED";

export interface Inquiry {
  id: string;
  user_id: string;
  user_email?: string | null;
  title: string;
  content: string;
  status: InquiryStatus;
  answer_title?: string | null;
  answer_content?: string | null;
  answered_by?: string | null;
  answered_at?: string | null;
  created_at: string;
  updated_at: string;
}
```

문의 등록 폼 타입:

```ts
export interface CreateInquiryFormValues {
  title: string;
  content: string;
}
```

답변 등록 폼 타입:

```ts
export interface AnswerInquiryFormValues {
  answerTitle: string;
  answerContent: string;
}
```

---

## 17. 상태 뱃지 문구

```ts
export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  PENDING: "답변 전",
  ANSWERED: "답변 완료",
};
```

스타일 방향:

| 상태 | 스타일 방향 |
|---|---|
| 답변 전 | 회색 또는 노란색 계열 |
| 답변 완료 | 파란색 또는 초록색 계열 |

머니북의 기존 디자인 톤을 유지한다면 다음처럼 구성한다.

```txt
답변 전: neutral / warning 계열
답변 완료: primary 계열
```

---

## 18. 유효성 검사

### 문의 등록

| 항목 | 조건 | 에러 문구 |
|---|---|---|
| 제목 | 1자 이상 | 제목을 입력해주세요. |
| 내용 | 1자 이상 | 문의 내용을 입력해주세요. |
| 제목 | 100자 이하 | 제목은 100자 이하로 입력해주세요. |
| 내용 | 2000자 이하 | 문의 내용은 2000자 이하로 입력해주세요. |

### 답변 등록

| 항목 | 조건 | 에러 문구 |
|---|---|---|
| 답변 제목 | 1자 이상 | 답변 제목을 입력해주세요. |
| 답변 내용 | 1자 이상 | 답변 내용을 입력해주세요. |
| 답변 제목 | 100자 이하 | 답변 제목은 100자 이하로 입력해주세요. |
| 답변 내용 | 2000자 이하 | 답변 내용은 2000자 이하로 입력해주세요. |

---

## 19. 초기 MVP 범위

### 포함

- 문의하기 페이지 추가
- 일반 사용자 문의 작성
- 일반 사용자 본인 문의 리스트 조회
- 일반 사용자 문의 상세 조회
- 답변 전 / 답변 완료 상태 뱃지
- 관리자 전체 문의 리스트 조회
- 관리자 문의 상세 조회
- 관리자 답변 작성
- 답변 완료 상태 변경
- Supabase RLS 적용

### 제외

- 이미지 첨부
- 파일 첨부
- 이메일 알림
- 푸시 알림
- 문의 삭제
- 문의 수정
- 댓글형 답변 스레드
- 다중 관리자 권한 관리 UI
- 답변 알림 배지

---

## 20. 추후 확장 아이디어

### 20-1. 이메일 알림

관리자가 답변을 등록하면 사용자에게 이메일 알림을 보낸다.

```txt
문의하신 내용에 답변이 등록되었습니다.
머니북에서 답변을 확인해주세요.
```

### 20-2. 문의 카테고리

문의 등록 시 카테고리를 선택할 수 있다.

예시:

- 오류 제보
- 기능 요청
- 사용 문의
- 기타

DB 컬럼 추가:

```sql
category text
```

### 20-3. 관리자 메모

사용자에게 보이지 않는 관리자 내부 메모를 추가한다.

DB 컬럼 추가:

```sql
admin_memo text
```

### 20-4. 문의 수정/삭제

답변 전 상태에서만 사용자가 문의를 수정하거나 삭제할 수 있게 확장할 수 있다.

정책 예시:

```txt
PENDING 상태일 때만 수정 가능
ANSWERED 상태에서는 수정 불가
```

### 20-5. 읽음 여부

사용자가 답변을 확인했는지 관리하기 위한 컬럼을 추가할 수 있다.

```sql
answer_read_at timestamptz
```

---

## 21. 구현 우선순위

### 1단계: DB 및 권한

- `inquiries` 테이블 생성
- `is_admin()` 함수 생성
- RLS 정책 적용
- Supabase에서 일반 사용자/관리자 조회 테스트

### 2단계: 일반 사용자 기능

- 문의 작성 폼 구현
- 문의 등록 API 또는 서버 액션 구현
- 나의 문의 리스트 조회
- 문의 상세 보기

### 3단계: 관리자 기능

- 관리자 여부 확인 로직 구현
- 관리자 전용 문의 리스트 구현
- 관리자 문의 상세 구현
- 답변 작성/수정 구현

### 4단계: UX 개선

- 상태 뱃지 스타일 적용
- 빈 상태 문구 추가
- 로딩/에러 상태 처리
- 등록/답변 완료 토스트 처리

---

## 22. 추천 구현 방향

머니북이 이미 운영 중인 서비스이므로, 문의하기 기능은 단순 UI보다 **권한 설계와 데이터 보호**가 중요하다.

따라서 클라이언트에서 `user_id`로 필터링하는 것만 믿지 말고 반드시 Supabase RLS로 다음 조건을 보장해야 한다.

```txt
일반 사용자는 자기 문의만 볼 수 있다.
관리자만 전체 문의를 볼 수 있다.
관리자만 답변을 작성할 수 있다.
```

초기에는 문의와 답변을 하나의 `inquiries` 테이블에서 관리하는 방식이 가장 적합하다.

이유:

- 문의 하나에 답변 하나만 필요한 단순 구조다.
- 테이블이 적어 구현과 관리가 쉽다.
- 무료 DB 환경에서 불필요한 복잡도를 줄일 수 있다.
- 추후 댓글형 답변이 필요해지면 `inquiry_answers` 테이블로 분리할 수 있다.

---

## 23. 최종 요약

문의하기 기능은 다음 구조로 구현한다.

```txt
일반 사용자
문의 작성 → 나의 문의 리스트 → 문의 상세 → 관리자 답변 확인

관리자
전체 문의 리스트 → 문의 상세 → 답변 작성 → 답변 완료 처리
```

DB는 `inquiries` 테이블 하나로 시작한다.

초기 MVP에서는 이미지 첨부 없이 텍스트 문의만 지원한다.

보안은 Supabase RLS를 통해 사용자별 접근 권한과 관리자 답변 권한을 분리한다.

이 기능은 운영 중인 머니북에서 사용자 피드백을 수집하고, 개선 요청을 관리하는 기본 고객지원 기능으로 활용할 수 있다.

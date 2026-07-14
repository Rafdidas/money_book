# CSP Report Collection Design

## Goal

CSP Report-Only 위반을 30일 동안 안전하게 저장해 운영자가 실제 허용 출처를 확인할 수 있게 한다.

## Components

- `public.csp_reports`: 서버만 기록하는 전용 테이블. 일반 사용자·anon 직접 접근은 RLS로 차단한다.
- `/api/csp-reports`: CSP 보고를 받는 Node.js Route Handler. 빈 응답을 반환하고, 본문 크기·형식·필드를 제한한다.
- `Content-Security-Policy-Report-Only`: `report-to`와 호환성용 `report-uri`로 Route Handler를 지정한다.
- 삭제 작업: 30일이 지난 보고를 삭제하는 서버 전용 작업. 실행 일정은 배포 환경의 cron에서 설정한다.

## Data minimization

저장 열은 보고 시각, document URI origin/path, blocked URI origin/path, effective directive, disposition, status code뿐이다. 쿼리 문자열·fragment·요청 본문·쿠키·IP·사용자 ID는 저장하지 않는다. 허용된 directive 이름과 최대 길이를 검사하고, 초과 본문은 거절한다.

## Security

Route Handler만 `SUPABASE_SERVICE_ROLE_KEY`를 사용한다. 해당 키는 서버 환경 변수로만 제공하며 브라우저와 저장소에는 노출하지 않는다. 테이블의 일반 읽기·쓰기 정책은 만들지 않는다. Rate limit은 이 단계에서 메모리 기반으로 두지 않고, 호스팅 환경 rate limit 또는 WAF 설정을 배포 시 검토한다.

## Rollout

코드와 마이그레이션은 `dev`에서 테스트한다. 운영 자동 수집은 사용자의 별도 승인 후에만 마이그레이션 실행, 서버 비밀 등록, 배포, cron 설정 순으로 적용한다. 운영자가 쿼리로 보고를 확인한 뒤 CSP 강제 모드 전환을 별도 승인한다.

## Self-review

- 30일 보관 기간은 명시적 사용자 선택을 반영한다.
- 새 테이블과 삭제 작업은 운영 데이터에 영향을 주므로 원격 적용 단계를 분리했다.
- 민감할 수 있는 URL query·fragment와 식별 정보를 저장하지 않는다.

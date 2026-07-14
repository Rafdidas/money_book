# CSP Report-Only Design

## Goal

정상 기능을 차단하지 않은 채 현재 서비스가 사용하는 스크립트·스타일·연결 출처를 관찰할 수 있도록 `Content-Security-Policy-Report-Only` 헤더를 추가한다.

## Scope

- `next.config.ts`의 전 경로 응답 헤더에 Report-Only CSP를 추가한다.
- 인라인 테마 스크립트와 JSON-LD, Google Analytics, jsDelivr Pretendard, Supabase API 연결을 고려한 정책을 선언한다.
- HSTS, CSP 강제 모드, nonce 기반 동적 렌더링, CSP 보고 저장 API는 이번 범위에서 제외한다.

## Policy

정책은 기본 출처를 `'self'`로 제한하되, 현재 호환성을 위해 `script-src`와 `style-src`에는 `'unsafe-inline'`을 포함한다. Google Tag Manager와 Google Analytics를 스크립트·연결·이미지 출처에 허용하고, jsDelivr는 스타일·폰트 출처에 허용한다. Supabase 연결은 배포 환경 변수의 HTTPS URL 호스트를 정적 정책에 넣지 않고, Report-Only 단계에서는 `https:` 연결을 허용해 실제 위반을 먼저 확인한다.

## Validation

빌드와 E2E를 실행해 헤더 추가가 렌더링·인증 진입·데모 흐름을 막지 않는지 확인한다. 브라우저 개발자 도구의 CSP 위반은 Report-Only 경고로만 나타나며 요청이나 리소스를 차단하지 않는다.

## Constraints and self-review

- 기존 DB, Supabase 스키마, RLS, 사용자·금융 데이터를 변경하지 않는다.
- 원격 Supabase 적용, 마이그레이션, 배포를 수행하지 않는다.
- HSTS는 모든 운영 도메인 및 서브도메인의 HTTPS 범위를 확인한 뒤 별도 변경으로 다룬다.
- 현재 인라인 스크립트가 있으므로 nonce 기반 strict CSP를 이 단계에 섞지 않는다.

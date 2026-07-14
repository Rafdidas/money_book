# Dependency Audit Fix Design

## Goal

`npm audit fix`가 제안하는 호환 가능한 잠금 의존성 업데이트만 적용해 보통 수준 취약점을 줄인다.

## Scope

- 격리된 `dev` 브랜치에서 일반 `npm audit fix`를 한 번 실행한다.
- 변경되는 것은 `package-lock.json`과 설치된 로컬 의존성뿐이며, `package.json`의 직접 의존성 범위는 바꾸지 않는다.
- 업데이트 후 lint, unit test, build, E2E, audit를 실행한다.

## Exclusions

- `npm audit fix --force`는 사용하지 않는다. 현재 이는 Next.js를 9.3.3으로 다운그레이드한다.
- Supabase 원격, DB 스키마·데이터, 배포, 런타임 환경 변수는 변경하지 않는다.
- 강제 업데이트가 필요한 postcss 취약점은 남는 위험으로 기록한다.

## Success criteria

- 일반 audit fix가 제안한 `@babel/*`, `brace-expansion`, `js-yaml` 등의 lockfile 업데이트만 포함한다.
- 린트·테스트·빌드·E2E가 통과한다.
- high 취약점이 없음을 재확인하고, 남는 취약점과 강제 업데이트 미적용 사유를 HANDOFF에 기록한다.

## Self-review

- 이 변경은 의존성 잠금 파일에 국한되며 애플리케이션 코드·운영 데이터에 영향을 주지 않는다.
- audit 도구가 예상보다 직접 의존성을 변경하거나 Next 다운그레이드를 제안하면 변경을 되돌리고 사용자 판단을 요청한다.

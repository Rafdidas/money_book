/**
 * 약관 재동의 게이트는 기본적으로 꺼져 있다.
 *
 * 게이트가 켜지면 로그인한 사용자는 `profiles`의 동의 열을 조회해야 하므로
 * `20260804000000_add_legal_consent.sql`이 먼저 적용되어 있어야 한다.
 * 기본값을 꺼짐으로 두면 마이그레이션 적용 전에 이 브랜치를 배포해도
 * 기존 사용자의 로그인 흐름이 달라지지 않는다.
 *
 * 켜려면 `NEXT_PUBLIC_LEGAL_CONSENT_GATE=true`를 설정한다.
 */
export const isLegalConsentGateEnabled = () =>
  process.env.NEXT_PUBLIC_LEGAL_CONSENT_GATE === "true";

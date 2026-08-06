import type { LegalConsentProfile } from "@/lib/legal/consentStatus";
import {
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
} from "@/lib/legal/legalDocuments";
import { supabase } from "@/lib/supabase/client";

const LEGAL_CONSENT_COLUMNS =
  "terms_version, terms_agreed_at, privacy_version, privacy_agreed_at, age_confirmed_at";

/**
 * `userId`로 명시적으로 좁힌다. `profiles`의 조회 정책은
 * `id = auth.uid() or public.is_admin()`이므로, 필터를 생략하면
 * 관리자 계정에서 전체 프로필이 조회되어 `maybeSingle()`이 실패한다.
 */
export const getCurrentUserLegalConsent = async (
  userId: string,
): Promise<LegalConsentProfile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select(LEGAL_CONSENT_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("동의 정보를 불러오지 못했습니다.");
  }

  return data;
};

/**
 * 문서 버전의 단일 출처는 `legalDocuments.ts`다. 데이터베이스는 현재 버전을
 * 알지 못하고 전달받은 값을 기록만 한다. 양쪽에 버전을 두면 한쪽만 올렸을 때
 * 재동의가 해소되지 않는다. 기록 시각은 데이터베이스의 `now()`를 쓴다.
 */
export const recordCurrentLegalConsent = async (): Promise<void> => {
  const { error } = await supabase.rpc("record_current_legal_consent", {
    p_terms_version: CURRENT_TERMS_VERSION,
    p_privacy_version: CURRENT_PRIVACY_VERSION,
  });

  if (error) {
    throw new Error("동의 기록을 저장하지 못했습니다.");
  }
};

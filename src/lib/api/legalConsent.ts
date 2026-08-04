import type { LegalConsentProfile } from "@/lib/legal/consentStatus";
import { supabase } from "@/lib/supabase/client";

const LEGAL_CONSENT_COLUMNS =
  "terms_version, terms_agreed_at, privacy_version, privacy_agreed_at, age_confirmed_at";

export const getCurrentUserLegalConsent = async (): Promise<LegalConsentProfile | null> => {
  const { data, error } = await supabase.from("profiles").select(LEGAL_CONSENT_COLUMNS).maybeSingle();

  if (error) {
    throw new Error("동의 정보를 불러오지 못했습니다.");
  }

  return data;
};

export const recordCurrentLegalConsent = async (): Promise<void> => {
  const { error } = await supabase.rpc("record_current_legal_consent");

  if (error) {
    throw new Error("동의 기록을 저장하지 못했습니다.");
  }
};

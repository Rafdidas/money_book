import {
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
} from "./legalDocuments";

export { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION };

export interface LegalConsentProfile {
  terms_version: string | null;
  privacy_version: string | null;
  terms_agreed_at: string | null;
  privacy_agreed_at: string | null;
  age_confirmed_at: string | null;
}

export const needsCurrentLegalConsent = (profile: LegalConsentProfile | null) =>
  !profile ||
  profile.terms_version !== CURRENT_TERMS_VERSION ||
  profile.privacy_version !== CURRENT_PRIVACY_VERSION ||
  !profile.terms_agreed_at ||
  !profile.privacy_agreed_at ||
  !profile.age_confirmed_at;

import { describe, expect, it } from "vitest";
import {
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
  needsCurrentLegalConsent,
} from "./consentStatus";

const currentConsent = {
  terms_version: CURRENT_TERMS_VERSION,
  privacy_version: CURRENT_PRIVACY_VERSION,
  terms_agreed_at: "2026-08-04T00:00:00Z",
  privacy_agreed_at: "2026-08-04T00:00:00Z",
  age_confirmed_at: "2026-08-04T00:00:00Z",
};

describe("needsCurrentLegalConsent", () => {
  it("requires consent when no profile is available", () => {
    expect(needsCurrentLegalConsent(null)).toBe(true);
  });

  it("does not require consent for a complete current consent record", () => {
    expect(needsCurrentLegalConsent(currentConsent)).toBe(false);
  });

  it("requires consent when the privacy version is outdated", () => {
    expect(
      needsCurrentLegalConsent({
        ...currentConsent,
        privacy_version: "2026-01-01",
      }),
    ).toBe(true);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const { maybeSingle, eq, select, from, rpc } = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: { from, rpc },
}));

import {
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
} from "@/lib/legal/legalDocuments";
import { getCurrentUserLegalConsent, recordCurrentLegalConsent } from "./legalConsent";

describe("legal consent API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eq.mockReturnValue({ maybeSingle });
    select.mockReturnValue({ eq });
    from.mockReturnValue({ select });
  });

  it("selects the authenticated profile's legal-consent fields", async () => {
    const profile = {
      terms_version: "2026-08-04",
      terms_agreed_at: "2026-08-04T00:00:00.000Z",
      privacy_version: "2026-08-04",
      privacy_agreed_at: "2026-08-04T00:00:00.000Z",
      age_confirmed_at: "2026-08-04T00:00:00.000Z",
    };
    maybeSingle.mockResolvedValue({ data: profile, error: null });

    await expect(getCurrentUserLegalConsent("user-1")).resolves.toEqual(profile);
    expect(from).toHaveBeenCalledWith("profiles");
    expect(select).toHaveBeenCalledWith(
      "terms_version, terms_agreed_at, privacy_version, privacy_agreed_at, age_confirmed_at",
    );
    expect(maybeSingle).toHaveBeenCalledOnce();
  });

  it("narrows the lookup to the given user so admin row visibility cannot break it", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });

    await getCurrentUserLegalConsent("user-1");

    expect(eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("surfaces a Korean error when the profile lookup is rejected", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: new Error("query failed") });

    await expect(getCurrentUserLegalConsent("user-1")).rejects.toThrow(
      "동의 정보를 불러오지 못했습니다.",
    );
  });
  it("returns null when the authenticated profile is absent", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(getCurrentUserLegalConsent("user-1")).resolves.toBeNull();
  });

  it("records consent with the versions declared in legalDocuments", async () => {
    rpc.mockResolvedValue({ error: null });

    await expect(recordCurrentLegalConsent()).resolves.toBeUndefined();
    // 버전이 SQL에 하드코딩되어 있으면 TS 상수만 올렸을 때 재동의가 해소되지 않는다.
    expect(rpc).toHaveBeenCalledWith("record_current_legal_consent", {
      p_terms_version: CURRENT_TERMS_VERSION,
      p_privacy_version: CURRENT_PRIVACY_VERSION,
    });
  });

  it("surfaces a Korean error when recording consent is rejected", async () => {
    rpc.mockResolvedValue({ error: new Error("RPC failed") });

    await expect(recordCurrentLegalConsent()).rejects.toThrow("동의 기록을 저장하지 못했습니다.");
  });
});

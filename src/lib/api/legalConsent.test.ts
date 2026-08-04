import { beforeEach, describe, expect, it, vi } from "vitest";

const { maybeSingle, select, from, rpc } = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
  select: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: { from, rpc },
}));

import { getCurrentUserLegalConsent, recordCurrentLegalConsent } from "./legalConsent";

describe("legal consent API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    select.mockReturnValue({ maybeSingle });
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

    await expect(getCurrentUserLegalConsent()).resolves.toEqual(profile);
    expect(from).toHaveBeenCalledWith("profiles");
    expect(select).toHaveBeenCalledWith(
      "terms_version, terms_agreed_at, privacy_version, privacy_agreed_at, age_confirmed_at",
    );
    expect(maybeSingle).toHaveBeenCalledOnce();
  });

  it("returns null when the authenticated profile is absent", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(getCurrentUserLegalConsent()).resolves.toBeNull();
  });

  it("records current legal consent without client-supplied arguments", async () => {
    rpc.mockResolvedValue({ error: null });

    await expect(recordCurrentLegalConsent()).resolves.toBeUndefined();
    expect(rpc).toHaveBeenCalledWith("record_current_legal_consent");
  });

  it("surfaces a Korean error when recording consent is rejected", async () => {
    rpc.mockResolvedValue({ error: new Error("RPC failed") });

    await expect(recordCurrentLegalConsent()).rejects.toThrow("동의 기록을 저장하지 못했습니다.");
  });
});

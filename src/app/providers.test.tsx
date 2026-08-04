import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, getCurrentUserLegalConsent, isDemoModeEnabled } = vi.hoisted(() => ({
  getUser: vi.fn(),
  getCurrentUserLegalConsent: vi.fn(),
  isDemoModeEnabled: vi.fn(),
}));

vi.mock("@/lib/demo", () => ({ isDemoModeEnabled }));
vi.mock("@/lib/supabase/client", () => ({ supabase: { auth: { getUser } } }));
vi.mock("@/lib/api/legalConsent", () => ({ getCurrentUserLegalConsent }));
vi.mock("@/lib/supabase/auth-url", () => ({ consumeAuthHashSession: vi.fn() }));
vi.mock("@lottiefiles/dotlottie-react", () => ({ setWasmUrl: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/app",
  useRouter: () => ({ replace: vi.fn() }),
}));

import { getAuthenticatedDestination } from "./providers";

const legacyProfile = {
  terms_version: "2026-01-01",
  terms_agreed_at: "2026-01-01T00:00:00.000Z",
  privacy_version: "2026-01-01",
  privacy_agreed_at: "2026-01-01T00:00:00.000Z",
  age_confirmed_at: "2026-01-01T00:00:00.000Z",
};

const currentProfile = {
  ...legacyProfile,
  terms_version: "2026-08-04",
  privacy_version: "2026-08-04",
};

describe("getAuthenticatedDestination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDemoModeEnabled.mockReturnValue(false);
    getUser.mockResolvedValue({ data: { user: null } });
  });

  const mockLegalProfile = (profile: typeof legacyProfile) => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    getCurrentUserLegalConsent.mockResolvedValue(profile);
  };

  it("routes a signed-out user to login", async () => {
    await expect(getAuthenticatedDestination()).resolves.toBe("/auth/login");
  });

  it("routes a user with legacy consent to consent", async () => {
    mockLegalProfile(legacyProfile);

    await expect(getAuthenticatedDestination()).resolves.toBe("/auth/consent");
  });

  it("routes a user with current consent to the app", async () => {
    mockLegalProfile(currentProfile);

    await expect(getAuthenticatedDestination()).resolves.toBe("/app");
  });
});

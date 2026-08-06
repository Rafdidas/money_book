import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  consumeAuthHashSession,
  getUser,
  getCurrentUserLegalConsent,
  isDemoModeEnabled,
  replace,
} = vi.hoisted(() => ({
  consumeAuthHashSession: vi.fn(),
  getUser: vi.fn(),
  getCurrentUserLegalConsent: vi.fn(),
  isDemoModeEnabled: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@/lib/demo", () => ({ isDemoModeEnabled }));
vi.mock("@/lib/supabase/client", () => ({ supabase: { auth: { getUser } } }));
vi.mock("@/lib/api/legalConsent", () => ({ getCurrentUserLegalConsent }));
vi.mock("@/lib/supabase/auth-url", () => ({ consumeAuthHashSession }));
vi.mock("@lottiefiles/dotlottie-react", () => ({ setWasmUrl: vi.fn() }));
vi.mock("@/components/app-alert/AppAlertProvider", () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/components/common/ThemeProvider", () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/app",
  useRouter: () => ({ replace }),
}));

import Providers, { getAuthenticatedDestination } from "./providers";

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

const authenticatedUser = { id: "user-1", email: "user@example.com", user_metadata: {} };

describe("getAuthenticatedDestination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consumeAuthHashSession.mockResolvedValue(undefined);
    isDemoModeEnabled.mockReturnValue(false);
    getUser.mockResolvedValue({ data: { user: null } });
    process.env.NEXT_PUBLIC_LEGAL_CONSENT_GATE = "true";
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_LEGAL_CONSENT_GATE;
  });

  const mockLegalProfile = (profile: typeof legacyProfile) => {
    getUser.mockResolvedValue({ data: { user: authenticatedUser } });
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

  it("skips the consent lookup entirely when the gate is disabled", async () => {
    delete process.env.NEXT_PUBLIC_LEGAL_CONSENT_GATE;
    mockLegalProfile(legacyProfile);

    await expect(getAuthenticatedDestination()).resolves.toBe("/app");
    expect(getCurrentUserLegalConsent).not.toHaveBeenCalled();
  });

  it("lets an authenticated user through when the consent lookup fails", async () => {
    getUser.mockResolvedValue({ data: { user: authenticatedUser } });
    getCurrentUserLegalConsent.mockRejectedValue(new Error("profile unavailable"));

    await expect(getAuthenticatedDestination()).resolves.toBe("/app");
  });

  it("narrows the consent lookup to the authenticated user id", async () => {
    mockLegalProfile(currentProfile);

    await getAuthenticatedDestination();

    expect(getCurrentUserLegalConsent).toHaveBeenCalledWith(authenticatedUser.id);
  });

  it("does not navigate after the app consent lookup resolves following unmount", async () => {
    getUser.mockResolvedValue({ data: { user: authenticatedUser } });
    let resolveConsent!: (profile: typeof legacyProfile) => void;
    getCurrentUserLegalConsent.mockReturnValue(
      new Promise((resolve) => {
        resolveConsent = resolve;
      }),
    );

    const { unmount } = render(<Providers>protected content</Providers>);
    await waitFor(() => expect(getCurrentUserLegalConsent).toHaveBeenCalled());
    unmount();
    resolveConsent(legacyProfile);

    await Promise.resolve();
    await Promise.resolve();
    expect(replace).not.toHaveBeenCalled();
  });
});

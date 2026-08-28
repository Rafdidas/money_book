import { createBrowserClient } from "@supabase/ssr";
import { describe, expect, it, vi } from "vitest";
import { AUTH_STORAGE_KEY, authStorage } from "@/lib/supabase/auth-storage";

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => ({})),
}));

import { createClient } from "./client";

describe("createClient", () => {
  it("uses the app's session-aware auth storage", () => {
    createClient();

    expect(createBrowserClient).toHaveBeenLastCalledWith(
      undefined,
      undefined,
      {
        auth: {
          storage: authStorage,
          storageKey: AUTH_STORAGE_KEY,
        },
      },
    );
  });
});

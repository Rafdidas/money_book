import { createBrowserClient } from "@supabase/ssr";
import { describe, expect, it, vi } from "vitest";

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => ({})),
}));

import { createClient } from "./client";

describe("createClient", () => {
  it("keeps Supabase SSR's cookie storage for server-protected routes", () => {
    createClient();

    expect(createBrowserClient).toHaveBeenLastCalledWith(
      undefined,
      undefined,
    );
  });
});

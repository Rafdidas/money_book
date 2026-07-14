// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/fsc/stock", () => ({ getFscDomesticStockQuote: vi.fn() }));

import { POST } from "./route";

describe("POST /api/stocks/quotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not expose a rate-limit provider error", async () => {
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "relation missing" } }),
    });

    const response = await POST(
      new Request("http://localhost/api/stocks/quotes", {
        method: "POST",
        body: JSON.stringify({ symbols: ["005930"] }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "잠시 후 다시 시도해주세요.",
    });
  });
});

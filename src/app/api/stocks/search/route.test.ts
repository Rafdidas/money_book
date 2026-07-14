// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { searchKisStocks } = vi.hoisted(() => ({
  searchKisStocks: vi.fn(),
}));

vi.mock("@/lib/kis/client", () => ({ searchKisStocks }));

import { GET } from "./route";

describe("GET /api/stocks/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a query longer than 80 characters before calling KIS", async () => {
    const response = await GET(
      new Request(`http://localhost/api/stocks/search?q=${"a".repeat(81)}`),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "검색어는 80자 이하로 입력해주세요.",
    });
    expect(searchKisStocks).not.toHaveBeenCalled();
  });

  it("does not expose an upstream error message", async () => {
    searchKisStocks.mockRejectedValueOnce(new Error("KIS token expired"));

    const response = await GET(
      new Request("http://localhost/api/stocks/search?q=005930"),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "잠시 후 다시 시도해주세요.",
    });
  });
});

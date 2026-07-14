import { beforeEach, describe, expect, it, vi } from "vitest";

const { range } = vi.hoisted(() => ({ range: vi.fn() }));

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({ range })),
      })),
    })),
  },
}));

import { getInquiries } from "./inquiries";

describe("getInquiries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses one look-ahead row to report whether more inquiries exist", async () => {
    const rows = Array.from({ length: 21 }, (_, index) => ({ id: String(index) }));
    range.mockResolvedValueOnce({ data: rows, error: null });

    await expect(getInquiries(0)).resolves.toEqual({
      items: rows.slice(0, 20),
      hasMore: true,
    });
    expect(range).toHaveBeenCalledWith(0, 20);
  });
});

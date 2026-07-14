import { beforeEach, describe, expect, it, vi } from "vitest";

const { order, or, range } = vi.hoisted(() => {
  const query = {
    order: vi.fn(),
    or: vi.fn(),
    range: vi.fn(),
  };
  query.order.mockReturnValue(query);
  query.or.mockReturnValue(query);
  return query;
});

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ order })),
    })),
  },
}));

import { getInquiries } from "./inquiries";

describe("getInquiries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    order.mockReturnValue({ order, or, range });
    or.mockReturnValue({ order, or, range });
  });

  it("returns a cursor from the final displayed inquiry", async () => {
    const rows = Array.from({ length: 21 }, (_, index) => ({
      id: String(index),
      created_at: `2026-07-14T00:00:${String(59 - index).padStart(2, "0")}.000Z`,
    }));
    range.mockResolvedValueOnce({ data: rows, error: null });

    await expect(getInquiries()).resolves.toEqual({
      items: rows.slice(0, 20),
      hasMore: true,
      nextCursor: { createdAt: rows[19].created_at, id: rows[19].id },
    });
    expect(order).toHaveBeenNthCalledWith(1, "created_at", { ascending: false });
    expect(order).toHaveBeenNthCalledWith(2, "id", { ascending: false });
    expect(range).toHaveBeenCalledWith(0, 20);
  });

  it("uses both created time and id to fetch rows after a cursor", async () => {
    range.mockResolvedValueOnce({ data: [], error: null });

    await getInquiries({ createdAt: "2026-07-14T00:00:00.000Z", id: "cursor-id" });

    expect(or).toHaveBeenCalledWith(
      "created_at.lt.2026-07-14T00:00:00.000Z,and(created_at.eq.2026-07-14T00:00:00.000Z,id.lt.cursor-id)",
    );
  });
});

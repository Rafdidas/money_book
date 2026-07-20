import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authGetUser,
  from,
  select,
  eq,
  order,
  limit,
  upsert,
  single,
  remove,
} = vi.hoisted(() => ({
  authGetUser: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  upsert: vi.fn(),
  single: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: { getUser: authGetUser },
    from,
  },
}));

import {
  deleteCustomCategory,
  getRecentCustomCategories,
  saveCustomCategory,
} from "./customCategories";

describe("custom category API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    from.mockReturnValue({ select, upsert, delete: remove });
    select.mockReturnValue({ eq, single });
    eq.mockReturnValue({ order, eq });
    order.mockReturnValue({ limit });
    upsert.mockReturnValue({ select });
    remove.mockReturnValue({ eq });
  });

  it("loads the five newest categories for the authenticated user", async () => {
    limit.mockResolvedValueOnce({
      data: [
        {
          id: "category-1",
          entry_type: "expense",
          name: "병원",
          last_used_at: "2026-07-20T00:00:00.000Z",
        },
      ],
      error: null,
    });

    await expect(getRecentCustomCategories()).resolves.toEqual([
      {
        id: "category-1",
        type: "expense",
        name: "병원",
        lastUsedAt: "2026-07-20T00:00:00.000Z",
      },
    ]);
    expect(from).toHaveBeenCalledWith("user_custom_categories");
    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(order).toHaveBeenCalledWith("last_used_at", { ascending: false });
    expect(limit).toHaveBeenCalledWith(20);
  });

  it("upserts a normalized category and returns the saved row", async () => {
    const now = new Date("2026-07-20T00:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);
    single.mockResolvedValueOnce({
      data: {
        id: "category-1",
        entry_type: "expense",
        name: "병원",
        last_used_at: now.toISOString(),
      },
      error: null,
    });

    await expect(saveCustomCategory("expense", " 병원 ")).resolves.toMatchObject({
      type: "expense",
      name: "병원",
    });
    expect(upsert).toHaveBeenCalledWith(
      {
        user_id: "user-1",
        entry_type: "expense",
        name: "병원",
        normalized_name: "병원",
        last_used_at: now.toISOString(),
      },
      { onConflict: "user_id,entry_type,normalized_name" },
    );
    vi.useRealTimers();
  });

  it("deletes only the authenticated user's category", async () => {
    eq.mockReturnValueOnce({ eq });
    eq.mockResolvedValueOnce({ error: null });

    await expect(deleteCustomCategory("category-1")).resolves.toBeUndefined();

    expect(remove).toHaveBeenCalledOnce();
    expect(eq).toHaveBeenNthCalledWith(1, "id", "category-1");
    expect(eq).toHaveBeenNthCalledWith(2, "user_id", "user-1");
  });

  it("requires authentication and propagates database failures", async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: null } });
    await expect(getRecentCustomCategories()).rejects.toThrow("로그인이 필요합니다.");

    limit.mockResolvedValueOnce({ data: null, error: { message: "조회 실패" } });
    await expect(getRecentCustomCategories()).rejects.toThrow("조회 실패");
  });
});

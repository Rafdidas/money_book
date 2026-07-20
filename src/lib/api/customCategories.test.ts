import { beforeEach, describe, expect, it, vi } from "vitest";

const { authGetUser, from } = vi.hoisted(() => ({
  authGetUser: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: { auth: { getUser: authGetUser }, from },
}));

import {
  deleteCustomCategory,
  getRecentCustomCategories,
  saveCustomCategory,
  type CustomCategoryType,
} from "./customCategories";

const categoryTypes: CustomCategoryType[] = [
  "expense",
  "income",
  "savings",
  "investment",
];

describe("custom category API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    authGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  it("loads the five newest categories independently for every entry type", async () => {
    const requestedTypes: string[] = [];
    const limits: number[] = [];

    from.mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn((_column: string, type: CustomCategoryType) => {
            requestedTypes.push(type);
            return {
              order: vi.fn(() => ({
                limit: vi.fn((limit: number) => {
                  limits.push(limit);
                  return Promise.resolve({
                    data: Array.from({ length: 5 }, (_, index) => ({
                      id: `${type}-${index}`,
                      entry_type: type,
                      name: `${type}-${index}`,
                      last_used_at: `2026-07-${String(20 - index).padStart(2, "0")}T00:00:00.000Z`,
                    })),
                    error: null,
                  });
                }),
              })),
            };
          }),
        })),
      })),
    }));

    const result = await getRecentCustomCategories();

    expect(requestedTypes).toEqual(categoryTypes);
    expect(limits).toEqual([5, 5, 5, 5]);
    expect(result).toHaveLength(20);
    for (const type of categoryTypes) {
      expect(result.filter((category) => category.type === type)).toHaveLength(5);
    }
  });

  it("does not let a busy type starve another type's newest categories", async () => {
    from.mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn((_column: string, type: CustomCategoryType) => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({
                data: [{
                  id: `${type}-newest`,
                  entry_type: type,
                  name: `${type} 최근`,
                  last_used_at: "2026-07-20T00:00:00.000Z",
                }],
                error: null,
              })),
            })),
          })),
        })),
      })),
    }));

    await expect(getRecentCustomCategories()).resolves.toEqual(
      categoryTypes.map((type) => ({
        id: `${type}-newest`,
        type,
        name: `${type} 최근`,
        lastUsedAt: "2026-07-20T00:00:00.000Z",
      })),
    );
  });

  it("upserts a normalized category and returns the saved row", async () => {
    const now = new Date("2026-07-20T00:00:00.000Z");
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "category-1",
        entry_type: "expense",
        name: "병원",
        last_used_at: now.toISOString(),
      },
      error: null,
    });
    const upsert = vi.fn(() => ({ select: vi.fn(() => ({ single })) }));
    from.mockReturnValue({ upsert });
    await expect(saveCustomCategory("expense", " 병원 ")).resolves.toMatchObject({
      type: "expense",
      name: "병원",
    });
    expect(upsert).toHaveBeenCalledWith(
      {
        user_id: "user-1",
        entry_type: "expense",
        name: "병원",
      },
      { onConflict: "user_id,entry_type,normalized_name" },
    );
  });

  it("propagates a category save database error", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: "저장 실패" } });
    from.mockReturnValue({
      upsert: vi.fn(() => ({ select: vi.fn(() => ({ single })) })),
    });

    await expect(saveCustomCategory("savings", "비상금")).rejects.toThrow("저장 실패");
  });

  it("deletes only the authenticated user's category", async () => {
    const secondEq = vi.fn().mockResolvedValue({ error: null });
    const firstEq = vi.fn(() => ({ eq: secondEq }));
    const remove = vi.fn(() => ({ eq: firstEq }));
    from.mockReturnValue({ delete: remove });

    await expect(deleteCustomCategory("category-1")).resolves.toBeUndefined();
    expect(firstEq).toHaveBeenCalledWith("id", "category-1");
    expect(secondEq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("propagates a category delete database error", async () => {
    const secondEq = vi.fn().mockResolvedValue({ error: { message: "삭제 실패" } });
    from.mockReturnValue({
      delete: vi.fn(() => ({ eq: vi.fn(() => ({ eq: secondEq })) })),
    });

    await expect(deleteCustomCategory("category-1")).rejects.toThrow("삭제 실패");
  });

  it("requires authentication and propagates category query failures", async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: null } });
    await expect(getRecentCustomCategories()).rejects.toThrow("로그인이 필요합니다.");

    from.mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({ data: null, error: { message: "조회 실패" } }),
            })),
          })),
        })),
      })),
    }));
    await expect(getRecentCustomCategories()).rejects.toThrow("조회 실패");
  });
});

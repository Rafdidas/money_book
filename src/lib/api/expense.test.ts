import { beforeEach, describe, expect, it, vi } from "vitest";

const { authGetUser, from, insert, select } = vi.hoisted(() => ({
  authGetUser: vi.fn(),
  from: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: { auth: { getUser: authGetUser }, from },
}));

import { createExpense } from "./expense";

describe("expense API durable subtype", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    from.mockReturnValue({ insert });
    insert.mockReturnValue({ select });
    select.mockResolvedValue({ data: [], error: null });
  });

  it.each(["savings", "investment"] as const)(
    "persists %s when creating a custom-category entry",
    async (entryType) => {
      await createExpense({
        amount: 10000,
        type: "expense",
        entry_type: entryType,
        category: "직접 만든 분류",
        memo: "",
        date: "2026-07-20",
      } as Parameters<typeof createExpense>[0]);

      expect(insert).toHaveBeenCalledWith([
        expect.objectContaining({
          type: "expense",
          entry_type: entryType,
          category: "직접 만든 분류",
        }),
      ]);
    },
  );
});

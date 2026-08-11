import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, deleteUser, createServiceClient, expensesEq, expensesDelete, expensesFrom } =
  vi.hoisted(() => ({
    getUser: vi.fn(),
    deleteUser: vi.fn(),
    createServiceClient: vi.fn(),
    expensesEq: vi.fn(),
    expensesDelete: vi.fn(),
    expensesFrom: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve({ auth: { getUser } }),
}));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient }));

import { POST } from "./route";

describe("POST /api/account/delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteUser.mockResolvedValue({ error: null });
    expensesEq.mockResolvedValue({ error: null });
    expensesDelete.mockReturnValue({ eq: expensesEq });
    expensesFrom.mockReturnValue({ delete: expensesDelete });
    createServiceClient.mockReturnValue({
      auth: { admin: { deleteUser } },
      from: expensesFrom,
    });
  });

  it("rejects an unauthenticated request", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await POST();

    expect(response.status).toBe(401);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("rejects when the session lookup errors", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: "expired" } });

    const response = await POST();

    expect(response.status).toBe(401);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("deletes only the user the server resolved from the session", async () => {
    // 본문으로 받은 id를 믿으면 남의 계정을 지울 수 있다. 라우트는 본문을
    // 읽지 않으며, POST()가 인자를 받지 않는 것으로 그 사실이 드러난다.
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

    const response = await POST();

    expect(deleteUser).toHaveBeenCalledWith("user-1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("returns 500 when deletion fails", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    deleteUser.mockResolvedValue({ error: { message: "boom" } });

    const response = await POST();

    expect(response.status).toBe(500);
    expect(expensesFrom).not.toHaveBeenCalled();
  });

  it("cleans up the deleted user's expenses via the service client", async () => {
    // 마이그레이션의 ON DELETE CASCADE가 아직 적용되지 않았을 수 있으므로
    // 라우트가 서비스 롤로 직접 expenses를 정리하는지 확인한다.
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

    const response = await POST();

    expect(expensesFrom).toHaveBeenCalledWith("expenses");
    expect(expensesDelete).toHaveBeenCalled();
    expect(expensesEq).toHaveBeenCalledWith("user_id", "user-1");
    expect(response.status).toBe(200);
  });

  it("still reports success with a warning when expenses cleanup fails", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    expensesEq.mockResolvedValue({ error: { message: "boom" } });

    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      warning: "일부 데이터를 정리하지 못했습니다.",
    });
  });
});

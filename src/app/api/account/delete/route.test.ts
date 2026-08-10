import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, deleteUser, createServiceClient } = vi.hoisted(() => ({
  getUser: vi.fn(),
  deleteUser: vi.fn(),
  createServiceClient: vi.fn(),
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
    createServiceClient.mockReturnValue({ auth: { admin: { deleteUser } } });
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
  });
});

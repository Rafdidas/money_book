// @vitest-environment node

import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser } = vi.hoisted(() => ({
  getUser: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser },
  })),
}));

import { config, proxy } from "@/proxy";

describe("proxy matcher", () => {
  it("/app 하위 경로만 보호한다", () => {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: "/app" })).toBe(true);
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: "/app/analysis" })).toBe(true);
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: "/auth/login" })).toBe(false);
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: "/api/stocks/search" })).toBe(false);
  });
});

describe("proxy access", () => {
  beforeEach(() => {
    getUser.mockReset();
  });

  it("비로그인 사용자를 next 경로와 함께 로그인으로 보낸다", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const response = await proxy(new NextRequest("https://monibuk.com/app/analysis"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://monibuk.com/auth/login?next=%2Fapp%2Fanalysis",
    );
  });

  it("로그인 사용자의 앱 접근을 통과시킨다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const response = await proxy(new NextRequest("https://monibuk.com/app"));

    expect(response.status).toBe(200);
  });

  it("데모 쿠키가 있는 비로그인 사용자의 앱 접근을 통과시킨다", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const request = new NextRequest("https://monibuk.com/app", {
      headers: { cookie: "money-book-demo-mode=true" },
    });
    const response = await proxy(request);

    expect(response.status).toBe(200);
  });
});

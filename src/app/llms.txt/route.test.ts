import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /llms.txt", () => {
  it("returns the current public service description for the canonical domain", async () => {
    const response = await GET();
    const body = await response.text();

    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(body).toContain("# 머니북가계부");
    expect(body).toContain("Primary URL: https://monibuk.com/");
    expect(body).not.toContain("money-book-one.vercel.app");
  });
});

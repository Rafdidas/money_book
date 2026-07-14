import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("security headers", () => {
  it("adds a non-blocking CSP policy without a report receiver", async () => {
    const headers = await nextConfig.headers?.();
    const policy = headers?.[0]?.headers.find(
      (header) => header.key === "Content-Security-Policy-Report-Only",
    )?.value;

    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).not.toContain("report-uri");
  });
});

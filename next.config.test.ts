import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("security headers", () => {
  it("adds a non-blocking CSP policy with a report receiver", async () => {
    const headers = await nextConfig.headers?.();
    const policy = headers?.[0]?.headers.find(
      (header) => header.key === "Content-Security-Policy-Report-Only",
    )?.value;

    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("report-uri /api/csp-reports");
    expect(policy).toContain("report-to csp-endpoint");
  });
});

// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServiceClient, insert } = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("@/lib/supabase/service", () => ({ createServiceClient }));

import { POST } from "./route";

describe("POST /api/csp-reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createServiceClient.mockReturnValue({ from: vi.fn(() => ({ insert })) });
    insert.mockResolvedValue({ error: null });
  });

  it("stores only sanitized CSP report metadata", async () => {
    const response = await POST(
      new Request("http://localhost/api/csp-reports", {
        method: "POST",
        headers: { "content-type": "application/csp-report" },
        body: JSON.stringify({
          "csp-report": {
            "document-uri": "https://moneybook.kr/app?token=secret#details",
            "blocked-uri": "https://tracker.example/path?user=private#hash",
            "effective-directive": "script-src-elem",
            disposition: "report",
            "status-code": 200,
          },
        }),
      }),
    );

    expect(response.status).toBe(204);
    expect(insert).toHaveBeenCalledWith({
      document_uri: "https://moneybook.kr/app",
      blocked_uri: "https://tracker.example/path",
      effective_directive: "script-src-elem",
      disposition: "report",
      status_code: 200,
    });
  });
});

import { vi } from "vitest";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";
});

import { describe, expect, it } from "vitest";
import { metadata } from "./layout";

describe("root social metadata", () => {
  it("uses the Open Graph image as a large X/Twitter card", () => {
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: ["/opengraph-image.png"],
    });
  });
});

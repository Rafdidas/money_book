import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const imagePath = resolve(process.cwd(), "src/app/opengraph-image.png");

describe("Open Graph image", () => {
  it("is a 1200 by 630 PNG under the social-image size limit", async () => {
    const image = await readFile(imagePath);
    const size = await stat(imagePath);

    expect(image.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(image.readUInt32BE(16)).toBe(1200);
    expect(image.readUInt32BE(20)).toBe(630);
    expect(size.size).toBeLessThan(5 * 1024 * 1024);
  });
});

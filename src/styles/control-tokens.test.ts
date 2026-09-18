import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(__dirname, "./_control-tokens.scss"), "utf8");

describe("control tokens", () => {
  it("컨트롤 높이 스케일을 정의한다", () => {
    expect(source).toContain("--control-height-sm: 32px;");
    expect(source).toContain("--control-height-md: 40px;");
    expect(source).toContain("--control-height-lg: 48px;");
  });

  it("반투명 표면 토큰을 라이트와 다크 모두 정의한다", () => {
    const names = [
      "--surface-translucent",
      "--surface-translucent-strong",
      "--surface-border-translucent",
      "--surface-shadow-soft",
    ];
    for (const name of names) {
      const occurrences = source.split(`${name}:`).length - 1;
      expect(occurrences, `${name} 는 라이트와 다크에서 정의되어야 한다`).toBeGreaterThanOrEqual(2);
    }
  });

  it("backdrop-filter 를 쓰지 않는다", () => {
    expect(source).not.toContain("backdrop-filter");
  });
});

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

  it("반투명 표면 토큰을 라이트와 [data-theme=\"dark\"] 블록 모두에서 정의한다", () => {
    const names = [
      "--surface-translucent",
      "--surface-translucent-strong",
      "--surface-border-translucent",
      "--surface-shadow-soft",
    ];
    const darkIndex = source.indexOf('[data-theme="dark"]');
    expect(darkIndex).toBeGreaterThan(-1);
    const light = source.slice(0, darkIndex);
    const dark = source.slice(darkIndex);
    for (const name of names) {
      expect(light, `${name} 라이트 정의`).toContain(`${name}:`);
      expect(dark, `${name} 다크 정의`).toContain(`${name}:`);
    }
  });

  it("ui.scss 는 backdrop-filter 를 쓰지 않는다", () => {
    const uiScss = readFileSync(join(__dirname, "../components/ui/ui.scss"), "utf8");
    expect(uiScss).not.toContain("backdrop-filter");
  });

  it("표 셀 패딩 토큰을 정의한다", () => {
    expect(source).toContain("--table-cell-pad-block: 5px;");
    expect(source).toContain("--table-cell-pad-inline: 10px;");
  });
});

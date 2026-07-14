import { describe, expect, it } from "vitest";
import { normalizeStockSearchText } from "@/utils/stock";

describe("normalizeStockSearchText", () => {
  it.each([
    [" 삼성 전자 ", "삼성전자"],
    ["KODEX-200", "kodex200"],
    ["ＡＢＣ １２３", "abc123"],
    ["005930", "005930"],
  ])("%s를 %s로 정규화한다", (input, expected) => {
    expect(normalizeStockSearchText(input)).toBe(expected);
  });
});

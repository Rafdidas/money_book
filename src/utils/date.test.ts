import { describe, expect, it } from "vitest";
import { formatDate } from "@/utils/date";

describe("formatDate", () => {
  it("로컬 날짜를 YYYY-MM-DD 형식으로 채운다", () => {
    expect(formatDate(new Date(2026, 1, 3))).toBe("2026-02-03");
  });

  it("연말 날짜를 다음 해로 이동시키지 않는다", () => {
    expect(formatDate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

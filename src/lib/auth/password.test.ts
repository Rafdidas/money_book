import { describe, expect, it } from "vitest";

import {
  PASSWORD_RULE_MESSAGE,
  PASSWORD_TOO_LONG_MESSAGE,
  getPasswordError,
} from "@/lib/auth/password";

describe("getPasswordError", () => {
  it("rejects a password shorter than 8 characters", () => {
    expect(getPasswordError("abc1234")).toBe(PASSWORD_RULE_MESSAGE);
  });

  it("rejects a password without digits", () => {
    expect(getPasswordError("abcdefgh")).toBe(PASSWORD_RULE_MESSAGE);
  });

  it("rejects a password without letters", () => {
    expect(getPasswordError("12345678")).toBe(PASSWORD_RULE_MESSAGE);
  });

  it("rejects a password longer than 72 bytes", () => {
    expect(getPasswordError(`${"a".repeat(72)}1`)).toBe(PASSWORD_TOO_LONG_MESSAGE);
  });

  it("counts bytes rather than characters for the upper bound", () => {
    // 한글은 UTF-8에서 3바이트라 25자면 75바이트가 된다.
    expect(getPasswordError(`${"가".repeat(25)}a1`)).toBe(PASSWORD_TOO_LONG_MESSAGE);
  });

  it("accepts a password with letters and digits at least 8 characters long", () => {
    expect(getPasswordError("password123")).toBe("");
  });
});

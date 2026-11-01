import { describe, expect, it } from "vitest";
import {
  clearLocalLoginFailures,
  hashLocalPassword,
  isLocalLoginBlocked,
  isValidUsername,
  normalizeUsername,
  recordLocalLoginFailure,
  verifyLocalPassword,
} from "./localAuth";

describe("local account credentials", () => {
  it("normalizes and validates usernames consistently", () => {
    expect(normalizeUsername("  Admin.User  ")).toBe("admin.user");
    expect(isValidUsername("warehouse_1")).toBe(true);
    expect(isValidUsername("مستودع-١")).toBe(true);
    expect(isValidUsername("two words")).toBe(false);
    expect(isValidUsername("ab")).toBe(false);
  });

  it("stores a salted password hash and verifies it without plaintext", async () => {
    const password = "Warehouse!2026Strong";
    const encoded = await hashLocalPassword(password);
    expect(encoded).toMatch(/^scrypt\$32768\$8\$1\$/);
    expect(encoded).not.toContain(password);
    expect(await verifyLocalPassword(password, encoded)).toBe(true);
    expect(await verifyLocalPassword("incorrect password", encoded)).toBe(false);
    expect(await verifyLocalPassword(password, null)).toBe(false);
  });

  it("blocks repeated password guesses and clears after a successful login", () => {
    const key = `test-login-${Date.now()}`;
    for (let i = 0; i < 8; i += 1) recordLocalLoginFailure(key);
    expect(isLocalLoginBlocked(key)).toBe(true);
    clearLocalLoginFailures(key);
    expect(isLocalLoginBlocked(key)).toBe(false);
  });
});

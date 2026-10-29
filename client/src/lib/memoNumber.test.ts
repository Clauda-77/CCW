import { describe, expect, it } from "vitest";
import { displayMemoNumber } from "./memoNumber";

describe("displayMemoNumber", () => {
  it("prefers the original BILNO saved from the legacy source", () => {
    expect(displayMemoNumber("38", "legacy-SRC-38-20260927-9")).toBe("38");
    expect(displayMemoNumber("87", "legacy-CST-87-20260226-2")).toBe("87");
  });

  it("extracts BILNO from a known replacement key when the source field is empty", () => {
    expect(displayMemoNumber(null, "legacy-SRC-38-20260927-9")).toBe("38");
    expect(displayMemoNumber(undefined, "legacy-CST-87-20260226-2")).toBe("87");
    expect(displayMemoNumber(null, "SRC-38-20260927-9")).toBe("38");
  });

  it("removes a trailing legacy import date but preserves ordinary memo numbers", () => {
    expect(displayMemoNumber(null, "legacy-104-20260927")).toBe("104");
    expect(displayMemoNumber(null, "2026/38")).toBe("2026/38");
    expect(displayMemoNumber(null, null)).toBe("");
  });
});

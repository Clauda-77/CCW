import { describe, expect, it } from "vitest";
import { displayCode } from "./displayCode";

describe("تنسيق الرمز المعروض", () => {
  it("يخفي بادئة legacy من العرض فقط", () => {
    expect(displayCode("legacy-1536")).toBe("1536");
    expect(displayCode("LEGACY_11")).toBe("11");
    expect(displayCode("1536")).toBe("1536");
  });

  it("لا يحول القيمة إلى رقم ولا يغير الجزء غير المخصص للبادئة", () => {
    expect(displayCode("legacy-009")).toBe("009");
    expect(displayCode("رمز-legacy-9")).toBe("رمز-legacy-9");
  });
});

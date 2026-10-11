import { describe, expect, it } from "vitest";
import { formatPrintNumber } from "./printNumber";

describe("formatPrintNumber", () => {
  it("يحذف الأصفار العشرية الزائدة", () => {
    expect(formatPrintNumber("1.000")).toBe("1");
    expect(formatPrintNumber("155.000")).toBe("155");
  });

  it("يحافظ على الكسور الحقيقية", () => {
    expect(formatPrintNumber("1.5")).toBe("1.5");
  });
});

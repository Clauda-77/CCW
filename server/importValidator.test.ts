import XLSXModule from "xlsx";
import { describe, expect, it } from "vitest";
import { validateWorkbook } from "./importValidator";

const XLSX = (XLSXModule as unknown as { default?: typeof XLSXModule }).default ?? XLSXModule;

function workbookBase64(rows: Record<string, unknown>[]) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "بيانات");
  return XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
}

describe("validateWorkbook", () => {
  it("accepts a valid materials sheet and returns a row sample", () => {
    const result = validateWorkbook("materials", workbookBase64([{ SERIALNO: "1", PRTNAME: "مادة اختبار", WIHDA: "عدد" }]));
    expect(result.isValid).toBe(true);
    expect(result.totalRows).toBe(1);
    expect(result.missingColumns).toEqual([]);
    expect(result.sample[0]?.PRTNAME).toBe("مادة اختبار");
  });

  it("reports required columns that are absent", () => {
    const result = validateWorkbook("balances", workbookBase64([{ SERIALNO: "1" }]));
    expect(result.isValid).toBe(false);
    expect(result.missingColumns).toContain("QUANTITEONHAND");
  });
});

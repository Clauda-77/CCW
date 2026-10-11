import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { buildExcelCompatibleCsv, buildExcelWorkbook, formatWholeQuantity } from "./Reports";

const source = readFileSync(new URL("./Reports.tsx", import.meta.url), "utf8");
const inventorySource = readFileSync(new URL("./Inventory.tsx", import.meta.url), "utf8");

describe("تصدير التقارير المتوافق مع Excel", () => {
  it("يولد صف الرأس والصفوف مع حماية الفواصل والاقتباسات", () => {
    const csv = buildExcelCompatibleCsv(["الرقم", "اسم المادة"], [[1, "قلم، أزرق"], [2, 'مادة "اختبار"']]);
    expect(csv).toContain('"الرقم","اسم المادة"');
    expect(csv).toContain('"1","قلم، أزرق"');
    expect(csv).toContain('"2","مادة ""اختبار"""');
  });

  it("يعرض الكميات كأعداد صحيحة دون أصفار عشرية", () => {
    expect(formatWholeQuantity("20.000")).toBe("20");
    expect(formatWholeQuantity("20.6")).toBe("21");
  });

  it("يبني مصنف XLSX فعليًا قابلًا للقراءة مع الرأس والصفوف", () => {
    const workbookBytes = buildExcelWorkbook(["الرقم", "اسم المادة"], [[1, "قلم"], [2, "ورق"]]);
    const workbook = XLSX.read(workbookBytes, { type: "array" });
    const sheetRows = XLSX.utils.sheet_to_json<(string | number)[]>(workbook.Sheets["التقرير"], { header: 1 });
    expect(workbook.SheetNames).toEqual(["التقرير"]);
    expect(sheetRows).toEqual([["الرقم", "اسم المادة"], [1, "قلم"], [2, "ورق"]]);
  });

  it("يربط الزر بتنزيل ملف XLSX باسم التقرير ويستعمل أعمدة كل نوع تقرير", () => {
    ["new Blob([workbook]", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".xlsx", "URL.createObjectURL(blob)", "link.download", "downloadExcel(kind, columns, rows)", "يومية الإدخالات", "جدول الجرد", "طباعة شهرية — المتحركة والثابتة", "طباعة شهرية — المتحركة فقط", "movementActiveRows"].forEach(fragment => expect(source).toContain(fragment));
  });

  it("يطبع بطاقتي الإدخالات والإخراجات لجميع الصفوف الظاهرة لا المادة المحددة فقط", () => {
    expect(inventorySource).toContain('const scoped = mode === "movement" ? filtered.filter');
    expect(inventorySource).toContain('mode === "inbound" ? "بطاقة الإدخالات"');
    expect(inventorySource).toContain("بطاقة الإدخالات لكل المواد");
    expect(inventorySource).toContain("بطاقة الإخراجات لكل المواد");
    expect(source).toContain("formatWholeQuantity(row.onHandQuantity), row.unit, formatWholeQuantity(row.onHandQuantity), \"\", \"\"");
    expect(inventorySource).toContain("formatWholeQuantity(row.onHandQuantity), row.unit, formatWholeQuantity(row.onHandQuantity), \"\", \"\"");
  });

  it("يبقي الفروق الجردية فارغة ولا يضع أصفارًا محسوبة تلقائيًا", () => {
    expect(source).toContain("formatWholeQuantity(row.onHandQuantity), row.unit, formatWholeQuantity(row.onHandQuantity), \"\", \"\"");
    expect(inventorySource).toContain("formatWholeQuantity(row.onHandQuantity), row.unit, formatWholeQuantity(row.onHandQuantity), \"\", \"\"");
    expect(source).not.toContain("formatWholeQuantity(row.onHandQuantity), row.unit, formatWholeQuantity(row.onHandQuantity), \"0\", \"0\"");
  });

  it("يضع أزرار التقارير بعد الجدول وبترتيب الواجهة القديمة", () => {
    const order = ["بطاقة المادة", "بطاقة الإدخالات لكل المواد", "بطاقة الإخراجات لكل المواد", "تقرير الجرد", "طباعة شهرية — المتحركة والثابتة", "طباعة شهرية — المتحركة فقط"].map(label => inventorySource.lastIndexOf(label));
    expect(order.every(index => index >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});

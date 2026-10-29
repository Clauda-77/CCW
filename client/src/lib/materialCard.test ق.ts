import { describe, expect, it } from "vitest";
import { buildMaterialCardRows } from "./materialCard";

describe("بطاقة المادة", () => {
  it("تحسب الرصيد المتسلسل من الحركات الفعلية وتعرض الفترة المطلوبة", () => {
    const rows = buildMaterialCardRows([
      { memoNumber: "2", memoDate: "2026-01-10", occurredAt: "2026-01-10", movementType: "outbound", quantityIn: "0", quantityOut: "3", partyName: "جهة", notes: null },
      { memoNumber: "1", memoDate: "2026-01-05", occurredAt: "2026-01-05", movementType: "inbound", quantityIn: "5", quantityOut: "0", partyName: "مورّد", notes: null },
    ], "10", "2026-01-01", "2026-01-31");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.[6]).toBe(15);
    expect(rows[1]?.[6]).toBe(12);
  });

  it("يستبعد تاريخ الحركة الواقع قبل الفترة مع إبقاء الرصيد المرحل الصحيح", () => {
    const rows = buildMaterialCardRows([
      { memoNumber: "قديم", memoDate: "2024-03-03", occurredAt: "2024-03-03", movementType: "inbound", quantityIn: "450", quantityOut: "0", partyName: "مورد", notes: null },
      { memoNumber: "جديد", memoDate: "2026-08-10", occurredAt: "2026-08-10", movementType: "outbound", quantityIn: "0", quantityOut: "5", partyName: "جهة", notes: null },
    ], "0", "2026-01-01", "2026-08-16");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.[2]).toBe("جديد");
    expect(rows[0]?.[6]).toBe(445);
  });

  it("يعرض الاستلام قبل التسليم عند تنفيذ الحركتين في اليوم نفسه", () => {
    const rows = buildMaterialCardRows([
      { memoNumber: "تسليم-2", memoDate: "2026-04-12", occurredAt: "2026-04-12T08:00:00", movementType: "outbound", quantityIn: "0", quantityOut: "7", partyName: "جهة", notes: null },
      { memoNumber: "استلام-1", memoDate: "2026-04-12", occurredAt: "2026-04-12T17:00:00", movementType: "inbound", quantityIn: "10", quantityOut: "0", partyName: "مورد", notes: null },
    ], "0");

    expect(rows.map(row => row[2])).toEqual(["استلام-1", "تسليم-2"]);
    expect(rows.map(row => row[6])).toEqual([10, 3]);
  });
});

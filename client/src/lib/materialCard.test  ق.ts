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

  it("يحافظ على الترتيب الزمني إذا كان الإدخال والتسليم بتاريخين مختلفين", () => {
    const rows = buildMaterialCardRows([
      { memoNumber: "إدخال-13", memoDate: "2026-04-13", occurredAt: "2026-04-13T08:00:00", movementType: "inbound", quantityIn: "5", quantityOut: "0", partyName: "مورد", notes: null },
      { memoNumber: "تسليم-12", memoDate: "2026-04-12", occurredAt: "2026-04-12T23:00:00", movementType: "outbound", quantityIn: "0", quantityOut: "3", partyName: "جهة", notes: null },
    ], "10");

    expect(rows.map(row => row[2])).toEqual(["تسليم-12", "إدخال-13"]);
    expect(rows.map(row => row[6])).toEqual([7, 12]);
  });

  it("لا يفرض أولوية الإدخال على أنواع الحركات الأخرى في اليوم نفسه", () => {
    const rows = buildMaterialCardRows([
      { memoNumber: "تسليم-صباحاً", memoDate: "2026-04-12", occurredAt: "2026-04-12T08:00:00", movementType: "outbound", quantityIn: "0", quantityOut: "2", partyName: "جهة", notes: null },
      { memoNumber: "تسوية-مساءً", memoDate: "2026-04-12", occurredAt: "2026-04-12T17:00:00", movementType: "adjustment", quantityIn: "1", quantityOut: "0", partyName: "", notes: null },
    ], "10");

    expect(rows.map(row => row[2])).toEqual(["تسليم-صباحاً", "تسوية-مساءً"]);
    expect(rows.map(row => row[6])).toEqual([8, 9]);
  });

  it("يعرض رقم المجلد مع الرقم المالي للاستلام والتركيب والتنسيق", () => {
    const receipt = buildMaterialCardRows([
      {
        memoNumber: "SER-1",
        memoType: "inbound",
        memoNotes: "استلام مواد جديدة",
        folderNumber: "12",
        referenceNumber: "FIN-45",
        memoDate: "2026-05-01",
        occurredAt: "2026-05-01",
        movementType: "inbound",
        quantityIn: "1",
        quantityOut: "0",
        partyName: "مورد",
        notes: null,
      },
    ], 0);
    const transfer = buildMaterialCardRows([
      {
        memoNumber: "SER-2",
        memoType: "outbound",
        memoNotes: "محضر تركيب وتنسيق",
        folderNumber: "13",
        referenceNumber: "FIN-46",
        memoDate: "2026-05-02",
        occurredAt: "2026-05-02",
        movementType: "outbound",
        quantityIn: "0",
        quantityOut: "1",
        partyName: "جهة",
        notes: null,
      },
    ], 0);

    expect(receipt[0]?.[2]).toBe("12 / FIN-45");
    expect(transfer[0]?.[2]).toBe("13 / FIN-46");
  });

  it("يعرض رقم المجلد مع الرقم المتسلسل للتسليم والإدخال", () => {
    const delivery = buildMaterialCardRows([
      {
        memoNumber: "SER-3",
        memoType: "outbound",
        memoNotes: "تسليم مواد",
        folderNumber: "14",
        referenceNumber: "FIN-47",
        memoDate: "2026-05-03",
        occurredAt: "2026-05-03",
        movementType: "outbound",
        quantityIn: "0",
        quantityOut: "1",
        partyName: "جهة",
        notes: null,
      },
    ], 0);
    const entry = buildMaterialCardRows([
      {
        memoNumber: "SER-4",
        memoType: "inbound",
        memoNotes: "إدخال مواد قديمة",
        folderNumber: "15",
        referenceNumber: "FIN-48",
        memoDate: "2026-05-04",
        occurredAt: "2026-05-04",
        movementType: "inbound",
        quantityIn: "1",
        quantityOut: "0",
        partyName: "جهة",
        notes: null,
      },
    ], 0);

    expect(delivery[0]?.[2]).toBe("14 / SER-3");
    expect(entry[0]?.[2]).toBe("15 / SER-4");
  });
});

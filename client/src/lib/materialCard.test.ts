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

  it("يبدأ البطاقة بمدور صفر مؤقتًا ويتجاهل حركات السنوات السابقة", () => {
    const rows = buildMaterialCardRows([
      { memoNumber: "استلام قديم", memoDate: "2025-06-02", occurredAt: "2025-06-02", movementType: "inbound", quantityIn: "8", quantityOut: "0", partyName: "مورد", notes: null },
      { memoNumber: "صرف قديم", memoDate: "2025-10-01", occurredAt: "2025-10-01", movementType: "outbound", quantityIn: "0", quantityOut: "3", partyName: "جهة", notes: null },
      { memoNumber: "استلام جديد", memoDate: "2026-01-04", occurredAt: "2026-01-04", movementType: "inbound", quantityIn: "6", quantityOut: "0", partyName: "مورد", notes: null },
      { memoNumber: "صرف جديد", memoDate: "2026-01-05", occurredAt: "2026-01-05", movementType: "outbound", quantityIn: "0", quantityOut: "2", partyName: "جهة", notes: null },
    ], 0, undefined, undefined, 2026);

    expect(rows[0]?.[1]).toBe("مدور");
    expect(rows[0]?.[3]).toBe("31/12/2025");
    expect(rows[0]?.[6]).toBe(0);
    expect(rows.slice(1).map(row => row[6])).toEqual([6, 4]);
  });

  it("يحسب الحركات من قيمة الجرد السنوي المعتمدة عند تمريرها", () => {
    const rows = buildMaterialCardRows([
      { memoNumber: "إدخال", memoDate: "2026-01-04", occurredAt: "2026-01-04", movementType: "inbound", quantityIn: "3", quantityOut: "0", partyName: "مورد", notes: null },
      { memoNumber: "تسليم", memoDate: "2026-01-05", occurredAt: "2026-01-05", movementType: "outbound", quantityIn: "0", quantityOut: "2", partyName: "جهة", notes: null },
    ], 99, undefined, undefined, 2026, 5);

    expect(rows[0]?.[6]).toBe(5);
    expect(rows.slice(1).map(row => row[6])).toEqual([8, 6]);
  });

  it("يعرض الاستلام قبل التسليم عند تنفيذ الحركتين في اليوم نفسه", () => {
    const rows = buildMaterialCardRows([
      { memoNumber: "تسليم-2", memoDate: "2026-04-12", occurredAt: "2026-04-12T08:00:00", movementType: "outbound", quantityIn: "0", quantityOut: "7", partyName: "جهة", notes: null },
      { memoNumber: "استلام-1", memoDate: "2026-04-12", occurredAt: "2026-04-12T17:00:00", movementType: "inbound", quantityIn: "10", quantityOut: "0", partyName: "مورد", notes: null },
    ], "0", undefined, undefined, 2026);

    expect(rows[0]?.[1]).toBe("مدور");
    expect(rows.slice(1).map(row => row[2])).toEqual(["استلام-1", "تسليم-2"]);
    expect(rows.slice(1).map(row => row[6])).toEqual([10, 3]);
  });

  it("يحافظ على الترتيب الزمني إذا كان الإدخال والتسليم بتاريخين مختلفين", () => {
    const rows = buildMaterialCardRows([
      { memoNumber: "إدخال-13", memoDate: "2026-04-13", occurredAt: "2026-04-13T08:00:00", movementType: "inbound", quantityIn: "5", quantityOut: "0", partyName: "مورد", notes: null },
      { memoNumber: "تسليم-12", memoDate: "2026-04-12", occurredAt: "2026-04-12T23:00:00", movementType: "outbound", quantityIn: "0", quantityOut: "3", partyName: "جهة", notes: null },
    ], "0", undefined, undefined, 2026);

    expect(rows.slice(1).map(row => row[2])).toEqual(["تسليم-12", "إدخال-13"]);
    expect(rows.slice(1).map(row => row[6])).toEqual([-3, 2]);
  });

  it("لا يفرض أولوية الإدخال على أنواع الحركات الأخرى في اليوم نفسه", () => {
    const rows = buildMaterialCardRows([
      { memoNumber: "تسليم-صباحاً", memoDate: "2026-04-12", occurredAt: "2026-04-12T08:00:00", movementType: "outbound", quantityIn: "0", quantityOut: "2", partyName: "جهة", notes: null },
      { memoNumber: "تسوية-مساءً", memoDate: "2026-04-12", occurredAt: "2026-04-12T17:00:00", movementType: "adjustment", quantityIn: "1", quantityOut: "0", partyName: "", notes: null },
    ], "0", undefined, undefined, 2026);

    expect(rows.slice(1).map(row => row[2])).toEqual(["تسليم-صباحاً", "تسوية-مساءً"]);
    expect(rows.slice(1).map(row => row[6])).toEqual([-2, -1]);
  });

  it("يعرض رقم المجلد مع رقم المذكرة للاستلام والتركيب والتنسيق", () => {
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
    ], 0, undefined, undefined, 2026);
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
    ], 0, undefined, undefined, 2026);

    expect(receipt[1]?.[2]).toBe("12 / SER-1");
    expect(transfer[1]?.[2]).toBe("13 / SER-2");
  });

  it("يعرض رقم المجلد مع رقم المذكرة للتسليم والإدخال", () => {
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
    ], 0, undefined, undefined, 2026);
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
    ], 0, undefined, undefined, 2026);

    expect(delivery[1]?.[2]).toBe("14 / SER-3");
    expect(entry[1]?.[2]).toBe("15 / SER-4");
  });

  it("يستخدم رقم المذكرة الأصلي المستورد بعد رقم المجلد", () => {
    const rows = buildMaterialCardRows([
      {
        memoNumber: "internal-123",
        sourceMemoNumber: "LEGACY-77",
        folderNumber: "16",
        memoDate: "2026-05-05",
        occurredAt: "2026-05-05",
        movementType: "inbound",
        quantityIn: "1",
        quantityOut: "0",
        partyName: "مورد",
        notes: null,
      },
    ], 0, undefined, undefined, 2026);

    expect(rows[1]?.[2]).toBe("16 / LEGACY-77");
  });
});

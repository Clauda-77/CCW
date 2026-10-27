import { describe, expect, it } from "vitest";
import {
  groupMaterialsByCode,
  mergeInventoryRowsByMaterialCode,
  normalizeMaterialIdentityCode,
} from "./materialIdentity";

describe("هوية المواد المكررة", () => {
  it("يوحد الرمز بعد إزالة بادئة legacy مع تجاهل اختلاف حالة الأحرف والمسافات", () => {
    expect(normalizeMaterialIdentityCode(" LEGACY_ P-12 ")).toBe("p-12");
    expect(
      groupMaterialsByCode([
        { id: 8, code: "legacy-P-12", isActive: true },
        { id: 12, code: "p-12", isActive: true },
      ])
    ).toHaveLength(1);
  });

  it("يحتفظ بمواد مختلفة الرمز ويختار السجل النشط ذي الرمز الأصلي عند التكرار", () => {
    const groups = groupMaterialsByCode([
      { id: 3, code: "legacy-200", isActive: false, name: "سجل قديم" },
      { id: 7, code: "200", isActive: true, name: "السجل المعتمد" },
      { id: 9, code: "201", isActive: true, name: "مادة مختلفة" },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.canonical).toMatchObject({
      id: 7,
      name: "السجل المعتمد",
    });
    expect(groups[1]?.canonical).toMatchObject({ id: 9, code: "201" });
  });

  it("يدمج صفوف الجرد المتكررة بجمع الرصيد والحركات ولا يسقط معرفات المادة الأصلية", () => {
    const rows = mergeInventoryRowsByMaterialCode([
      {
        id: 4,
        materialId: 20,
        code: "legacy-300",
        name: "قلم",
        unit: "عدد",
        minimumStock: "4",
        openingQuantity: "10",
        onHandQuantity: "8",
        inboundQuantity: "3",
        receiptQuantity: "2",
        returnQuantity: "1",
        outboundQuantity: "5",
        warehouseName: "المستودع الأول",
        warehouseId: 1,
        partyId: null,
      },
      {
        id: 9,
        materialId: 21,
        code: "300",
        name: "قلم مكرر",
        unit: "عدد",
        minimumStock: "6",
        openingQuantity: "7",
        onHandQuantity: "5",
        inboundQuantity: "2",
        receiptQuantity: "2",
        returnQuantity: "0",
        outboundQuantity: "4",
        warehouseName: "المستودع الثاني",
        warehouseId: 2,
        partyId: null,
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      materialId: 21,
      code: "300",
      materialIds: [20, 21],
      minimumStock: "6",
      openingQuantity: "17",
      onHandQuantity: "13",
      inboundQuantity: "5",
      receiptQuantity: "4",
      returnQuantity: "1",
      outboundQuantity: "9",
      warehouseName: "متعدد الجهات / المستودعات",
    });
  });
});

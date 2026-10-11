import { describe, expect, it } from "vitest";
import { filterMaterials } from "./materialSearch";

describe("البحث في مواد المذكرة", () => {
  const materials = [
    { id: 1, code: "1413", name: "مسطر أدراج", barcode: "6333" },
    { id: 2, code: "1412", name: "ملفات بلاستيكية", barcode: "3141" },
    { id: 3, code: "2583", name: "قلم رصاص", barcode: null },
  ];

  it("يبحث بالرقم المالي الموجود في حقل الباركود التاريخي", () => {
    expect(filterMaterials(materials, { financialNumber: "6333" }).map(item => item.id)).toEqual([1]);
  });

  it("يبحث بالرقم المتسلسل الموجود في رمز المادة", () => {
    expect(filterMaterials(materials, { serialNumber: "1412" }).map(item => item.id)).toEqual([2]);
  });

  it("يجمع الفلاتر مع البحث العام دون تعديل المواد", () => {
    expect(filterMaterials(materials, { general: "ملفات", financialNumber: "3141", serialNumber: "1412" })).toEqual([materials[1]]);
    expect(materials).toHaveLength(3);
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dbSource = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
const routerSource = readFileSync(
  new URL("./routers.ts", import.meta.url),
  "utf8"
);

describe("عقد عرض المواد غير المكررة", () => {
  it("يجمع تعريفات المواد المتكررة قبل حساب العدد وتقسيم صفحات دليل المواد", () => {
    expect(dbSource).toContain(
      "const materialGroups = groupMaterialsByCode(materialRows).filter("
    );
    expect(dbSource).toContain("const total = materialGroups.length;");
    expect(dbSource).toContain("const pageGroups = materialGroups.slice(");
    expect(dbSource).toContain("currentQuantities.get(material.id)");
  });

  it("يجمع أرصدة وحركات سجلات الرمز الموحد بعد حساب نتائج المواد الفردية", () => {
    expect(dbSource).toContain(
      "return mergeInventoryRowsByMaterialCode(inventoryRows).filter("
    );
    expect(dbSource).toContain("materialIds: [material.id]");
  });

  it("يمرر معرفات سجلات المادة المدمجة إلى قراءة بطاقة المادة الحية والمعاينة", () => {
    expect(dbSource).toContain("materialIds?: number[];");
    expect(dbSource).toContain(
      "new Set([input.materialId, ...(input.materialIds ?? [])])"
    );
    expect(
      routerSource.match(
        /materialIds: z\.array\(z\.number\(\)\.int\(\)\.positive\(\)\)/g
      )
    ).toHaveLength(2);
  });
});

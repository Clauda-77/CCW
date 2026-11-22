import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const inventorySource = readFileSync(new URL("./Inventory.tsx", import.meta.url), "utf8");
const dbSource = readFileSync(new URL("../../../server/db.ts", import.meta.url), "utf8");
const routerSource = readFileSync(new URL("../../../server/routers.ts", import.meta.url), "utf8");
const printSource = readFileSync(new URL("../lib/officialReportPrint.ts", import.meta.url), "utf8");

describe("بطاقة المادة من شاشة حركة المخزون", () => {
  it("يبني بطاقة المادة المختارة من حركاتها ورصيدها الافتتاحي", () => {
    expect(inventorySource).toContain("selectedBalance.materialId");
    expect(inventorySource).toContain("buildMaterialCardRows(card.movements, card.openingQuantity)");
    expect(inventorySource).toContain('type: "materialCard"');
    expect(inventorySource).toContain('title: isRangeReport ? "حركة مادة بين تاريخين" : "بطاقة المادة"');
    expect(printSource).toContain('if (type === "materialCard")');
  });

  it("يجلب رقم المجلد لكل حركة ويعرضه قبل رقم المذكرة", () => {
    const helperSource = readFileSync(new URL("../lib/materialCard.ts", import.meta.url), "utf8");
    expect(dbSource).toContain("folderNumber: memos.folderNumber,");
    expect(helperSource).toContain("`${folderNumber} / ${memoNumber}`");
  });

  it("يعرض أول سطر باسم مدور مع تاريخ نهاية السنة السابقة ورصيدها", () => {
    const helperSource = readFileSync(new URL("../lib/materialCard.ts", import.meta.url), "utf8");
    expect(helperSource).toContain('"مدور"');
    expect(helperSource).toContain("31/12/${currentYear - 1}");
    expect(helperSource).toContain("rolloverBalance");
    expect(helperSource).toContain("firstDayOfCurrentYear");
  });

  it("يقصر بيانات البطاقة على المستودعات المسندة للمستخدم في الخادم", () => {
    expect(routerSource).toContain("const allowedWarehouseIds = await getAccessibleWarehouseIds(ctx.user)");
    expect(routerSource).toContain("warehouseIds: allowedWarehouseIds ?? undefined");
    expect(dbSource).toContain("warehouseIds?: number[];");
    expect(dbSource).toContain("inArray(inventoryBalances.warehouseId, input.warehouseIds)");
    expect(dbSource).toContain("inArray(stockMovements.warehouseId, input.warehouseIds)");
  });

  it("يحتسب الرصيد الافتتاحي من أرصدة المستودعات الداخلة في النطاق فقط", () => {
    expect(dbSource).toContain("balanceWarehouseFilters");
    expect(dbSource).toContain("movementWarehouseFilters");
    expect(dbSource).toContain("openingQuantity: String(");
    expect(dbSource).toContain("balances.reduce(");
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  new URL("./Statistics.tsx", import.meta.url),
  "utf8"
);
const dbSource = readFileSync(
  new URL("../../../server/db.ts", import.meta.url),
  "utf8"
);
const routerSource = readFileSync(
  new URL("../../../server/routers.ts", import.meta.url),
  "utf8"
);

describe("إحصائية رصيد مادة في مستودع محدد", () => {
  it("تتيح اختيار المادة والمستودع وتعرض الكمية ووحدتها", () => {
    [
      "رصيد مادة في مستودع محدد",
      "اختر المادة",
      "اختر المستودع",
      "materialWarehouseBalance.useQuery",
      "previewMaterialWarehouseBalance.useQuery",
      "stockBalanceQuery.data.quantity",
      "stockBalanceQuery.data.unit",
    ].forEach(label => expect(pageSource).toContain(label));
  });

  it("يجمع رصيد المادة للمستودع المختار ويشترط صلاحية الوصول للمستودع", () => {
    expect(dbSource).toContain("getMaterialWarehouseBalance");
    expect(dbSource).toContain("sum(${inventoryBalances.onHandQuantity})");
    expect(dbSource).toContain(
      "eq(inventoryBalances.materialId, input.materialId)"
    );
    expect(dbSource).toContain(
      "eq(inventoryBalances.warehouseId, input.warehouseId)"
    );
    expect(routerSource).toContain(
      "await assertWarehouseAccess(ctx.user, input.warehouseId)"
    );
  });

  it("تحسب تكلفة الكمية من آخر سعر شراء معتمد للمادة في المستودع", () => {
    [
      "حاسبة تكلفة كمية من المادة",
      "الكمية المطلوبة للشراء",
      "stockCostQuery.data?.unitPrice",
      "estimatedPurchaseCost",
      "materialWarehouseCostEstimate.useQuery",
      "previewMaterialWarehouseCostEstimate.useQuery",
    ].forEach(label => expect(pageSource).toContain(label));
    expect(dbSource).toContain("getMaterialWarehouseCostEstimate");
    expect(dbSource).toContain('eq(memos.status, "approved")');
    expect(dbSource).toContain('eq(memos.type, "inbound")');
    expect(dbSource).toContain("NOT LIKE '%إدخال مواد قديمة%'");
    expect(routerSource).toContain(
      "await assertWarehouseAccess(ctx.user, input.warehouseId)"
    );
    expect(routerSource).toContain("warehouseDb.getMaterialWarehouseCostEstimate(input)");
  });
});

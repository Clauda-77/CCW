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
});

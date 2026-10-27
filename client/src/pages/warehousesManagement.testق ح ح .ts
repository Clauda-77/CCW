import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(new URL("./Warehouses.tsx", import.meta.url), "utf8");
const routerSource = readFileSync(new URL("../../../server/routers.ts", import.meta.url), "utf8");

describe("عقد إدارة المستودعات والجهات", () => {
  it("يوفر بحثًا وإضافة وتعديلًا لكل من المستودعات والجهات", () => {
    ["دليل المستودعات", "دليل الجهات", "ابحث بالرمز أو الاسم", "ابحث بالاسم أو الرقم التاريخي أو الهاتف", "تعديل مستودع", "تعديل جهة", "entities.updateWarehouse.useMutation", "entities.updateParty.useMutation"].forEach(label => expect(pageSource).toContain(label));
    ["listWarehouses", "listParties", "previewListWarehouses", "previewListParties"].forEach(label => expect(routerSource).toContain(label));
  });

  it("يوفر حذفًا نهائيًا مشروطًا للمستودع ويبقي تعطيل الجهة آمنًا", () => {
    ["entities.deleteWarehouse.useMutation", "entities.deactivateParty.useMutation", "تم حذف المستودع نهائيًا", "تم تعطيل الجهة من دون حذف سجلاتها", "مرتبطًا بمذكرة أو رصيد أو حركة مخزون"].forEach(label => expect(pageSource).toContain(label));
    expect(routerSource).toContain("deleteWarehouse: administratorProcedure");
    expect(routerSource).toContain("deactivateParty: administratorProcedure");
  });
});

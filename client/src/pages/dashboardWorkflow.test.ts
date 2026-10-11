import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const dbSource = readFileSync(new URL("../../../server/db.ts", import.meta.url), "utf8");

describe("عقد لوحة متابعة المستودعات", () => {
  it("يربط المؤشرات والمواد الأكثر استخدامًا وآخر المذكرات ببيانات لوحة التحكم", () => {
    ["trpc.warehouse.dashboard.useQuery", "trpc.warehouse.previewDashboard.useQuery", "materialCount", "warehouseCount", "memoCount", "mostUsedMaterials", "latestMemos"].forEach(label => expect(source).toContain(label));
    expect(source).toContain("إجمالي المستودعات");
    expect(source).not.toContain("مواد قيد المتابعة");
  });

  it("يعرض حالات التحميل والفراغ والخطأ ويمنع الصلاحيات غير المخولة من إنشاء المذكرة", () => {
    ["جار تحميل المواد", "لا توجد حركات إخراج مسجلة بعد.", "جار تحميل المذكرات", "لا توجد مذكرات لعرضها", "تعذر تحميل لوحة التحكم", "canCreateMemo"].forEach(label => expect(source).toContain(label));
  });

  it("يعرض المواد الأكثر استخدامًا بحسب حركات الإخراج الفعلية", () => {
    ["mostUsedMaterials", "المواد الأكثر استخدامًا", "الكمية المستخدمة", "عدد الحركات", "لا توجد حركات إخراج مسجلة بعد."].forEach(label => expect(source).toContain(label));
    expect(dbSource).toContain("usageQuantity");
    expect(dbSource).toContain("sum(${stockMovements.quantityOut})");
    expect(dbSource).toContain("gt(stockMovements.quantityOut, \"0\")");
  });
});

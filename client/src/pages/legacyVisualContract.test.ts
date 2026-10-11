import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const inventorySource = readFileSync(new URL("./Inventory.tsx", import.meta.url), "utf8");
const layoutSource = readFileSync(new URL("../components/DashboardLayout.tsx", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../index.css", import.meta.url), "utf8");

describe("عقد التحقق البصري للقوائم واختيار المادة", () => {
  it("يعرض تبويبات قديمة الطابع مع حالة نشطة ولوحة قائمة منفصلة", () => {
    expect(styleSource).toContain(".legacy-menu-tabs");
    expect(styleSource).toContain(".legacy-menu-tab[data-active=\"true\"]");
    expect(styleSource).toContain(".legacy-menu-panel");
    expect(layoutSource).toContain("legacy-menu-tabs");
    expect(layoutSource).toContain("legacy-menu-panel");
  });

  it("يحافظ على القوائم التشغيلية الأساسية كما في تنظيم الواجهة القديمة", () => {
    ["ملف", "المذكرات", "المستودع", "أدوات"].forEach(label => expect(layoutSource).toContain(`label: \"${label}\"`));
    ["مذكرة الاستلام", "مذكرة الإدخال", "مذكرة التسليم", "إدخال وتعديل بطاقة المادة", "حركة المواد بالمستودعات", "إدخال أسماء الموردين والجهات"].forEach(label => expect(layoutSource).toContain(`label: \"${label}\"`));
  });

  it("يقدم صفوفًا قابلة للتحديد مع مؤشر مرئي ويربط البطاقة بالسجل المختار", () => {
    expect(styleSource).toContain(".inventory-selectable-row.is-selected");
    expect(inventorySource).toContain("inventory-selectable-row");
    expect(inventorySource).toContain("aria-selected={row.id === selectedBalanceId}");
    expect(inventorySource).toContain("onClick={() => setSelectedBalanceId(row.id)}");
    expect(inventorySource).toContain("materialId: selectedBalance.materialId");
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const inventorySource = readFileSync(new URL("./Inventory.tsx", import.meta.url), "utf8");
const memoDetailsSource = readFileSync(new URL("./MemoDetails.tsx", import.meta.url), "utf8");
const layoutSource = readFileSync(new URL("../components/DashboardLayout.tsx", import.meta.url), "utf8");

describe("مسارات الطباعة الرسمية في الواجهة", () => {
  it("يوجه أزرار حركة المخزون إلى مولد الطباعة الرسمي بدل القالب السابق", () => {
    expect(inventorySource).toContain('from "@/lib/officialReportPrint"');
    expect(inventorySource).toContain("printOfficialReport({ title, dateRange: period, rows: officialRows, type })");
    expect(inventorySource).not.toContain("openInventoryPrint");
  });

  it("يغطي أزرار بطاقة المادة والتقارير الشهرية والجرد بالقالب الرسمي", () => {
    ["card", "inbound", "outbound", "inventory", "movementAll", "movement"].forEach(mode => {
      expect(inventorySource).toContain(`printReport("${mode}")`);
    });
    expect(inventorySource).toContain('type: "materialCard"');
    expect(inventorySource).toContain("renderOfficialReport(cardWindow");
    expect(inventorySource).toContain('const type: OfficialReportType = mode === "inbound" ? "inboundJournal" : mode === "outbound" ? "outboundJournal" : mode === "inventory" ? "inventory" : "monthlyMovement";');
    expect(inventorySource).toContain('onClick={() => printReport("inventory")}');
    expect(inventorySource).toContain("تقرير الجرد");
  });

  it("يوجه زر معاينة المذكرة إلى قالب المذكرة الرسمي قبل إرسال أمر الطباعة", () => {
    expect(memoDetailsSource).toContain('from "@/lib/memoPrint"');
    expect(memoDetailsSource.match(/printMemo\(memo\)/g)).toHaveLength(1);
    expect(memoDetailsSource).toContain("معاينة قبل الطباعة");
    expect(memoDetailsSource).not.toContain("onClick={() => window.print()}");
  });

  it("يربط زر المعاينة بمولد المذكرة الرسمي الواحد", () => {
    expect(memoDetailsSource).toContain('<Button onClick={() => printMemo(memo)} className="bg-[#0071ba] hover:bg-[#00558d]">');
  });

  it("يحدد المادة بالنقر على صفها ثم يطبع بطاقتها من السجل المحدد", () => {
    expect(inventorySource).toContain("useState<number | null>(null)");
    expect(inventorySource).toContain("onClick={() => setSelectedBalanceId(row.id)}");
    expect(inventorySource).toContain("if (!selectedBalance) { toast.info");
    expect(inventorySource).toContain("materialId: selectedBalance.materialId");
    expect(inventorySource).toContain("setCardTarget({ materialId: selectedBalance.materialId })");
  });

  it("ينظم الشريط العلوي كتَبويبات تشغيلية مع قوائم قديمة الطابع", () => {
    ["ملف", "المذكرات", "المستودع", "أدوات"].forEach(label => expect(layoutSource).toContain(`label: "${label}"`));
    ["مذكرة الاستلام", "مذكرة الإدخال", "مذكرة التسليم", "إدخال وتعديل بطاقة المادة", "حركة المواد بالمستودعات", "إدخال أسماء الموردين والجهات"].forEach(label => expect(layoutSource).toContain(`label: "${label}"`));
    expect(layoutSource).toContain("legacy-menu-tab");
    expect(layoutSource).toContain("legacy-menu-panel");
  });
});

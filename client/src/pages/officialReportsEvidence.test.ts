import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildOfficialReportHtml } from "@/lib/officialReportPrint";
import { officialReportEvidenceFixtures } from "./OfficialReportsEvidence";

const reportsSource = readFileSync(new URL("./Reports.tsx", import.meta.url), "utf8");
const officialFormsIndex = readFileSync(new URL("../../../docs/official-forms-index.md", import.meta.url), "utf8");

describe("دليل مراجعة النماذج الرسمية وواجهة التقارير", () => {
  it("يحمل صف الجرد المرجعي خمس عشرة خانة ويحافظ على حقول الجرد الفعلي والاعتمادات فارغة", () => {
    const inventory = officialReportEvidenceFixtures.find(report => report.type === "inventory");
    expect(inventory?.rows[0]).toHaveLength(15);
    expect(inventory?.rows[0]?.slice(8)).toEqual(["", "", "", "", "", "", ""]);
    const html = buildOfficialReportHtml(inventory!);
    ["سعر", "رأي أمين المستودع", "رأي رئيس المستودع", "ملاحظات"].forEach(label => expect(html).toContain(label));
  });

  it("يوثق النماذج الرسمية الخمسة ويعرض اليوميات ضمن واجهة تبويبات وفلاتر وأزرار واضحة", () => {
    expect(officialReportEvidenceFixtures.map(report => report.type)).toEqual(["inboundJournal", "outboundJournal", "materialCard", "inventory", "monthlyMovement"]);
    ["يومية الإدخالات", "يومية الإخراجات", "جدول الجرد", "حركة المواد", "تصدير Excel", "معاينة رسمية", "طباعة التقرير", "report-grid", "مذكرة الاستلام", "مذكرة التسليم أو الإخراج", "الفروق الجردية", "الأسباب والمبررات", "rowSpan={3}"].forEach(label => expect(reportsSource).toContain(label));
  });

  it("يفهرس كل نموذج مدعوم بمرجع واختبار ودليل معاينة قابل للمراجعة", () => {
    ["يومية الإدخالات", "يومية الإخراجات", "بطاقة مواد", "جدول الجرد", "جدول حركة المواد", "الادخالات.png", "الاخراجات.png", "بطاقةالمواد.png", "الجرد1.png", "الجرد2.png", "طباعةشهرية1.png", "طباعةشهرية2.png", "officialReportLayout.contract.test.ts", "OfficialReportsEvidence.tsx"].forEach(label => expect(officialFormsIndex).toContain(label));
  });
});

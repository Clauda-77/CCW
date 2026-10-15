import { describe, expect, it, vi } from "vitest";
import { renderOfficialReport, type OfficialReport, type OfficialReportType } from "./officialReportPrint";

function htmlFor(type: OfficialReportType, rows: OfficialReport["rows"], material?: OfficialReport["material"]) {
  const write = vi.fn();
  renderOfficialReport({ document: { open: vi.fn(), write, close: vi.fn() }, focus: vi.fn() } as unknown as Window, {
    type,
    title: "تقرير",
    dateRange: "بين التاريخين 2026/1/1 و 2026/8/16",
    rows,
    material,
  });
  return String(write.mock.calls[0]?.[0] ?? "");
}

describe("عقد طباعة النماذج الرسمية غير التابعة للمذكرات", () => {
  it("يطابق رأسي يوميتي الإدخالات والإخراجات متعددَي المستويات", () => {
    const inbound = htmlFor("inboundJournal", [[1, "1", "2026/1/15", "1342", "سراقة", "", "عدد", 2, ""]]);
    const outbound = htmlFor("outboundJournal", [[1, "1/", "2026/1/12", "1122", "حبر", "", "عبوة", 1, "مركز الحاسب", ""]]);
    ["يومية الإدخالات", "نموذج مستودع رقم 14", "مذكرة الاستلام", "رقم<br>المادة", "المواصفات العينية"].forEach(label => expect(inbound).toContain(label));
    ["يومية الإخراجات", "نموذج مستودع رقم 13", "مذكرة التسليم أو الإخراج", "الجهة<br>المستلمة", "نوع المادة"].forEach(label => expect(outbound).toContain(label));
  });

  it("يضع معرفات جدول الجرد يسارًا والتاريخ تحت العنوان المركزي", () => {
    const write = vi.fn();
    renderOfficialReport({ document: { open: vi.fn(), write, close: vi.fn() }, focus: vi.fn() } as unknown as Window, {
      type: "inventory",
      title: "تقرير",
      dateRange: "من 2026/1/1 إلى 2026/8/16",
      rows: [[1, "1122", "ظرف أسمر وسط", "", "عدد", "", "عدد", "20", "عدد", "20", "", "", "", "", ""]],
    });
    const inventory = String(write.mock.calls[0]?.[0] ?? "");
    expect(inventory).toContain("نموذج مستودع رقم 18<br>رقم المجلد<br>الرقم المتسلسل");
    expect(inventory).toContain(".inventory-identifiers{padding-top:8mm;direction:rtl;text-align:right;justify-self:end;white-space:nowrap;transform:translateX(12mm)}");
    expect(inventory).toContain(".inventory-header .title p{margin-top:5mm;text-align:center}");
    expect(inventory).toMatch(/<h1>جدول جرد<\/h1><p>بتاريخ [^<]+<\/p>/);
    expect(inventory).toContain("بتاريخ 2026/8/16");
    expect(inventory).toContain("جدول الجرد");
    expect(inventory).toContain("أمين المستودع");
    expect(inventory).toContain("أعضاء لجنة الجرد");
    expect(inventory).toContain("رئيس اللجنة");
    expect(inventory).not.toContain("................");
    expect(inventory).not.toContain("............");
    expect(inventory).not.toMatch(/<td>0<\/td>/);
  });

  it("يبقي صفوف الجرد حتى عندما تكون الكميات صفرًا لإتاحة تعبئة الجرد اليدوية", () => {
    const inventory = htmlFor("inventory", [
      [1, "000", "مادة بلا رصيد", "", "عدد", "", "عدد", "0", "عدد", "0", "0", "0", "", "", ""],
      [2, "1122", "مادة لها رصيد", "", "عدد", "", "عدد", "20", "عدد", "20", "", "", "", "", ""],
    ]);
    expect(inventory).toContain("مادة بلا رصيد");
    expect(inventory).toContain("مادة لها رصيد");
  });

  it("يطابق بطاقة المادة من الرأس إلى جدول المستند والحركة", () => {
    const card = htmlFor("materialCard", [[1, "إدخال", "2/21", "2026/7/27", 50, "", 50, "2026/7/27", "المستودع المركزي", ""]], { code: "1122", name: "ظرف أسمر وسط", unit: "عدد", notes: "" });
    ["بطاقة مواد رقم", "نموذج مستودع رقم ( 15 )", "اسم المادة : ظرف أسمر وسط", "المستند", "الحركة", "الجهة المسلمة أو"].forEach(label => expect(card).toContain(label));
    expect(card).toContain('class="material-code"');
    expect(card).toContain("رمزها : 1122");
    expect(card).toContain('class="card-header"');
    expect(card).toContain('class="government"');
    expect(card).toContain(".card-meta{direction:rtl;white-space:nowrap;padding-top:0;text-align:right;justify-self:end;transform:translateX(10mm);line-height:1.5}");
    expect(card).toContain(".card-meta .material-name,.card-meta .material-code{display:block;font-weight:400}");
    expect(card).toContain(".card-header{display:grid;grid-template-columns:1fr 1.25fr 1fr;align-items:start;min-height:35mm;margin-bottom:2mm}");
    expect(card).toContain(".card-title p{margin-top:6mm;font-size:20px;text-align:right}");
    expect(card).toContain(".government{font-size:23px;line-height:1.42;font-weight:700;text-align:center}");
    expect(card).toContain(".government span{display:block;font-size:18px;text-align:center}");
    expect(card).toContain('id="download-pdf"');
    expect(card).toContain("document.getElementById(\"download-pdf\")");
    expect(card).toContain("<strong></strong>");
  });

  it("يستخدم تصنيف الاستلام والإدخال التاريخي داخل نموذج 17 ويترك غير المصنف فارغًا", () => {
    const movement = htmlFor("monthlyMovement", [[1, "1111", "مادة", "", 5, 2, "", 1, 6, ""]]);
    ["الاستلام", "الإدخال", "الإخراجات", "الرصيد"].forEach(label => expect(movement).toContain(label));
    expect(movement).not.toContain("استلام شهر");
    expect(movement.match(/<col style=/g)).toHaveLength(10);
  });

  it("يطابق رؤوس الجرد وحركة المادة والتذييل المرجعي", () => {
    const inventory = htmlFor("inventory", [[1, "1111", "مادة", "", "عدد", "", "عدد", 1, "", "", "", "", "", "", ""]]);
    const movement = htmlFor("monthlyMovement", [[1, "1111", "مادة", "", 5, 0, 0, 0, 5, ""]]);
    ["جدول الجرد", "سعر", "الفروق الجردية", "الأسباب والمبررات", "رأي أمين المستودع", "رأي رئيس المستودع", "ملاحظات"].forEach(label => expect(inventory).toContain(label));
    expect(inventory.match(/<col style=/g)).toHaveLength(15);
    expect(inventory).toContain("@page{size:297mm 210mm;margin:7mm}");
    expect(inventory).toContain(".inventory-signatures{display:grid;grid-template-columns:1fr 1.7fr 1.3fr .8fr .8fr;gap:8px;");
    expect(inventory).toContain("thead{display:table-header-group}");
    expect(inventory).toContain("page-break-inside:avoid");
    ["جدول حركة المواد", "رصيد أول الشهر", "الاستلام", "الإدخال", "الإخراجات", "أمين المستودع", "Page No"].forEach(label => expect(movement).toContain(label));
  });

  it("يعرض معاينة أولاً ولا يطبع إلا بعد اختيار المستخدم", () => {
    const html = htmlFor("inboundJournal", []);
    expect(html).toContain("معاينة قبل الطباعة");
    expect(html).toContain('id="print-now"');
    expect(html).toContain("إرسال إلى الطابعة");
    expect(html).not.toContain("setTimeout(()=>window.print()");
    expect(html).not.toContain("window.onload=()=>window.print()");
  });
});

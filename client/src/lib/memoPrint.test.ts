// import { describe, expect, it, vi } from "vitest";
// import { printMemo } from "./memoPrint";

// describe("معاينة وطباعة مذكرة الإدخال الرسمية", () => {
//   it("تبني معاينة قبل الطباعة تطابق الرأس والجدول والتذييل والتوقيعات المرجعية", () => {
//     const write = vi.fn();
//     const page = { document: { open: vi.fn(), write, close: vi.fn() }, focus: vi.fn() } as unknown as Window;
//     vi.stubGlobal("window", { open: vi.fn(() => page) });
//     const printed = printMemo({ type: "inbound", memoNumber: "22", memoDate: "2026-07-27", warehouseName: "المستودع المركزي", partyName: "المستودع المركزي", folderNumber: "2", orderNumber: "10/37", orderDate: "2026-07-20", referenceNumber: "", items: [{ code: "legacy-1411", name: "معطر أرضيات", description: "", unit: "عبوة", quantity: "1.000", unitPrice: null }, { code: "legacy-1412", name: "مادة ثانية", description: "", unit: "عبوة", quantity: "1.5", unitPrice: null }] });
//     const html = String(write.mock.calls.at(-1)?.[0] ?? "");
//     expect(printed).toBe(true);
//     expect(html).toContain(">1</td>");
//     expect(html).toContain(">1.5</td>");
//     expect(html).not.toContain("1.000");
//     ["معاينة قبل الطباعة", "إرسال إلى الطابعة", "الجمهورية العربية السورية", "وزارة المالية", "government-lines", "مذكرة استلام", "مركز الحاسب", "نموذج مستودع رقم ( ٦ )", "رقم المجلد", "رقم التسلسل", "إن المواد المذكورة أدناه", "وبموجب رقم الطلب", "قيمة مجموعها", "فقد جرى استلامها", "وتم تسجيلها في بطاقات المستودع أصولاً", "أمين المستودع", "الوظيفة :", "memo-first-page", "padding:16mm 13mm 14mm 24mm", "padding-left:10mm", "text-align:center"].forEach(text => expect(html).toContain(text));
//     expect(html).not.toContain("نوع العملية:");
//     expect(html.match(/class="memo-sheet/g)).toHaveLength(1);
//     expect(html.indexOf("قيمة مجموعها")).toBeGreaterThan(html.indexOf("official-table"));
//     ["الرقم<br/>المتسلسل", "رمزها", "اسمها", "أوصافها", "وحدتها", "الكمية المستلمة", "رقم بطاقة<br/>المواد", "ملاحظات"].forEach(header => expect(html).toContain(header));
//     expect(html.match(/<col style=/g)).toHaveLength(10);
//     expect(html).toContain("السعر الإفرادي");
//     expect(html).toContain("الإجمالي");
//     expect(html).not.toContain("window.onload");
//     expect(html).not.toContain(">—<");
//     expect(html).toContain(">1411<");
//     expect(html).not.toContain("legacy-1411");
//     expect(html).toContain("رقم بطاقة<br/>المواد");
//     vi.unstubAllGlobals();
//   });

//   it("يفصل البنود بعد كل 11 بندًا ويضع البند 12 في الصفحة التالية", () => {
//     const write = vi.fn();
//     const page = { document: { open: vi.fn(), write, close: vi.fn() }, focus: vi.fn() } as unknown as Window;
//     vi.stubGlobal("window", { open: vi.fn(() => page) });
//     const items = Array.from({ length: 12 }, (_, index) => ({ code: String(index + 1), name: "مادة " + (index + 1), description: "", unit: "عدد", quantity: "1", unitPrice: null }));
//     printMemo({ type: "inbound", memoNumber: "25", memoDate: "2026-07-29", warehouseName: "المستودع المركزي", items });
//     const html = String(write.mock.calls.at(-1)?.[0] ?? "");
//     expect(html).toContain("tbody tr:nth-child(11n):not(:last-child)");
//     expect(html.match(/<tr><td>/g)).toHaveLength(12);
//     vi.unstubAllGlobals();
//   });

//   it("يطبع نوع تركيب وتنسيق منفصلًا عن مذكرة التسليم", () => {
//     const write = vi.fn();
//     const page = { document: { open: vi.fn(), write, close: vi.fn() }, focus: vi.fn() } as unknown as Window;
//     vi.stubGlobal("window", { open: vi.fn(() => page) });
//     printMemo({ type: "outbound", memoNumber: "24", memoDate: "2026-07-28", warehouseName: "المستودع المركزي", notes: "تركيب وتنسيق", items: [] });
//     const html = String(write.mock.calls.at(-1)?.[0] ?? "");
//     expect(html).toContain("محضر تركيب وتنسيق");
//     expect(html).not.toContain("نوع العملية:");
//     vi.unstubAllGlobals();
//   });

//   it("يميز في الطباعة بين استلام المواد الجديدة وإدخال المواد القديمة المُرجعة", () => {
//     const write = vi.fn();
//     const page = { document: { open: vi.fn(), write, close: vi.fn() }, focus: vi.fn() } as unknown as Window;
//     vi.stubGlobal("window", { open: vi.fn(() => page) });
//     printMemo({ type: "inbound", memoNumber: "23", memoDate: "2026-07-27", warehouseName: "المستودع المركزي", notes: "إدخال مواد قديمة (إرجاع)", items: [] });
//     const html = String(write.mock.calls.at(-1)?.[0] ?? "");
//     expect(html).toContain("مذكرة إدخال");
//     expect(html).not.toContain("نوع العملية:");
//     vi.unstubAllGlobals();
//   });
// });
import { describe, expect, it, vi } from "vitest";
import { printMemo } from "./memoPrint";

describe("معاينة وطباعة مذكرة الإدخال الرسمية", () => {
  it("تبني معاينة قبل الطباعة تطابق الرأس والجدول والتذييل والتوقيعات المرجعية", () => {
    const write = vi.fn();
    const page = { document: { open: vi.fn(), write, close: vi.fn() }, focus: vi.fn() } as unknown as Window;
    vi.stubGlobal("window", { open: vi.fn(() => page) });
    const printed = printMemo({ type: "inbound", memoNumber: "22", memoDate: "2026-07-27", warehouseName: "المستودع المركزي", partyName: "المستودع المركزي", folderNumber: "2", orderNumber: "10/37", orderDate: "2026-07-20", referenceNumber: "", items: [{ code: "legacy-1411", name: "معطر أرضيات", description: "", unit: "عبوة", quantity: "1.000", unitPrice: null }, { code: "legacy-1412", name: "مادة ثانية", description: "", unit: "عبوة", quantity: "1.5", unitPrice: null }] });
    const html = String(write.mock.calls.at(-1)?.[0] ?? "");
    expect(printed).toBe(true);
    expect(html).toContain(">1</td>");
    expect(html).toContain(">1.5</td>");
    expect(html).not.toContain("1.000");
    ["معاينة قبل الطباعة", "إرسال إلى الطابعة", "الجمهورية العربية السورية", "وزارة المالية", "government-lines", "مذكرة استلام", "مركز الحاسب", "نموذج مستودع رقم ( ٦ )", "رقم المجلد", "الرقم<br/>المتسلسل", "إن المواد المذكورة أدناه", "وبموجب رقم الطلب", "قيمة مجموعها", "فقد جرى استلامها", "وتم تسجيلها في بطاقات المستودع أصولاً", "أمين المستودع", "الوظيفة :", "memo-first-page", "padding:16mm 13mm 14mm 24mm", "padding-left:10mm", "text-align:center"].forEach(text => expect(html).toContain(text));
    expect(html).not.toContain("نوع العملية:");
    expect(html.match(/class="memo-sheet/g)).toHaveLength(1);
    expect(html.indexOf("قيمة مجموعها")).toBeGreaterThan(html.indexOf("official-table"));
    ["الرقم<br/>المتسلسل", "رمزها", "اسمها", "أوصافها", "وحدتها", "الكمية المستلمة", "رقم بطاقة<br/>المواد", "ملاحظات"].forEach(header => expect(html).toContain(header));
    expect(html.match(/<col style=/g)).toHaveLength(10);
    expect(html).toContain("السعر الإفرادي");
    expect(html).toContain("الإجمالي");
    expect(html).not.toContain("window.onload");
    expect(html).not.toContain(">—<");
    expect(html).toContain(">1411<");
    expect(html).not.toContain("legacy-1411");
    expect(html).toContain("رقم بطاقة<br/>المواد");
    vi.unstubAllGlobals();
  });

  it("يفصل البنود بعد كل 11 بندًا ويضع البند 12 في الصفحة التالية", () => {
    const write = vi.fn();
    const page = { document: { open: vi.fn(), write, close: vi.fn() }, focus: vi.fn() } as unknown as Window;
    vi.stubGlobal("window", { open: vi.fn(() => page) });
    const items = Array.from({ length: 12 }, (_, index) => ({ code: String(index + 1), name: "مادة " + (index + 1), description: "", unit: "عدد", quantity: "1", unitPrice: null }));
    printMemo({ type: "inbound", memoNumber: "25", memoDate: "2026-07-29", warehouseName: "المستودع المركزي", items });
    const html = String(write.mock.calls.at(-1)?.[0] ?? "");
    expect(html.match(/class="memo-sheet/g)).toHaveLength(2);
    expect(html.match(/class="official-table/g)).toHaveLength(2);
    expect(html.match(/<tr><td>/g)).toHaveLength(12);
    vi.unstubAllGlobals();
  });

  it("يطبع نوع تركيب وتنسيق منفصلًا عن مذكرة التسليم", () => {
    const write = vi.fn();
    const page = { document: { open: vi.fn(), write, close: vi.fn() }, focus: vi.fn() } as unknown as Window;
    vi.stubGlobal("window", { open: vi.fn(() => page) });
    printMemo({ type: "outbound", memoNumber: "24", memoDate: "2026-07-28", warehouseName: "المستودع المركزي", notes: "تركيب وتنسيق", items: [] });
    const html = String(write.mock.calls.at(-1)?.[0] ?? "");
    expect(html).toContain("محضر تركيب وتنسيق");
    expect(html).not.toContain("نوع العملية:");
    vi.unstubAllGlobals();
  });

  it("يطابق رأس محضر التركيب وعبارته المركزية ويحافظ على الجدول والتوقيعات", () => {
    const write = vi.fn();
    const page = { document: { open: vi.fn(), write, close: vi.fn() }, focus: vi.fn() } as unknown as Window;
    vi.stubGlobal("window", { open: vi.fn(() => page) });
    printMemo({ type: "outbound", classification: "transfer", memoNumber: "19305", memoDate: "2026-07-28", warehouseName: "المستودع المركزي", partyName: "جهة الاختبار", folderNumber: "12", orderNumber: "A-17", invoiceNumber: "INV-77", invoiceDate: "2026-07-20", items: [] });
    const html = String(write.mock.calls.at(-1)?.[0] ?? "");
    expect(html).toContain("نموذج مستودع رقم ( ٤ )");
    expect(html).toContain("رقم المجلد");
    expect(html).toContain("رقم المتسلسل");
    expect(html).toContain('class="memo-header" style="position:relative;min-height:26mm"');
    expect(html).toContain('style="position:absolute;left:0;top:0;width:48mm;text-align:right;direction:rtl"');
    expect(html).not.toContain("translateX(-");
    expect(html.match(/display:flex;align-items:baseline;gap:2ch;white-space:nowrap/g)).toHaveLength(2);
    expect(html).not.toContain("grid-template-columns:minmax(0,1fr) 14mm");
    expect(html).toContain("19305");
    expect(html).not.toContain("مركز الحاسب");
    expect(html).not.toContain("نموذج مستودع رقم ( ٦ )");
    expect(html).not.toContain("رقم المحضر");
    expect(html).not.toContain("التاريخ");
    expect(html).not.toContain("2026-07-28");
    expect(html).toContain('class="memo-intro transfer-intro" style="text-align:center;direction:rtl;white-space:pre-wrap"');
    const memoDate = new Date("2026-07-28").toLocaleDateString("ar-SY");
    const invoiceDate = new Date("2026-07-20").toLocaleDateString("ar-SY");
    expect(html).toContain(`بتاريخ ${memoDate} تم تركيب المواد المبينة فيما يلي والواردة بموجب الفاتورة رقم ( INV-77 ) تاريخ ${invoiceDate} من جهة الاختبار وركبت على المادة رقم             نوع        والعائدة           وسلمت القطع التبديلية المنسقة إلى أمين مستودع المواد التالفة كما يلي:`);
    ["المواد المركبة", "الرقم<br/>المتسلسل", "اسم المادة", "رمزها", "مواصفاتها", "الوحدة", "الكمية", "ملاحظات", "القيمة<br/>الإجمالية<br/>ل.س", "السعر<br/>الإفرادي<br/>ل.س", "المواد المنسقة", "القائم بالعمل", "المسؤول عن المادة التي تم إصلاحها أو صيانتها", "رئيس اللوازم", "أمين المستودع", "مصدق المدير المختص"].forEach(label => expect(html).toContain(label));
    expect(html.indexOf("السعر<br/>الإفرادي<br/>ل.س")).toBeLessThan(html.indexOf("القيمة<br/>الإجمالية<br/>ل.س"));
    expect(html).not.toContain("المرآب");
    expect(html).toContain('class="transfer-receipt" style="margin:0;text-align:center;font-weight:700;transform:translateX(4mm)"');
    expect(html).toContain('grid-template-columns:repeat(3,minmax(0,1fr))');
    expect(html).toContain('grid-template-columns:repeat(2,minmax(0,1fr))');
    const topRow = html.indexOf('class="transfer-signature-row transfer-top-row"');
    const receipt = html.indexOf('class="transfer-receipt"');
    const bottomRow = html.indexOf('class="transfer-signature-row transfer-bottom-row"');
    expect(topRow).toBeGreaterThan(-1);
    expect(receipt).toBeGreaterThan(topRow);
    expect(bottomRow).toBeGreaterThan(receipt);
    vi.unstubAllGlobals();
  });

  it("يميز في الطباعة بين استلام المواد الجديدة وإدخال المواد القديمة المُرجعة", () => {
    const write = vi.fn();
    const page = { document: { open: vi.fn(), write, close: vi.fn() }, focus: vi.fn() } as unknown as Window;
    vi.stubGlobal("window", { open: vi.fn(() => page) });
    printMemo({ type: "inbound", memoNumber: "23", memoDate: "2026-07-27", warehouseName: "المستودع المركزي", notes: "إدخال مواد قديمة (إرجاع)", items: [] });
    const html = String(write.mock.calls.at(-1)?.[0] ?? "");
    expect(html).toContain("مذكرة إدخال");
    expect(html).not.toContain("نوع العملية:");
    vi.unstubAllGlobals();
  });
});

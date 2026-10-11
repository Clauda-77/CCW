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
    ["معاينة قبل الطباعة", "إرسال إلى الطابعة", "الجمهورية العربية السورية", "وزارة المالية", "government-lines", "مذكرة استلام", "مركز الحاسب", "نموذج مستودع رقم ( ٦ )", "رقم المجلد", "رقم التسلسل", "إن المواد المذكورة أدناه", "وبموجب رقم الطلب", "قيمة مجموعها", "فقد جرى استلامها", "وتم تسجيلها في بطاقات المستودع أصولاً", "أمين المستودع", "الوظيفة :", "memo-first-page", "padding:16mm 13mm 14mm 24mm", "padding-left:10mm", "text-align:center"].forEach(text => expect(html).toContain(text));
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

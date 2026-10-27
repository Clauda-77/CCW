import { describe, expect, it, vi } from "vitest";
import { printMemo } from "./memoPrint";

describe("معاينة وطباعة المذكرات الرسمية", () => {
  it("تبني معاينة مذكرة الاستلام بالرأس والحقول والجدول والتذييل المطلوب", () => {
    const write = vi.fn();
    const page = { document: { open: vi.fn(), write, close: vi.fn() }, focus: vi.fn() } as unknown as Window;
    vi.stubGlobal("window", { open: vi.fn(() => page) });
    const printed = printMemo({
      type: "inbound",
      classification: "purchase",
      memoNumber: "22",
      memoDate: "2026-07-27",
      warehouseName: "المستودع المركزي",
      partyName: "مديرية التربية",
      folderNumber: "2",
      invoiceNumber: "INV-55",
      invoiceDate: "2026-07-20",
      items: [
        { code: "legacy-1411", name: "معطر أرضيات", description: "", unit: "عبوة", quantity: "1.000", unitPrice: "5" },
        { code: "legacy-1412", name: "مادة ثانية", description: "", unit: "عبوة", quantity: "1.5", unitPrice: null },
      ],
    });
    const html = String(write.mock.calls.at(-1)?.[0] ?? "");
    const memoDate = new Date("2026-07-27").toLocaleDateString("ar-SY");
    const invoiceDate = new Date("2026-07-20").toLocaleDateString("ar-SY");
    const metadata = html.slice(html.indexOf('<section class="memo-meta delivery-meta"'), html.indexOf("</section></header>"));
    expect(printed).toBe(true);
    expect(html).toContain("مذكرة استلام");
    expect(html).not.toContain("مركز الحاسب");
    expect(metadata).toContain("نموذج مستودع رقم ( ٣ )");
    expect(metadata).toContain('<span>رقم الجلد</span><span>2</span>');
    expect(metadata).not.toContain("الرقم المتسلسل");
    expect(metadata).not.toContain("التاريخ");
    expect(html).toContain(`إن المواد المذكورة أدناه وردت من&nbsp;&nbsp;مديرية التربية&nbsp;&nbsp;التاريخ&nbsp;&nbsp;${memoDate}`);
    expect(html).toContain(`بموجب الفاتورة رقم&nbsp;&nbsp;(INV-55)&nbsp;&nbsp;تاريخ&nbsp;&nbsp;${invoiceDate}`);
    expect(html).toContain(">1</td>");
    expect(html).toContain(">1.5</td>");
    expect(html).not.toContain("1.000");
    expect(html).toContain("رقم البطاقة");
    expect(html).toContain("السعر ل.س");
    expect(html).toContain("القيمة ل.س");
    expect(html).not.toContain("السعر الإفرادي");
    expect(html).not.toContain("رقم بطاقة<br/>المواد");
    expect(html).toContain("فقط كمية وقدرها ....................................................... وقيمتها مبلغ ....................................................");
    expect(html).toContain(`تم استلام المواد المبينة أعلاه وفقاً للمواصفات المحددة في ........................................ رقم&nbsp;&nbsp;(INV-55)&nbsp;&nbsp;تاريخ&nbsp;&nbsp;${invoiceDate}`);
    expect(html).toContain("ويجري استلامها في .................................... وتم تسجيلها في بطاقات المستودع المشار إليها");
    expect(html).toContain("أمين المستودع المستلم");
    expect(html).toContain('class="storekeeper" style="text-align:right;direction:rtl"><p>أمين المستودع المستلم');
    expect(html).toContain("المسلم");
    expect(html).toContain('class="recipient" style="text-align:right;direction:rtl"><p>المسلم</p>');
    expect(html).toContain('style="grid-template-columns:1fr 1fr;direction:ltr;gap:0;margin:8mm auto 0;width:64%"');
    expect(html.match(/class="memo-sheet/g)).toHaveLength(1);
    expect(html.match(/<col style=/g)).toHaveLength(10);
    expect(html.indexOf("فقط كمية وقدرها")).toBeGreaterThan(html.indexOf("official-table"));
    expect(html).toContain("الجمهورية العربية السورية");
    expect(html).toContain("وزارة المالية");
    expect(html).toContain("معاينة قبل الطباعة");
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

  it("يربط الجهة ورقم الطلب وتاريخه في رأس مذكرة التسليم", () => {
    const write = vi.fn();
    const page = { document: { open: vi.fn(), write, close: vi.fn() }, focus: vi.fn() } as unknown as Window;
    vi.stubGlobal("window", { open: vi.fn(() => page) });
    printMemo({
      type: "outbound",
      classification: "adjustment",
      memoNumber: "2025050827",
      memoDate: "2026-10-24",
      warehouseName: "المستودع المركزي",
      folderNumber: "2",
      partyName: "مديرية التربية",
      orderNumber: "ط-245",
      orderDate: "2026-10-22",
      items: [],
    });
    const html = String(write.mock.calls.at(-1)?.[0] ?? "");
    const requestDate = new Date("2026-10-22").toLocaleDateString("ar-SY");
    const memoDate = new Date("2026-10-24").toLocaleDateString("ar-SY");
    expect(html).toContain("مذكرة تسليم");
    expect(html).not.toContain("مركز الحاسب");
    expect(html).toContain('class="memo-header" style="position:relative;min-height:26mm"');
    expect(html).toContain('class="memo-meta delivery-meta" style="position:absolute;left:0;top:0;width:48mm;text-align:right;direction:rtl"');
    expect(html).toContain("<p>نموذج مستودع رقم ( ٦ )</p>");
    expect(html).toContain('<p style="display:flex;align-items:baseline;gap:2ch;white-space:nowrap"><span>رقم المجلد</span><span>2</span></p>');
    expect(html).toContain('<p style="display:flex;align-items:baseline;gap:2ch;white-space:nowrap"><span>الرقم المتسلسل</span><span>2025050827</span></p>');
    expect(html).toContain(`<p style="display:flex;align-items:baseline;gap:2ch;white-space:nowrap"><span>التاريخ</span><span>${memoDate}</span></p>`);
    expect(html).toContain("تم تسليم المواد المذكورة إلى مديرية التربية");
    expect(html).toContain("بموجب طلب مواد رقم&nbsp;&nbsp;ط-245");
    expect(html).toContain(`تاريخ&nbsp;&nbsp;${requestDate}`);
    vi.unstubAllGlobals();
  });

  it("يُبقي خانات الجهة والطلب والتاريخ فارغة عند غياب بياناتها", () => {
    const write = vi.fn();
    const page = { document: { open: vi.fn(), write, close: vi.fn() }, focus: vi.fn() } as unknown as Window;
    vi.stubGlobal("window", { open: vi.fn(() => page) });
    printMemo({
      type: "outbound",
      classification: "adjustment",
      memoNumber: "198",
      warehouseName: "المستودع المركزي",
      items: [],
    });
    const html = String(write.mock.calls.at(-1)?.[0] ?? "");
    expect(html).toContain("تم تسليم المواد المذكورة إلى ............................");
    expect(html).toContain("بموجب طلب مواد رقم&nbsp;&nbsp;................................................");
    expect(html).toContain('<p style="display:flex;align-items:baseline;gap:2ch;white-space:nowrap"><span>التاريخ</span><span>/&nbsp;&nbsp;/&nbsp;&nbsp;200</span></p>');
    expect(html).toContain("تاريخ&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;200");
    vi.unstubAllGlobals();
  });

  it("يطبع أعمدة مذكرة التسليم وتذييلها وتواقيعها حسب النموذج الجديد", () => {
    const write = vi.fn();
    const page = { document: { open: vi.fn(), write, close: vi.fn() }, focus: vi.fn() } as unknown as Window;
    vi.stubGlobal("window", { open: vi.fn(() => page) });
    printMemo({
      type: "outbound",
      classification: "adjustment",
      memoNumber: "199",
      memoDate: "2026-10-24",
      warehouseName: "المستودع المركزي",
      items: [{
        code: "M-12",
        name: "مادة اختبار",
        description: "وصف المادة",
        unit: "علبة",
        quantity: "3",
        cardNumber: "C-5",
      }],
    });
    const html = String(write.mock.calls.at(-1)?.[0] ?? "");
    const table = html.slice(html.indexOf('<table class="official-table delivery-table"'), html.indexOf("</table>") + 8);
    const footer = html.slice(html.indexOf('<footer class="memo-footer delivery-footer">'), html.indexOf("</footer>") + 9);
    expect(table).toContain('<th colspan="3">المادة</th>');
    expect(table).toContain('<th rowspan="2">الوحدة</th>');
    expect(table).toContain("الكمية المسلمة");
    expect(table).toContain("<th>رقماً</th><th>كتابةً</th>");
    expect(table).toContain("جهة الاستعمال");
    expect(table).toContain("رقم بطاقة");
    expect(table).toContain("ملاحظات");
    expect(table).toContain("<td>علبة</td><td>3</td><td></td><td></td><td>C-5</td>");
    expect(footer).toContain("تم تسليم المواد المبينة أعلاه فقط ............. أفلام وهي: بحالة جيدة ومطابقة للمواصفات المحددة في طلب المواد / فاتورة بيع");
    expect(footer).toContain("رقم /&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;تاريخ&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;20");
    expect(footer).toContain("المستلم :");
    expect(footer).toContain("<hr class=\"delivery-divider\"/>");
    expect(footer).toContain("تم تسجيل المواد المسلمة المشار إليها أعلاه في بطاقات المستودع بتاريخ");
    expect(footer).toContain("أمين المستودع :");
    expect(html).toContain(".delivery-recipient,.delivery-storekeeper{direction:rtl;text-align:right}");
    expect(html).toContain(".delivery-recipient{position:relative;left:-10%;width:48%;margin:5mm auto 2mm 0;text-align:right;direction:rtl;line-height:1.4}");
    expect(html).toContain(".delivery-storekeeper{position:relative;left:-10%;width:48%;margin:2mm auto 0 0;text-align:right;direction:rtl;line-height:1.4}");
    expect(footer.indexOf("المستلم :")).toBeLessThan(footer.indexOf("delivery-divider"));
    expect(footer.indexOf("delivery-divider")).toBeLessThan(footer.indexOf("تم تسجيل المواد المسلمة"));
    expect(footer.indexOf("تم تسجيل المواد المسلمة")).toBeLessThan(footer.indexOf("أمين المستودع :"));
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

  it("يطبع مذكرة الإدخال ببيانات المستودع والفاتورة والتواقيع المطلوبة", () => {
    const write = vi.fn();
    const page = { document: { open: vi.fn(), write, close: vi.fn() }, focus: vi.fn() } as unknown as Window;
    vi.stubGlobal("window", { open: vi.fn(() => page) });
    printMemo({
      type: "inbound",
      classification: "return",
      memoNumber: "SER-26",
      memoDate: "2026-10-24",
      warehouseName: "مستودع دمشق",
      folderNumber: "12",
      invoiceNumber: "INV-123",
      invoiceDate: "2026-10-20",
      items: [],
    });
    const html = String(write.mock.calls.at(-1)?.[0] ?? "");
    const memoDate = new Date("2026-10-24").toLocaleDateString("ar-SY");
    const invoiceDate = new Date("2026-10-20").toLocaleDateString("ar-SY");
    expect(html).toContain("مذكرة إدخال");
    expect(html).not.toContain("مركز الحاسب");
    expect(html).toContain("نموذج مستودع رقم ( ٦ )");
    expect(html).toContain('<span>رقم المجلد</span><span>12</span>');
    expect(html).toContain(`<span>الرقم المتسلسل</span><span>SER-26</span>`);
    expect(html).toContain(`<span>التاريخ</span><span>${memoDate}</span>`);
    expect(html).toContain(`إن المواد المذكورة أدناه وردت من&nbsp;&nbsp;مستودع دمشق&nbsp;&nbsp;بموجب الفاتورة رقم&nbsp;&nbsp;(INV-123)&nbsp;&nbsp;تاريخ&nbsp;&nbsp;${invoiceDate}`);
    expect(html).toContain("فقط كمية وقدرها ....................................................... وقيمتها مبلغ ....................................................");
    expect(html).toContain(`تم استلام المواد المبينة أعلاه وفقاً للمواصفات المحددة في ........................................ رقم&nbsp;&nbsp;(INV-123)&nbsp;&nbsp;تاريخ&nbsp;&nbsp;${invoiceDate}`);
    expect(html).toContain("وتم تسجيلها في بطاقات المستودع المشار إليها");
    expect(html).toContain("المسلم");
    expect(html).toContain("أمين المستودع");
    expect(html).toContain('class="storekeeper" style="text-align:right;direction:rtl"');
    expect(html).toContain('class="recipient" style="text-align:right;direction:rtl"><p>المسلم</p>');
    expect(html).toContain('style="grid-template-columns:1fr 1fr;direction:ltr;gap:0;margin:8mm auto 0;width:64%"');
    expect(html).toContain("رقم بطاقة<br/>المواد");
    expect(html).not.toContain("السعر الإفرادي");
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

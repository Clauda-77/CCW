// import { describe, expect, it, vi } from "vitest";
// import { officialFormMeta, renderOfficialReport } from "./officialReportPrint";

// describe("النماذج المالية الرسمية", () => {
//   it("تحافظ على أرقام نماذج اليوميات والجرد وبطاقة المادة وكشف الحركة", () => {
//     expect(officialFormMeta.inboundJournal.formNumber).toBe(14);
//     expect(officialFormMeta.outboundJournal.formNumber).toBe(13);
//     expect(officialFormMeta.inventory.formNumber).toBe(14);
//     expect(officialFormMeta.materialCard.formNumber).toBe(15);
//     expect(officialFormMeta.monthlyMovement.formNumber).toBe(17);
//   });

//   it("يبني يومية الإدخالات برأس النموذج 14 والحقول الرسمية ومعاينة قبل الطباعة", () => {
//     const write = vi.fn();
//     const page = { document: { write, close: vi.fn() } } as unknown as Window;
//     renderOfficialReport(page, { title: "يومية الإدخالات", dateRange: "من 2026-01-01 إلى 2026-01-31", type: "inboundJournal", rows: [[1, "12", "2026/1/1", "1001", "مادة", "وصف", "عدد", "5", ""]] });
//     expect(write).toHaveBeenCalledTimes(1);
//     expect(write.mock.calls[0]?.[0]).toContain("نموذج مستودع رقم 14");
//     expect(write.mock.calls[0]?.[0]).toContain("مذكرة الاستلام");
//     expect(write.mock.calls[0]?.[0]).toContain("إرسال إلى الطابعة");
//   });

//   it("ينسق الأرقام العشرية في خلايا التقارير الرسمية دون حذف الكسور الحقيقية", () => {
//     const write = vi.fn();
//     const page = { document: { write, close: vi.fn() } } as unknown as Window;
//     renderOfficialReport(page, { title: "تقرير", dateRange: "", type: "monthlyMovement", rows: [[1, "1001", "مادة", "", "1.000", "155.000", "1.5", "", "", ""]] });
//     const html = String(write.mock.calls[0]?.[0] ?? "");
//     expect(html).toContain(">1</td>");
//     expect(html).toContain(">155</td>");
//     expect(html).toContain(">1.5</td>");
//     expect(html).not.toContain("1.000");
//     expect(html).not.toContain("155.000");
//   });

//   it("يبني كشف حركة المواد بأعمدة شهرية موحّدة دون توزيع افتراضي للوارد", () => {
//     const write = vi.fn();
//     const page = { document: { write, close: vi.fn() } } as unknown as Window;
//     renderOfficialReport(page, { title: "كشف حركة المواد", dateRange: "من 2026-01-01 إلى 2026-01-31", type: "monthlyMovement", rows: [[1, "1001", "مادة", "", 3, 2, "", 1, 4, ""]] });
//     expect(write.mock.calls[0]?.[0]).toContain("استلام شهر");
//     expect(write.mock.calls[0]?.[0]).toContain("إدخال شهر");
//     expect(write.mock.calls[0]?.[0]).toContain("إخراجات شهر");
//   });

//   it("يبقي الحقول غير المتوفرة في التقرير فارغة من دون رموز بديلة", () => {
//     const write = vi.fn();
//     const page = { document: { write, close: vi.fn() } } as unknown as Window;
//     renderOfficialReport(page, { title: "بطاقة المادة", dateRange: "", type: "materialCard", material: { code: "1001", name: "مادة", unit: "عدد", minimumStock: null, maximumStock: null, notes: null }, rows: [[1, "إدخال", "1", "", 2, "", 2, "", "", ""]] });
//     expect(write.mock.calls[0]?.[0]).not.toContain(">—<");
//     expect(write.mock.calls[0]?.[0]).toContain("الحد الأدنى : <br>");
//   });

//   it("يبقي الحقول غير المتوفرة فارغة في اليوميات والجرد وحركة المواد", () => {
//     const cases = [
//       { type: "inboundJournal" as const, rows: [[1, "", "", "1001", "مادة", null, "عدد", 1, null]] },
//       { type: "outboundJournal" as const, rows: [[1, "", "", "1001", "مادة", null, "عدد", 1, null, null]] },
//       { type: "inventory" as const, rows: [[1, "1001", "مادة", null, "عدد", "", 1, "", "", "", "", "", null]] },
//       { type: "monthlyMovement" as const, rows: [[1, "1001", "مادة", null, 0, "", "", 0, 0, ""]] },
//     ];
//     cases.forEach(({ type, rows }) => {
//       const write = vi.fn();
//       const page = { document: { write, close: vi.fn() } } as unknown as Window;
//       renderOfficialReport(page, { title: "تقرير", dateRange: "", type, rows });
//       expect(write.mock.calls[0]?.[0]).not.toContain(">—<");
//     });
//   });
// });
import { describe, expect, it, vi } from "vitest";
import { officialFormMeta, renderOfficialReport } from "./officialReportPrint";

describe("النماذج المالية الرسمية", () => {
  it("تحافظ على أرقام نماذج اليوميات والجرد وبطاقة المادة وكشف الحركة", () => {
    expect(officialFormMeta.inboundJournal.formNumber).toBe(14);
    expect(officialFormMeta.outboundJournal.formNumber).toBe(13);
    expect(officialFormMeta.inventory.formNumber).toBe(18);
    expect(officialFormMeta.materialCard.formNumber).toBe(15);
    expect(officialFormMeta.monthlyMovement.formNumber).toBe(17);
  });

  it("يبني يومية الإدخالات برأس النموذج 14 والحقول الرسمية ومعاينة قبل الطباعة", () => {
    const write = vi.fn();
    const page = { document: { write, close: vi.fn() } } as unknown as Window;
    renderOfficialReport(page, { title: "يومية الإدخالات", dateRange: "من 2026-01-01 إلى 2026-01-31", type: "inboundJournal", rows: [[1, "12", "2026/1/1", "1001", "مادة", "وصف", "عدد", "5", ""]] });
    expect(write).toHaveBeenCalledTimes(1);
    expect(write.mock.calls[0]?.[0]).toContain("نموذج مستودع رقم 14");
    expect(write.mock.calls[0]?.[0]).toContain("مذكرة الاستلام");
    expect(write.mock.calls[0]?.[0]).toContain("إرسال إلى الطابعة");
  });

  it("ينسق الأرقام العشرية في خلايا التقارير الرسمية دون حذف الكسور الحقيقية", () => {
    const write = vi.fn();
    const page = { document: { write, close: vi.fn() } } as unknown as Window;
    renderOfficialReport(page, { title: "تقرير", dateRange: "", type: "monthlyMovement", rows: [[1, "1001", "مادة", "", "1.000", "155.000", "1.5", "", "", ""]] });
    const html = String(write.mock.calls[0]?.[0] ?? "");
    expect(html).toContain(">1</td>");
    expect(html).toContain(">155</td>");
    expect(html).toContain(">1.5</td>");
    expect(html).not.toContain("1.000");
    expect(html).not.toContain("155.000");
  });

  it("يبني كشف حركة المواد بأعمدة شهرية موحّدة دون توزيع افتراضي للوارد", () => {
    const write = vi.fn();
    const page = { document: { write, close: vi.fn() } } as unknown as Window;
    renderOfficialReport(page, { title: "كشف حركة المواد", dateRange: "من 2026-01-01 إلى 2026-01-31", type: "monthlyMovement", rows: [[1, "1001", "مادة", "", 3, 2, "", 1, 4, ""]] });
    expect(write.mock.calls[0]?.[0]).toContain("الاستلام");
    expect(write.mock.calls[0]?.[0]).toContain("الإدخال");
    expect(write.mock.calls[0]?.[0]).toContain("الإخراجات");
    expect(write.mock.calls[0]?.[0]).not.toContain("استلام شهر");
  });

  it("يعرض أسهم الأولى والسابقة والتالية والأخيرة مع إجمالي صفحات التقرير", () => {
    const write = vi.fn();
    const page = { document: { write, close: vi.fn() } } as unknown as Window;
    renderOfficialReport(page, { title: "جدول الجرد", dateRange: "", type: "inventory", rows: [[21, "1001", "مادة", "", "عدد", "", "عدد", 1, "عدد", 1, "", "", "", "", ""]], pagination: { page: 2, totalPages: 350, hasPrevious: true, hasNext: true, sessionId: "session-1" } });
    const html = String(write.mock.calls[0]?.[0] ?? "");
    ["⏮ الأولى", "◀ السابقة", "التالية ▶", "الأخيرة ⏭", "صفحة 2 من 350", "report-first", "report-last"].forEach(fragment => expect(html).toContain(fragment));
  });

  it("يعيد ربط زر التالية بعد تحديث صفحة المعاينة من دون كتابة النافذة مجددًا", () => {
    const navigate = vi.fn();
    const root = { innerHTML: "" };
    const controls: Record<string, { onclick: null | (() => void) }> = {
      "report-first": { onclick: null }, "report-previous": { onclick: null }, "report-next": { onclick: null }, "report-last": { onclick: null },
      "close-preview": { onclick: null }, "download-pdf": { onclick: null }, "print-now": { onclick: null },
    };
    const page = {
      opener: { __inventoryReportNavigate: navigate },
      document: { getElementById: (id: string) => id === "official-report-root" ? root : controls[id], write: vi.fn(), close: vi.fn() },
      focus: vi.fn(), print: vi.fn(), close: vi.fn(),
    } as unknown as Window;
    const firstPage = { title: "جدول الجرد", dateRange: "", type: "inventory" as const, rows: [[1, "1001", "مادة", "", "عدد", "", "عدد", 1, "عدد", 1, "", "", "", "", ""]], pagination: { page: 1, totalPages: 3, hasPrevious: false, hasNext: true, sessionId: "session-1" } };
    renderOfficialReport(page, firstPage);
    controls["report-next"].onclick?.();
    renderOfficialReport(page, { ...firstPage, pagination: { ...firstPage.pagination, page: 2, hasPrevious: true } });
    controls["report-next"].onclick?.();
    expect(navigate).toHaveBeenNthCalledWith(1, "session-1", "next", undefined);
    expect(navigate).toHaveBeenNthCalledWith(2, "session-1", "next", undefined);
    expect(page.document.write).not.toHaveBeenCalled();
    expect(root.innerHTML).toContain("صفحة 2 من 3");
  });

  it("يضع كل صفحات التقرير في نسخة الطباعة الكاملة ويطبعها دفعة واحدة", () => {
    const print = vi.fn();
    const root = { innerHTML: "" };
    const controls: Record<string, { onclick: null | (() => void) }> = {
      "report-first": { onclick: null }, "report-previous": { onclick: null }, "report-next": { onclick: null }, "report-last": { onclick: null },
      "close-preview": { onclick: null }, "download-pdf": { onclick: null }, "print-now": { onclick: null },
    };
    const page = { document: { getElementById: (id: string) => id === "official-report-root" ? root : controls[id], write: vi.fn(), close: vi.fn() }, focus: vi.fn(), print, close: vi.fn() } as unknown as Window;
    const report = { title: "جدول الجرد", dateRange: "", type: "inventory" as const, rows: [[1, "1001", "الصف الأول", "", "عدد", "", "عدد", 1, "عدد", 1, "", "", "", "", ""]] };
    renderOfficialReport(page, { ...report, pages: [report, { ...report, rows: [[21, "1002", "الصف الثاني", "", "عدد", "", "عدد", 2, "عدد", 2, "", "", "", "", ""]] }] });
    controls["print-now"].onclick?.();
    controls["download-pdf"].onclick?.();
    expect(root.innerHTML).toContain("الصف الأول");
    expect(root.innerHTML).toContain("الصف الثاني");
    expect(print).toHaveBeenCalledTimes(2);
  });

  it("يبقي الحقول غير المتوفرة في التقرير فارغة من دون رموز بديلة", () => {
    const write = vi.fn();
    const page = { document: { write, close: vi.fn() } } as unknown as Window;
    renderOfficialReport(page, { title: "بطاقة المادة", dateRange: "", type: "materialCard", material: { code: "1001", name: "مادة", unit: "عدد", minimumStock: null, maximumStock: null, notes: null }, rows: [[1, "إدخال", "1", "", 2, "", 2, "", "", ""]] });
    expect(write.mock.calls[0]?.[0]).not.toContain(">—<");
    expect(write.mock.calls[0]?.[0]).toContain("الحد الأدنى : <br>");
  });

  it("يبقي الحقول غير المتوفرة فارغة في اليوميات والجرد وحركة المواد", () => {
    const cases = [
      { type: "inboundJournal" as const, rows: [[1, "", "", "1001", "مادة", null, "عدد", 1, null]] },
      { type: "outboundJournal" as const, rows: [[1, "", "", "1001", "مادة", null, "عدد", 1, null, null]] },
      { type: "inventory" as const, rows: [[1, "1001", "مادة", null, "عدد", "", 1, "", "", "", "", "", null]] },
      { type: "monthlyMovement" as const, rows: [[1, "1001", "مادة", null, 0, "", "", 0, 0, ""]] },
    ];
    cases.forEach(({ type, rows }) => {
      const write = vi.fn();
      const page = { document: { write, close: vi.fn() } } as unknown as Window;
      renderOfficialReport(page, { title: "تقرير", dateRange: "", type, rows });
      expect(write.mock.calls[0]?.[0]).not.toContain(">—<");
    });
  });

  it("يعرض رقم مستند بطاقة المادة باتجاه يسار إلى يمين", () => {
    const write = vi.fn();
    const page = { document: { write, close: vi.fn() } } as unknown as Window;
    renderOfficialReport(page, {
      title: "بطاقة المادة",
      dateRange: "",
      type: "materialCard",
      rows: [[1, "مذكرة استلام", "12 / FIN-45", "", 1, "", 1, "", "مورد", ""]],
    });

    expect(write.mock.calls[0]?.[0]).toContain(
      '<bdi dir="ltr" style="unicode-bidi:isolate">12 / FIN-45</bdi>'
    );
  });
});

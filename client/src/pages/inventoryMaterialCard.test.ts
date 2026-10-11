// import { readFileSync } from "node:fs";
// import { describe, expect, it } from "vitest";

// const inventorySource = readFileSync(new URL("./Inventory.tsx", import.meta.url), "utf8");
// const homeSource = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
// const dbSource = readFileSync(new URL("../../../server/db.ts", import.meta.url), "utf8");

// describe("بطاقة المادة من شاشة حركة المخزون", () => {
//   it("يمرر مفاتيح الصف المحدد إلى استعلام البطاقة ويعرض بيانات الاستعلام الرسمية", () => {
//     expect(inventorySource).toContain("selectedBalance.materialId");
//     expect(inventorySource).toContain("setCardTarget({ materialId: selectedBalance.materialId })");
//     expect(inventorySource).toContain("card.movements");
//     expect(inventorySource).toContain("card.cardNumber");
//     expect(inventorySource).toContain("card.name");
//     expect(inventorySource).toContain("card.code");
//     expect(inventorySource).toContain("buildMaterialCardRows(card.movements");
//     expect(inventorySource).toContain('const isRangeReport = cardPrintMode === "range"');
//     expect(inventorySource).toContain('mode === "card" || mode === "cardRange"');
//     expect(inventorySource).toContain('printReport("cardRange")');
//     expect(inventorySource).toContain(">من تاريخ</span>");
//     expect(inventorySource).toContain(">إلى تاريخ</span>");
//     expect(inventorySource).toContain("if (!card.name || !card.code)");
//     expect(inventorySource).toContain('title: isRangeReport ? "حركة مادة بين تاريخين" : "بطاقة المادة"');
//     expect(inventorySource).toContain("حركة مادة بين تاريخين");
//     expect(inventorySource).toContain("const exportExcel = () =>");
//     expect(inventorySource).toContain("const exportPdf = () =>");
//     expect(inventorySource).toContain("XLSX.utils.aoa_to_sheet");
//   });

//   it("يطبع المادة الموحدة مع حركات جميع الجهات ويحتفظ بالنطاق المحدد عند طلبه", () => {
//     expect(dbSource).toContain("const scopedMovements = await db.select(movementFields)");
//     expect(dbSource).toContain("const hasLocationScope = input.warehouseId !== undefined");
//     expect(dbSource).toContain("hasLocationScope ? and(...movementBase");
//     expect(dbSource).toContain("const [material] = await db.select");
//     expect(dbSource).toContain("cardNumber: hasLocationScope ? balances[0]?.id ?? null : null");
//     expect(dbSource).toContain("openingQuantity: String(balances.reduce");
//   });

//   it("يجمع الحركة بترتيب ثابت ويدعم إزاحة الصفحة من دون تغيير قيد الفترة", () => {
//     expect(dbSource).toContain("const limit = options?.limit ?? 20_000");
//     expect(dbSource).toContain(".orderBy(materials.code, materials.id).limit(limit).offset(options?.offset ?? 0)");
//     expect(dbSource).toContain("export async function listInventoryBalancePage");
//     expect(dbSource).toContain("movementFilters.push(gte(stockMovements.occurredAt, options.fromDate))");
//     expect(dbSource).toContain("movementFilters.push(lte(stockMovements.occurredAt, options.toDate))");
//   });

//   it("يبني قائمة الحركة من دليل المواد كاملًا ويُظهر المواد بلا رصيد بصفوف صفرية", () => {
//     expect(dbSource).toContain("const pageMaterials = await db.select");
//     expect(dbSource).toContain("if (!pageMaterials.length) return []");
//     expect(inventorySource).not.toContain("هذه المادة لا تملك رصيدًا أو مستودعًا مرتبطًا بعد");
//     expect(inventorySource).toContain("لا توجد مواد مطابقة للبحث.");
//   });

//   it("يرسل البحث إلى الخادم ويضع شريط التحكم بعد جدول المواد", () => {
//     expect(inventorySource).toContain("search: search.trim() || undefined");
//     expect(inventorySource).toContain("placeholder=\"ابحث باسم المادة أو رمزها أو باركودها في كل المواد\"");
//     expect(inventorySource.indexOf('className="inventory-compact-table')).toBeLessThan(inventorySource.indexOf('placeholder="ابحث باسم المادة أو رمزها أو باركودها في كل المواد"'));
//     expect(dbSource).toContain("options?: { fromDate?: Date; toDate?: Date; search?: string; limit?: number; offset?: number }");
//     expect(dbSource).toContain("const materialSearch = term ? or(like(materials.code");
//   });

//   it("يطلب عشرين مادة فقط من الخادم في كل صفحة مع بقاء البحث شاملًا", () => {
//     expect(inventorySource).toContain("const MATERIALS_PER_PAGE = 20");
//     expect(inventorySource).toContain("limit: MATERIALS_PER_PAGE, offset: (page - 1) * MATERIALS_PER_PAGE");
//     expect(inventorySource).toContain("const rows = (query.data?.rows ?? []) as InventoryRow[]");
//     expect(inventorySource).toContain("pageRows.map((row, index)");
//     expect(inventorySource).toContain("عرض {((currentPage - 1) * MATERIALS_PER_PAGE + 1)");
//   });

//   it("يعرض كل مادة مرة واحدة ويجمع أرصدتها وحركاتها بدل تكرارها حسب الجهة", () => {
//     expect(dbSource).toContain("const balances = balanceRows.filter(row => row.materialId === material.id)");
//     expect(dbSource).toContain("String(balances.reduce((total, row) => total + Number(row.onHandQuantity ?? 0), 0))");
//     expect(dbSource).toContain('"متعدد الجهات / المستودعات"');
//   });

//   it("يطبع المادة الموحدة مع تفاصيل كل جهة بدل حصرها في أول رصيد ظاهر", () => {
//     expect(inventorySource).toContain("setCardTarget({ materialId: selectedBalance.materialId })");
//     expect(dbSource).toContain("const hasLocationScope = input.warehouseId !== undefined");
//     expect(dbSource).toContain("movementBase = hasLocationScope");
//     expect(dbSource).toContain("String(balances.reduce((total, balance) => total + Number(balance.openingQuantity ?? 0), 0))");
//   });

//   it("يحذف الشروح غير المطلوبة ويبقي عنوان قسم المواد مبسطًا", () => {
//     expect(inventorySource).not.toContain("انقر على صف المادة لتحديدها");
//     expect(inventorySource).not.toContain("ترتيب الجدول يحاكي النظام القديم");
//     expect(inventorySource).not.toContain("سجل بهذه الصفحة");
//     expect(homeSource).toContain(">المواد الأكثر استخدامًا</h2>");
//     expect(homeSource).not.toContain("المواد منخفضة المستوى");
//     expect(homeSource).not.toContain("مقارنة المستوى الحالي بالحد الأدنى المعرّف.");
//   });

//   it("يخفي عمود المستودع والجهة من جدول الحركة من دون تغيير بيانات البطاقة", () => {
//     expect(inventorySource).not.toContain(">المستودع / الجهة</th>");
//     expect(inventorySource).toContain("min-w-[1120px]");
//     expect(inventorySource).toContain("colSpan={10}");
//     expect(inventorySource).toContain("selectedBalance.materialId");
//   });
// });
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const inventorySource = readFileSync(new URL("./Inventory.tsx", import.meta.url), "utf8");
const homeSource = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const dbSource = readFileSync(new URL("../../../server/db.ts", import.meta.url), "utf8");

describe("بطاقة المادة من شاشة حركة المخزون", () => {
  it("يمرر مفاتيح الصف المحدد إلى استعلام البطاقة ويعرض بيانات الاستعلام الرسمية", () => {
    expect(inventorySource).toContain("selectedBalance.materialId");
    expect(inventorySource).toContain("setCardTarget({ materialId: selectedBalance.materialId })");
    expect(inventorySource).toContain("card.movements");
    expect(inventorySource).toContain("card.cardNumber");
    expect(inventorySource).toContain("card.name");
    expect(inventorySource).toContain("card.code");
    expect(inventorySource).toContain("buildMaterialCardRows(card.movements");
    expect(inventorySource).toContain('const isRangeReport = cardPrintMode === "range"');
    expect(inventorySource).toContain('mode === "card" || mode === "cardRange"');
    expect(inventorySource).toContain('printReport("cardRange")');
    expect(inventorySource).toContain(">من تاريخ</span>");
    expect(inventorySource).toContain(">إلى تاريخ</span>");
    expect(inventorySource).toContain("if (!card.name || !card.code)");
    expect(inventorySource).toContain('title: isRangeReport ? "حركة مادة بين تاريخين" : "بطاقة المادة"');
    expect(inventorySource).toContain("حركة مادة بين تاريخين");
    expect(inventorySource).toContain("const exportExcel = () =>");
    expect(inventorySource).toContain("const exportPdf = () =>");
    expect(inventorySource).toContain("XLSX.utils.aoa_to_sheet");
  });

  it("يطبع المادة الموحدة مع حركات جميع الجهات ويحتفظ بالنطاق المحدد عند طلبه", () => {
    expect(dbSource).toContain("const scopedMovements = await db.select(movementFields)");
    expect(dbSource).toContain("const hasLocationScope = input.warehouseId !== undefined");
    expect(dbSource).toContain("hasLocationScope ? and(...movementBase");
    expect(dbSource).toContain("const [material] = await db.select");
    expect(dbSource).toContain("cardNumber: hasLocationScope ? balances[0]?.id ?? null : null");
    expect(dbSource).toContain("openingQuantity: String(balances.reduce");
  });

  it("يجمع الحركة بترتيب ثابت ويدعم إزاحة الصفحة من دون تغيير قيد الفترة", () => {
    expect(dbSource).toContain("const limit = options?.limit ?? 20_000");
    expect(dbSource).toContain(".orderBy(materials.code, materials.id).limit(limit).offset(options?.offset ?? 0)");
    expect(dbSource).toContain("export async function listInventoryBalancePage");
    expect(dbSource).toContain("movementFilters.push(gte(stockMovements.occurredAt, options.fromDate))");
    expect(dbSource).toContain("movementFilters.push(lte(stockMovements.occurredAt, options.toDate))");
  });

  it("يبني قائمة الحركة من دليل المواد كاملًا ويُظهر المواد بلا رصيد بصفوف صفرية", () => {
    expect(dbSource).toContain("const pageMaterials = await db.select");
    expect(dbSource).toContain("if (!pageMaterials.length) return []");
    expect(inventorySource).not.toContain("هذه المادة لا تملك رصيدًا أو مستودعًا مرتبطًا بعد");
    expect(inventorySource).toContain("لا توجد مواد مطابقة للبحث.");
  });

  it("يرسل البحث إلى الخادم ويضع شريط التحكم بعد جدول المواد", () => {
    expect(inventorySource).toContain("search: search.trim() || undefined");
    expect(inventorySource).toContain("placeholder=\"ابحث باسم المادة أو رمزها أو باركودها في كل المواد\"");
    expect(inventorySource.indexOf('className="inventory-compact-table')).toBeLessThan(inventorySource.indexOf('placeholder="ابحث باسم المادة أو رمزها أو باركودها في كل المواد"'));
    expect(dbSource).toContain("options?: { fromDate?: Date; toDate?: Date; search?: string; limit?: number; offset?: number }");
    expect(dbSource).toContain("const materialSearch = term ? or(like(materials.code");
  });

  it("يطلب عشرين مادة فقط من الخادم في كل صفحة مع بقاء البحث شاملًا", () => {
    expect(inventorySource).toContain("const MATERIALS_PER_PAGE = 20");
    expect(inventorySource).toContain("limit: MATERIALS_PER_PAGE, offset: (page - 1) * MATERIALS_PER_PAGE");
    expect(inventorySource).toContain("const rows = (query.data?.rows ?? []) as InventoryRow[]");
    expect(inventorySource).toContain("pageRows.map((row, index)");
    expect(inventorySource).toContain("عرض {((currentPage - 1) * MATERIALS_PER_PAGE + 1)");
  });

  it("يعرض كل مادة مرة واحدة ويجمع أرصدتها وحركاتها بدل تكرارها حسب الجهة", () => {
    expect(dbSource).toContain("const balances = balanceRows.filter(row => row.materialId === material.id)");
    expect(dbSource).toContain("String(balances.reduce((total, row) => total + Number(row.onHandQuantity ?? 0), 0))");
    expect(dbSource).toContain('"متعدد الجهات / المستودعات"');
  });

  it("يطبع المادة الموحدة مع تفاصيل كل جهة بدل حصرها في أول رصيد ظاهر", () => {
    expect(inventorySource).toContain("setCardTarget({ materialId: selectedBalance.materialId })");
    expect(dbSource).toContain("const hasLocationScope = input.warehouseId !== undefined");
    expect(dbSource).toContain("movementBase = hasLocationScope");
    expect(dbSource).toContain("String(balances.reduce((total, balance) => total + Number(balance.openingQuantity ?? 0), 0))");
  });

  it("يحذف الشروح غير المطلوبة ويبقي عنوان قسم المواد مبسطًا", () => {
    expect(inventorySource).not.toContain("انقر على صف المادة لتحديدها");
    expect(inventorySource).not.toContain("ترتيب الجدول يحاكي النظام القديم");
    expect(inventorySource).not.toContain("سجل بهذه الصفحة");
    expect(homeSource).toContain(">المواد الأكثر استخدامًا</h2>");
    expect(homeSource).not.toContain("المواد منخفضة المستوى");
    expect(homeSource).not.toContain("مقارنة المستوى الحالي بالحد الأدنى المعرّف.");
  });

  it("يخفي عمود المستودع والجهة من جدول الحركة من دون تغيير بيانات البطاقة", () => {
    expect(inventorySource).not.toContain(">المستودع / الجهة</th>");
    expect(inventorySource).toContain("min-w-[1120px]");
    expect(inventorySource).toContain("colSpan={10}");
    expect(inventorySource).toContain("selectedBalance.materialId");
  });

  it("يعرض تقرير الجرد على صفحات متتابعة من 20 مادة داخل نافذة المعاينة", () => {
    expect(inventorySource).toContain("inventory-report-page");
    expect(inventorySource).toContain("setReportSession({ id: sessionId");
    expect(inventorySource).toContain("pagination: { page: reportSession.page");
    expect(inventorySource).toContain("if (reportQuery.isFetching || reportQuery.isLoading) return;");
    expect(inventorySource).toContain("تعذر تحميل صفحة التقرير المطلوبة.");
    expect(inventorySource).toContain('event.data?.type === "inventory-report-page"');
    expect(inventorySource).toContain("وصلت إلى آخر صفحة متاحة من التقرير.");
    expect(inventorySource).toContain("sessionId !== current.id");
    expect(inventorySource).toContain("__inventoryReportNavigate");
  });

  it("يجلب جميع مواد التقرير وقت الطباعة فقط ويعرضها بصفحات رسمية كاملة", () => {
    expect(inventorySource).toContain("previewReportBalances.fetch(activeSession.filters)");
    expect(inventorySource).toContain("reportBalances.fetch(activeSession.filters)");
    expect(inventorySource).toContain("__inventoryReportPrintAll");
    expect(inventorySource).toContain("pages: reportPages");
    expect(dbSource).toContain("export async function listInventoryBalances");
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const layoutSource = readFileSync(new URL("../components/DashboardLayout.tsx", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const memoSource = readFileSync(new URL("./Memos.tsx", import.meta.url), "utf8");
const memoDetailsSource = readFileSync(new URL("./MemoDetails.tsx", import.meta.url), "utf8");
const inventorySource = readFileSync(new URL("./Inventory.tsx", import.meta.url), "utf8");
const materialsSource = readFileSync(new URL("./Materials.tsx", import.meta.url), "utf8");
const partyPickerSource = readFileSync(new URL("../components/MemoPartyPicker.tsx", import.meta.url), "utf8");
const quickMaterialSource = readFileSync(new URL("../components/MemoQuickMaterialDialog.tsx", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const contractSource = readFileSync(new URL("../../../docs/memo-navigation-print-contract.md", import.meta.url), "utf8");

describe("تجربة قوائم التبويبات والمذكرة", () => {
  it("يخفي مؤقتًا بحث وتصفية القوائم العلوية والعبارة الداخلية مع الإبقاء على التبويبات", () => {
    expect(layoutSource).not.toContain("CommandInput");
    expect(layoutSource).not.toContain("بحث وتصفية");
    expect(layoutSource).not.toContain("عمليات {item.label}");
    expect(layoutSource).not.toContain("quickMaterials");
    expect(layoutSource).toContain("dropdownItems(item)");
    expect(layoutSource).toContain('label: "محضر تركيب وتنسيق", path: "/transfer"');
    expect(layoutSource).toContain('label: "مذكرة الإدخال", path: "/entry"');
    expect(appSource).toContain('path={"/transfer"}');
    expect(appSource).toContain('path={"/entry"}');
    expect(appSource).toContain('inboundMode="entry"');
    expect(appSource).toContain('mode="transfer"');
    expect(styleSource).toContain(".legacy-menu-tab[data-active=\"true\"]");
    expect(styleSource).toContain("prefers-reduced-motion");
  });

  it("يعرض محرر المذكرة الموسع ويختار المادة بالنقر على صفها فقط", () => {
    expect(memoSource).toContain("h-[calc(100vh-1rem)]");
    expect(memoSource).toContain("onClick={() => selectMaterial(material.id)}");
    expect(memoSource).toContain("memo-material-row");
    expect(memoSource).toContain("memo-editor-dialog");
    expect(memoSource).not.toContain('>اختيار</Button>');
    expect(styleSource).toContain("width: min(1780px, calc(100vw - 2rem)) !important");
    expect(styleSource).toContain("height: min(920px, calc(100vh - 2rem)) !important");
    expect(styleSource).toContain(".max-w-5xl { width: min(1780px, calc(100vw - 2rem)) !important");
  });

  it("يبقي رأس المذكرة وإجراءاتها متاحة ويقصر التمرير على جدول البنود الطويل", () => {
    expect(memoSource).toContain('className="memo-items-scroll min-h-0 flex-1 basis-0 overflow-y-auto overflow-x-auto overscroll-contain bg-white"');
    expect(memoSource).toContain('className="grid min-h-[360px] flex-none gap-3 xl:grid-cols-[minmax(0,1fr)_320px]"');
    expect(memoSource).toContain("إضافة مادة");
    expect(memoSource).toContain("لم تتم إضافة أي مادة بعد");
    expect(memoSource).toContain('aria-label="البحث عن مادة"');
    expect(memoSource).toContain("بحث المواد");
    expect(memoSource).toContain("اختر السطر ثم اضغط المادة لإضافتها مباشرة");
    expect(memoSource).toContain("مواد المذكرة");
    expect(memoSource).toContain("بحث بالرقم المالي");
    expect(memoSource).toContain("بحث بالرقم المتسلسل للمذكرة");
    expect(memoSource).toContain("البحث هنا يصفّي رأس المذكرة كاملًا، وليس موادها فقط");
    expect(memoSource).toContain("filterMemos");
    expect(memoSource).toContain("mode?: \"standard\" | \"transfer\"");
    expect(memoSource).toContain('inboundMode?: "receipt" | "entry"');
    expect(memoSource).toContain('const inboundEntry = inbound && inboundMode === "entry"');
    expect(memoSource).toContain("const usePreview = isDevelopment && !isAuthenticated");
    expect(memoSource).toContain("trpc.materials.list.useQuery({ search: materialSearch }, { enabled: isAuthenticated })");
    expect(memoSource).toContain("trpc.materials.previewList.useQuery({ search: materialSearch }, { enabled: usePreview })");
    expect(memoSource).toContain("const loadedMaterials = (usePreview ? materialsPreview.data : materialsLive.data) ?? []");
    expect(memoSource).toContain("const selectedMaterialCache = lines.filter(line => line.materialId && line.materialName)");
    expect(memoSource).toContain("إدخال مواد مستعملة مُعادة إلى المستودع");
    expect(memoSource).not.toContain("isAlwaysNewReceiptMaterial");
    expect(memoSource).toContain("محضر تركيب وتنسيق");
    expect(memoSource).toContain("تركيب وتنسيق");
    expect(memoSource).not.toContain("تركيب وتنسيق — بلا سعر");
    expect(memoSource).not.toContain("مطابقة البنود");
    expect(memoSource).toContain('toast.success("تم إنشاء المذكرة بنجاح.")');
    expect(styleSource).toContain(".memo-editor-dialog form > div:nth-child(2) { display: none; }");
    expect(styleSource).toContain('[role="dialog"] form > div[class*="min-h-0"][class*="flex-1"] > div[class*="overflow-x-auto"]');
    expect(styleSource).toContain("overflow: auto");
    expect(contractSource).toContain("يُمرَّر جدول البنود فقط");
  });

  it("يضيف كل مادة مختارة من البحث في سطر جديد ويحافظ على الأسطر السابقة", () => {
    expect(memoSource).toContain("setLines(current =>");
    expect(memoSource).toContain("const emptyLineIndex = current.findIndex(line => !line.materialId)");
    expect(memoSource).toContain("materialName: selectedMaterial.name");
    expect(memoSource).toContain("return [...current, { ...emptyLine(), ...selectedMaterialDetails }]");
    expect(memoSource).toContain("selectedMaterialCache.filter(material => !loadedMaterials.some");
    expect(memoSource).not.toContain("updateLine(targetLine, { materialId: String(id) })");
  });

  it("يفرض كمية صحيحة موجبة عند إضافة مادة إلى المذكرة", () => {
    expect(memoSource).toContain('min="0.001" step="0.001" inputMode="decimal"');
    expect(memoSource).toContain("const invalidQuantity = lines.some");
    expect(memoSource).toContain("أدخل كمية موجبة صحيحة أو عشرية");
  });

  it("يطبق تنسيق الأرقام المختصر على جداول الواجهة", () => {
    expect(inventorySource).toContain('import { formatPrintNumber } from "@/lib/printNumber";');
    expect(inventorySource).toContain("formatPrintNumber(row.onHandQuantity)");
    expect(materialsSource).toContain('import { formatPrintNumber } from "@/lib/printNumber";');
    expect(materialsSource).toContain("formatPrintNumber(material.minimumStock)");
    expect(memoDetailsSource).toContain("formatPrintNumber(item.quantity)");
  });

  it("يخفي عمود السعر كاملًا في المذكرات غير المسعّرة ويبقيه للاستلام الجديد", () => {
    expect(memoSource).toContain("{priceAllowed && <th className=\"px-3 py-2\">السعر</th>}");
    expect(memoSource).toContain("{priceAllowed && <td className=\"px-3 py-2\">");
    expect(memoSource).toContain("colSpan={priceAllowed ? 7 : 6}");
    expect(memoDetailsSource).toContain("memoClassificationHasPrice(classification)");
  });

  it("يوجه طباعة سجل المذكرات إلى قالب الطباعة الرسمي بدل طباعة الصفحة", () => {
    expect(memoSource).toContain('import { printMemo } from "@/lib/memoPrint"');
    expect(memoSource).toContain('import { openPrintWindow } from "@/lib/printWindow"');
    expect(memoSource).toContain("startMemoPrint(memo.id)");
    expect(memoSource).toContain("setPrintWindow(page); setPrintTargetId(id)");
    expect(memoSource).toContain("printMemo(printQuery.data, printWindow)");
    expect(memoSource).not.toContain("window.print()");
  });

  it("يوثق عناصر القبول المرئية وبنية الطباعة الرسمية القابلة للمراجعة", () => {
    ["تبويب نشط", "النقر على صف المادة", "لا تظهر أعمدة السعر أو القيمة", "الجمهورية العربية السورية", "إرسال إلى الطابعة", "أمين المستودع"].forEach(text => expect(contractSource).toContain(text));
    ["ملف", "المذكرات", "المستودع", "أدوات"].forEach(tab => expect(layoutSource).toContain(`label: "${tab}"`));
  });

  it("يعرض نافذة تأكيد منبثقة قبل الحذف النهائي للمسودة", () => {
    expect(memoSource).toContain("AlertDialog");
    expect(memoSource).toContain("تأكيد الحذف النهائي");
    expect(memoSource).toContain("نعم، احذف نهائيًا");
    expect(memoSource).toContain("setDeleteTarget({ id: memo.id, memoNumber: memo.memoNumber })");
  });

  it("يثبت الإلغاء الإداري دون حذف السجل وإزالة زر الإغلاق من المحرر", () => {
    expect(memoSource).toContain("trpc.memos.cancel.useMutation");
    expect(memoSource).toContain("trpc.memos.delete.useMutation");
    expect(memoSource).toContain("حذف نهائي");
    expect(memoSource).toContain("إلغاء المذكرة");
    expect(memoSource).toContain("دون حذف سجلها");
    expect(memoSource).not.toContain("<X className=\"ml-1 h-4 w-4\" />إغلاق");
  });

  it("يمنع تكرار رقم المذكرة قبل الإرسال ويعرض رسالة واضحة بدل الخطأ الخام", () => {
    expect(memoSource).toContain("const duplicate = rows.find");
    expect(memoSource).toContain("موجود مسبقًا في السجل");
    expect(memoSource).toContain("normalizedMemoNumber");
  });

  it("يملأ مركز الحاسب والرقم التسلسلي التالي عند فتح مذكرة جديدة", () => {
    expect(memoSource).toContain("trpc.memos.nextSerialNumber.useQuery");
    expect(memoSource).toContain('warehouse.name.trim().includes("المستودع المركزي")');
    expect(memoSource).toContain("setMemoNumber(current => current || nextSerialNumber)");
    expect(memoSource).toContain("utils.memos.nextSerialNumber.invalidate()");
  });

  it("يوفر بحث الجهة وإضافتها من رأس المذكرة ثم يختارها تلقائيًا", () => {
    expect(memoSource).toContain("MemoPartyPicker");
    ["ابحث واختر جهة أو مورد", "handleSearchKeyDown", "إضافة جهة جديدة باسم", "limit: 500", "trpc.entities.listParties.useQuery", "trpc.entities.createParty.useMutation", "تمت إضافة الجهة واختيارها للمذكرة."].forEach(label => expect(partyPickerSource).toContain(label));
  });

  it("يفتح إضافة مادة جديدة عند الضغط على Enter بلا نتائج ويدرجها مباشرةً في سطر المذكرة", () => {
    ["MemoQuickMaterialDialog", "openQuickMaterial", "event.key === \"Enter\"", "إضافة مادة جديدة باسم", "materialSearchEnterRef", "if (materialSearchEnterRef.current)"].forEach(label => expect(memoSource).toContain(label));
    ["trpc.materials.create.useMutation", "تمت إضافة المادة وإدراجها في المذكرة.", "حفظ المادة وإضافتها"].forEach(label => expect(quickMaterialSource).toContain(label));
  });
});

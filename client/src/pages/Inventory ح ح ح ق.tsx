// // // // import { Button } from "@/components/ui/button";
// // // // import { Card, CardContent } from "@/components/ui/card";
// // // // import { Input } from "@/components/ui/input";
// // // // import { useAuth } from "@/_core/hooks/useAuth";
// // // // import { buildMaterialCardRows } from "@/lib/materialCard";
// // // // import { printOfficialReport, renderOfficialReport, type OfficialReportType } from "@/lib/officialReportPrint";
// // // // import { openPrintWindow } from "@/lib/printWindow";
// // // // import { trpc } from "@/lib/trpc";
// // // // import { displayCode } from "@/lib/displayCode";
// // // // import { formatPrintNumber } from "@/lib/printNumber";
// // // // import { formatWholeQuantity } from "@/pages/Reports";
// // // // import { CalendarRange, CheckCircle2, Download, FileDown, FileSpreadsheet, FileText, Search, Tags, X } from "lucide-react";
// // // // import { useEffect, useMemo, useState } from "react";
// // // // import * as XLSX from "xlsx";
// // // // import { toast } from "sonner";

// // // // type InventoryPrintMode = "card" | "cardRange" | "inbound" | "outbound" | "inventory" | "sub" | "movementAll" | "movement";
// // // // type InventoryRow = { id: number; materialId: number; warehouseId: number; partyId: number | null; code: string; name: string; description: string | null; unit: string; openingQuantity: string; onHandQuantity: string; inboundQuantity: string; receiptQuantity: string; returnQuantity: string; outboundQuantity: string; warehouseName: string; partyName: string | null };
// // // // const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
// // // // const MATERIALS_PER_PAGE = 20;

// // // // export default function InventoryPage({ reportsOnly = false }: { reportsOnly?: boolean }) {
// // // //   const { isAuthenticated } = useAuth();
// // // //   const isDevelopment = import.meta.env.DEV;
// // // //   const [search, setSearch] = useState("");
// // // //   const [page, setPage] = useState(1);
// // // //   const [fromDate, setFromDate] = useState("");
// // // //   const [toDate, setToDate] = useState("");
// // // //   const [selectedBalanceId, setSelectedBalanceId] = useState<number | null>(null);
// // // //   const [cardTarget, setCardTarget] = useState<{ materialId: number } | null>(null);
// // // //   const [cardWindow, setCardWindow] = useState<Window | null>(null);
// // // //   const [cardPrintMode, setCardPrintMode] = useState<"all" | "range">("all");
// // // //   const usePreview = isDevelopment && !isAuthenticated;
// // // //   const filters = useMemo(() => ({ fromDate: fromDate ? new Date(`${fromDate}T00:00:00`) : undefined, toDate: toDate ? new Date(`${toDate}T23:59:59.999`) : undefined, search: search.trim() || undefined, limit: MATERIALS_PER_PAGE, offset: (page - 1) * MATERIALS_PER_PAGE }), [fromDate, page, search, toDate]);
// // // //   const live = trpc.inventory.listBalances.useQuery(filters, { enabled: isAuthenticated });
// // // //   const preview = trpc.inventory.previewBalances.useQuery(filters, { enabled: usePreview });

// // // // const reportFilters = useMemo(() => ({
// // // //   fromDate: fromDate ? new Date(`${fromDate}T00:00:00`) : undefined,
// // // //   toDate: toDate ? new Date(`${toDate}T23:59:59.999`) : undefined,
// // // //   search: search.trim() || undefined,
// // // // }), [fromDate, search, toDate]);

// // // // const allReportLive = trpc.inventory.allBalances.useQuery(reportFilters, { enabled: false });
// // // // const allReportPreview = trpc.inventory.previewAllBalances.useQuery(reportFilters, { enabled: false });
// // // // const allReportQuery = usePreview ? allReportPreview : allReportLive;

// // // // const getAllReportRows = async () => {
// // // //   const result = await allReportQuery.refetch();
// // // //   if (result.error) {
// // // //     toast.error(result.error.message || "تعذر تحميل جميع مواد التقرير.");
// // // //     return null;
// // // //   }
// // // //   return (result.data ?? []) as InventoryRow[];
// // // // };


// // // //   const query = usePreview ? preview : live;
// // // //   const rows = (query.data?.rows ?? []) as InventoryRow[];
// // // //   const hasMore = query.data?.hasMore ?? false;
// // // //   const cardInput = cardTarget ?? { materialId: 1 };
// // // //   const cardLive = trpc.inventory.materialCard.useQuery(cardInput, { enabled: Boolean(cardTarget) && isAuthenticated });
// // // //   const cardPreview = trpc.inventory.previewMaterialCard.useQuery(cardInput, { enabled: Boolean(cardTarget) && usePreview });
// // // //   const cardQuery = usePreview ? cardPreview : cardLive;
// // // //   const filtered = rows;
// // // //   const currentPage = page;
// // // //   const pageRows = filtered;
// // // //   const selectedBalance = useMemo(() => selectedBalanceId === null ? null : rows.find(row => row.id === selectedBalanceId) ?? null, [rows, selectedBalanceId]);

// // // //   useEffect(() => { setPage(1); }, [search, fromDate, toDate]);

// // // //   useEffect(() => {
// // // //     if (!cardTarget || !cardWindow) return;
// // // //     if (cardQuery.isError) {
// // // //       toast.error(cardQuery.error.message || "تعذر تحميل حركة المادة لبطاقتها الرسمية.");
// // // //       cardWindow.close();
// // // //       setCardWindow(null);
// // // //       setCardTarget(null);
// // // //       return;
// // // //     }
// // // //     if (!cardQuery.data) return;
// // // //     const card = cardQuery.data;
// // // //     if (!card.name || !card.code) {
// // // //       toast.error("تعذر جلب اسم المادة ورمزها. اختر صف المادة من الجدول ثم أعد المحاولة.");
// // // //       cardWindow.close();
// // // //       setCardWindow(null);
// // // //       setCardTarget(null);
// // // //       return;
// // // //     }
// // // //     const isRangeReport = cardPrintMode === "range";
// // // //     const rows = isRangeReport
// // // //       ? buildMaterialCardRows(card.movements, card.openingQuantity, fromDate, toDate)
// // // //       : buildMaterialCardRows(card.movements, card.openingQuantity);
// // // //     renderOfficialReport(cardWindow, {
// // // //       title: isRangeReport ? "حركة مادة بين تاريخين" : "بطاقة المادة",
// // // //       dateRange: isRangeReport ? `من ${fromDate} إلى ${toDate}` : "كامل الفترة المتاحة",
// // // //       type: "materialCard",
// // // //       material: { cardNumber: card.cardNumber, code: displayCode(card.code), name: card.name, description: card.description, unit: card.unit, minimumStock: card.minimumStock, maximumStock: null, notes: null },
// // // //       rows,
// // // //     });
// // // //     setCardWindow(null);
// // // //     setCardTarget(null);
// // // //     setCardPrintMode("all");
// // // //   }, [cardPrintMode, cardQuery.data, cardQuery.error, cardQuery.isError, cardTarget, cardWindow, fromDate, toDate]);


// // // //   const printReport = (mode: InventoryPrintMode) => {
// // // //   if (mode === "card" || mode === "cardRange") {
// // // //     if (!selectedBalance) {
// // // //       toast.info("اختر المادة من صف الجدول أولًا ثم اضغط «بطاقة المادة». ");
// // // //       return;
// // // //     }

// // // //     if (mode === "cardRange" && (!fromDate || !toDate)) {
// // // //       toast.info("حدد تاريخ البداية وتاريخ النهاية أولًا لطباعة حركة المادة.");
// // // //       return;
// // // //     }

// // // //     const page = openPrintWindow(
// // // //       mode === "cardRange" ? "حركة مادة بين تاريخين" : "بطاقة المادة"
// // // //     );

// // // //     if (!page) {
// // // //       toast.error("تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.");
// // // //       return;
// // // //     }

// // // //     setCardWindow(page);
// // // //     setCardPrintMode(mode === "cardRange" ? "range" : "all");
// // // //     setCardTarget({ materialId: selectedBalance.materialId });
// // // //     return;
// // // //   }

// // // //   const scoped = mode === "movement"
// // // //     ? filtered.filter(row => Number(row.inboundQuantity) !== 0 || Number(row.outboundQuantity) !== 0)
// // // //     : filtered;

// // // //   // const printReport = (mode: InventoryPrintMode) => {
// // // //   // const printReport = async (mode: InventoryPrintMode) => {

// // // // //     if (mode === "card" || mode === "cardRange") {
// // // // //       if (!selectedBalance) { toast.info("اختر المادة من صف الجدول أولًا ثم اضغط «بطاقة المادة». "); return; }
// // // // //       if (mode === "cardRange" && (!fromDate || !toDate)) { toast.info("حدد تاريخ البداية وتاريخ النهاية أولًا لطباعة حركة المادة."); return; }
// // // // //       const page = openPrintWindow(mode === "cardRange" ? "حركة مادة بين تاريخين" : "بطاقة المادة");
// // // // //       if (!page) { toast.error("تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة."); return; }
// // // // //       setCardWindow(page);
// // // // //       setCardPrintMode(mode === "cardRange" ? "range" : "all");
// // // // //       setCardTarget({ materialId: selectedBalance.materialId });
// // // // //       return;
// // // // //     }
// // // // //     const allRows = await getAllReportRows();
// // // // // if (allRows === null) return;
// // // // // const scoped = mode === "movement" ? filtered.filter(row => Number(row.inboundQuantity) !== 0 || Number(row.outboundQuantity) !== 0) : filtered;

// // // // // const scoped = mode === "movement"
// // // // //   ? allRows.filter(row => Number(row.inboundQuantity) !== 0 || Number(row.outboundQuantity) !== 0)
// // // // //   : allRows;

// // // //     // const scoped = mode === "movement" ? filtered.filter(row => Number(row.inboundQuantity) !== 0 || Number(row.outboundQuantity) !== 0) : filtered;
// // // //     if (!scoped.length) { toast.info("لا توجد سجلات مطابقة لهذا التقرير."); return; }
// // // //     const type: OfficialReportType = mode === "inbound" ? "inboundJournal" : mode === "outbound" ? "outboundJournal" : mode === "inventory" ? "inventory" : "monthlyMovement";
// // // //     const title = mode === "inbound" ? "بطاقة الإدخالات" : mode === "outbound" ? "بطاقة الإخراجات" : mode === "inventory" ? "جدول الجرد" : mode === "sub" ? "كشف فرعي" : mode === "movementAll" ? "طباعة شهرية — كل المواد" : "طباعة شهرية — المتحركة فقط";
// // // //     const period = fromDate || toDate ? `من ${fromDate || ""} إلى ${toDate || ""}` : "";
// // // //     const officialRows: Array<Array<string | number>> = scoped.map((row, index) => {
// // // //       if (mode === "inbound") return [index + 1, "", "", displayCode(row.code), row.name, "", row.unit, row.inboundQuantity, ""];
// // // //       if (mode === "outbound") return [index + 1, "", "", displayCode(row.code), row.name, "", row.unit, row.outboundQuantity, row.partyName || "", ""];
// // // //       if (mode === "inventory") return [index + 1, displayCode(row.code), row.name, row.description || "", row.unit, "", row.unit, formatWholeQuantity(row.onHandQuantity), row.unit, formatWholeQuantity(row.onHandQuantity), "", "", "", "", ""];
// // // //       return [index + 1, displayCode(row.code), row.name, "", row.openingQuantity, Number(row.receiptQuantity) > 0 ? row.receiptQuantity : "", Number(row.returnQuantity) > 0 ? row.returnQuantity : "", row.outboundQuantity, row.onHandQuantity, ""];
// // // //     });
// // // //     if (!printOfficialReport({ title, dateRange: period, rows: officialRows, type })) toast.error("تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.");
// // // //   };

// // // //   const movementExportColumns = ["التسلسل", "رمز المادة", "اسم المادة", "الوصف", "رصيد أول شهر", "استلام شهر", "إدخال شهر", "إخراجات شهر", "الرصيد", "ملاحظات"];
// // // //   const movementExportRows = filtered.map((row, index) => [index + 1, displayCode(row.code), row.name, row.description || "", formatPrintNumber(row.openingQuantity), Number(row.receiptQuantity) > 0 ? formatPrintNumber(row.receiptQuantity) : "", Number(row.returnQuantity) > 0 ? formatPrintNumber(row.returnQuantity) : "", formatPrintNumber(row.outboundQuantity), formatPrintNumber(row.onHandQuantity), ""]);
// // // //   const exportExcel = () => {
// // // //     if (!movementExportRows.length) { toast.info("لا توجد بيانات ظاهرة لتصديرها."); return; }
// // // //     const worksheet = XLSX.utils.aoa_to_sheet([movementExportColumns, ...movementExportRows]);
// // // //     worksheet["!rtl"] = true;
// // // //     const workbook = XLSX.utils.book_new();
// // // //     XLSX.utils.book_append_sheet(workbook, worksheet, "حركة المواد");
// // // //     XLSX.writeFile(workbook, `حركة-المواد-${new Date().toISOString().slice(0, 10)}.xlsx`);
// // // //     toast.success("تم تنزيل جدول حركة المواد بصيغة Excel.");
// // // //   };
// // // //   const exportPdf = () => {
// // // //     if (!movementExportRows.length) { toast.info("لا توجد بيانات ظاهرة لتصديرها."); return; }
// // // //     if (!printOfficialReport({ title: "حركة المواد", dateRange: fromDate || toDate ? `من ${fromDate || "بداية الفترة"} إلى ${toDate || "اليوم"}` : "كامل الفترة المتاحة", rows: movementExportRows, type: "monthlyMovement" })) toast.error("تعذر فتح معاينة PDF.");
// // // //   };

// // // //   const exportCsv = () => {
// // // //     if (!filtered.length) { toast.info("لا توجد بيانات ظاهرة لتصديرها."); return; }
// // // //     const heading = ["رقم البطاقة", "رمز المادة", "اسم المادة", "كمية أول مدة", "الرصيد السابق", "كمية الاستلام", "كمية الإدخال", "كمية التسليم", "كمية الإخراج", "الرصيد الحالي", "المستودع", "الجهة"];
// // // //     const values = filtered.map(row => ["", displayCode(row.code), row.name, row.openingQuantity, row.openingQuantity, row.inboundQuantity, "", row.outboundQuantity, "", row.onHandQuantity, row.warehouseName, row.partyName || ""]);
// // // //     const url = URL.createObjectURL(new Blob(["\uFEFF", [heading, ...values].map(row => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }));
// // // //     const anchor = document.createElement("a");
// // // //     anchor.href = url;
// // // //     anchor.download = "inventory-movement.csv";
// // // //     anchor.click();
// // // //     URL.revokeObjectURL(url);
// // // //     toast.success("تم تنزيل حركة المواد بصيغة CSV المتوافقة مع Excel.");
// // // //   };

// // // //   return (
// // // //     <div className="mx-auto max-w-[1480px] space-y-6" dir="rtl">
// // // //       <section>
// // // //         <p className="text-sm font-semibold text-[#17698a]">المستودع / حركة المواد</p>
// // // //         <h1 className="mt-1 text-3xl font-extrabold tracking-tight">حركة المواد بالمستودعات</h1>
// // // //       </section>

// // // //       <Card className="soft-shadow overflow-hidden border-white/75 bg-white/85"><CardContent className="p-0">
// // // //         <div className="border-b border-slate-100 px-6 py-5"><h2 className="font-extrabold">حركة المواد</h2></div>
// // // //         <div className="overflow-x-auto"><table className="inventory-compact-table w-full min-w-[1120px] text-right">
// // // //           <thead className="bg-[#d9e4ee] text-xs font-bold text-slate-700"><tr><th className="px-2.5 py-2">رقم البطاقة</th><th className="px-2.5 py-2">رمز المادة</th><th className="px-2.5 py-2">اسم المادة</th><th className="px-2.5 py-2">كمية أول مدة</th><th className="px-2.5 py-2">الرصيد السابق</th><th className="px-2.5 py-2">كمية الاستلام</th><th className="px-2.5 py-2">كمية الإدخال</th><th className="px-2.5 py-2">كمية التسليم</th><th className="px-2.5 py-2">كمية الإخراج</th><th className="px-2.5 py-2">الرصيد الحالي</th></tr></thead>
// // // //           <tbody>
// // // //             {query.isLoading && <tr><td colSpan={10} className="px-5 py-10 text-center text-sm text-muted-foreground">جار تحميل الأرصدة…</td></tr>}
// // // //             {query.isError && <tr><td colSpan={10} className="px-5 py-10 text-center text-sm text-destructive">تعذر تحميل الأرصدة.</td></tr>}
// // // //             {!query.isLoading && !query.isError && filtered.length === 0 && <tr><td colSpan={10} className="px-5 py-10 text-center text-sm text-muted-foreground">لا توجد مواد مطابقة للبحث.</td></tr>}
// // // //             {pageRows.map((row, index) => (
// // // //               <tr key={row.id} tabIndex={0} aria-selected={row.id === selectedBalanceId} onClick={() => setSelectedBalanceId(row.id)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedBalanceId(row.id); } }} className={`inventory-selectable-row border-t border-[#dae4d5] text-sm ${index % 2 ? "bg-[#e6f0df]" : "bg-white"} ${row.id === selectedBalanceId ? "is-selected" : ""}`}>
// // // //                 <td className="px-4 py-3 text-center text-muted-foreground"></td><td className="px-4 py-3 font-semibold text-slate-600">{displayCode(row.code)}</td><td className="px-5 py-3 font-bold"><div className="flex items-center gap-2">{row.id === selectedBalanceId && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0071ba]" />}<span>{row.name}</span><span className="text-xs font-normal text-muted-foreground">{row.unit}</span></div></td><td className="px-4 py-3 text-center">{formatPrintNumber(row.openingQuantity)}</td><td className="px-4 py-3 text-center">{formatPrintNumber(row.openingQuantity)}</td><td className="px-4 py-3 text-center font-semibold text-[#39744b]">{formatPrintNumber(row.inboundQuantity)}</td><td className="px-4 py-3 text-center"></td><td className="px-4 py-3 text-center font-semibold text-[#ab5062]">{formatPrintNumber(row.outboundQuantity)}</td><td className="px-4 py-3 text-center"></td><td className="px-4 py-3 text-center font-extrabold text-[#17698a]">{formatPrintNumber(row.onHandQuantity)}</td>
// // // //               </tr>
// // // //             ))}
// // // //           </tbody>
// // // //         </table></div>
// // // //         {!query.isLoading && !query.isError && filtered.length > 0 && <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"><p className="text-muted-foreground">عرض {((currentPage - 1) * MATERIALS_PER_PAGE + 1).toLocaleString("ar")}–{((currentPage - 1) * MATERIALS_PER_PAGE + filtered.length).toLocaleString("ar")} من نتائج البحث</p><div className="flex items-center gap-2"><Button type="button" variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(current => Math.max(1, current - 1))}>السابقة</Button><span className="min-w-20 text-center text-xs font-bold text-[#17698a]">صفحة {currentPage.toLocaleString("ar")}</span><Button type="button" variant="outline" size="sm" disabled={!hasMore} onClick={() => setPage(current => current + 1)}>التالية</Button></div></div>}
// // // //       </CardContent></Card>

// // // //       <Card className="soft-shadow border-white/75 bg-white/85"><CardContent className="p-5"><div className="grid gap-3 lg:grid-cols-[1.2fr_0.7fr_0.7fr_auto]">
// // // //         <div className="relative"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="h-10 rounded-xl pr-9" value={search} onChange={event => setSearch(event.target.value)} placeholder="ابحث باسم المادة أو رمزها أو باركودها في كل المواد" /></div>
// // // //         <div className="flex items-center gap-2"><span className="shrink-0 text-xs font-extrabold text-[#17698a]">من تاريخ</span><div className="relative min-w-0 flex-1"><CalendarRange className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="h-10 rounded-xl pr-9" value={fromDate} onChange={event => setFromDate(event.target.value)} type="date" aria-label="من تاريخ" /></div></div>
// // // //         <div className="flex items-center gap-2"><span className="shrink-0 text-xs font-extrabold text-[#17698a]">إلى تاريخ</span><div className="relative min-w-0 flex-1"><CalendarRange className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="h-10 rounded-xl pr-9" value={toDate} onChange={event => setToDate(event.target.value)} type="date" aria-label="إلى تاريخ" /></div></div>
// // // //         <div className="flex flex-wrap gap-2">
// // // //         {/* <Button onClick={exportExcel} className="rounded-xl bg-[#17698a] hover:bg-[#125875]"><FileSpreadsheet className="ml-2 h-4 w-4" />تصدير Excel</Button>
// // // //         <Button onClick={exportPdf} variant="outline" className="rounded-xl border-[#d47b32] text-[#a45a19] hover:bg-[#fff4e8]"><FileText className="ml-2 h-4 w-4" />تصدير PDF</Button>
// // // //         <Button onClick={exportCsv} variant="outline" className="rounded-xl border-[#8cc6dd] text-[#17698a]"><Download className="ml-2 h-4 w-4" />تصدير CSV</Button> */}
// // // //         </div>
// // // //       </div></CardContent></Card>

// // // //       <Card className="soft-shadow border-[#9bd8f0] bg-[#ecf9ff]"><CardContent className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-sm font-extrabold text-[#07518e]">طباعات حركة المواد</p><p className="mt-1 text-xs text-[#4b7792]">اختر صف المادة من الجدول ثم اطبع البطاقة الكاملة أو حركة الفترة المحددة. أما بقية الأزرار فتعتمد على الفترة والسجلات الظاهرة.</p>{selectedBalance && <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#83cdec] bg-white/80 px-3 py-2 text-xs text-[#07518e]"><CheckCircle2 className="h-4 w-4" /><span>المادة المحددة: <strong>{selectedBalance.name}</strong> — {displayCode(selectedBalance.code)}</span><button onClick={() => setSelectedBalanceId(null)} className="mr-1 rounded p-0.5 text-[#4b7792] hover:bg-sky-100" aria-label="إلغاء تحديد المادة"><X className="h-3.5 w-3.5" /></button></div>}</div><div className="flex flex-wrap gap-2">{reportsOnly ? <Button variant="outline" onClick={() => printReport("inventory")}><FileText className="ml-2 h-4 w-4" />تقرير الجرد</Button> : <><Button variant="outline" onClick={() => printReport("card")} className={selectedBalance ? "border-[#0071ba] bg-white text-[#0067ad]" : ""}><Tags className="ml-2 h-4 w-4" />بطاقة المادة</Button><Button variant="outline" onClick={() => printReport("cardRange")} className={selectedBalance ? "border-[#d47b32] bg-white text-[#a45a19]" : ""}><CalendarRange className="ml-2 h-4 w-4" />حركة مادة بين تاريخين</Button><Button variant="outline" onClick={() => printReport("inbound")}><FileDown className="ml-2 h-4 w-4" />بطاقة الإدخالات لكل المواد</Button><Button variant="outline" onClick={() => printReport("outbound")}><FileDown className="ml-2 h-4 w-4" />بطاقة الإخراجات لكل المواد</Button><Button variant="outline" onClick={() => printReport("inventory")}><FileText className="ml-2 h-4 w-4" />تقرير الجرد</Button><Button variant="outline" onClick={() => printReport("movementAll")}><FileText className="ml-2 h-4 w-4" />طباعة شهرية — المتحركة والثابتة</Button><Button variant="outline" onClick={() => printReport("movement")}><FileText className="ml-2 h-4 w-4" />طباعة شهرية — المتحركة فقط</Button></>}</div></div></CardContent></Card>
// // // //     </div>
// // // //   );
// // // // }




// // // import { Button } from "@/components/ui/button";
// // // import { Card, CardContent } from "@/components/ui/card";
// // // import { Input } from "@/components/ui/input";
// // // import { useAuth } from "@/_core/hooks/useAuth";
// // // import { buildMaterialCardRows } from "@/lib/materialCard";
// // // import { printOfficialReport, renderOfficialReport, type OfficialReportType } from "@/lib/officialReportPrint";
// // // import { openPrintWindow } from "@/lib/printWindow";
// // // import { trpc } from "@/lib/trpc";
// // // import { displayCode } from "@/lib/displayCode";
// // // import { formatPrintNumber } from "@/lib/printNumber";
// // // import { formatWholeQuantity } from "@/pages/Reports";
// // // import { CalendarRange, CheckCircle2, Download, FileDown, FileSpreadsheet, FileText, Search, Tags, X } from "lucide-react";
// // // import { useEffect, useMemo, useState } from "react";
// // // import * as XLSX from "xlsx";
// // // import { toast } from "sonner";

// // // type InventoryPrintMode = "card" | "cardRange" | "inbound" | "outbound" | "inventory" | "sub" | "movementAll" | "movement";
// // // type InventoryRow = { id: number; materialId: number; warehouseId: number; partyId: number | null; code: string; name: string; description: string | null; unit: string; openingQuantity: string; onHandQuantity: string; inboundQuantity: string; receiptQuantity: string; returnQuantity: string; outboundQuantity: string; warehouseName: string; partyName: string | null };
// // // const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
// // // const MATERIALS_PER_PAGE = 20;

// // // export default function InventoryPage() {
// // //   const { isAuthenticated } = useAuth();
// // //   const isDevelopment = import.meta.env.DEV;
// // //   const [search, setSearch] = useState("");
// // //   const [page, setPage] = useState(1);
// // //   const [fromDate, setFromDate] = useState("");
// // //   const [toDate, setToDate] = useState("");
// // //   const [selectedBalanceId, setSelectedBalanceId] = useState<number | null>(null);
// // //   const [cardTarget, setCardTarget] = useState<{ materialId: number } | null>(null);
// // //   const [cardWindow, setCardWindow] = useState<Window | null>(null);
// // //   const [cardPrintMode, setCardPrintMode] = useState<"all" | "range">("all");
// // //   const [reportWindow, setReportWindow] = useState<Window | null>(null);
// // //   const [reportMode, setReportMode] = useState<Exclude<InventoryPrintMode, "card" | "cardRange"> | null>(null);
// // //   const usePreview = isDevelopment && !isAuthenticated;
// // //   const filters = useMemo(() => ({ fromDate: fromDate ? new Date(`${fromDate}T00:00:00`) : undefined, toDate: toDate ? new Date(`${toDate}T23:59:59.999`) : undefined, search: search.trim() || undefined, limit: MATERIALS_PER_PAGE, offset: (page - 1) * MATERIALS_PER_PAGE }), [fromDate, page, search, toDate]);
// // //   const live = trpc.inventory.listBalances.useQuery(filters, { enabled: isAuthenticated });
// // //   const preview = trpc.inventory.previewBalances.useQuery(filters, { enabled: usePreview });
// // //   const query = usePreview ? preview : live;
// // //   const rows = (query.data?.rows ?? []) as InventoryRow[];
// // //   const hasMore = query.data?.hasMore ?? false;
// // //   const cardInput = cardTarget ?? { materialId: 1 };
// // //   const cardLive = trpc.inventory.materialCard.useQuery(cardInput, { enabled: Boolean(cardTarget) && isAuthenticated });
// // //   const cardPreview = trpc.inventory.previewMaterialCard.useQuery(cardInput, { enabled: Boolean(cardTarget) && usePreview });
// // //   const cardQuery = usePreview ? cardPreview : cardLive;
// // //   const filtered = rows;
// // //   const currentPage = page;
// // //   const pageRows = filtered;
// // //   const selectedBalance = useMemo(() => selectedBalanceId === null ? null : rows.find(row => row.id === selectedBalanceId) ?? null, [rows, selectedBalanceId]);

// // //   useEffect(() => { setPage(1); }, [search, fromDate, toDate]);

// // //   useEffect(() => {
// // //     if (!cardTarget || !cardWindow) return;
// // //     if (cardQuery.isError) {
// // //       toast.error(cardQuery.error.message || "تعذر تحميل حركة المادة لبطاقتها الرسمية.");
// // //       cardWindow.close();
// // //       setCardWindow(null);
// // //       setCardTarget(null);
// // //       return;
// // //     }
// // //     if (!cardQuery.data) return;
// // //     const card = cardQuery.data;
// // //     if (!card.name || !card.code) {
// // //       toast.error("تعذر جلب اسم المادة ورمزها. اختر صف المادة من الجدول ثم أعد المحاولة.");
// // //       cardWindow.close();
// // //       setCardWindow(null);
// // //       setCardTarget(null);
// // //       return;
// // //     }
// // //     const isRangeReport = cardPrintMode === "range";
// // //     const rows = isRangeReport
// // //       ? buildMaterialCardRows(card.movements, card.openingQuantity, fromDate, toDate)
// // //       : buildMaterialCardRows(card.movements, card.openingQuantity);
// // //     renderOfficialReport(cardWindow, {
// // //       title: isRangeReport ? "حركة مادة بين تاريخين" : "بطاقة المادة",
// // //       dateRange: isRangeReport ? `من ${fromDate} إلى ${toDate}` : "كامل الفترة المتاحة",
// // //       type: "materialCard",
// // //       material: { cardNumber: card.cardNumber, code: displayCode(card.code), name: card.name, description: card.description, unit: card.unit, minimumStock: card.minimumStock, maximumStock: null, notes: null },
// // //       rows,
// // //     });
// // //     setCardWindow(null);
// // //     setCardTarget(null);
// // //     setCardPrintMode("all");
// // //   }, [cardPrintMode, cardQuery.data, cardQuery.error, cardQuery.isError, cardTarget, cardWindow, fromDate, toDate]);

// // //   useEffect(() => {
// // //     const handleReportPage = (event: MessageEvent<{ type?: string; direction?: "previous" | "next" }>) => {
// // //       if (event.source !== reportWindow || event.data?.type !== "inventory-report-page") return;
// // //       setPage(current => event.data.direction === "previous" ? Math.max(1, current - 1) : hasMore ? current + 1 : current);
// // //     };
// // //     window.addEventListener("message", handleReportPage);
// // //     return () => window.removeEventListener("message", handleReportPage);
// // //   }, [hasMore, reportWindow]);

// // //   useEffect(() => {
// // //     if (!reportWindow || !reportMode) return;
// // //     if (reportWindow.closed) { setReportWindow(null); setReportMode(null); return; }
// // //     if (query.isFetching || query.isLoading) return;
// // //     if (query.isError) { toast.error("تعذر تحميل صفحة التقرير المطلوبة."); reportWindow.close(); setReportWindow(null); setReportMode(null); return; }
// // //     const scoped = reportMode === "movement" ? filtered.filter(row => Number(row.inboundQuantity) !== 0 || Number(row.outboundQuantity) !== 0) : filtered;
// // //     if (!scoped.length) { toast.info("لا توجد سجلات مطابقة لهذه الصفحة من التقرير."); reportWindow.close(); setReportWindow(null); setReportMode(null); return; }
// // //     const type: OfficialReportType = reportMode === "inbound" ? "inboundJournal" : reportMode === "outbound" ? "outboundJournal" : reportMode === "inventory" ? "inventory" : "monthlyMovement";
// // //     const title = reportMode === "inbound" ? "بطاقة الإدخالات" : reportMode === "outbound" ? "بطاقة الإخراجات" : reportMode === "inventory" ? "جدول الجرد" : reportMode === "sub" ? "كشف فرعي" : reportMode === "movementAll" ? "طباعة شهرية — المتحركة والثابتة" : "طباعة شهرية — المتحركة فقط";
// // //     const period = fromDate || toDate ? `من ${fromDate || ""} إلى ${toDate || ""}` : "";
// // //     const officialRows: Array<Array<string | number>> = scoped.map((row, index) => {
// // //       const serial = (currentPage - 1) * MATERIALS_PER_PAGE + index + 1;
// // //       if (reportMode === "inbound") return [serial, "", "", displayCode(row.code), row.name, "", row.unit, row.inboundQuantity, ""];
// // //       if (reportMode === "outbound") return [serial, "", "", displayCode(row.code), row.name, "", row.unit, row.outboundQuantity, row.partyName || "", ""];
// // //       if (reportMode === "inventory") return [serial, displayCode(row.code), row.name, row.description || "", row.unit, "", row.unit, formatWholeQuantity(row.onHandQuantity), row.unit, formatWholeQuantity(row.onHandQuantity), "", "", "", "", ""];
// // //       return [serial, displayCode(row.code), row.name, "", row.openingQuantity, Number(row.receiptQuantity) > 0 ? row.receiptQuantity : "", Number(row.returnQuantity) > 0 ? row.returnQuantity : "", row.outboundQuantity, row.onHandQuantity, ""];
// // //     });
// // //     renderOfficialReport(reportWindow, { title, dateRange: period, rows: officialRows, type, pagination: { page: currentPage, hasPrevious: currentPage > 1, hasNext: hasMore } });
// // //   }, [currentPage, filtered, fromDate, hasMore, query.isError, query.isFetching, query.isLoading, reportMode, reportWindow, toDate]);

// // //   const printReport = (mode: InventoryPrintMode) => {
// // //     if (mode === "card" || mode === "cardRange") {
// // //       if (!selectedBalance) { toast.info("اختر المادة من صف الجدول أولًا ثم اضغط «بطاقة المادة». "); return; }
// // //       if (mode === "cardRange" && (!fromDate || !toDate)) { toast.info("حدد تاريخ البداية وتاريخ النهاية أولًا لطباعة حركة المادة."); return; }
// // //       const page = openPrintWindow(mode === "cardRange" ? "حركة مادة بين تاريخين" : "بطاقة المادة");
// // //       if (!page) { toast.error("تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة."); return; }
// // //       setCardWindow(page);
// // //       setCardPrintMode(mode === "cardRange" ? "range" : "all");
// // //       setCardTarget({ materialId: selectedBalance.materialId });
// // //       return;
// // //     }
// // //     const page = openPrintWindow("معاينة التقرير");
// // //     if (!page) { toast.error("تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة."); return; }
// // //     setReportMode(mode);
// // //     setReportWindow(page);
// // //   };

// // //   const movementExportColumns = ["التسلسل", "رمز المادة", "اسم المادة", "الوصف", "رصيد أول شهر", "استلام شهر", "إدخال شهر", "إخراجات شهر", "الرصيد", "ملاحظات"];
// // //   const movementExportRows = filtered.map((row, index) => [index + 1, displayCode(row.code), row.name, row.description || "", formatPrintNumber(row.openingQuantity), Number(row.receiptQuantity) > 0 ? formatPrintNumber(row.receiptQuantity) : "", Number(row.returnQuantity) > 0 ? formatPrintNumber(row.returnQuantity) : "", formatPrintNumber(row.outboundQuantity), formatPrintNumber(row.onHandQuantity), ""]);
// // //   const exportExcel = () => {
// // //     if (!movementExportRows.length) { toast.info("لا توجد بيانات ظاهرة لتصديرها."); return; }
// // //     const worksheet = XLSX.utils.aoa_to_sheet([movementExportColumns, ...movementExportRows]);
// // //     worksheet["!rtl"] = true;
// // //     const workbook = XLSX.utils.book_new();
// // //     XLSX.utils.book_append_sheet(workbook, worksheet, "حركة المواد");
// // //     XLSX.writeFile(workbook, `حركة-المواد-${new Date().toISOString().slice(0, 10)}.xlsx`);
// // //     toast.success("تم تنزيل جدول حركة المواد بصيغة Excel.");
// // //   };
// // //   const exportPdf = () => {
// // //     if (!movementExportRows.length) { toast.info("لا توجد بيانات ظاهرة لتصديرها."); return; }
// // //     if (!printOfficialReport({ title: "حركة المواد", dateRange: fromDate || toDate ? `من ${fromDate || "بداية الفترة"} إلى ${toDate || "اليوم"}` : "كامل الفترة المتاحة", rows: movementExportRows, type: "monthlyMovement" })) toast.error("تعذر فتح معاينة PDF.");
// // //   };

// // //   const exportCsv = () => {
// // //     if (!filtered.length) { toast.info("لا توجد بيانات ظاهرة لتصديرها."); return; }
// // //     const heading = ["رقم البطاقة", "رمز المادة", "اسم المادة", "كمية أول مدة", "الرصيد السابق", "كمية الاستلام", "كمية الإدخال", "كمية التسليم", "كمية الإخراج", "الرصيد الحالي", "المستودع", "الجهة"];
// // //     const values = filtered.map(row => ["", displayCode(row.code), row.name, row.openingQuantity, row.openingQuantity, row.inboundQuantity, "", row.outboundQuantity, "", row.onHandQuantity, row.warehouseName, row.partyName || ""]);
// // //     const url = URL.createObjectURL(new Blob(["\uFEFF", [heading, ...values].map(row => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }));
// // //     const anchor = document.createElement("a");
// // //     anchor.href = url;
// // //     anchor.download = "inventory-movement.csv";
// // //     anchor.click();
// // //     URL.revokeObjectURL(url);
// // //     toast.success("تم تنزيل حركة المواد بصيغة CSV المتوافقة مع Excel.");
// // //   };

// // //   return (
// // //     <div className="mx-auto max-w-[1480px] space-y-6" dir="rtl">
// // //       <section>
// // //         <p className="text-sm font-semibold text-[#17698a]">المستودع / حركة المواد</p>
// // //         <h1 className="mt-1 text-3xl font-extrabold tracking-tight">حركة المواد بالمستودعات</h1>
// // //       </section>

// // //       <Card className="soft-shadow overflow-hidden border-white/75 bg-white/85"><CardContent className="p-0">
// // //         <div className="border-b border-slate-100 px-6 py-5"><h2 className="font-extrabold">حركة المواد</h2></div>
// // //         <div className="overflow-x-auto"><table className="inventory-compact-table w-full min-w-[1120px] text-right">
// // //           <thead className="bg-[#d9e4ee] text-xs font-bold text-slate-700"><tr><th className="px-2.5 py-2">رقم البطاقة</th><th className="px-2.5 py-2">رمز المادة</th><th className="px-2.5 py-2">اسم المادة</th><th className="px-2.5 py-2">كمية أول مدة</th><th className="px-2.5 py-2">الرصيد السابق</th><th className="px-2.5 py-2">كمية الاستلام</th><th className="px-2.5 py-2">كمية الإدخال</th><th className="px-2.5 py-2">كمية التسليم</th><th className="px-2.5 py-2">كمية الإخراج</th><th className="px-2.5 py-2">الرصيد الحالي</th></tr></thead>
// // //           <tbody>
// // //             {query.isLoading && <tr><td colSpan={10} className="px-5 py-10 text-center text-sm text-muted-foreground">جار تحميل الأرصدة…</td></tr>}
// // //             {query.isError && <tr><td colSpan={10} className="px-5 py-10 text-center text-sm text-destructive">تعذر تحميل الأرصدة.</td></tr>}
// // //             {!query.isLoading && !query.isError && filtered.length === 0 && <tr><td colSpan={10} className="px-5 py-10 text-center text-sm text-muted-foreground">لا توجد مواد مطابقة للبحث.</td></tr>}
// // //             {pageRows.map((row, index) => (
// // //               <tr key={row.id} tabIndex={0} aria-selected={row.id === selectedBalanceId} onClick={() => setSelectedBalanceId(row.id)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedBalanceId(row.id); } }} className={`inventory-selectable-row border-t border-[#dae4d5] text-sm ${index % 2 ? "bg-[#e6f0df]" : "bg-white"} ${row.id === selectedBalanceId ? "is-selected" : ""}`}>
// // //                 <td className="px-4 py-3 text-center text-muted-foreground"></td><td className="px-4 py-3 font-semibold text-slate-600">{displayCode(row.code)}</td><td className="px-5 py-3 font-bold"><div className="flex items-center gap-2">{row.id === selectedBalanceId && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0071ba]" />}<span>{row.name}</span><span className="text-xs font-normal text-muted-foreground">{row.unit}</span></div></td><td className="px-4 py-3 text-center">{formatPrintNumber(row.openingQuantity)}</td><td className="px-4 py-3 text-center">{formatPrintNumber(row.openingQuantity)}</td><td className="px-4 py-3 text-center font-semibold text-[#39744b]">{formatPrintNumber(row.inboundQuantity)}</td><td className="px-4 py-3 text-center"></td><td className="px-4 py-3 text-center font-semibold text-[#ab5062]">{formatPrintNumber(row.outboundQuantity)}</td><td className="px-4 py-3 text-center"></td><td className="px-4 py-3 text-center font-extrabold text-[#17698a]">{formatPrintNumber(row.onHandQuantity)}</td>
// // //               </tr>
// // //             ))}
// // //           </tbody>
// // //         </table></div>
// // //         {!query.isLoading && !query.isError && filtered.length > 0 && <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"><p className="text-muted-foreground">عرض {((currentPage - 1) * MATERIALS_PER_PAGE + 1).toLocaleString("ar")}–{((currentPage - 1) * MATERIALS_PER_PAGE + filtered.length).toLocaleString("ar")} من نتائج البحث</p><div className="flex items-center gap-2"><Button type="button" variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(current => Math.max(1, current - 1))}>السابقة</Button><span className="min-w-20 text-center text-xs font-bold text-[#17698a]">صفحة {currentPage.toLocaleString("ar")}</span><Button type="button" variant="outline" size="sm" disabled={!hasMore} onClick={() => setPage(current => current + 1)}>التالية</Button></div></div>}
// // //       </CardContent></Card>

// // //       <Card className="soft-shadow border-white/75 bg-white/85"><CardContent className="p-5"><div className="grid gap-3 lg:grid-cols-[1.2fr_0.7fr_0.7fr_auto]">
// // //         <div className="relative"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="h-10 rounded-xl pr-9" value={search} onChange={event => setSearch(event.target.value)} placeholder="ابحث باسم المادة أو رمزها أو باركودها في كل المواد" /></div>
// // //         <div className="flex items-center gap-2"><span className="shrink-0 text-xs font-extrabold text-[#17698a]">من تاريخ</span><div className="relative min-w-0 flex-1"><CalendarRange className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="h-10 rounded-xl pr-9" value={fromDate} onChange={event => setFromDate(event.target.value)} type="date" aria-label="من تاريخ" /></div></div>
// // //         <div className="flex items-center gap-2"><span className="shrink-0 text-xs font-extrabold text-[#17698a]">إلى تاريخ</span><div className="relative min-w-0 flex-1"><CalendarRange className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="h-10 rounded-xl pr-9" value={toDate} onChange={event => setToDate(event.target.value)} type="date" aria-label="إلى تاريخ" /></div></div>
// // //         {/* <div className="flex flex-wrap gap-2"><Button onClick={exportExcel} className="rounded-xl bg-[#17698a] hover:bg-[#125875]"><FileSpreadsheet className="ml-2 h-4 w-4" />تصدير Excel</Button><Button onClick={exportPdf} variant="outline" className="rounded-xl border-[#d47b32] text-[#a45a19] hover:bg-[#fff4e8]"><FileText className="ml-2 h-4 w-4" />تصدير PDF</Button><Button onClick={exportCsv} variant="outline" className="rounded-xl border-[#8cc6dd] text-[#17698a]"><Download className="ml-2 h-4 w-4" />تصدير CSV</Button></div> */}
// // //       </div></CardContent></Card>

// // //       <Card className="soft-shadow border-[#9bd8f0] bg-[#ecf9ff]"><CardContent className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-sm font-extrabold text-[#07518e]">طباعات حركة المواد</p><p className="mt-1 text-xs text-[#4b7792]">اختر صف المادة من الجدول ثم اطبع البطاقة الكاملة أو حركة الفترة المحددة. أما بقية الأزرار فتعتمد على الفترة والسجلات الظاهرة.</p>{selectedBalance && <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#83cdec] bg-white/80 px-3 py-2 text-xs text-[#07518e]"><CheckCircle2 className="h-4 w-4" /><span>المادة المحددة: <strong>{selectedBalance.name}</strong> — {displayCode(selectedBalance.code)}</span><button onClick={() => setSelectedBalanceId(null)} className="mr-1 rounded p-0.5 text-[#4b7792] hover:bg-sky-100" aria-label="إلغاء تحديد المادة"><X className="h-3.5 w-3.5" /></button></div>}</div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => printReport("card")} className={selectedBalance ? "border-[#0071ba] bg-white text-[#0067ad]" : ""}><Tags className="ml-2 h-4 w-4" />بطاقة المادة</Button><Button variant="outline" onClick={() => printReport("cardRange")} className={selectedBalance ? "border-[#d47b32] bg-white text-[#a45a19]" : ""}><CalendarRange className="ml-2 h-4 w-4" />حركة مادة بين تاريخين</Button><Button variant="outline" onClick={() => printReport("inbound")}><FileDown className="ml-2 h-4 w-4" />بطاقة الإدخالات لكل المواد</Button><Button variant="outline" onClick={() => printReport("outbound")}><FileDown className="ml-2 h-4 w-4" />بطاقة الإخراجات لكل المواد</Button><Button variant="outline" onClick={() => printReport("inventory")}><FileText className="ml-2 h-4 w-4" />تقرير الجرد</Button><Button variant="outline" onClick={() => printReport("movementAll")}><FileText className="ml-2 h-4 w-4" />طباعة شهرية — المتحركة والثابتة</Button><Button variant="outline" onClick={() => printReport("movement")}><FileText className="ml-2 h-4 w-4" />طباعة شهرية — المتحركة فقط</Button></div></div></CardContent></Card>
// // //     </div>
// // //   );
// // // }



// // import { Button } from "@/components/ui/button";
// // import { Card, CardContent } from "@/components/ui/card";
// // import { Input } from "@/components/ui/input";
// // import { useAuth } from "@/_core/hooks/useAuth";
// // import { buildMaterialCardRows } from "@/lib/materialCard";
// // import { printOfficialReport, renderOfficialReport, type OfficialReportType } from "@/lib/officialReportPrint";
// // import { openPrintWindow } from "@/lib/printWindow";
// // import { trpc } from "@/lib/trpc";
// // import { displayCode } from "@/lib/displayCode";
// // import { formatPrintNumber } from "@/lib/printNumber";
// // import { formatWholeQuantity } from "@/pages/Reports";
// // import { CalendarRange, CheckCircle2, Download, FileDown, FileSpreadsheet, FileText, Search, Tags, X } from "lucide-react";
// // import { useEffect, useMemo, useState } from "react";
// // import * as XLSX from "xlsx";
// // import { toast } from "sonner";

// // type InventoryPrintMode = "card" | "cardRange" | "inbound" | "outbound" | "inventory" | "sub" | "movementAll" | "movement";
// // type InventoryRow = { id: number; materialId: number; warehouseId: number; partyId: number | null; code: string; name: string; description: string | null; unit: string; openingQuantity: string; onHandQuantity: string; inboundQuantity: string; receiptQuantity: string; returnQuantity: string; outboundQuantity: string; warehouseName: string; partyName: string | null };
// // const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
// // const MATERIALS_PER_PAGE = 20;

// // export default function InventoryPage() {
// //   const { isAuthenticated } = useAuth();
// //   const isDevelopment = import.meta.env.DEV;
// //   const [search, setSearch] = useState("");
// //   const [page, setPage] = useState(1);
// //   const [fromDate, setFromDate] = useState("");
// //   const [toDate, setToDate] = useState("");
// //   const [selectedBalanceId, setSelectedBalanceId] = useState<number | null>(null);
// //   const [cardTarget, setCardTarget] = useState<{ materialId: number } | null>(null);
// //   const [cardWindow, setCardWindow] = useState<Window | null>(null);
// //   const [cardPrintMode, setCardPrintMode] = useState<"all" | "range">("all");
// //   const [reportWindow, setReportWindow] = useState<Window | null>(null);
// //   const [reportMode, setReportMode] = useState<Exclude<InventoryPrintMode, "card" | "cardRange"> | null>(null);
// //   const usePreview = isDevelopment && !isAuthenticated;
// //   const filters = useMemo(() => ({ fromDate: fromDate ? new Date(`${fromDate}T00:00:00`) : undefined, toDate: toDate ? new Date(`${toDate}T23:59:59.999`) : undefined, search: search.trim() || undefined, limit: MATERIALS_PER_PAGE, offset: (page - 1) * MATERIALS_PER_PAGE }), [fromDate, page, search, toDate]);
// //   const live = trpc.inventory.listBalances.useQuery(filters, { enabled: isAuthenticated });
// //   const preview = trpc.inventory.previewBalances.useQuery(filters, { enabled: usePreview });
// //   const query = usePreview ? preview : live;
// //   const rows = (query.data?.rows ?? []) as InventoryRow[];
// //   const hasMore = query.data?.hasMore ?? false;
// //   const cardInput = cardTarget ?? { materialId: 1 };
// //   const cardLive = trpc.inventory.materialCard.useQuery(cardInput, { enabled: Boolean(cardTarget) && isAuthenticated });
// //   const cardPreview = trpc.inventory.previewMaterialCard.useQuery(cardInput, { enabled: Boolean(cardTarget) && usePreview });
// //   const cardQuery = usePreview ? cardPreview : cardLive;
// //   const filtered = rows;
// //   const currentPage = page;
// //   const pageRows = filtered;
// //   const selectedBalance = useMemo(() => selectedBalanceId === null ? null : rows.find(row => row.id === selectedBalanceId) ?? null, [rows, selectedBalanceId]);

// //   useEffect(() => { setPage(1); }, [search, fromDate, toDate]);

// //   useEffect(() => {
// //     if (!cardTarget || !cardWindow) return;
// //     if (cardQuery.isError) {
// //       toast.error(cardQuery.error.message || "تعذر تحميل حركة المادة لبطاقتها الرسمية.");
// //       cardWindow.close();
// //       setCardWindow(null);
// //       setCardTarget(null);
// //       return;
// //     }
// //     if (!cardQuery.data) return;
// //     const card = cardQuery.data;
// //     if (!card.name || !card.code) {
// //       toast.error("تعذر جلب اسم المادة ورمزها. اختر صف المادة من الجدول ثم أعد المحاولة.");
// //       cardWindow.close();
// //       setCardWindow(null);
// //       setCardTarget(null);
// //       return;
// //     }
// //     const isRangeReport = cardPrintMode === "range";
// //     const rows = isRangeReport
// //       ? buildMaterialCardRows(card.movements, card.openingQuantity, fromDate, toDate)
// //       : buildMaterialCardRows(card.movements, card.openingQuantity);
// //     renderOfficialReport(cardWindow, {
// //       title: isRangeReport ? "حركة مادة بين تاريخين" : "بطاقة المادة",
// //       dateRange: isRangeReport ? `من ${fromDate} إلى ${toDate}` : "كامل الفترة المتاحة",
// //       type: "materialCard",
// //       material: { cardNumber: card.cardNumber, code: displayCode(card.code), name: card.name, description: card.description, unit: card.unit, minimumStock: card.minimumStock, maximumStock: null, notes: null },
// //       rows,
// //     });
// //     setCardWindow(null);
// //     setCardTarget(null);
// //     setCardPrintMode("all");
// //   }, [cardPrintMode, cardQuery.data, cardQuery.error, cardQuery.isError, cardTarget, cardWindow, fromDate, toDate]);

// //   useEffect(() => {
// //     const handleReportPage = (event: MessageEvent<{ type?: string; direction?: "previous" | "next" }>) => {
// //       if (event.data?.type !== "inventory-report-page") return;
// //       setPage(current => event.data.direction === "previous" ? Math.max(1, current - 1) : current + 1);
// //     };
// //     window.addEventListener("message", handleReportPage);
// //     return () => window.removeEventListener("message", handleReportPage);
// //   }, []);

// //   useEffect(() => {
// //     if (!reportWindow || !reportMode) return;
// //     if (reportWindow.closed) { setReportWindow(null); setReportMode(null); return; }
// //     if (query.isFetching || query.isLoading) return;
// //     if (query.isError) { toast.error("تعذر تحميل صفحة التقرير المطلوبة."); reportWindow.close(); setReportWindow(null); setReportMode(null); return; }
// //     const scoped = reportMode === "movement" ? filtered.filter(row => Number(row.inboundQuantity) !== 0 || Number(row.outboundQuantity) !== 0) : filtered;
// //     if (!scoped.length) {
// //       if (currentPage > 1) { toast.info("وصلت إلى آخر صفحة متاحة من التقرير."); setPage(current => current - 1); return; }
// //       toast.info("لا توجد سجلات مطابقة لهذه الصفحة من التقرير."); reportWindow.close(); setReportWindow(null); setReportMode(null); return;
// //     }
// //     const type: OfficialReportType = reportMode === "inbound" ? "inboundJournal" : reportMode === "outbound" ? "outboundJournal" : reportMode === "inventory" ? "inventory" : "monthlyMovement";
// //     const title = reportMode === "inbound" ? "بطاقة الإدخالات" : reportMode === "outbound" ? "بطاقة الإخراجات" : reportMode === "inventory" ? "جدول الجرد" : reportMode === "sub" ? "كشف فرعي" : reportMode === "movementAll" ? "طباعة شهرية — المتحركة والثابتة" : "طباعة شهرية — المتحركة فقط";
// //     const period = fromDate || toDate ? `من ${fromDate || ""} إلى ${toDate || ""}` : "";
// //     const officialRows: Array<Array<string | number>> = scoped.map((row, index) => {
// //       const serial = (currentPage - 1) * MATERIALS_PER_PAGE + index + 1;
// //       if (reportMode === "inbound") return [serial, "", "", displayCode(row.code), row.name, "", row.unit, row.inboundQuantity, ""];
// //       if (reportMode === "outbound") return [serial, "", "", displayCode(row.code), row.name, "", row.unit, row.outboundQuantity, row.partyName || "", ""];
// //       if (reportMode === "inventory") return [serial, displayCode(row.code), row.name, row.description || "", row.unit, "", row.unit, formatWholeQuantity(row.onHandQuantity), row.unit, formatWholeQuantity(row.onHandQuantity), "", "", "", "", ""];
// //       return [serial, displayCode(row.code), row.name, "", row.openingQuantity, Number(row.receiptQuantity) > 0 ? row.receiptQuantity : "", Number(row.returnQuantity) > 0 ? row.returnQuantity : "", row.outboundQuantity, row.onHandQuantity, ""];
// //     });
// //     renderOfficialReport(reportWindow, { title, dateRange: period, rows: officialRows, type, pagination: { page: currentPage, hasPrevious: currentPage > 1, hasNext: hasMore || filtered.length === MATERIALS_PER_PAGE } });
// //   }, [currentPage, filtered, fromDate, hasMore, query.isError, query.isFetching, query.isLoading, reportMode, reportWindow, toDate]);

// //   const printReport = (mode: InventoryPrintMode) => {
// //     if (mode === "card" || mode === "cardRange") {
// //       if (!selectedBalance) { toast.info("اختر المادة من صف الجدول أولًا ثم اضغط «بطاقة المادة». "); return; }
// //       if (mode === "cardRange" && (!fromDate || !toDate)) { toast.info("حدد تاريخ البداية وتاريخ النهاية أولًا لطباعة حركة المادة."); return; }
// //       const page = openPrintWindow(mode === "cardRange" ? "حركة مادة بين تاريخين" : "بطاقة المادة");
// //       if (!page) { toast.error("تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة."); return; }
// //       setCardWindow(page);
// //       setCardPrintMode(mode === "cardRange" ? "range" : "all");
// //       setCardTarget({ materialId: selectedBalance.materialId });
// //       return;
// //     }
// //     const page = openPrintWindow("معاينة التقرير");
// //     if (!page) { toast.error("تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة."); return; }
// //     setReportMode(mode);
// //     setReportWindow(page);
// //   };

// //   const movementExportColumns = ["التسلسل", "رمز المادة", "اسم المادة", "الوصف", "رصيد أول شهر", "استلام شهر", "إدخال شهر", "إخراجات شهر", "الرصيد", "ملاحظات"];
// //   const movementExportRows = filtered.map((row, index) => [index + 1, displayCode(row.code), row.name, row.description || "", formatPrintNumber(row.openingQuantity), Number(row.receiptQuantity) > 0 ? formatPrintNumber(row.receiptQuantity) : "", Number(row.returnQuantity) > 0 ? formatPrintNumber(row.returnQuantity) : "", formatPrintNumber(row.outboundQuantity), formatPrintNumber(row.onHandQuantity), ""]);
// //   const exportExcel = () => {
// //     if (!movementExportRows.length) { toast.info("لا توجد بيانات ظاهرة لتصديرها."); return; }
// //     const worksheet = XLSX.utils.aoa_to_sheet([movementExportColumns, ...movementExportRows]);
// //     worksheet["!rtl"] = true;
// //     const workbook = XLSX.utils.book_new();
// //     XLSX.utils.book_append_sheet(workbook, worksheet, "حركة المواد");
// //     XLSX.writeFile(workbook, `حركة-المواد-${new Date().toISOString().slice(0, 10)}.xlsx`);
// //     toast.success("تم تنزيل جدول حركة المواد بصيغة Excel.");
// //   };
// //   const exportPdf = () => {
// //     if (!movementExportRows.length) { toast.info("لا توجد بيانات ظاهرة لتصديرها."); return; }
// //     if (!printOfficialReport({ title: "حركة المواد", dateRange: fromDate || toDate ? `من ${fromDate || "بداية الفترة"} إلى ${toDate || "اليوم"}` : "كامل الفترة المتاحة", rows: movementExportRows, type: "monthlyMovement" })) toast.error("تعذر فتح معاينة PDF.");
// //   };

// //   const exportCsv = () => {
// //     if (!filtered.length) { toast.info("لا توجد بيانات ظاهرة لتصديرها."); return; }
// //     const heading = ["رقم البطاقة", "رمز المادة", "اسم المادة", "كمية أول مدة", "الرصيد السابق", "كمية الاستلام", "كمية الإدخال", "كمية التسليم", "كمية الإخراج", "الرصيد الحالي", "المستودع", "الجهة"];
// //     const values = filtered.map(row => ["", displayCode(row.code), row.name, row.openingQuantity, row.openingQuantity, row.inboundQuantity, "", row.outboundQuantity, "", row.onHandQuantity, row.warehouseName, row.partyName || ""]);
// //     const url = URL.createObjectURL(new Blob(["\uFEFF", [heading, ...values].map(row => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }));
// //     const anchor = document.createElement("a");
// //     anchor.href = url;
// //     anchor.download = "inventory-movement.csv";
// //     anchor.click();
// //     URL.revokeObjectURL(url);
// //     toast.success("تم تنزيل حركة المواد بصيغة CSV المتوافقة مع Excel.");
// //   };

// //   return (
// //     <div className="mx-auto max-w-[1480px] space-y-6" dir="rtl">
// //       <section>
// //         <p className="text-sm font-semibold text-[#17698a]">المستودع / حركة المواد</p>
// //         <h1 className="mt-1 text-3xl font-extrabold tracking-tight">حركة المواد بالمستودعات</h1>
// //       </section>

// //       <Card className="soft-shadow overflow-hidden border-white/75 bg-white/85"><CardContent className="p-0">
// //         <div className="border-b border-slate-100 px-6 py-5"><h2 className="font-extrabold">حركة المواد</h2></div>
// //         <div className="overflow-x-auto"><table className="inventory-compact-table w-full min-w-[1120px] text-right">
// //           <thead className="bg-[#d9e4ee] text-xs font-bold text-slate-700"><tr><th className="px-2.5 py-2">رقم البطاقة</th><th className="px-2.5 py-2">رمز المادة</th><th className="px-2.5 py-2">اسم المادة</th><th className="px-2.5 py-2">كمية أول مدة</th><th className="px-2.5 py-2">الرصيد السابق</th><th className="px-2.5 py-2">كمية الاستلام</th><th className="px-2.5 py-2">كمية الإدخال</th><th className="px-2.5 py-2">كمية التسليم</th><th className="px-2.5 py-2">كمية الإخراج</th><th className="px-2.5 py-2">الرصيد الحالي</th></tr></thead>
// //           <tbody>
// //             {query.isLoading && <tr><td colSpan={10} className="px-5 py-10 text-center text-sm text-muted-foreground">جار تحميل الأرصدة…</td></tr>}
// //             {query.isError && <tr><td colSpan={10} className="px-5 py-10 text-center text-sm text-destructive">تعذر تحميل الأرصدة.</td></tr>}
// //             {!query.isLoading && !query.isError && filtered.length === 0 && <tr><td colSpan={10} className="px-5 py-10 text-center text-sm text-muted-foreground">لا توجد مواد مطابقة للبحث.</td></tr>}
// //             {pageRows.map((row, index) => (
// //               <tr key={row.id} tabIndex={0} aria-selected={row.id === selectedBalanceId} onClick={() => setSelectedBalanceId(row.id)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedBalanceId(row.id); } }} className={`inventory-selectable-row border-t border-[#dae4d5] text-sm ${index % 2 ? "bg-[#e6f0df]" : "bg-white"} ${row.id === selectedBalanceId ? "is-selected" : ""}`}>
// //                 <td className="px-4 py-3 text-center text-muted-foreground"></td><td className="px-4 py-3 font-semibold text-slate-600">{displayCode(row.code)}</td><td className="px-5 py-3 font-bold"><div className="flex items-center gap-2">{row.id === selectedBalanceId && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0071ba]" />}<span>{row.name}</span><span className="text-xs font-normal text-muted-foreground">{row.unit}</span></div></td><td className="px-4 py-3 text-center">{formatPrintNumber(row.openingQuantity)}</td><td className="px-4 py-3 text-center">{formatPrintNumber(row.openingQuantity)}</td><td className="px-4 py-3 text-center font-semibold text-[#39744b]">{formatPrintNumber(row.inboundQuantity)}</td><td className="px-4 py-3 text-center"></td><td className="px-4 py-3 text-center font-semibold text-[#ab5062]">{formatPrintNumber(row.outboundQuantity)}</td><td className="px-4 py-3 text-center"></td><td className="px-4 py-3 text-center font-extrabold text-[#17698a]">{formatPrintNumber(row.onHandQuantity)}</td>
// //               </tr>
// //             ))}
// //           </tbody>
// //         </table></div>
// //         {!query.isLoading && !query.isError && filtered.length > 0 && <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"><p className="text-muted-foreground">عرض {((currentPage - 1) * MATERIALS_PER_PAGE + 1).toLocaleString("ar")}–{((currentPage - 1) * MATERIALS_PER_PAGE + filtered.length).toLocaleString("ar")} من نتائج البحث</p><div className="flex items-center gap-2"><Button type="button" variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(current => Math.max(1, current - 1))}>السابقة</Button><span className="min-w-20 text-center text-xs font-bold text-[#17698a]">صفحة {currentPage.toLocaleString("ar")}</span><Button type="button" variant="outline" size="sm" disabled={!hasMore} onClick={() => setPage(current => current + 1)}>التالية</Button></div></div>}
// //       </CardContent></Card>

// //       <Card className="soft-shadow border-white/75 bg-white/85"><CardContent className="p-5"><div className="grid gap-3 lg:grid-cols-[1.2fr_0.7fr_0.7fr_auto]">
// //         <div className="relative"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="h-10 rounded-xl pr-9" value={search} onChange={event => setSearch(event.target.value)} placeholder="ابحث باسم المادة أو رمزها أو باركودها في كل المواد" /></div>
// //         <div className="flex items-center gap-2"><span className="shrink-0 text-xs font-extrabold text-[#17698a]">من تاريخ</span><div className="relative min-w-0 flex-1"><CalendarRange className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="h-10 rounded-xl pr-9" value={fromDate} onChange={event => setFromDate(event.target.value)} type="date" aria-label="من تاريخ" /></div></div>
// //         <div className="flex items-center gap-2"><span className="shrink-0 text-xs font-extrabold text-[#17698a]">إلى تاريخ</span><div className="relative min-w-0 flex-1"><CalendarRange className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="h-10 rounded-xl pr-9" value={toDate} onChange={event => setToDate(event.target.value)} type="date" aria-label="إلى تاريخ" /></div></div>
// //         {/* <div className="flex flex-wrap gap-2"><Button onClick={exportExcel} className="rounded-xl bg-[#17698a] hover:bg-[#125875]"><FileSpreadsheet className="ml-2 h-4 w-4" />تصدير Excel</Button><Button onClick={exportPdf} variant="outline" className="rounded-xl border-[#d47b32] text-[#a45a19] hover:bg-[#fff4e8]"><FileText className="ml-2 h-4 w-4" />تصدير PDF</Button><Button onClick={exportCsv} variant="outline" className="rounded-xl border-[#8cc6dd] text-[#17698a]"><Download className="ml-2 h-4 w-4" />تصدير CSV</Button></div> */}
// //       </div></CardContent></Card>

// //       <Card className="soft-shadow border-[#9bd8f0] bg-[#ecf9ff]"><CardContent className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-sm font-extrabold text-[#07518e]">طباعات حركة المواد</p><p className="mt-1 text-xs text-[#4b7792]">اختر صف المادة من الجدول ثم اطبع البطاقة الكاملة أو حركة الفترة المحددة. أما بقية الأزرار فتعتمد على الفترة والسجلات الظاهرة.</p>{selectedBalance && <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#83cdec] bg-white/80 px-3 py-2 text-xs text-[#07518e]"><CheckCircle2 className="h-4 w-4" /><span>المادة المحددة: <strong>{selectedBalance.name}</strong> — {displayCode(selectedBalance.code)}</span><button onClick={() => setSelectedBalanceId(null)} className="mr-1 rounded p-0.5 text-[#4b7792] hover:bg-sky-100" aria-label="إلغاء تحديد المادة"><X className="h-3.5 w-3.5" /></button></div>}</div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => printReport("card")} className={selectedBalance ? "border-[#0071ba] bg-white text-[#0067ad]" : ""}><Tags className="ml-2 h-4 w-4" />بطاقة المادة</Button><Button variant="outline" onClick={() => printReport("cardRange")} className={selectedBalance ? "border-[#d47b32] bg-white text-[#a45a19]" : ""}><CalendarRange className="ml-2 h-4 w-4" />حركة مادة بين تاريخين</Button><Button variant="outline" onClick={() => printReport("inbound")}><FileDown className="ml-2 h-4 w-4" />بطاقة الإدخالات لكل المواد</Button><Button variant="outline" onClick={() => printReport("outbound")}><FileDown className="ml-2 h-4 w-4" />بطاقة الإخراجات لكل المواد</Button><Button variant="outline" onClick={() => printReport("inventory")}><FileText className="ml-2 h-4 w-4" />تقرير الجرد</Button><Button variant="outline" onClick={() => printReport("movementAll")}><FileText className="ml-2 h-4 w-4" />طباعة شهرية — المتحركة والثابتة</Button><Button variant="outline" onClick={() => printReport("movement")}><FileText className="ml-2 h-4 w-4" />طباعة شهرية — المتحركة فقط</Button></div></div></CardContent></Card>
// //     </div>
// //   );
// // }


// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { useAuth } from "@/_core/hooks/useAuth";
// import { buildMaterialCardRows } from "@/lib/materialCard";
// import { printOfficialReport, renderOfficialReport, type OfficialReportType } from "@/lib/officialReportPrint";
// import { openPrintWindow } from "@/lib/printWindow";
// import { trpc } from "@/lib/trpc";
// import { displayCode } from "@/lib/displayCode";
// import { formatPrintNumber } from "@/lib/printNumber";
// import { formatWholeQuantity } from "@/pages/Reports";
// import { CalendarRange, CheckCircle2, Download, FileDown, FileSpreadsheet, FileText, Search, Tags, X } from "lucide-react";
// import { useCallback, useEffect, useMemo, useState } from "react";
// import * as XLSX from "xlsx";
// import { toast } from "sonner";

// type InventoryPrintMode = "card" | "cardRange" | "inbound" | "outbound" | "inventory" | "sub" | "movementAll" | "movement";
// type InventoryRow = { id: number; materialId: number; warehouseId: number; partyId: number | null; code: string; name: string; description: string | null; unit: string; openingQuantity: string; onHandQuantity: string; inboundQuantity: string; receiptQuantity: string; returnQuantity: string; outboundQuantity: string; warehouseName: string; partyName: string | null };
// type ReportSession = { id: string; mode: Exclude<InventoryPrintMode, "card" | "cardRange">; page: number; window: Window; filters: { fromDate?: Date; toDate?: Date; search?: string; onlyMoved?: boolean }; period: string };
// const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
// const MATERIALS_PER_PAGE = 20;

// function reportDefinition(mode: ReportSession["mode"]) {
//   const type: OfficialReportType = mode === "inbound" ? "inboundJournal" : mode === "outbound" ? "outboundJournal" : mode === "inventory" ? "inventory" : "monthlyMovement";
//   const title = mode === "inbound" ? "بطاقة الإدخالات" : mode === "outbound" ? "بطاقة الإخراجات" : mode === "inventory" ? "جدول الجرد" : mode === "sub" ? "كشف فرعي" : mode === "movementAll" ? "طباعة شهرية — المتحركة والثابتة" : "طباعة شهرية — المتحركة فقط";
//   return { type, title };
// }

// function buildReportRows(mode: ReportSession["mode"], reportRows: InventoryRow[], reportPage: number) {
//   const scoped = mode === "movement" ? reportRows.filter(row => Number(row.inboundQuantity) !== 0 || Number(row.outboundQuantity) !== 0) : reportRows;
//   const rows: Array<Array<string | number>> = scoped.map((row, index) => {
//     const serial = (reportPage - 1) * MATERIALS_PER_PAGE + index + 1;
//     if (mode === "inbound") return [serial, "", "", displayCode(row.code), row.name, "", row.unit, row.inboundQuantity, ""];
//     if (mode === "outbound") return [serial, "", "", displayCode(row.code), row.name, "", row.unit, row.outboundQuantity, row.partyName || "", ""];
//     if (mode === "inventory") return [serial, displayCode(row.code), row.name, row.description || "", row.unit, "", row.unit, formatWholeQuantity(row.onHandQuantity), row.unit, formatWholeQuantity(row.onHandQuantity), "", "", "", "", ""];
//     return [serial, displayCode(row.code), row.name, "", row.openingQuantity, Number(row.receiptQuantity) > 0 ? row.receiptQuantity : "", Number(row.returnQuantity) > 0 ? row.returnQuantity : "", row.outboundQuantity, row.onHandQuantity, ""];
//   });
//   return { scoped, rows };
// }

// export default function InventoryPage() {
//   const { isAuthenticated } = useAuth();
//   const isDevelopment = import.meta.env.DEV;
//   const [search, setSearch] = useState("");
//   const [page, setPage] = useState(1);
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [selectedBalanceId, setSelectedBalanceId] = useState<number | null>(null);
//   const [cardTarget, setCardTarget] = useState<{ materialId: number } | null>(null);
//   const [cardWindow, setCardWindow] = useState<Window | null>(null);
//   const [cardPrintMode, setCardPrintMode] = useState<"all" | "range">("all");
//   const [reportSession, setReportSession] = useState<ReportSession | null>(null);
//   const usePreview = isDevelopment && !isAuthenticated;
//   const filters = useMemo(() => ({ fromDate: fromDate ? new Date(`${fromDate}T00:00:00`) : undefined, toDate: toDate ? new Date(`${toDate}T23:59:59.999`) : undefined, search: search.trim() || undefined, limit: MATERIALS_PER_PAGE, offset: (page - 1) * MATERIALS_PER_PAGE }), [fromDate, page, search, toDate]);
//   const live = trpc.inventory.listBalances.useQuery(filters, { enabled: isAuthenticated });
//   const preview = trpc.inventory.previewBalances.useQuery(filters, { enabled: usePreview });
//   const query = usePreview ? preview : live;
//   const utils = trpc.useUtils();
//   const reportFilters = useMemo(() => reportSession ? { ...reportSession.filters, limit: MATERIALS_PER_PAGE, offset: (reportSession.page - 1) * MATERIALS_PER_PAGE } : undefined, [reportSession]);
//   const reportLive = trpc.inventory.listBalances.useQuery(reportFilters, { enabled: isAuthenticated && Boolean(reportSession) });
//   const reportPreview = trpc.inventory.previewBalances.useQuery(reportFilters, { enabled: usePreview && Boolean(reportSession) });
//   const reportQuery = usePreview ? reportPreview : reportLive;
//   const rows = (query.data?.rows ?? []) as InventoryRow[];
//   const hasMore = query.data?.hasMore ?? false;
//   const cardInput = cardTarget ?? { materialId: 1 };
//   const cardLive = trpc.inventory.materialCard.useQuery(cardInput, { enabled: Boolean(cardTarget) && isAuthenticated });
//   const cardPreview = trpc.inventory.previewMaterialCard.useQuery(cardInput, { enabled: Boolean(cardTarget) && usePreview });
//   const cardQuery = usePreview ? cardPreview : cardLive;
//   const filtered = rows;
//   const currentPage = page;
//   const pageRows = filtered;
//   const selectedBalance = useMemo(() => selectedBalanceId === null ? null : rows.find(row => row.id === selectedBalanceId) ?? null, [rows, selectedBalanceId]);

//   useEffect(() => { setPage(1); }, [search, fromDate, toDate]);

//   useEffect(() => {
//     if (!cardTarget || !cardWindow) return;
//     if (cardQuery.isError) {
//       toast.error(cardQuery.error.message || "تعذر تحميل حركة المادة لبطاقتها الرسمية.");
//       cardWindow.close();
//       setCardWindow(null);
//       setCardTarget(null);
//       return;
//     }
//     if (!cardQuery.data) return;
//     const card = cardQuery.data;
//     if (!card.name || !card.code) {
//       toast.error("تعذر جلب اسم المادة ورمزها. اختر صف المادة من الجدول ثم أعد المحاولة.");
//       cardWindow.close();
//       setCardWindow(null);
//       setCardTarget(null);
//       return;
//     }
//     const isRangeReport = cardPrintMode === "range";
//     const rows = isRangeReport
//       ? buildMaterialCardRows(card.movements, card.openingQuantity, fromDate, toDate)
//       : buildMaterialCardRows(card.movements, card.openingQuantity);
//     renderOfficialReport(cardWindow, {
//       title: isRangeReport ? "حركة مادة بين تاريخين" : "بطاقة المادة",
//       dateRange: isRangeReport ? `من ${fromDate} إلى ${toDate}` : "كامل الفترة المتاحة",
//       type: "materialCard",
//       material: { cardNumber: card.cardNumber, code: displayCode(card.code), name: card.name, description: card.description, unit: card.unit, minimumStock: card.minimumStock, maximumStock: null, notes: null },
//       rows,
//     });
//     setCardWindow(null);
//     setCardTarget(null);
//     setCardPrintMode("all");
//   }, [cardPrintMode, cardQuery.data, cardQuery.error, cardQuery.isError, cardTarget, cardWindow, fromDate, toDate]);

//   useEffect(() => {
//     const printEntireReport = async (sessionId: string) => {
//       const activeSession = reportSession;
//       if (!activeSession || activeSession.id !== sessionId || activeSession.window.closed) return;
//       try {
//         const result = usePreview
//           ? await utils.inventory.previewReportBalances.fetch(activeSession.filters)
//           : await utils.inventory.reportBalances.fetch(activeSession.filters);
//         const allRows = result as InventoryRow[];
//         const { type, title } = reportDefinition(activeSession.mode);
//         const reportPages: Array<{ title: string; dateRange: string; type: OfficialReportType; rows: Array<Array<string | number>> }> = [];
//         for (let pageIndex = 0; pageIndex < Math.max(1, Math.ceil(allRows.length / MATERIALS_PER_PAGE)); pageIndex += 1) {
//           const pageNumber = pageIndex + 1;
//           const pageRows = allRows.slice(pageIndex * MATERIALS_PER_PAGE, pageNumber * MATERIALS_PER_PAGE);
//           const built = buildReportRows(activeSession.mode, pageRows, pageNumber);
//           if (built.scoped.length) reportPages.push({ title, dateRange: activeSession.period, type, rows: built.rows });
//         }
//         renderOfficialReport(activeSession.window, {
//           title,
//           dateRange: activeSession.period,
//           type,
//           rows: reportPages[0]?.rows ?? [],
//           pages: reportPages,
//           pagination: { page: activeSession.page, totalPages: reportPages.length, hasPrevious: activeSession.page > 1, hasNext: activeSession.page < reportPages.length, sessionId: activeSession.id },
//         });
//         activeSession.window.focus();
//         activeSession.window.print();
//       } catch {
//         toast.error("تعذر تجهيز جميع صفحات التقرير للطباعة. لم تتغير بيانات المستودع.");
//       }
//     };
//     const changeReportPage = (sessionId: string | undefined, direction: "first" | "previous" | "next" | "last" | undefined, targetPage?: number) => {
//       setReportSession(current => {
//         if (!current || sessionId !== current.id || !direction) return current;
//         const page = direction === "first" ? 1 : direction === "last" && targetPage ? targetPage : direction === "previous" ? Math.max(1, current.page - 1) : current.page + 1;
//         return { ...current, page };
//       });
//     };
//     const handleReportPage = (event: MessageEvent<{ type?: string; sessionId?: string; direction?: "first" | "previous" | "next" | "last"; targetPage?: number }>) => {
//       if (event.data?.type === "inventory-report-page") changeReportPage(event.data.sessionId, event.data.direction, event.data.targetPage);
//     };
//     const hostWindow = window as Window & { __inventoryReportNavigate?: typeof changeReportPage; __inventoryReportPrintAll?: typeof printEntireReport };
//     hostWindow.__inventoryReportNavigate = changeReportPage;
//     hostWindow.__inventoryReportPrintAll = printEntireReport;
//     window.addEventListener("message", handleReportPage);
//     return () => { window.removeEventListener("message", handleReportPage); delete hostWindow.__inventoryReportNavigate; delete hostWindow.__inventoryReportPrintAll; };
//   }, [reportSession, usePreview, utils]);

//   useEffect(() => {
//     if (!reportSession) return;
//     if (reportSession.window.closed) { setReportSession(null); return; }
//     if (reportQuery.isFetching || reportQuery.isLoading) return;
//     if (reportQuery.isError) { toast.error("تعذر تحميل صفحة التقرير المطلوبة."); reportSession.window.close(); setReportSession(null); return; }
//     const reportRows = (reportQuery.data?.rows ?? []) as InventoryRow[];
//     const reportTotal = reportQuery.data?.total ?? reportRows.length;
//     const totalPages = Math.max(1, Math.ceil(reportTotal / MATERIALS_PER_PAGE));
//     const { scoped, rows: officialRows } = buildReportRows(reportSession.mode, reportRows, reportSession.page);
//     if (!scoped.length) {
//       if (reportSession.page > 1) { toast.info("وصلت إلى آخر صفحة متاحة من التقرير."); setReportSession(current => current ? { ...current, page: current.page - 1 } : null); return; }
//       toast.info("لا توجد سجلات مطابقة لهذه الصفحة من التقرير."); reportSession.window.close(); setReportSession(null); return;
//     }
//     const { type, title } = reportDefinition(reportSession.mode);
//     renderOfficialReport(reportSession.window, { title, dateRange: reportSession.period, rows: officialRows, type, pagination: { page: reportSession.page, totalPages, hasPrevious: reportSession.page > 1, hasNext: reportSession.page < totalPages, sessionId: reportSession.id } });
//   }, [reportQuery.data, reportQuery.isError, reportQuery.isFetching, reportQuery.isLoading, reportSession]);

//   const printReport = (mode: InventoryPrintMode) => {
//     if (mode === "card" || mode === "cardRange") {
//       if (!selectedBalance) { toast.info("اختر المادة من صف الجدول أولًا ثم اضغط «بطاقة المادة». "); return; }
//       if (mode === "cardRange" && (!fromDate || !toDate)) { toast.info("حدد تاريخ البداية وتاريخ النهاية أولًا لطباعة حركة المادة."); return; }
//       const page = openPrintWindow(mode === "cardRange" ? "حركة مادة بين تاريخين" : "بطاقة المادة");
//       if (!page) { toast.error("تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة."); return; }
//       setCardWindow(page);
//       setCardPrintMode(mode === "cardRange" ? "range" : "all");
//       setCardTarget({ materialId: selectedBalance.materialId });
//       return;
//     }
//     const page = openPrintWindow("معاينة التقرير");
//     if (!page) { toast.error("تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة."); return; }
//     const sessionId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
//     setReportSession({ id: sessionId, mode, page: 1, window: page, filters: { fromDate: fromDate ? new Date(`${fromDate}T00:00:00`) : undefined, toDate: toDate ? new Date(`${toDate}T23:59:59.999`) : undefined, search: search.trim() || undefined }, period: fromDate || toDate ? `من ${fromDate || ""} إلى ${toDate || ""}` : "" });
//   };

//   const movementExportColumns = ["التسلسل", "رمز المادة", "اسم المادة", "الوصف", "رصيد أول شهر", "استلام شهر", "إدخال شهر", "إخراجات شهر", "الرصيد", "ملاحظات"];
//   const movementExportRows = filtered.map((row, index) => [index + 1, displayCode(row.code), row.name, row.description || "", formatPrintNumber(row.openingQuantity), Number(row.receiptQuantity) > 0 ? formatPrintNumber(row.receiptQuantity) : "", Number(row.returnQuantity) > 0 ? formatPrintNumber(row.returnQuantity) : "", formatPrintNumber(row.outboundQuantity), formatPrintNumber(row.onHandQuantity), ""]);
//   const exportExcel = () => {
//     if (!movementExportRows.length) { toast.info("لا توجد بيانات ظاهرة لتصديرها."); return; }
//     const worksheet = XLSX.utils.aoa_to_sheet([movementExportColumns, ...movementExportRows]);
//     worksheet["!rtl"] = true;
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "حركة المواد");
//     XLSX.writeFile(workbook, `حركة-المواد-${new Date().toISOString().slice(0, 10)}.xlsx`);
//     toast.success("تم تنزيل جدول حركة المواد بصيغة Excel.");
//   };
//   const exportPdf = () => {
//     if (!movementExportRows.length) { toast.info("لا توجد بيانات ظاهرة لتصديرها."); return; }
//     if (!printOfficialReport({ title: "حركة المواد", dateRange: fromDate || toDate ? `من ${fromDate || "بداية الفترة"} إلى ${toDate || "اليوم"}` : "كامل الفترة المتاحة", rows: movementExportRows, type: "monthlyMovement" })) toast.error("تعذر فتح معاينة PDF.");
//   };

//   const exportCsv = () => {
//     if (!filtered.length) { toast.info("لا توجد بيانات ظاهرة لتصديرها."); return; }
//     const heading = ["رقم البطاقة", "رمز المادة", "اسم المادة", "كمية أول مدة", "الرصيد السابق", "كمية الاستلام", "كمية الإدخال", "كمية التسليم", "كمية الإخراج", "الرصيد الحالي", "المستودع", "الجهة"];
//     const values = filtered.map(row => ["", displayCode(row.code), row.name, row.openingQuantity, row.openingQuantity, row.inboundQuantity, "", row.outboundQuantity, "", row.onHandQuantity, row.warehouseName, row.partyName || ""]);
//     const url = URL.createObjectURL(new Blob(["\uFEFF", [heading, ...values].map(row => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }));
//     const anchor = document.createElement("a");
//     anchor.href = url;
//     anchor.download = "inventory-movement.csv";
//     anchor.click();
//     URL.revokeObjectURL(url);
//     toast.success("تم تنزيل حركة المواد بصيغة CSV المتوافقة مع Excel.");
//   };

//   return (
//     <div className="mx-auto max-w-[1480px] space-y-6" dir="rtl">
//       <section>
//         <p className="text-sm font-semibold text-[#17698a]">المستودع / حركة المواد</p>
//         <h1 className="mt-1 text-3xl font-extrabold tracking-tight">حركة المواد بالمستودعات</h1>
//       </section>

//       <Card className="soft-shadow overflow-hidden border-white/75 bg-white/85"><CardContent className="p-0">
//         <div className="border-b border-slate-100 px-6 py-5"><h2 className="font-extrabold">حركة المواد</h2></div>
//         <div className="overflow-x-auto"><table className="inventory-compact-table w-full min-w-[1120px] text-right">
//           <thead className="bg-[#d9e4ee] text-xs font-bold text-slate-700"><tr><th className="px-2.5 py-2">رقم البطاقة</th><th className="px-2.5 py-2">رمز المادة</th><th className="px-2.5 py-2">اسم المادة</th><th className="px-2.5 py-2">كمية أول مدة</th><th className="px-2.5 py-2">الرصيد السابق</th><th className="px-2.5 py-2">كمية الاستلام</th><th className="px-2.5 py-2">كمية الإدخال</th><th className="px-2.5 py-2">كمية التسليم</th><th className="px-2.5 py-2">كمية الإخراج</th><th className="px-2.5 py-2">الرصيد الحالي</th></tr></thead>
//           <tbody>
//             {query.isLoading && <tr><td colSpan={10} className="px-5 py-10 text-center text-sm text-muted-foreground">جار تحميل الأرصدة…</td></tr>}
//             {query.isError && <tr><td colSpan={10} className="px-5 py-10 text-center text-sm text-destructive">تعذر تحميل الأرصدة.</td></tr>}
//             {!query.isLoading && !query.isError && filtered.length === 0 && <tr><td colSpan={10} className="px-5 py-10 text-center text-sm text-muted-foreground">لا توجد مواد مطابقة للبحث.</td></tr>}
//             {pageRows.map((row, index) => (
//               <tr key={row.id} tabIndex={0} aria-selected={row.id === selectedBalanceId} onClick={() => setSelectedBalanceId(row.id)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedBalanceId(row.id); } }} className={`inventory-selectable-row border-t border-[#dae4d5] text-sm ${index % 2 ? "bg-[#e6f0df]" : "bg-white"} ${row.id === selectedBalanceId ? "is-selected" : ""}`}>
//                 <td className="px-4 py-3 text-center text-muted-foreground"></td><td className="px-4 py-3 font-semibold text-slate-600">{displayCode(row.code)}</td><td className="px-5 py-3 font-bold"><div className="flex items-center gap-2">{row.id === selectedBalanceId && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0071ba]" />}<span>{row.name}</span><span className="text-xs font-normal text-muted-foreground">{row.unit}</span></div></td><td className="px-4 py-3 text-center">{formatPrintNumber(row.openingQuantity)}</td><td className="px-4 py-3 text-center">{formatPrintNumber(row.openingQuantity)}</td><td className="px-4 py-3 text-center font-semibold text-[#39744b]">{formatPrintNumber(row.inboundQuantity)}</td><td className="px-4 py-3 text-center"></td><td className="px-4 py-3 text-center font-semibold text-[#ab5062]">{formatPrintNumber(row.outboundQuantity)}</td><td className="px-4 py-3 text-center"></td><td className="px-4 py-3 text-center font-extrabold text-[#17698a]">{formatPrintNumber(row.onHandQuantity)}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table></div>
//         {!query.isLoading && !query.isError && filtered.length > 0 && <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"><p className="text-muted-foreground">عرض {((currentPage - 1) * MATERIALS_PER_PAGE + 1).toLocaleString("ar")}–{((currentPage - 1) * MATERIALS_PER_PAGE + filtered.length).toLocaleString("ar")} من نتائج البحث</p><div className="flex items-center gap-2"><Button type="button" variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(current => Math.max(1, current - 1))}>السابقة</Button><span className="min-w-20 text-center text-xs font-bold text-[#17698a]">صفحة {currentPage.toLocaleString("ar")}</span><Button type="button" variant="outline" size="sm" disabled={!hasMore} onClick={() => setPage(current => current + 1)}>التالية</Button></div></div>}
//       </CardContent></Card>

//       <Card className="soft-shadow border-white/75 bg-white/85"><CardContent className="p-5"><div className="grid gap-3 lg:grid-cols-[1.2fr_0.7fr_0.7fr_auto]">
//         <div className="relative"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="h-10 rounded-xl pr-9" value={search} onChange={event => setSearch(event.target.value)} placeholder="ابحث باسم المادة أو رمزها أو باركودها في كل المواد" /></div>
//         <div className="flex items-center gap-2"><span className="shrink-0 text-xs font-extrabold text-[#17698a]">من تاريخ</span><div className="relative min-w-0 flex-1"><CalendarRange className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="h-10 rounded-xl pr-9" value={fromDate} onChange={event => setFromDate(event.target.value)} type="date" aria-label="من تاريخ" /></div></div>
//         <div className="flex items-center gap-2"><span className="shrink-0 text-xs font-extrabold text-[#17698a]">إلى تاريخ</span><div className="relative min-w-0 flex-1"><CalendarRange className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="h-10 rounded-xl pr-9" value={toDate} onChange={event => setToDate(event.target.value)} type="date" aria-label="إلى تاريخ" /></div></div>
//         {/* <div className="flex flex-wrap gap-2"><Button onClick={exportExcel} className="rounded-xl bg-[#17698a] hover:bg-[#125875]"><FileSpreadsheet className="ml-2 h-4 w-4" />تصدير Excel</Button><Button onClick={exportPdf} variant="outline" className="rounded-xl border-[#d47b32] text-[#a45a19] hover:bg-[#fff4e8]"><FileText className="ml-2 h-4 w-4" />تصدير PDF</Button><Button onClick={exportCsv} variant="outline" className="rounded-xl border-[#8cc6dd] text-[#17698a]"><Download className="ml-2 h-4 w-4" />تصدير CSV</Button></div> */}
//       </div></CardContent></Card>

//       <Card className="soft-shadow border-[#9bd8f0] bg-[#ecf9ff]"><CardContent className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-sm font-extrabold text-[#07518e]">طباعات حركة المواد</p><p className="mt-1 text-xs text-[#4b7792]">اختر صف المادة من الجدول ثم اطبع البطاقة الكاملة أو حركة الفترة المحددة. أما بقية الأزرار فتعتمد على الفترة والسجلات الظاهرة.</p>{selectedBalance && <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#83cdec] bg-white/80 px-3 py-2 text-xs text-[#07518e]"><CheckCircle2 className="h-4 w-4" /><span>المادة المحددة: <strong>{selectedBalance.name}</strong> — {displayCode(selectedBalance.code)}</span><button onClick={() => setSelectedBalanceId(null)} className="mr-1 rounded p-0.5 text-[#4b7792] hover:bg-sky-100" aria-label="إلغاء تحديد المادة"><X className="h-3.5 w-3.5" /></button></div>}</div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => printReport("card")} className={selectedBalance ? "border-[#0071ba] bg-white text-[#0067ad]" : ""}><Tags className="ml-2 h-4 w-4" />بطاقة المادة</Button><Button variant="outline" onClick={() => printReport("cardRange")} className={selectedBalance ? "border-[#d47b32] bg-white text-[#a45a19]" : ""}><CalendarRange className="ml-2 h-4 w-4" />حركة مادة بين تاريخين</Button><Button variant="outline" onClick={() => printReport("inbound")}><FileDown className="ml-2 h-4 w-4" />بطاقة الإدخالات لكل المواد</Button><Button variant="outline" onClick={() => printReport("outbound")}><FileDown className="ml-2 h-4 w-4" />بطاقة الإخراجات لكل المواد</Button><Button variant="outline" onClick={() => printReport("inventory")}><FileText className="ml-2 h-4 w-4" />تقرير الجرد</Button><Button variant="outline" onClick={() => printReport("movementAll")}><FileText className="ml-2 h-4 w-4" />طباعة شهرية — المتحركة والثابتة</Button><Button variant="outline" onClick={() => printReport("movement")}><FileText className="ml-2 h-4 w-4" />طباعة شهرية — المتحركة فقط</Button></div></div></CardContent></Card>
//     </div>
//   );
// }
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { buildMaterialCardRows } from "@/lib/materialCard";
import { printOfficialReport, renderOfficialReport, type OfficialReportType } from "@/lib/officialReportPrint";
import { openPrintWindow } from "@/lib/printWindow";
import { trpc } from "@/lib/trpc";
import { displayCode } from "@/lib/displayCode";
import { formatPrintNumber } from "@/lib/printNumber";
import { formatWholeQuantity } from "@/pages/Reports";
import { CalendarRange, CheckCircle2, Download, FileDown, FileSpreadsheet, FileText, Search, Tags, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

type InventoryPrintMode = "card" | "cardRange" | "inbound" | "outbound" | "inventory" | "sub" | "movementAll" | "movement";
type InventoryRow = { id: number; materialId: number; warehouseId: number; partyId: number | null; code: string; name: string; description: string | null; unit: string; openingQuantity: string; onHandQuantity: string; inboundQuantity: string; receiptQuantity: string; returnQuantity: string; outboundQuantity: string; warehouseName: string; partyName: string | null };
type ReportSession = { id: string; mode: Exclude<InventoryPrintMode, "card" | "cardRange">; page: number; window: Window; filters: { fromDate?: Date; toDate?: Date; search?: string; onlyMoved?: boolean }; period: string };
const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const MATERIALS_PER_PAGE = 20;

function reportDefinition(mode: ReportSession["mode"]) {
  const type: OfficialReportType = mode === "inbound" ? "inboundJournal" : mode === "outbound" ? "outboundJournal" : mode === "inventory" ? "inventory" : "monthlyMovement";
  const title = mode === "inbound" ? "بطاقة الإدخالات" : mode === "outbound" ? "بطاقة الإخراجات" : mode === "inventory" ? "جدول الجرد" : mode === "sub" ? "كشف فرعي" : mode === "movementAll" ? "طباعة شهرية — المتحركة والثابتة" : "طباعة شهرية — المتحركة فقط";
  return { type, title };
}

function buildReportRows(mode: ReportSession["mode"], reportRows: InventoryRow[], reportPage: number) {
  const scoped = mode === "movement" ? reportRows.filter(row => Number(row.inboundQuantity) !== 0 || Number(row.outboundQuantity) !== 0) : reportRows;
  const rows: Array<Array<string | number>> = scoped.map((row, index) => {
    const serial = (reportPage - 1) * MATERIALS_PER_PAGE + index + 1;
    if (mode === "inbound") return [serial, "", "", displayCode(row.code), row.name, "", row.unit, row.inboundQuantity, ""];
    if (mode === "outbound") return [serial, "", "", displayCode(row.code), row.name, "", row.unit, row.outboundQuantity, row.partyName || "", ""];
    if (mode === "inventory") return [serial, displayCode(row.code), row.name, row.description || "", row.unit, "", row.unit, formatWholeQuantity(row.onHandQuantity), row.unit, formatWholeQuantity(row.onHandQuantity), "", "", "", "", ""];
    return [serial, displayCode(row.code), row.name, "", row.openingQuantity, Number(row.receiptQuantity) > 0 ? row.receiptQuantity : "", Number(row.returnQuantity) > 0 ? row.returnQuantity : "", row.outboundQuantity, row.onHandQuantity, ""];
  });
  return { scoped, rows };
}

export default function InventoryPage({ reportsOnly = false }: { reportsOnly?: boolean }) {
  const { isAuthenticated } = useAuth();
  const isDevelopment = import.meta.env.DEV;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedBalanceId, setSelectedBalanceId] = useState<number | null>(null);
  const [cardTarget, setCardTarget] = useState<{ materialId: number } | null>(null);
  const [cardWindow, setCardWindow] = useState<Window | null>(null);
  const [cardPrintMode, setCardPrintMode] = useState<"all" | "range">("all");
  const [reportSession, setReportSession] = useState<ReportSession | null>(null);
  const usePreview = isDevelopment && !isAuthenticated;
  const filters = useMemo(() => ({ fromDate: fromDate ? new Date(`${fromDate}T00:00:00`) : undefined, toDate: toDate ? new Date(`${toDate}T23:59:59.999`) : undefined, search: search.trim() || undefined, limit: MATERIALS_PER_PAGE, offset: (page - 1) * MATERIALS_PER_PAGE }), [fromDate, page, search, toDate]);
  const live = trpc.inventory.listBalances.useQuery(filters, { enabled: isAuthenticated });
  const preview = trpc.inventory.previewBalances.useQuery(filters, { enabled: usePreview });
  const query = usePreview ? preview : live;
  const utils = trpc.useUtils();
  const reportFilters = useMemo(() => reportSession ? { ...reportSession.filters, limit: MATERIALS_PER_PAGE, offset: (reportSession.page - 1) * MATERIALS_PER_PAGE } : undefined, [reportSession]);
  const reportLive = trpc.inventory.listBalances.useQuery(reportFilters, { enabled: isAuthenticated && Boolean(reportSession) });
  const reportPreview = trpc.inventory.previewBalances.useQuery(reportFilters, { enabled: usePreview && Boolean(reportSession) });
  const reportQuery = usePreview ? reportPreview : reportLive;
  const rows = (query.data?.rows ?? []) as InventoryRow[];
  const hasMore = query.data?.hasMore ?? false;
  const cardInput = cardTarget ?? { materialId: 1 };
  const cardLive = trpc.inventory.materialCard.useQuery(cardInput, { enabled: Boolean(cardTarget) && isAuthenticated });
  const cardPreview = trpc.inventory.previewMaterialCard.useQuery(cardInput, { enabled: Boolean(cardTarget) && usePreview });
  const cardQuery = usePreview ? cardPreview : cardLive;
  const filtered = rows;
  const currentPage = page;
  const pageRows = filtered;
  const selectedBalance = useMemo(() => selectedBalanceId === null ? null : rows.find(row => row.id === selectedBalanceId) ?? null, [rows, selectedBalanceId]);

  useEffect(() => { setPage(1); }, [search, fromDate, toDate]);

  useEffect(() => {
    if (!cardTarget || !cardWindow) return;
    if (cardQuery.isError) {
      toast.error(cardQuery.error.message || "تعذر تحميل حركة المادة لبطاقتها الرسمية.");
      cardWindow.close();
      setCardWindow(null);
      setCardTarget(null);
      return;
    }
    if (!cardQuery.data) return;
    const card = cardQuery.data;
    if (!card.name || !card.code) {
      toast.error("تعذر جلب اسم المادة ورمزها. اختر صف المادة من الجدول ثم أعد المحاولة.");
      cardWindow.close();
      setCardWindow(null);
      setCardTarget(null);
      return;
    }
    const isRangeReport = cardPrintMode === "range";
    const rows = isRangeReport
      ? buildMaterialCardRows(card.movements, card.openingQuantity, fromDate, toDate)
      : buildMaterialCardRows(card.movements, card.openingQuantity);
    renderOfficialReport(cardWindow, {
      title: isRangeReport ? "حركة مادة بين تاريخين" : "بطاقة المادة",
      dateRange: isRangeReport ? `من ${fromDate} إلى ${toDate}` : "كامل الفترة المتاحة",
      type: "materialCard",
      material: { cardNumber: card.cardNumber, code: displayCode(card.code), name: card.name, description: card.description, unit: card.unit, minimumStock: card.minimumStock, maximumStock: null, notes: null },
      rows,
    });
    setCardWindow(null);
    setCardTarget(null);
    setCardPrintMode("all");
  }, [cardPrintMode, cardQuery.data, cardQuery.error, cardQuery.isError, cardTarget, cardWindow, fromDate, toDate]);

  useEffect(() => {
    const printEntireReport = async (sessionId: string) => {
      const activeSession = reportSession;
      if (!activeSession || activeSession.id !== sessionId || activeSession.window.closed) return;
      try {
        const result = usePreview
          ? await utils.inventory.previewReportBalances.fetch(activeSession.filters)
          : await utils.inventory.reportBalances.fetch(activeSession.filters);
        const allRows = result as InventoryRow[];
        const { type, title } = reportDefinition(activeSession.mode);
        // تقرير الجرد يعرض المواد التي لها رصيد متبقٍ بعد حساب الفترة المحددة.
        const printableRows = allRows;
        const reportPages: Array<{ title: string; dateRange: string; type: OfficialReportType; rows: Array<Array<string | number>> }> = [];
        for (let pageIndex = 0; pageIndex < Math.max(1, Math.ceil(printableRows.length / MATERIALS_PER_PAGE)); pageIndex += 1) {
          const pageNumber = pageIndex + 1;
          const pageRows = printableRows.slice(pageIndex * MATERIALS_PER_PAGE, pageNumber * MATERIALS_PER_PAGE);
          const built = buildReportRows(activeSession.mode, pageRows, pageNumber);
          if (built.scoped.length) reportPages.push({ title, dateRange: activeSession.period, type, rows: built.rows });
        }
        renderOfficialReport(activeSession.window, {
          title,
          dateRange: activeSession.period,
          type,
          rows: reportPages[0]?.rows ?? [],
          pages: reportPages,
          pagination: { page: activeSession.page, totalPages: reportPages.length, hasPrevious: activeSession.page > 1, hasNext: activeSession.page < reportPages.length, sessionId: activeSession.id },
        });
        activeSession.window.focus();
        activeSession.window.print();
      } catch {
        toast.error("تعذر تجهيز جميع صفحات التقرير للطباعة. لم تتغير بيانات المستودع.");
      }
    };
    const changeReportPage = (sessionId: string | undefined, direction: "first" | "previous" | "next" | "last" | undefined, targetPage?: number) => {
      setReportSession(current => {
        if (!current || sessionId !== current.id || !direction) return current;
        const page = direction === "first" ? 1 : direction === "last" && targetPage ? targetPage : direction === "previous" ? Math.max(1, current.page - 1) : current.page + 1;
        return { ...current, page };
      });
    };
    const handleReportPage = (event: MessageEvent<{ type?: string; sessionId?: string; direction?: "first" | "previous" | "next" | "last"; targetPage?: number }>) => {
      if (event.data?.type === "inventory-report-page") changeReportPage(event.data.sessionId, event.data.direction, event.data.targetPage);
    };
    const hostWindow = window as Window & { __inventoryReportNavigate?: typeof changeReportPage; __inventoryReportPrintAll?: typeof printEntireReport };
    hostWindow.__inventoryReportNavigate = changeReportPage;
    hostWindow.__inventoryReportPrintAll = printEntireReport;
    window.addEventListener("message", handleReportPage);
    return () => { window.removeEventListener("message", handleReportPage); delete hostWindow.__inventoryReportNavigate; delete hostWindow.__inventoryReportPrintAll; };
  }, [reportSession, usePreview, utils]);

  useEffect(() => {
    if (!reportSession) return;
    if (reportSession.window.closed) { setReportSession(null); return; }
    if (reportQuery.isFetching || reportQuery.isLoading) return;
    if (reportQuery.isError) { toast.error("تعذر تحميل صفحة التقرير المطلوبة."); reportSession.window.close(); setReportSession(null); return; }
    const reportRows = (reportQuery.data?.rows ?? []) as InventoryRow[];
    const reportedTotal = Number(reportQuery.data?.total);
    const hasMoreReportRows = Boolean(reportQuery.data?.hasMore);
    const totalPages = Number.isFinite(reportedTotal) && reportedTotal > 0
      ? Math.max(1, Math.ceil(reportedTotal / MATERIALS_PER_PAGE))
      : reportSession.page + (hasMoreReportRows ? 1 : 0);
    const { scoped, rows: officialRows } = buildReportRows(reportSession.mode, reportRows, reportSession.page);
    if (!scoped.length) {
      if (reportSession.page > 1) { toast.info("وصلت إلى آخر صفحة متاحة من التقرير."); setReportSession(current => current ? { ...current, page: current.page - 1 } : null); return; }
      toast.info("لا توجد سجلات مطابقة لهذه الصفحة من التقرير."); reportSession.window.close(); setReportSession(null); return;
    }
    const { type, title } = reportDefinition(reportSession.mode);
    renderOfficialReport(reportSession.window, { title, dateRange: reportSession.period, rows: officialRows, type, pagination: { page: reportSession.page, totalPages, hasPrevious: reportSession.page > 1, hasNext: hasMoreReportRows || reportSession.page < totalPages, sessionId: reportSession.id } });
  }, [reportQuery.data, reportQuery.isError, reportQuery.isFetching, reportQuery.isLoading, reportSession]);

  const printReport = (mode: InventoryPrintMode) => {
    if (mode === "movement" || mode === "movementAll") {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setFromDate(monthStart.toISOString().slice(0, 10));
      setToDate(monthEnd.toISOString().slice(0, 10));
    }
    if (mode === "card" || mode === "cardRange") {
      if (!selectedBalance) { toast.info("اختر المادة من صف الجدول أولًا ثم اضغط «بطاقة المادة». "); return; }
      if (mode === "cardRange" && (!fromDate || !toDate)) { toast.info("حدد تاريخ البداية وتاريخ النهاية أولًا لطباعة حركة المادة."); return; }
      const page = openPrintWindow(mode === "cardRange" ? "حركة مادة بين تاريخين" : "بطاقة المادة");
      if (!page) { toast.error("تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة."); return; }
      setCardWindow(page);
      setCardPrintMode(mode === "cardRange" ? "range" : "all");
      setCardTarget({ materialId: selectedBalance.materialId });
      return;
    }
    if (mode === "inventory" && (!fromDate || !toDate)) {
      toast.info("حدد تاريخ البداية وتاريخ النهاية أولًا لإظهار جرد المواد المتحركة.");
      return;
    }
    const inventoryFrom = fromDate;
    const inventoryTo = toDate;
    const page = openPrintWindow("معاينة التقرير");
    if (!page) { toast.error("تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة."); return; }
    const sessionId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    const reportSearch = search.trim() || undefined;
    setReportSession({ id: sessionId, mode, page: 1, window: page, filters: { fromDate: inventoryFrom ? new Date(`${inventoryFrom}T00:00:00`) : undefined, toDate: inventoryTo ? new Date(`${inventoryTo}T23:59:59.999`) : undefined, search: reportSearch, onlyMoved: mode === "inventory" }, period: inventoryFrom || inventoryTo ? `من ${inventoryFrom || ""} إلى ${inventoryTo || ""}` : "" });
  };

  const movementExportColumns = ["التسلسل", "رمز المادة", "اسم المادة", "الوصف", "رصيد أول شهر", "استلام شهر", "إدخال شهر", "إخراجات شهر", "الرصيد", "ملاحظات"];
  const movementExportRows = filtered.map((row, index) => [index + 1, displayCode(row.code), row.name, row.description || "", formatPrintNumber(row.openingQuantity), Number(row.receiptQuantity) > 0 ? formatPrintNumber(row.receiptQuantity) : "", Number(row.returnQuantity) > 0 ? formatPrintNumber(row.returnQuantity) : "", formatPrintNumber(row.outboundQuantity), formatPrintNumber(row.onHandQuantity), ""]);
  const exportExcel = () => {
    if (!movementExportRows.length) { toast.info("لا توجد بيانات ظاهرة لتصديرها."); return; }
    const worksheet = XLSX.utils.aoa_to_sheet([movementExportColumns, ...movementExportRows]);
    worksheet["!rtl"] = true;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "حركة المواد");
    XLSX.writeFile(workbook, `حركة-المواد-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("تم تنزيل جدول حركة المواد بصيغة Excel.");
  };
  const exportPdf = () => {
    if (!movementExportRows.length) { toast.info("لا توجد بيانات ظاهرة لتصديرها."); return; }
    if (!printOfficialReport({ title: "حركة المواد", dateRange: fromDate || toDate ? `من ${fromDate || "بداية الفترة"} إلى ${toDate || "اليوم"}` : "كامل الفترة المتاحة", rows: movementExportRows, type: "monthlyMovement" })) toast.error("تعذر فتح معاينة PDF.");
  };

  const exportCsv = () => {
    if (!filtered.length) { toast.info("لا توجد بيانات ظاهرة لتصديرها."); return; }
    const heading = ["رقم البطاقة", "رمز المادة", "اسم المادة", "كمية أول مدة", "الرصيد السابق", "كمية الاستلام", "كمية الإدخال", "كمية التسليم", "كمية الإخراج", "الرصيد الحالي", "المستودع", "الجهة"];
    const values = filtered.map(row => ["", displayCode(row.code), row.name, row.openingQuantity, row.openingQuantity, row.inboundQuantity, "", row.outboundQuantity, "", row.onHandQuantity, row.warehouseName, row.partyName || ""]);
    const url = URL.createObjectURL(new Blob(["\uFEFF", [heading, ...values].map(row => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "inventory-movement.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("تم تنزيل حركة المواد بصيغة CSV المتوافقة مع Excel.");
  };

  return (
    <div className="mx-auto max-w-[1480px] space-y-6" dir="rtl">
      <section>
        <p className="text-sm font-semibold text-[#17698a]">المستودع / حركة المواد</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">حركة المواد بالمستودعات</h1>
      </section>

      <Card className="soft-shadow overflow-hidden border-white/75 bg-white/85"><CardContent className="p-0">
        <div className="border-b border-slate-100 px-6 py-5"><h2 className="font-extrabold">حركة المواد</h2></div>
        <div className="overflow-x-auto"><table className="inventory-compact-table w-full min-w-[1120px] text-right">
          <thead className="bg-[#d9e4ee] text-xs font-bold text-slate-700"><tr><th className="px-2.5 py-2">رقم البطاقة</th><th className="px-2.5 py-2">رمز المادة</th><th className="px-2.5 py-2">اسم المادة</th><th className="px-2.5 py-2">كمية أول مدة</th><th className="px-2.5 py-2">الرصيد السابق</th><th className="px-2.5 py-2">كمية الاستلام</th><th className="px-2.5 py-2">كمية الإدخال</th><th className="px-2.5 py-2">كمية التسليم</th><th className="px-2.5 py-2">كمية الإخراج</th><th className="px-2.5 py-2">الرصيد الحالي</th></tr></thead>
          <tbody>
            {query.isLoading && <tr><td colSpan={10} className="px-5 py-10 text-center text-sm text-muted-foreground">جار تحميل الأرصدة…</td></tr>}
            {query.isError && <tr><td colSpan={10} className="px-5 py-10 text-center text-sm text-destructive">تعذر تحميل الأرصدة.</td></tr>}
            {!query.isLoading && !query.isError && filtered.length === 0 && <tr><td colSpan={10} className="px-5 py-10 text-center text-sm text-muted-foreground">لا توجد مواد مطابقة للبحث.</td></tr>}
            {pageRows.map((row, index) => (
              <tr key={row.id} tabIndex={0} aria-selected={row.id === selectedBalanceId} onClick={() => setSelectedBalanceId(row.id)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedBalanceId(row.id); } }} className={`inventory-selectable-row border-t border-[#dae4d5] text-sm ${index % 2 ? "bg-[#e6f0df]" : "bg-white"} ${row.id === selectedBalanceId ? "is-selected" : ""}`}>
                <td className="px-4 py-3 text-center text-muted-foreground"></td><td className="px-4 py-3 font-semibold text-slate-600">{displayCode(row.code)}</td><td className="px-5 py-3 font-bold"><div className="flex items-center gap-2">{row.id === selectedBalanceId && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0071ba]" />}<span>{row.name}</span><span className="text-xs font-normal text-muted-foreground">{row.unit}</span></div></td><td className="px-4 py-3 text-center">{formatPrintNumber(row.openingQuantity)}</td><td className="px-4 py-3 text-center">{formatPrintNumber(row.openingQuantity)}</td><td className="px-4 py-3 text-center font-semibold text-[#39744b]">{formatPrintNumber(row.inboundQuantity)}</td><td className="px-4 py-3 text-center"></td><td className="px-4 py-3 text-center font-semibold text-[#ab5062]">{formatPrintNumber(row.outboundQuantity)}</td><td className="px-4 py-3 text-center"></td><td className="px-4 py-3 text-center font-extrabold text-[#17698a]">{formatPrintNumber(row.onHandQuantity)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
        {!query.isLoading && !query.isError && filtered.length > 0 && <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"><p className="text-muted-foreground">عرض {((currentPage - 1) * MATERIALS_PER_PAGE + 1).toLocaleString("ar")}–{((currentPage - 1) * MATERIALS_PER_PAGE + filtered.length).toLocaleString("ar")} من نتائج البحث</p><div className="flex items-center gap-2"><Button type="button" variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(current => Math.max(1, current - 1))}>السابقة</Button><span className="min-w-20 text-center text-xs font-bold text-[#17698a]">صفحة {currentPage.toLocaleString("ar")}</span><Button type="button" variant="outline" size="sm" disabled={!hasMore} onClick={() => setPage(current => current + 1)}>التالية</Button></div></div>}
      </CardContent></Card>

      <Card className="soft-shadow border-white/75 bg-white/85"><CardContent className="p-5"><div className="grid gap-3 lg:grid-cols-[1.2fr_0.7fr_0.7fr_auto]">
        <div className="relative"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="h-10 rounded-xl pr-9" value={search} onChange={event => setSearch(event.target.value)} placeholder="ابحث باسم المادة أو رمزها أو باركودها في كل المواد" /></div>
        <div className="flex items-center gap-2"><span className="shrink-0 text-xs font-extrabold text-[#17698a]">من تاريخ</span><div className="relative min-w-0 flex-1"><CalendarRange className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="h-10 rounded-xl pr-9" value={fromDate} onChange={event => setFromDate(event.target.value)} type="date" aria-label="من تاريخ" /></div></div>
        <div className="flex items-center gap-2"><span className="shrink-0 text-xs font-extrabold text-[#17698a]">إلى تاريخ</span><div className="relative min-w-0 flex-1"><CalendarRange className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="h-10 rounded-xl pr-9" value={toDate} onChange={event => setToDate(event.target.value)} type="date" aria-label="إلى تاريخ" /></div></div>
        {/* <div className="flex flex-wrap gap-2"><Button onClick={exportExcel} className="rounded-xl bg-[#17698a] hover:bg-[#125875]"><FileSpreadsheet className="ml-2 h-4 w-4" />تصدير Excel</Button><Button onClick={exportPdf} variant="outline" className="rounded-xl border-[#d47b32] text-[#a45a19] hover:bg-[#fff4e8]"><FileText className="ml-2 h-4 w-4" />تصدير PDF</Button><Button onClick={exportCsv} variant="outline" className="rounded-xl border-[#8cc6dd] text-[#17698a]"><Download className="ml-2 h-4 w-4" />تصدير CSV</Button></div> */}
      </div></CardContent></Card>

      <Card className="soft-shadow border-[#9bd8f0] bg-[#ecf9ff]"><CardContent className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-sm font-extrabold text-[#07518e]">طباعات حركة المواد</p><p className="mt-1 text-xs text-[#4b7792]">{reportsOnly ? "تقرير الجرد يحسب رصيد بداية الفترة والحركات حتى تاريخ النهاية، ويعرض المواد ذات الرصيد المتبقي فقط." : "اختر صف المادة من الجدول ثم اطبع البطاقة الكاملة أو حركة الفترة المحددة. أما بقية الأزرار فتعتمد على الفترة والسجلات الظاهرة."}</p>{selectedBalance && <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#83cdec] bg-white/80 px-3 py-2 text-xs text-[#07518e]"><CheckCircle2 className="h-4 w-4" /><span>المادة المحددة: <strong>{selectedBalance.name}</strong> — {displayCode(selectedBalance.code)}</span><button onClick={() => setSelectedBalanceId(null)} className="mr-1 rounded p-0.5 text-[#4b7792] hover:bg-sky-100" aria-label="إلغاء تحديد المادة"><X className="h-3.5 w-3.5" /></button></div>}</div><div className="flex flex-wrap gap-2">{reportsOnly ? <Button variant="outline" onClick={() => printReport("inventory")}><FileText className="ml-2 h-4 w-4" />تقرير الجرد</Button> : <><Button variant="outline" onClick={() => printReport("card")} className={selectedBalance ? "border-[#0071ba] bg-white text-[#0067ad]" : ""}><Tags className="ml-2 h-4 w-4" />بطاقة المادة</Button><Button variant="outline" onClick={() => printReport("cardRange")} className={selectedBalance ? "border-[#d47b32] bg-white text-[#a45a19]" : ""}><CalendarRange className="ml-2 h-4 w-4" />حركة مادة بين تاريخين</Button><Button variant="outline" onClick={() => printReport("inbound")}><FileDown className="ml-2 h-4 w-4" />بطاقة الإدخالات لكل المواد</Button><Button variant="outline" onClick={() => printReport("outbound")}><FileDown className="ml-2 h-4 w-4" />بطاقة الإخراجات لكل المواد</Button><Button variant="outline" onClick={() => printReport("inventory")}><FileText className="ml-2 h-4 w-4" />تقرير الجرد</Button><Button variant="outline" onClick={() => printReport("movementAll")}><FileText className="ml-2 h-4 w-4" />طباعة شهرية — المتحركة والثابتة</Button><Button variant="outline" onClick={() => printReport("movement")}><FileText className="ml-2 h-4 w-4" />طباعة شهرية — المتحركة فقط</Button></>}</div></div></CardContent></Card>
    </div>
  );
}

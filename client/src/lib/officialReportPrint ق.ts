// // // import { openPrintWindow } from "./printWindow";

// // // import { formatPrintNumber } from "@/lib/printNumber";

// // // export type OfficialReportType = "inboundJournal" | "outboundJournal" | "inventory" | "materialCard" | "monthlyMovement";

// // // export type OfficialReport = {
// // //   title: string;
// // //   dateRange: string;
// // //   rows: Array<Array<string | number | null | undefined>>;
// // //   type: OfficialReportType;
// // //   material?: { cardNumber?: string | number | null; code: string; name: string; description?: string | null; unit: string; minimumStock?: string | number | null; maximumStock?: string | number | null; notes?: string | null };
// // // };

// // // export const officialFormMeta: Record<OfficialReportType, { formNumber: number; officialTitle: string }> = {
// // //   inboundJournal: { formNumber: 14, officialTitle: "يومية الإدخالات" },
// // //   outboundJournal: { formNumber: 13, officialTitle: "يومية الإخراجات" },
// // //   inventory: { formNumber: 14, officialTitle: "جدول الجرد" },
// // //   materialCard: { formNumber: 15, officialTitle: "بطاقة مواد" },
// // //   monthlyMovement: { formNumber: 17, officialTitle: "جدول حركة المواد" },
// // // };

// // // const esc = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char] ?? char);
// // // const blank = (value: unknown) => esc(value ?? "");
// // // const reportCell = (value: unknown) => { if (typeof value === "number") return esc(formatPrintNumber(value)); const text = String(value ?? ""); return esc(/^-?\d+\.\d+$/.test(text.trim()) ? formatPrintNumber(text) : value ?? ""); };
// // // const displayMaterialCode = (value: unknown) => String(value ?? "").replace(/^legacy[-_]/i, "");

// // // function tableHead(type: OfficialReportType) {
// // //   if (type === "inboundJournal") return `<colgroup><col style="width:5%"><col style="width:9%"><col style="width:10%"><col style="width:7%"><col style="width:20%"><col style="width:13%"><col style="width:7%"><col style="width:6%"><col style="width:23%"></colgroup><tr><th rowspan="2">الرقم<br>المتسلسل</th><th colspan="2">مذكرة الاستلام</th><th rowspan="2">رقم<br>المادة</th><th colspan="2">المواد</th><th colspan="2">الكميات</th><th rowspan="2">ملاحظات</th></tr><tr><th>رقم</th><th>تاريخ</th><th>اسم المواد</th><th>المواصفات العينية</th><th>الوحدة</th><th>العدد</th></tr>`;
// // //   if (type === "outboundJournal") return `<colgroup><col style="width:4%"><col style="width:9%"><col style="width:10%"><col style="width:7%"><col style="width:20%"><col style="width:11%"><col style="width:7%"><col style="width:6%"><col style="width:12%"><col style="width:14%"></colgroup><tr><th rowspan="2">الرقم<br>المتسلسل</th><th colspan="2">مذكرة التسليم أو الإخراج</th><th rowspan="2">رمز<br>المادة</th><th colspan="2">المواد</th><th colspan="2">الكميات</th><th rowspan="2">الجهة<br>المستلمة</th><th rowspan="2">ملاحظات</th></tr><tr><th>رقم</th><th>تاريخ</th><th>نوع المادة</th><th>المواصفات</th><th>الوحدة</th><th>العدد</th></tr>`;
// // //   if (type === "inventory") return `<colgroup><col style="width:4%"><col style="width:5%"><col style="width:16%"><col style="width:7%"><col style="width:4%"><col style="width:4%"><col style="width:4%"><col style="width:5%"><col style="width:4%"><col style="width:5%"><col style="width:4%"><col style="width:5%"><col style="width:4%"><col style="width:5%"><col style="width:8%"><col style="width:8%"><col style="width:8%"></colgroup><tr><th rowspan="3">الرقم<br>المتسلسل</th><th colspan="3">المادة</th><th rowspan="3">الوحدة</th><th rowspan="3">سعر</th><th colspan="4">المخزون</th><th colspan="4">الفروق الجردية</th><th colspan="2">الأسباب والمبررات</th><th rowspan="3">ملاحظات</th></tr><tr><th rowspan="2">رمزها</th><th rowspan="2">اسمها</th><th rowspan="2">أوصافها</th><th colspan="2">الرصيد الدفتري</th><th colspan="2">الجرد الفعلي</th><th colspan="2">بالزيادة</th><th colspan="2">بالنقص</th><th rowspan="2">رأي أمين المستودع</th><th rowspan="2">رأي رئيس المستودعات</th></tr><tr><th>الوحدة</th><th>العدد</th><th>الوحدة</th><th>العدد</th><th>الوحدة</th><th>العدد</th><th>الوحدة</th><th>العدد</th></tr>`;
// // //   if (type === "materialCard") return `<colgroup><col style="width:6%"><col style="width:10%"><col style="width:10%"><col style="width:12%"><col style="width:7%"><col style="width:7%"><col style="width:8%"><col style="width:10%"><col style="width:15%"><col style="width:15%"></colgroup><tr><th rowspan="2">الرقم<br>المتسلسل</th><th colspan="3">المستند</th><th colspan="3">الحركة</th><th rowspan="2">تاريخ الاستلام<br>أو التسليم</th><th rowspan="2">الجهة المسلمة أو<br>المستلمة</th><th rowspan="2">ملاحظات</th></tr><tr><th>نوعه</th><th>رقمه</th><th>تاريخه</th><th>إدخالات</th><th>إخراجات</th><th>الرصيد</th></tr>`;
// // //   return `<colgroup><col style="width:5%"><col style="width:8%"><col style="width:27%"><col style="width:10%"><col style="width:8%"><col style="width:8%"><col style="width:8%"><col style="width:8%"><col style="width:8%"><col style="width:10%"></colgroup><tr><th rowspan="2">متسلسل</th><th colspan="3">المادة</th><th colspan="5">الكميات</th><th rowspan="2">ملاحظات</th></tr><tr><th>الرمز</th><th>الاسم</th><th>الوصف</th><th>رصيد أول شهر</th><th>استلام شهر</th><th>إدخال شهر</th><th>إخراجات شهر</th><th>الرصيد</th></tr>`;
// // // }

// // // function header(report: OfficialReport) {
// // //   const meta = officialFormMeta[report.type];
// // //   const today = new Date().toLocaleDateString("ar-SY");
// // //   if (report.type === "materialCard") return `<header class="card-header"><section class="government">الجمهورية العربية السورية<br><span>وزارة المالية</span></section><section class="card-title"><h1>بطاقة مواد رقم</h1><strong>${blank(report.material?.cardNumber)}</strong><p>ملاحظات : ${blank(report.material?.notes)}</p></section><section class="card-meta">نموذج مستودع رقم ( ${meta.formNumber} )<br><strong class="material-name">اسم المادة : ${blank(report.material?.name)}</strong><br><strong class="material-code">رمزها : ${blank(displayMaterialCode(report.material?.code))}</strong><br>الحد الأدنى : ${blank(report.material?.minimumStock)}<br>الحد الأقصى : ${blank(report.material?.maximumStock)}<br>الوحدة : ${blank(report.material?.unit)}</section></header>`;
// // //   if (report.type === "inventory") return `<header class="inventory-header"><section class="government">الجمهورية العربية السورية<br><span>وزارة المالية</span></section><section class="title"><h1>جدول الجرد</h1><p>${blank(report.dateRange || today)}</p></section><section class="inventory-identifiers">رقم المجلد<br>الرقم المتسلسل</section></header>`;
// // //   const title = meta.officialTitle;
// // //   const subtitle = report.type === "monthlyMovement" ? report.dateRange : "";
// // //   const form = report.type === "monthlyMovement" ? `نموذج مستودع رقم ( ${meta.formNumber} )` : `نموذج مستودع رقم ${meta.formNumber}`;
// // //   return `<header class="masthead"><section class="government">الجمهورية العربية السورية<br><span>وزارة المالية</span></section><section class="title"><h1>${title}</h1>${subtitle ? `<p>${blank(subtitle)}</p>` : ""}</section><section class="form">${form}</section></header>`;
// // // }

// // // function footer(type: OfficialReportType) {
// // //   if (type === "monthlyMovement") return `<footer class="movement-sign"><strong>أمين المستودع</strong><span>الاسم :</span><span>التوقيع :</span></footer><div class="page-footer movement-page-footer"><span>تمت طباعة هذا التقرير بتاريخ ${new Date().toLocaleDateString("ar-SY")}</span><span>Page No <b class="page-no"></b></span></div>`;
// // //   if (type === "materialCard") return "";
// // //   return "";
// // // }

// // // export function buildOfficialReportHtml(report: OfficialReport) {
// // //   const meta = officialFormMeta[report.type];
// // //   const columnCount = report.type === "inboundJournal" ? 9 : report.type === "outboundJournal" ? 10 : report.type === "inventory" ? 15 : report.type === "materialCard" ? 10 : 10;
// // //   const rows = report.rows.map(row => `<tr>${row.map(value => `<td>${reportCell(value)}</td>`).join("")}</tr>`).join("");
// // //   return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(meta.officialTitle)}</title><style>
// // //     @page{size:A4 landscape;margin:7mm}*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#e8eef2;color:#000}body{font-family:"Times New Roman",Tahoma,Arial,sans-serif}.preview-toolbar{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 18px;background:#163c5b;color:#fff;font-family:Tahoma,Arial,sans-serif}.preview-toolbar strong{font-size:14px}.preview-toolbar span{font-size:12px;color:#d7edfa}.preview-actions{display:flex;gap:8px}.preview-actions button{cursor:pointer;border:1px solid #9fd9f6;border-radius:4px;padding:7px 13px;background:white;color:#07518e;font-weight:700}.preview-actions .print-now{background:#0a7aba;color:#fff;border-color:#0a7aba}.preview-actions .pdf-now{background:#e9f5ff;color:#07518e;border-color:#77b9df}.report-page{width:297mm;min-height:210mm;margin:18px auto;background:#fff;padding:17mm 13mm 14mm;box-shadow:0 1px 5px #0004;font-size:15px;line-height:1.5}.masthead,.inventory-header{display:grid;grid-template-columns:1fr 1.25fr 1fr;align-items:start;margin-bottom:13mm}.card-header{display:grid;grid-template-columns:1fr 1.25fr 1fr;align-items:start;min-height:35mm;margin-bottom:2mm}.government{font-size:23px;line-height:1.42;font-weight:700;text-align:center}.government span{display:block;font-size:18px;text-align:center}.card-title strong{display:block;font-size:34px;line-height:1.3}.title{text-align:center;padding-top:8mm}.title h1{margin:0;font-size:29px}.title p{margin:5mm 0 0;font-size:18px}.form,.card-meta,.inventory-identifiers{text-align:left;font-size:19px;line-height:1.85}.card-meta{direction:rtl;white-space:nowrap;padding-top:0;text-align:right;justify-self:end;transform:translateX(10mm);line-height:1.5}.card-meta .material-name,.card-meta .material-code{display:block;font-weight:400}.inventory-identifiers{padding-top:8mm;direction:rtl;text-align:right;justify-self:end;white-space:nowrap;transform:translateX(12mm)}.inventory-header .title p{margin-top:5mm;text-align:center}.card-title{text-align:center;padding-top:3mm}.card-title h1{margin:0;font-size:27px}.card-title p{margin-top:6mm;font-size:20px;text-align:right}.official-table{width:100%;border-collapse:collapse;table-layout:fixed}.official-table thead{display:table-header-group}.official-table tr{break-inside:avoid;page-break-inside:avoid}.official-table th,.official-table td{border:1px solid #000;text-align:center;vertical-align:middle;padding:3px;word-break:break-word}.official-table th{font-size:16px;line-height:1.25;font-weight:700}.official-table td{height:29px;font-size:14px}.official-table td:nth-child(3),.official-table td:nth-child(5){text-align:right}.movement-sign{display:flex;flex-direction:column;gap:7px;width:28%;margin:22mm 0 0 auto;font-size:19px;font-weight:700;text-align:center}.page-footer{display:flex;justify-content:space-between;font-family:Tahoma,Arial,sans-serif;font-size:10px}.movement-page-footer{margin-top:8mm}.page-footer .page-no:after{content:counter(page)}@media print{html,body{background:#fff}.preview-toolbar{display:none}.report-page{width:auto;min-height:196mm;margin:0;padding:0;box-shadow:none}.official-table th,.official-table td{border-color:#000!important}.movement-page-footer{position:fixed;right:0;bottom:4mm;left:0;margin:0}.report-page:has(.movement-page-footer){padding-bottom:15mm}}
// // //   </style></head><body><header class="preview-toolbar"><div><strong>معاينة قبل الطباعة — ${esc(meta.officialTitle)}</strong><span>راجع نموذج الطباعة ثم اضغط «إرسال إلى الطابعة».</span></div><div class="preview-actions"><button id="close-preview" type="button">إغلاق</button><button id="download-pdf" class="pdf-now" type="button">تنزيل PDF</button><button id="print-now" class="print-now" type="button">إرسال إلى الطابعة</button></div></header><main class="report-page">${header(report)}<table class="official-table"><thead>${tableHead(report.type)}</thead><tbody>${rows || `<tr><td colspan="${columnCount}">&nbsp;</td></tr>`}</tbody></table>${footer(report.type)}</main><script>document.getElementById("print-now").addEventListener("click",()=>{window.focus();window.print()});document.getElementById("download-pdf").addEventListener("click",()=>{window.focus();window.print()});document.getElementById("close-preview").addEventListener("click",()=>window.close());window.focus()</script></body></html>`;
// // // }

// // // export function renderOfficialReport(page: Window, report: OfficialReport) {
// // //   page.document.open?.();
// // //   page.document.write(buildOfficialReportHtml(report));
// // //   page.document.close();
// // //   page.focus?.();
// // // }

// // // export function printOfficialReport(report: OfficialReport) {
// // //   const page = openPrintWindow(officialFormMeta[report.type].officialTitle);
// // //   if (!page) return false;
// // //   renderOfficialReport(page, report);
// // //   return true;
// // // }




// // import { openPrintWindow } from "./printWindow";

// // import { formatPrintNumber } from "@/lib/printNumber";

// // export type OfficialReportType = "inboundJournal" | "outboundJournal" | "inventory" | "materialCard" | "monthlyMovement";

// // export type OfficialReport = {
// //   title: string;
// //   dateRange: string;
// //   rows: Array<Array<string | number | null | undefined>>;
// //   type: OfficialReportType;
// //   pagination?: { page: number; hasPrevious: boolean; hasNext: boolean };
// //   material?: { cardNumber?: string | number | null; code: string; name: string; description?: string | null; unit: string; minimumStock?: string | number | null; maximumStock?: string | number | null; notes?: string | null };
// // };

// // export const officialFormMeta: Record<OfficialReportType, { formNumber: number; officialTitle: string }> = {
// //   inboundJournal: { formNumber: 14, officialTitle: "يومية الإدخالات" },
// //   outboundJournal: { formNumber: 13, officialTitle: "يومية الإخراجات" },
// //   inventory: { formNumber: 14, officialTitle: "جدول الجرد" },
// //   materialCard: { formNumber: 15, officialTitle: "بطاقة مواد" },
// //   monthlyMovement: { formNumber: 17, officialTitle: "جدول حركة المواد" },
// // };

// // const esc = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char] ?? char);
// // const blank = (value: unknown) => esc(value ?? "");
// // const reportCell = (value: unknown) => { if (typeof value === "number") return esc(formatPrintNumber(value)); const text = String(value ?? ""); return esc(/^-?\d+\.\d+$/.test(text.trim()) ? formatPrintNumber(text) : value ?? ""); };
// // const displayMaterialCode = (value: unknown) => String(value ?? "").replace(/^legacy[-_]/i, "");

// // function tableHead(type: OfficialReportType) {
// //   if (type === "inboundJournal") return `<colgroup><col style="width:5%"><col style="width:9%"><col style="width:10%"><col style="width:7%"><col style="width:20%"><col style="width:13%"><col style="width:7%"><col style="width:6%"><col style="width:23%"></colgroup><tr><th rowspan="2">الرقم<br>المتسلسل</th><th colspan="2">مذكرة الاستلام</th><th rowspan="2">رقم<br>المادة</th><th colspan="2">المواد</th><th colspan="2">الكميات</th><th rowspan="2">ملاحظات</th></tr><tr><th>رقم</th><th>تاريخ</th><th>اسم المواد</th><th>المواصفات العينية</th><th>الوحدة</th><th>العدد</th></tr>`;
// //   if (type === "outboundJournal") return `<colgroup><col style="width:4%"><col style="width:9%"><col style="width:10%"><col style="width:7%"><col style="width:20%"><col style="width:11%"><col style="width:7%"><col style="width:6%"><col style="width:12%"><col style="width:14%"></colgroup><tr><th rowspan="2">الرقم<br>المتسلسل</th><th colspan="2">مذكرة التسليم أو الإخراج</th><th rowspan="2">رمز<br>المادة</th><th colspan="2">المواد</th><th colspan="2">الكميات</th><th rowspan="2">الجهة<br>المستلمة</th><th rowspan="2">ملاحظات</th></tr><tr><th>رقم</th><th>تاريخ</th><th>نوع المادة</th><th>المواصفات</th><th>الوحدة</th><th>العدد</th></tr>`;
// //   if (type === "inventory") return `<footer class="inventory-signatures">
// //   <section><strong>أمين المستودع</strong>
// //   <span>الاسم</span><span>التوقيع</span></section>
// //   <section class="inventory-committee"><strong>أعضاء لجنة الجرد</strong><div><span>عضو</span><span>عضو</span><span>رئيس اللجنة</span></div></section>
// //   <section><strong>رئيس دائرة اللوازم والمستودعات</strong>
// //   <span>الاسم</span><span>التوقيع</span></section>
// //   <section>محاسب الإدارة</section>
// //   <section>أمر الصرف</section></footer>`;
// //   if (type === "materialCard") return `<colgroup><col style="width:6%"><col style="width:10%"><col style="width:10%"><col style="width:12%"><col style="width:7%"><col style="width:7%"><col style="width:8%"><col style="width:10%"><col style="width:15%"><col style="width:15%"></colgroup><tr><th rowspan="2">الرقم<br>المتسلسل</th><th colspan="3">المستند</th><th colspan="3">الحركة</th><th rowspan="2">تاريخ الاستلام<br>أو التسليم</th><th rowspan="2">الجهة المسلمة أو<br>المستلمة</th><th rowspan="2">ملاحظات</th></tr><tr><th>نوعه</th><th>رقمه</th><th>تاريخه</th><th>إدخالات</th><th>إخراجات</th><th>الرصيد</th></tr>`;
// //   return `<colgroup><col style="width:5%"><col style="width:8%"><col style="width:27%"><col style="width:10%"><col style="width:8%"><col style="width:8%"><col style="width:8%"><col style="width:8%"><col style="width:8%"><col style="width:10%"></colgroup><tr><th rowspan="2">متسلسل</th><th colspan="3">المادة</th><th colspan="5">الكميات</th><th rowspan="2">ملاحظات</th></tr><tr><th>الرمز</th><th>الاسم</th><th>الوصف</th><th>رصيد أول شهر</th><th>استلام شهر</th><th>إدخال شهر</th><th>إخراجات شهر</th><th>الرصيد</th></tr>`;
// // }

// // function header(report: OfficialReport) {
// //   const meta = officialFormMeta[report.type];
// //   const today = new Date().toLocaleDateString("ar-SY");
// //   if (report.type === "materialCard") return `<header class="card-header"><section class="government">الجمهورية العربية السورية<br><span>وزارة المالية</span></section><section class="card-title"><h1>بطاقة مواد رقم</h1><strong>${blank(report.material?.cardNumber)}</strong><p>ملاحظات : ${blank(report.material?.notes)}</p></section><section class="card-meta">نموذج مستودع رقم ( ${meta.formNumber} )<br><strong class="material-name">اسم المادة : ${blank(report.material?.name)}</strong><br><strong class="material-code">رمزها : ${blank(displayMaterialCode(report.material?.code))}</strong><br>الحد الأدنى : ${blank(report.material?.minimumStock)}<br>الحد الأقصى : ${blank(report.material?.maximumStock)}<br>الوحدة : ${blank(report.material?.unit)}</section></header>`;
// //   if (report.type === "inventory") return `<header class="inventory-header"><section class="government">الجمهورية العربية السورية<br><span>وزارة المالية</span></section><section class="title"><h1>جدول الجرد</h1><p>${today}</p></section><section class="inventory-identifiers">رقم المجلد<br>الرقم المتسلسل</section></header>`;
// //   const title = meta.officialTitle;
// //   const subtitle = report.type === "monthlyMovement" ? report.dateRange : "";
// //   const form = report.type === "monthlyMovement" ? `نموذج مستودع رقم ( ${meta.formNumber} )` : `نموذج مستودع رقم ${meta.formNumber}`;
// //   return `<header class="masthead"><section class="government">الجمهورية العربية السورية<br><span>وزارة المالية</span></section><section class="title"><h1>${title}</h1>${subtitle ? `<p>${blank(subtitle)}</p>` : ""}</section><section class="form">${form}</section></header>`;
// // }

// // function footer(type: OfficialReportType) {
// //   if (type === "monthlyMovement") return `<footer class="movement-sign"><strong>أمين المستودع</strong><span>الاسم :</span><span>التوقيع :</span></footer><div class="page-footer movement-page-footer"><span>تمت طباعة هذا التقرير بتاريخ ${new Date().toLocaleDateString("ar-SY")}</span><span>Page No <b class="page-no"></b></span></div>`;
// //   if (type === "materialCard") return "";
// //   return "";
// // }

// // export function buildOfficialReportHtml(report: OfficialReport) {
// //   const meta = officialFormMeta[report.type];
// //   const columnCount = report.type === "inboundJournal" ? 9 : report.type === "outboundJournal" ? 10 : report.type === "inventory" ? 15 : report.type === "materialCard" ? 10 : 10;
// //   const rows = report.rows.map(row => `<tr>${row.map(value => `<td>${reportCell(value)}</td>`).join("")}</tr>`).join("");
// //   const reportPaging = report.pagination ? `<button id="report-previous" type="button" ${report.pagination.hasPrevious ? "" : "disabled"}>السابقة</button><span class="report-page-status">صفحة ${report.pagination.page.toLocaleString("ar")}</span><button id="report-next" type="button" ${report.pagination.hasNext ? "" : "disabled"}>التالية</button>` : "";
// //   return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(meta.officialTitle)}</title><style>
// //     @page{size:A4 landscape;margin:7mm}*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#e8eef2;color:#000}body{font-family:"Times New Roman",Tahoma,Arial,sans-serif}.preview-toolbar{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 18px;background:#163c5b;color:#fff;font-family:Tahoma,Arial,sans-serif}.preview-toolbar strong{font-size:14px}.preview-toolbar span{font-size:12px;color:#d7edfa}.preview-actions{display:flex;align-items:center;gap:8px}.preview-actions button{cursor:pointer;border:1px solid #9fd9f6;border-radius:4px;padding:7px 13px;background:white;color:#07518e;font-weight:700}.preview-actions button:disabled{cursor:not-allowed;opacity:.5}.preview-actions .report-page-status{font-size:12px;color:#fff;white-space:nowrap}.preview-actions .print-now{background:#0a7aba;color:#fff;border-color:#0a7aba}.preview-actions .pdf-now{background:#e9f5ff;color:#07518e;border-color:#77b9df}.report-page{width:297mm;min-height:210mm;margin:18px auto;background:#fff;padding:17mm 13mm 14mm;box-shadow:0 1px 5px #0004;font-size:15px;line-height:1.5}.masthead,.inventory-header{display:grid;grid-template-columns:1fr 1.25fr 1fr;align-items:start;margin-bottom:13mm}.card-header{display:grid;grid-template-columns:1fr 1.25fr 1fr;align-items:start;min-height:35mm;margin-bottom:2mm}.government{font-size:23px;line-height:1.42;font-weight:700;text-align:center}.government span{display:block;font-size:18px;text-align:center}.card-title strong{display:block;font-size:34px;line-height:1.3}.title{text-align:center;padding-top:8mm}.title h1{margin:0;font-size:29px}.title p{margin:5mm 0 0;font-size:18px}.form,.card-meta,.inventory-identifiers{text-align:left;font-size:19px;line-height:1.85}.card-meta{direction:rtl;white-space:nowrap;padding-top:0;text-align:right;justify-self:end;transform:translateX(10mm);line-height:1.5}.card-meta .material-name,.card-meta .material-code{display:block;font-weight:400}.inventory-identifiers{padding-top:8mm;direction:rtl;text-align:right;justify-self:end;white-space:nowrap;transform:translateX(12mm)}.inventory-header .title p{margin-top:5mm;text-align:center}.card-title{text-align:center;padding-top:3mm}.card-title h1{margin:0;font-size:27px}.card-title p{margin-top:6mm;font-size:20px;text-align:right}.official-table{width:100%;border-collapse:collapse;table-layout:fixed}.official-table thead{display:table-header-group}.official-table tr{break-inside:avoid;page-break-inside:avoid}.official-table th,.official-table td{border:1px solid #000;text-align:center;vertical-align:middle;padding:3px;word-break:break-word}.official-table th{font-size:16px;line-height:1.25;font-weight:700}.official-table td{height:29px;font-size:14px}.official-table td:nth-child(3),.official-table td:nth-child(5){text-align:right}.movement-sign{display:flex;flex-direction:column;gap:7px;width:28%;margin:22mm 0 0 auto;font-size:19px;font-weight:700;text-align:center}.page-footer{display:flex;justify-content:space-between;font-family:Tahoma,Arial,sans-serif;font-size:10px}.movement-page-footer{margin-top:8mm}.page-footer .page-no:after{content:counter(page)}@media print{html,body{background:#fff}.preview-toolbar{display:none}.report-page{width:auto;min-height:196mm;margin:0;padding:0;box-shadow:none}.official-table th,.official-table td{border-color:#000!important}.movement-page-footer{position:fixed;right:0;bottom:4mm;left:0;margin:0}.report-page:has(.movement-page-footer){padding-bottom:15mm}}
// //   </style></head><body><header class="preview-toolbar"><div><strong>معاينة قبل الطباعة — ${esc(meta.officialTitle)}</strong><span>راجع نموذج الطباعة ثم اضغط «إرسال إلى الطابعة».</span></div><div class="preview-actions">${reportPaging}<button id="close-preview" type="button">إغلاق</button><button id="download-pdf" class="pdf-now" type="button">تنزيل PDF</button><button id="print-now" class="print-now" type="button">إرسال إلى الطابعة</button></div></header><main class="report-page">${header(report)}<table class="official-table"><thead>${tableHead(report.type)}</thead><tbody>${rows || `<tr><td colspan="${columnCount}">&nbsp;</td></tr>`}</tbody></table>${footer(report.type)}</main><script>document.getElementById("print-now").addEventListener("click",()=>{window.focus();window.print()});document.getElementById("download-pdf").addEventListener("click",()=>{window.focus();window.print()});document.getElementById("close-preview").addEventListener("click",()=>window.close());const moveReportPage=direction=>window.opener?.postMessage({type:"inventory-report-page",direction},"*");document.getElementById("report-previous")?.addEventListener("click",()=>moveReportPage("previous"));document.getElementById("report-next")?.addEventListener("click",()=>moveReportPage("next"));window.focus()</script></body></html>`;
// // }

// // export function renderOfficialReport(page: Window, report: OfficialReport) {
// //   page.document.open?.();
// //   page.document.write(buildOfficialReportHtml(report));
// //   page.document.close();
// //   page.focus?.();
// // }

// // export function printOfficialReport(report: OfficialReport) {
// //   const page = openPrintWindow(officialFormMeta[report.type].officialTitle);
// //   if (!page) return false;
// //   renderOfficialReport(page, report);
// //   return true;
// // }



// import { formatPrintNumber } from "@/lib/printNumber";
// import { openPrintWindow } from "@/lib/printWindow";

// export type OfficialReportType = "inboundJournal" | "outboundJournal" | "inventory" | "materialCard" | "monthlyMovement";

// export type OfficialReport = {
//   title: string;
//   dateRange: string;
//   rows: Array<Array<string | number | null | undefined>>;
//   type: OfficialReportType;
//   pagination?: { page: number; totalPages: number; hasPrevious: boolean; hasNext: boolean; sessionId: string };
//   pages?: OfficialReport[];
//   material?: { cardNumber?: string | number | null; code: string; name: string; description?: string | null; unit: string; minimumStock?: string | number | null; maximumStock?: string | number | null; notes?: string | null };
// };

// export const officialFormMeta: Record<OfficialReportType, { formNumber: number; officialTitle: string }> = {
//   inboundJournal: { formNumber: 14, officialTitle: "يومية الإدخالات" },
//   outboundJournal: { formNumber: 13, officialTitle: "يومية الإخراجات" },
//   inventory: { formNumber: 14, officialTitle: "جدول الجرد" },
//   materialCard: { formNumber: 15, officialTitle: "بطاقة مواد" },
//   monthlyMovement: { formNumber: 17, officialTitle: "جدول حركة المواد" },
// };

// const OFFICIAL_REPORT_ROOT_ID = "official-report-root";
// const esc = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char] ?? char);
// const blank = (value: unknown) => esc(value ?? "");
// const reportCell = (value: unknown) => { if (typeof value === "number") return esc(formatPrintNumber(value)); const text = String(value ?? ""); return esc(/^-?\d+\.\d+$/.test(text.trim()) ? formatPrintNumber(text) : value ?? ""); };
// const displayMaterialCode = (value: unknown) => String(value ?? "").replace(/^legacy[-_]/i, "");

// function tableHead(type: OfficialReportType) {
//   if (type === "inboundJournal") return `<colgroup><col style="width:5%"><col style="width:9%"><col style="width:10%"><col style="width:7%"><col style="width:20%"><col style="width:13%"><col style="width:7%"><col style="width:6%"><col style="width:23%"></colgroup><tr><th rowspan="2">الرقم<br>المتسلسل</th><th colspan="2">مذكرة الاستلام</th><th rowspan="2">رقم<br>المادة</th><th colspan="2">المواد</th><th colspan="2">الكميات</th><th rowspan="2">ملاحظات</th></tr><tr><th>رقم</th><th>تاريخ</th><th>اسم المواد</th><th>المواصفات العينية</th><th>الوحدة</th><th>العدد</th></tr>`;
//   if (type === "outboundJournal") return `<colgroup><col style="width:4%"><col style="width:9%"><col style="width:10%"><col style="width:7%"><col style="width:20%"><col style="width:11%"><col style="width:7%"><col style="width:6%"><col style="width:12%"><col style="width:14%"></colgroup><tr><th rowspan="2">الرقم<br>المتسلسل</th><th colspan="2">مذكرة التسليم أو الإخراج</th><th rowspan="2">رمز<br>المادة</th><th colspan="2">المواد</th><th colspan="2">الكميات</th><th rowspan="2">الجهة<br>المستلمة</th><th rowspan="2">ملاحظات</th></tr><tr><th>رقم</th><th>تاريخ</th><th>نوع المادة</th><th>المواصفات</th><th>الوحدة</th><th>العدد</th></tr>`;
//   if (type === "inventory") return `<colgroup><col style="width:4%"><col style="width:6%"><col style="width:16%"><col style="width:10%"><col style="width:5%"><col style="width:5%"><col style="width:5%"><col style="width:5%"><col style="width:5%"><col style="width:5%"><col style="width:5%"><col style="width:5%"><col style="width:8%"><col style="width:8%"><col style="width:8%"></colgroup><tr><th rowspan="3">الرقم<br>الجرد</th><th colspan="3">المادة</th><th rowspan="3">الوحدة</th><th rowspan="3">سعر</th><th colspan="4">المخزون</th><th colspan="2">الفروق الجردية</th><th colspan="2">الأسباب والمبررات</th><th rowspan="3">ملاحظات</th></tr><tr><th rowspan="2">رمزها</th><th rowspan="2">اسمها</th><th rowspan="2">أوصافها</th><th colspan="2">الرصيد الدفتري</th><th colspan="2">الجرد الفعلي</th><th rowspan="2">بالزيادة</th><th rowspan="2">بالنقص</th><th rowspan="2">رأي أمين المستودع</th><th rowspan="2">رأي رئيس المستودع</th></tr><tr><th>الوحدة</th><th>العدد</th><th>الوحدة</th><th>العدد</th></tr>`;
//   if (type === "materialCard") return `<colgroup><col style="width:6%"><col style="width:10%"><col style="width:10%"><col style="width:12%"><col style="width:7%"><col style="width:7%"><col style="width:8%"><col style="width:10%"><col style="width:15%"><col style="width:15%"></colgroup><tr><th rowspan="2">الرقم<br>المتسلسل</th><th colspan="3">المستند</th><th colspan="3">الحركة</th><th rowspan="2">تاريخ الاستلام<br>أو التسليم</th><th rowspan="2">الجهة المسلمة أو<br>المستلمة</th><th rowspan="2">ملاحظات</th></tr><tr><th>نوعه</th><th>رقمه</th><th>تاريخه</th><th>إدخالات</th><th>إخراجات</th><th>الرصيد</th></tr>`;
//   return `<colgroup><col style="width:5%"><col style="width:8%"><col style="width:27%"><col style="width:10%"><col style="width:8%"><col style="width:8%"><col style="width:8%"><col style="width:8%"><col style="width:8%"><col style="width:10%"></colgroup><tr><th rowspan="2">متسلسل</th><th colspan="3">المادة</th><th colspan="5">الكميات</th><th rowspan="2">ملاحظات</th></tr><tr><th>الرمز</th><th>الاسم</th><th>الوصف</th><th>رصيد أول شهر</th><th>استلام شهر</th><th>إدخال شهر</th><th>إخراجات شهر</th><th>الرصيد</th></tr>`;
// }

// function header(report: OfficialReport) {
//   const meta = officialFormMeta[report.type];
//   const today = new Date().toLocaleDateString("ar-SY");
//   if (report.type === "materialCard") return `<header class="card-header"><section class="government">الجمهورية العربية السورية<br><span>وزارة المالية</span></section><section class="card-title"><h1>بطاقة مواد رقم</h1><strong>${blank(report.material?.cardNumber)}</strong><p>ملاحظات : ${blank(report.material?.notes)}</p></section><section class="card-meta">نموذج مستودع رقم ( ${meta.formNumber} )<br><strong class="material-name">اسم المادة : ${blank(report.material?.name)}</strong><br><strong class="material-code">رمزها : ${blank(displayMaterialCode(report.material?.code))}</strong><br>الحد الأدنى : ${blank(report.material?.minimumStock)}<br>الحد الأقصى : ${blank(report.material?.maximumStock)}<br>الوحدة : ${blank(report.material?.unit)}</section></header>`;
//   if (report.type === "inventory") return `<header class="inventory-header"><section class="government">الجمهورية العربية السورية<br><span>وزارة المالية</span></section><section class="title"><h1>جدول الجرد</h1><p>${today}</p></section><section class="inventory-identifiers">رقم المجلد<br>الرقم المتسلسل</section></header>`;
//   const title = meta.officialTitle;
//   const subtitle = report.type === "monthlyMovement" ? report.dateRange : "";
//   const form = report.type === "monthlyMovement" ? `نموذج مستودع رقم ( ${meta.formNumber} )` : `نموذج مستودع رقم ${meta.formNumber}`;
//   return `<header class="masthead"><section class="government">الجمهورية العربية السورية<br><span>وزارة المالية</span></section><section class="title"><h1>${title}</h1>${subtitle ? `<p>${blank(subtitle)}</p>` : ""}</section><section class="form">${form}</section></header>`;
// }

// function footer(type: OfficialReportType) {
//   if (type === "monthlyMovement") return `<footer class="movement-sign"><strong>أمين المستودع</strong><span>الاسم :</span><span>التوقيع :</span></footer><div class="page-footer movement-page-footer"><span>تمت طباعة هذا التقرير بتاريخ ${new Date().toLocaleDateString("ar-SY")}</span><span>Page No <b class="page-no"></b></span></div>`;
//   return "";
// }

// function reportPreviewBodyHtml(report: OfficialReport) {
//   const meta = officialFormMeta[report.type];
//   const printableReports = report.pages?.length ? report.pages : [report];
//   const paging = report.pagination ? `<button id="report-first" type="button" ${report.pagination.hasPrevious ? "" : "disabled"}>⏮ الأولى</button><button id="report-previous" type="button" ${report.pagination.hasPrevious ? "" : "disabled"}>◀ السابقة</button><span class="report-page-status">صفحة ${report.pagination.page.toLocaleString("ar")} من ${report.pagination.totalPages.toLocaleString("ar")}</span><button id="report-next" type="button" ${report.pagination.hasNext ? "" : "disabled"}>التالية ▶</button><button id="report-last" type="button" ${report.pagination.hasNext ? "" : "disabled"}>الأخيرة ⏭</button>` : "";
//   const printablePages = printableReports.map(pageReport => {
//     const columnCount = pageReport.type === "inboundJournal" ? 9 : pageReport.type === "outboundJournal" ? 10 : pageReport.type === "inventory" ? 15 : 10;
//     const rows = pageReport.rows.map(row => `<tr>${row.map(value => `<td>${reportCell(value)}</td>`).join("")}</tr>`).join("");
//     return `<main class="report-page">${header(pageReport)}<table class="official-table"><thead>${tableHead(pageReport.type)}</thead><tbody>${rows || `<tr><td colspan="${columnCount}">&nbsp;</td></tr>`}</tbody></table>${footer(pageReport.type)}</main>`;
//   }).join("");
//   return `<header class="preview-toolbar"><div><strong>معاينة قبل الطباعة — ${esc(meta.officialTitle)}</strong><span>${report.pages?.length ? `النسخة الكاملة — ${report.pages.length.toLocaleString("ar")} صفحة جاهزة للطباعة.` : "راجع نموذج الطباعة ثم اضغط «إرسال إلى الطابعة»."}</span></div><div class="preview-actions">${paging}<button id="close-preview" type="button">إغلاق</button><button id="download-pdf" class="pdf-now" type="button">تنزيل PDF</button><button id="print-now" class="print-now" type="button">إرسال إلى الطابعة</button></div></header>${printablePages}`;
// }

// export function buildOfficialReportHtml(report: OfficialReport) {
//   const meta = officialFormMeta[report.type];
//   return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(meta.officialTitle)}</title><style>
//     @page{size:A4 landscape;margin:7mm}*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#e8eef2;color:#000}body{font-family:"Times New Roman",Tahoma,Arial,sans-serif}.preview-toolbar{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 18px;background:#163c5b;color:#fff;font-family:Tahoma,Arial,sans-serif}.preview-toolbar strong{font-size:14px}.preview-toolbar span{font-size:12px;color:#d7edfa}.preview-actions{display:flex;align-items:center;gap:8px}.preview-actions button{cursor:pointer;border:1px solid #9fd9f6;border-radius:4px;padding:7px 13px;background:white;color:#07518e;font-weight:700}.preview-actions button:disabled{cursor:not-allowed;opacity:.5}.preview-actions .report-page-status{font-size:12px;color:#fff;white-space:nowrap}.preview-actions .print-now{background:#0a7aba;color:#fff;border-color:#0a7aba}.preview-actions .pdf-now{background:#e9f5ff;color:#07518e;border-color:#77b9df}.report-page{width:297mm;min-height:210mm;margin:18px auto;background:#fff;padding:17mm 13mm 14mm;box-shadow:0 1px 5px #0004;font-size:15px;line-height:1.5}.masthead,.inventory-header{display:grid;grid-template-columns:1fr 1.25fr 1fr;align-items:start;margin-bottom:13mm}.card-header{display:grid;grid-template-columns:1fr 1.25fr 1fr;align-items:start;min-height:35mm;margin-bottom:2mm}.government{font-size:23px;line-height:1.42;font-weight:700;text-align:center}.government span{display:block;font-size:18px;text-align:center}.card-title strong{display:block;font-size:34px;line-height:1.3}.title{text-align:center;padding-top:8mm}.title h1{margin:0;font-size:29px}.title p{margin:5mm 0 0;font-size:18px}.form,.card-meta,.inventory-identifiers{text-align:left;font-size:19px;line-height:1.85}.card-meta{direction:rtl;white-space:nowrap;padding-top:0;text-align:right;justify-self:end;transform:translateX(10mm);line-height:1.5}.card-meta .material-name,.card-meta .material-code{display:block;font-weight:400}.inventory-identifiers{padding-top:8mm;direction:rtl;text-align:right;justify-self:end;white-space:nowrap;transform:translateX(12mm)}.inventory-header .title p{margin-top:5mm;text-align:center}.card-title{text-align:center;padding-top:3mm}.card-title h1{margin:0;font-size:27px}.card-title p{margin-top:6mm;font-size:20px;text-align:right}.official-table{width:100%;border-collapse:collapse;table-layout:fixed}.official-table thead{display:table-header-group}.official-table tr{break-inside:avoid;page-break-inside:avoid}.official-table th,.official-table td{border:1px solid #000;text-align:center;vertical-align:middle;padding:3px;word-break:break-word}.official-table th{font-size:16px;line-height:1.25;font-weight:700}.official-table td{height:29px;font-size:14px}.official-table td:nth-child(3),.official-table td:nth-child(5){text-align:right}.movement-sign{display:flex;flex-direction:column;gap:7px;width:28%;margin:22mm 0 0 auto;font-size:19px;font-weight:700;text-align:center}.page-footer{display:flex;justify-content:space-between;font-family:Tahoma,Arial,sans-serif;font-size:10px}.movement-page-footer{margin-top:8mm}.page-footer .page-no:after{content:counter(page)}@media print{html,body{background:#fff}.preview-toolbar{display:none}.report-page{width:auto;min-height:196mm;margin:0;padding:0;box-shadow:none;break-after:page;page-break-after:always}.report-page:last-child{break-after:auto;page-break-after:auto}.official-table th,.official-table td{border-color:#000!important}.movement-page-footer{position:fixed;right:0;bottom:4mm;left:0;margin:0}.report-page:has(.movement-page-footer){padding-bottom:15mm}}
//   </style></head><body><div id="${OFFICIAL_REPORT_ROOT_ID}">${reportPreviewBodyHtml(report)}</div></body></html>`;
// }

// type ReportOpener = Window & {
//   __inventoryReportNavigate?: (sessionId: string, direction: "first" | "previous" | "next" | "last", targetPage?: number) => void;
//   __inventoryReportPrintAll?: (sessionId: string) => void;
// };

// function bindOfficialReportControls(page: Window, report: OfficialReport) {
//   const getControl = (id: string) => page.document.getElementById?.(id) as HTMLButtonElement | null;
//   const opener = page.opener as ReportOpener | null;
//   const moveReportPage = (direction: "first" | "previous" | "next" | "last", targetPage?: number) => {
//     if (!report.pagination) return;
//     const navigate = opener?.__inventoryReportNavigate;
//     if (typeof navigate === "function") navigate(report.pagination.sessionId, direction, targetPage);
//     else opener?.postMessage({ type: "inventory-report-page", sessionId: report.pagination.sessionId, direction, targetPage }, "*");
//   };
//   const printEntireReport = () => {
//     if (!report.pagination || report.pages?.length) { page.focus(); page.print(); return; }
//     const printAll = opener?.__inventoryReportPrintAll;
//     if (typeof printAll === "function") printAll(report.pagination.sessionId);
//     else opener?.postMessage({ type: "inventory-report-print-all", sessionId: report.pagination.sessionId }, "*");
//   };
//   const bind = (id: string, handler: () => void) => { const control = getControl(id); if (control) control.onclick = handler; };
//   bind("print-now", printEntireReport);
//   bind("download-pdf", printEntireReport);
//   bind("close-preview", () => page.close());
//   bind("report-first", () => moveReportPage("first", 1));
//   bind("report-previous", () => moveReportPage("previous"));
//   bind("report-next", () => moveReportPage("next"));
//   bind("report-last", () => moveReportPage("last", report.pagination?.totalPages));
// }

// export function renderOfficialReport(page: Window, report: OfficialReport) {
//   const root = page.document.getElementById?.(OFFICIAL_REPORT_ROOT_ID);
//   if (root) root.innerHTML = reportPreviewBodyHtml(report);
//   else {
//     page.document.open?.();
//     page.document.write(buildOfficialReportHtml(report));
//     page.document.close();
//   }
//   bindOfficialReportControls(page, report);
//   page.focus?.();
// }

// export function printOfficialReport(report: OfficialReport) {
//   const page = openPrintWindow(officialFormMeta[report.type].officialTitle);
//   if (!page) return false;
//   renderOfficialReport(page, report);
//   return true;
// }

import { formatPrintNumber } from "@/lib/printNumber";
import { openPrintWindow } from "@/lib/printWindow";

export type OfficialReportType = "inboundJournal" | "outboundJournal" | "inventory" | "materialCard" | "monthlyMovement";

export type OfficialReport = {
  title: string;
  dateRange: string;
  rows: Array<Array<string | number | null | undefined>>;
  type: OfficialReportType;
  pagination?: { page: number; totalPages: number; hasPrevious: boolean; hasNext: boolean; sessionId: string };
  pages?: OfficialReport[];
  material?: { cardNumber?: string | number | null; code: string; name: string; description?: string | null; unit: string; minimumStock?: string | number | null; maximumStock?: string | number | null; notes?: string | null };
};

export const officialFormMeta: Record<OfficialReportType, { formNumber: number; officialTitle: string }> = {
  inboundJournal: { formNumber: 14, officialTitle: "يومية الإدخالات" },
  outboundJournal: { formNumber: 13, officialTitle: "يومية الإخراجات" },
  inventory: { formNumber: 18, officialTitle: "جدول الجرد" },
  materialCard: { formNumber: 15, officialTitle: "بطاقة مواد" },
  monthlyMovement: { formNumber: 17, officialTitle: "جدول حركة المواد" },
};

const OFFICIAL_REPORT_ROOT_ID = "official-report-root";
const esc = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char] ?? char);
const blank = (value: unknown) => esc(value ?? "");
const reportCell = (value: unknown) => { if (typeof value === "number") return esc(formatPrintNumber(value)); const text = String(value ?? ""); return esc(/^-?\d+\.\d+$/.test(text.trim()) ? formatPrintNumber(text) : value ?? ""); };
const displayMaterialCode = (value: unknown) => String(value ?? "").replace(/^legacy[-_]/i, "");

function tableHead(type: OfficialReportType) {
  if (type === "inboundJournal") return `<colgroup><col style="width:5%"><col style="width:9%"><col style="width:10%"><col style="width:7%"><col style="width:20%"><col style="width:13%"><col style="width:7%"><col style="width:6%"><col style="width:23%"></colgroup><tr><th rowspan="2">الرقم<br>المتسلسل</th><th colspan="2">مذكرة الاستلام</th><th rowspan="2">رقم<br>المادة</th><th colspan="2">المواد</th><th colspan="2">الكميات</th><th rowspan="2">ملاحظات</th></tr><tr><th>رقم</th><th>تاريخ</th><th>اسم المواد</th><th>المواصفات العينية</th><th>الوحدة</th><th>العدد</th></tr>`;
  if (type === "outboundJournal") return `<colgroup><col style="width:4%"><col style="width:9%"><col style="width:10%"><col style="width:7%"><col style="width:20%"><col style="width:11%"><col style="width:7%"><col style="width:6%"><col style="width:12%"><col style="width:14%"></colgroup><tr><th rowspan="2">الرقم<br>المتسلسل</th><th colspan="2">مذكرة التسليم أو الإخراج</th><th rowspan="2">رمز<br>المادة</th><th colspan="2">المواد</th><th colspan="2">الكميات</th><th rowspan="2">الجهة<br>المستلمة</th><th rowspan="2">ملاحظات</th></tr><tr><th>رقم</th><th>تاريخ</th><th>نوع المادة</th><th>المواصفات</th><th>الوحدة</th><th>العدد</th></tr>`;
  if (type === "inventory") return `<colgroup><col style="width:8%"><col style="width:5%"><col style="width:16%"><col style="width:5%"><col style="width:4%"><col style="width:4%"><col style="width:4%"><col style="width:5%"><col style="width:4%"><col style="width:5%"><col style="width:4%"><col style="width:5%"><col style="width:4%"><col style="width:5%"><col style="width:7%"><col style="width:7%"><col style="width:8%"></colgroup><tr><th rowspan="3">الرقم<br>المتسلسل</th><th colspan="3">المادة</th><th rowspan="3">الوحدة</th><th rowspan="3">سعر</th><th colspan="4">المخزون</th><th colspan="4">الفروق الجردية</th><th colspan="2">الأسباب والمبررات</th><th rowspan="3">ملاحظات</th></tr><tr><th rowspan="2">رمزها</th><th rowspan="2">اسمها</th><th rowspan="2">أوصافها</th><th colspan="2">الرصيد الدفتري</th><th colspan="2">الجرد الفعلي</th><th colspan="2">بالزيادة</th><th colspan="2">بالنقص</th><th rowspan="2">رأي أمين المستودع</th><th rowspan="2">رأي رئيس المستودعات</th></tr><tr><th>الوحدة</th><th>العدد</th><th>الوحدة</th><th>العدد</th><th>الوحدة</th><th>العدد</th><th>الوحدة</th><th>العدد</th></tr>`;
  if (type === "materialCard") return `<colgroup><col style="width:6%"><col style="width:10%"><col style="width:10%"><col style="width:12%"><col style="width:7%"><col style="width:7%"><col style="width:8%"><col style="width:10%"><col style="width:15%"><col style="width:15%"></colgroup><tr><th rowspan="2">الرقم<br>المتسلسل</th><th colspan="3">المستند</th><th colspan="3">الحركة</th><th rowspan="2">تاريخ الاستلام<br>أو التسليم</th><th rowspan="2">الجهة المسلمة أو<br>المستلمة</th><th rowspan="2">ملاحظات</th></tr><tr><th>نوعه</th><th>رقمه</th><th>تاريخه</th><th>الإدخال</th><th>الإخراج</th><th>الرصيد</th></tr>`;
  return `<colgroup><col style="width:5%"><col style="width:8%"><col style="width:27%"><col style="width:10%"><col style="width:8%"><col style="width:8%"><col style="width:8%"><col style="width:8%"><col style="width:8%"><col style="width:10%"></colgroup><tr><th rowspan="2">متسلسل</th><th colspan="3">المادة</th><th colspan="5">الكميات</th><th rowspan="2">ملاحظات</th></tr><tr><th>الرمز</th><th>الاسم</th><th>الوصف</th><th>رصيد أول الشهر</th><th>الاستلام</th><th>الإدخال</th><th>الإخراجات</th><th>الرصيد</th></tr>`;
}

function header(report: OfficialReport) {
  const meta = officialFormMeta[report.type];
  const today = new Date().toLocaleDateString("ar-SY");
  if (report.type === "materialCard") return `<header class="card-header"><section class="government">الجمهورية العربية السورية<br><span>وزارة المالية</span></section><section class="card-title"><h1>بطاقة مواد رقم</h1><strong>${blank(report.material?.cardNumber)}</strong></section><section class="card-meta">نموذج مستودع رقم ( ${meta.formNumber} )<br><strong class="material-name">اسم المادة : ${blank(report.material?.name)}</strong><strong class="material-code">رمزها : ${blank(displayMaterialCode(report.material?.code))}</strong>الحد الأدنى<br>الحد الأقصى<br>الوحدة : ${blank(report.material?.unit)}</section></header>`;
  if (report.type === "inventory") {
    const inventoryDate = report.dateRange.match(/إلى\s+(.+)$/)?.[1]?.trim() || report.dateRange.trim() || " / / 20";
    return `<header class="inventory-header"><section class="government">الجمهورية العربية السورية<br><span>وزارة المالية</span></section><section class="title"><h1>جدول جرد</h1><p>بتاريخ ${blank(inventoryDate)}</p></section><section class="inventory-identifiers">نموذج مستودع رقم 18<br>رقم المجلد<br>الرقم المتسلسل</section></header>`;
  }
  const title = meta.officialTitle;
  const subtitle = report.type === "monthlyMovement" ? report.dateRange : "";
  const form = report.type === "monthlyMovement" ? `نموذج مستودع رقم ( ${meta.formNumber} )` : `نموذج مستودع رقم ${meta.formNumber}`;
  return `<header class="masthead"><section class="government">الجمهورية العربية السورية<br><span>وزارة المالية</span></section><section class="title"><h1>${title}</h1>${subtitle ? `<p>${blank(subtitle)}</p>` : ""}</section><section class="form">${form}</section></header>`;
}

function footer(type: OfficialReportType) {
  if (type === "inventory") return `<footer class="inventory-signatures">
  <section><strong>أمين المستودع</strong>
  <span>الاسم</span><span>التوقيع</span></section>
  <section class="inventory-committee"><strong>أعضاء لجنة الجرد</strong><div><span>عضو</span><span>عضو</span><span>رئيس اللجنة</span></div></section>
  <section><strong>رئيس دائرة اللوازم والمستودعات</strong>
  <span>الاسم</span><span>التوقيع</span></section>
  <section>محاسب الإدارة</section>
  <section>أمر الصرف</section></footer>`;
  if (type === "monthlyMovement") return `<footer class="movement-sign"><strong>أمين المستودع</strong><span>الاسم :</span><span>التوقيع :</span></footer><div class="page-footer movement-page-footer"><span>تمت طباعة هذا التقرير بتاريخ ${new Date().toLocaleDateString("ar-SY")}</span><span>Page No <b class="page-no"></b></span></div>`;
  return "";
}

function reportPreviewBodyHtml(report: OfficialReport) {
  const meta = officialFormMeta[report.type];
  const printableReports = report.pages?.length ? report.pages : [report];
  const sessionId = esc(report.pagination?.sessionId ?? "");
  const pagesReady = report.pages?.length ? "true" : "false";
  const paging = report.pagination ? `<button id="report-first" data-preview-action="first" data-report-session="${sessionId}" type="button" ${report.pagination.hasPrevious ? "" : "disabled"}>⏮ الأولى</button><button id="report-previous" data-preview-action="previous" data-report-session="${sessionId}" type="button" ${report.pagination.hasPrevious ? "" : "disabled"}>◀ السابقة</button><span class="report-page-status">صفحة ${report.pagination.page.toLocaleString("ar")} من ${report.pagination.totalPages.toLocaleString("ar")}</span><button id="report-next" data-preview-action="next" data-report-session="${sessionId}" type="button" ${report.pagination.hasNext ? "" : "disabled"}>التالية ▶</button><button id="report-last" data-preview-action="last" data-report-session="${sessionId}" data-report-last-page="${report.pagination.totalPages}" type="button" ${report.pagination.hasNext ? "" : "disabled"}>الأخيرة ⏭</button>` : "";
  const printablePages = printableReports.map(pageReport => {
    const columnCount = pageReport.type === "inboundJournal" ? 9 : pageReport.type === "outboundJournal" ? 10 : pageReport.type === "inventory" ? 17 : 10;
    // الجرد يجب أن يعرض كل مواد المستودع، حتى عندما تكون الكميات صفرًا.
    // لا نرشح الصفوف هنا لأن الصفر قيمة صحيحة وليست سببًا لإخفاء المادة.
    const reportRows = pageReport.rows;
    const rows = reportRows.map(row => `<tr>${row.map(value => `<td>${pageReport.type === "inventory" && (value === 0 || String(value).trim() === "0") ? "" : reportCell(value)}</td>`).join("")}</tr>`).join("");
    return `<main class="report-page${pageReport.type === "inventory" ? " inventory-report" : pageReport.type === "materialCard" ? " material-card-report" : ""}">${header(pageReport)}<table class="official-table"><thead>${tableHead(pageReport.type)}</thead><tbody>${rows || `<tr><td colspan="${columnCount}">&nbsp;</td></tr>`}</tbody></table>${footer(pageReport.type)}</main>`;
  }).join("");
  return `<header class="preview-toolbar"><div><strong>معاينة قبل الطباعة — ${esc(meta.officialTitle)}</strong><span>${report.pages?.length ? `النسخة الكاملة — ${report.pages.length.toLocaleString("ar")} صفحة جاهزة للطباعة.` : "راجع نموذج الطباعة ثم اضغط «إرسال إلى الطابعة»."}</span></div><div class="preview-actions">${paging}<button id="close-preview" data-preview-action="close" type="button">إغلاق</button><button id="download-pdf" data-preview-action="print-all" data-report-session="${sessionId}" data-pages-ready="${pagesReady}" class="pdf-now" type="button">تنزيل PDF</button><button id="print-now" data-preview-action="print-all" data-report-session="${sessionId}" data-pages-ready="${pagesReady}" class="print-now" type="button">إرسال إلى الطابعة</button></div></header>${printablePages}`;
}

export function buildOfficialReportHtml(report: OfficialReport) {
  const meta = officialFormMeta[report.type];
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(meta.officialTitle)}</title><style>
    @page{size:297mm 210mm;margin:4mm}*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#e8eef2;color:#000}body{font-family:"Times New Roman",Tahoma,Arial,sans-serif}.preview-toolbar{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 18px;background:#163c5b;color:#fff;font-family:Tahoma,Arial,sans-serif}.preview-toolbar strong{font-size:14px}.preview-toolbar span{font-size:12px;color:#d7edfa}.preview-actions{display:flex;align-items:center;gap:8px}.preview-actions button{cursor:pointer;border:1px solid #9fd9f6;border-radius:4px;padding:7px 13px;background:white;color:#07518e;font-weight:700}.preview-actions button:disabled{cursor:not-allowed;opacity:.5}.preview-actions .report-page-status{font-size:12px;color:#fff;white-space:nowrap}.preview-actions .print-now{background:#0a7aba;color:#fff;border-color:#0a7aba}.preview-actions .pdf-now{background:#e9f5ff;color:#07518e;border-color:#77b9df}.report-page{width:297mm;min-height:210mm;margin:18px auto;background:#fff;padding:17mm 8mm 14mm;box-shadow:0 1px 5px #0004;font-size:15px;line-height:1.5}.masthead,.inventory-header{display:grid;grid-template-columns:1fr 1.25fr 1fr;align-items:start;margin-bottom:13mm}.card-header{display:grid;grid-template-columns:1fr 1.25fr 1fr;align-items:start;min-height:35mm;margin-bottom:2mm}.government{font-size:23px;line-height:1.42;font-weight:700;text-align:center}.government span{display:block;font-size:18px;text-align:center}.card-title strong{display:block;font-size:34px;line-height:1.3}.title{text-align:center;padding-top:8mm}.title h1{margin:0;font-size:29px}.title p{margin:5mm 0 0;font-size:18px}.form,.card-meta,.inventory-identifiers{text-align:left;font-size:19px;line-height:1.85}.card-meta{direction:rtl;white-space:nowrap;padding-top:0;text-align:right;justify-self:end;transform:translateX(10mm);line-height:1.5}.card-meta .material-name,.card-meta .material-code{display:block;font-weight:400}.inventory-identifiers{padding-top:8mm;direction:rtl;text-align:right;justify-self:end;white-space:nowrap;transform:translateX(12mm)}.inventory-header .title p{margin-top:5mm;text-align:center}.card-title{text-align:center;padding-top:3mm}.card-title h1{margin:0;font-size:27px}.card-title p{margin-top:6mm;font-size:20px;text-align:right}.official-table{width:100%;border-collapse:collapse;table-layout:fixed}.official-table thead{display:table-header-group}.official-table tr{break-inside:avoid;page-break-inside:avoid}.official-table th,.official-table td{border:1px solid #000;text-align:center;vertical-align:middle;padding:3px;word-break:break-word}.official-table th{font-size:16px;line-height:1.25;font-weight:700}.official-table td{height:29px;font-size:14px}.inventory-report .official-table th{font-size:14px;line-height:1.2;padding:2px;word-break:normal}.inventory-report .official-table td{font-size:13px;padding:2px}.official-table td:nth-child(3),.official-table td:nth-child(5){text-align:right}.material-card-report .official-table td:nth-child(5){text-align:center}.inventory-signatures{display:grid;grid-template-columns:1fr 1.7fr 1.3fr .8fr .8fr;gap:8px;margin-top:13mm;padding-top:5mm;border-top:1px solid #000;font-size:14px;font-weight:700;text-align:center;direction:rtl}.inventory-signatures section{display:flex;min-width:0;min-height:28mm;flex-direction:column;gap:5px;justify-content:flex-start}.inventory-signatures strong{font-size:15px}.inventory-signatures span{font-weight:400}.inventory-committee div{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:3px}.movement-sign{display:flex;flex-direction:column;gap:7px;width:28%;margin:22mm 0 0 auto;font-size:19px;font-weight:700;text-align:center}.page-footer{display:flex;justify-content:space-between;font-family:Tahoma,Arial,sans-serif;font-size:10px}.movement-page-footer{margin-top:8mm}.page-footer .page-no:after{content:counter(page)}@media print{html,body{background:#fff}.preview-toolbar{display:none}.report-page{width:auto;min-height:196mm;margin:0;padding:0;box-shadow:none;break-after:page;page-break-after:always}.report-page:last-child{break-after:auto;page-break-after:auto}.official-table th,.official-table td{border-color:#000!important}.inventory-signatures{break-inside:avoid;page-break-inside:avoid}.movement-page-footer{position:fixed;right:0;bottom:4mm;left:0;margin:0}.report-page:has(.movement-page-footer){padding-bottom:15mm}}
  </style></head><body><div id="${OFFICIAL_REPORT_ROOT_ID}">${reportPreviewBodyHtml(report)}</div><script>const pdfButton=document.getElementById("download-pdf");document.addEventListener("click",function(event){const target=event.target instanceof Element?event.target.closest("[data-preview-action]"):null;if(!target||target.disabled)return;const action=target.getAttribute("data-preview-action");if(action==="close"){window.close();return}if(action==="print-all"){if(target.getAttribute("data-pages-ready")==="true"){window.focus();window.print();return}const printAll=window.opener&&window.opener.__inventoryReportPrintAll;if(typeof printAll==="function"){printAll(target.getAttribute("data-report-session")||"");return}window.focus();window.print();return}const sessionId=target.getAttribute("data-report-session")||"";const targetPage=action==="first"?1:action==="last"?Number(target.getAttribute("data-report-last-page")||1):undefined;const navigate=window.opener&&window.opener.__inventoryReportNavigate;if(typeof navigate==="function"){navigate(sessionId,action,targetPage)}else if(window.opener){window.opener.postMessage({type:"inventory-report-page",sessionId:sessionId,direction:action,targetPage:targetPage},"*")}})</script></body></html>`;
}

type ReportOpener = Window & {
  __inventoryReportNavigate?: (sessionId: string, direction: "first" | "previous" | "next" | "last", targetPage?: number) => void;
  __inventoryReportPrintAll?: (sessionId: string) => void;
};

function bindOfficialReportControls(page: Window, report: OfficialReport) {
  const getControl = (id: string) => page.document.getElementById?.(id) as HTMLButtonElement | null;
  const opener = page.opener as ReportOpener | null;
  const moveReportPage = (direction: "first" | "previous" | "next" | "last", targetPage?: number) => {
    if (!report.pagination) return;
    const navigate = opener?.__inventoryReportNavigate;
    if (typeof navigate === "function") navigate(report.pagination.sessionId, direction, targetPage);
    else opener?.postMessage({ type: "inventory-report-page", sessionId: report.pagination.sessionId, direction, targetPage }, "*");
  };
  const printEntireReport = () => {
    if (!report.pagination || report.pages?.length) { page.focus(); page.print(); return; }
    const printAll = opener?.__inventoryReportPrintAll;
    if (typeof printAll === "function") printAll(report.pagination.sessionId);
    else opener?.postMessage({ type: "inventory-report-print-all", sessionId: report.pagination.sessionId }, "*");
  };
  const bind = (id: string, handler: () => void) => { const control = getControl(id); if (control) control.onclick = event => { event?.stopPropagation(); handler(); }; };
  bind("print-now", printEntireReport);
  bind("download-pdf", printEntireReport);
  bind("close-preview", () => page.close());
  bind("report-first", () => moveReportPage("first", 1));
  bind("report-previous", () => moveReportPage("previous"));
  bind("report-next", () => moveReportPage("next"));
  bind("report-last", () => moveReportPage("last", report.pagination?.totalPages));
}

export function renderOfficialReport(page: Window, report: OfficialReport) {
  const root = page.document.getElementById?.(OFFICIAL_REPORT_ROOT_ID);
  if (root) root.innerHTML = reportPreviewBodyHtml(report);
  else {
    page.document.open?.();
    page.document.write(buildOfficialReportHtml(report));
    page.document.close();
  }
  bindOfficialReportControls(page, report);
  page.focus?.();
}

export function printOfficialReport(report: OfficialReport) {
  const page = openPrintWindow(officialFormMeta[report.type].officialTitle);
  if (!page) return false;
  renderOfficialReport(page, report);
  return true;
}
